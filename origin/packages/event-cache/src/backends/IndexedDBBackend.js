const Dexie = require('dexie').default
const uniq = require('lodash/uniq')
const memoize = require('lodash/memoize')
const intersectionBy = require('lodash/intersectionBy')

const { AbstractBackend } = require('./AbstractBackend')
const { debug, compareEvents } = require('../utils')

/**
 * Check and see if IndexedDB is available for use
 */
function checkForIndexedDB() {
  // Just look for a global, since testing in node may inject
  if (typeof window !== 'undefined' && typeof indexedDB === 'undefined') {
    throw new Error('Unable to find IndexedDB')
  }
}
/**
 * Normalize index names so they would match get() args. Used for matching.
 *
 * @param indexes {Array} of fully qualified index names
 * @returns {Array} of normalized index names
 */
function normalizedIndexes(indexes) {
  return uniq(
    indexes.map(idx => {
      if (idx.includes('.')) {
        return idx.split('.').pop()
      }
      return idx
    })
  )
}

/**
 * Initialize the IndexedDB, object store, and indexes
 */
const initDB = memoize(async function({ IndexedDB, IDBKeyRange, dbName }) {
  debug(`initDB ${dbName}`)
  const opts = {}
  const stores = {}

  if (IndexedDB) opts['indexedDB'] = IndexedDB
  if (IndexedDB) opts['IDBKeyRange'] = IDBKeyRange

  const db = new Dexie(dbName, opts)
  stores[EVENT_STORE] = INDEXES.join(', ')
  db.version(SCHEMA_VERSION).stores(stores)
  const eventStore = db[EVENT_STORE]

  /**
   * Get the known block number from cache. Can be a little slow, but should
   * be non-blocking(I think)
   */
  const lastIndexedBlock = await new Promise(resolve => {
    db[EVENT_STORE].orderBy('blockNumber')
      .reverse()
      .limit(1)
      .toArray()
      .then(res => {
        if (res && res.length > 0) {
          debug(`lastIndexedBlock`, res[0].blockNumber)
          resolve(res[0].blockNumber)
        }
        resolve(null)
      })
  })

  return { db, eventStore, lastIndexedBlock }
})

/**
 * Create a map of arg names to fully qualified index names
 *
 * @param indexes {Array} of fully qualified index names
 * @returns {object} mapping of arg -> index name
 */
function createIndexeMap(indexes) {
  const idxMap = {}
  indexes.map(idx => {
    if (idx.includes('.')) {
      idxMap[idx.split('.').pop()] = idx
    } else {
      idxMap[idx] = idx
    }
  })
  return idxMap
}

/**
 * Get a value from an object, using dot notation
 *
 * @param key {string} key name, can include dot notation
 * @returns {any} value
 */
function getFromObject(key, obj) {
  if (key.indexOf('.') > -1) {
    return key.split('.').reduce((o, i) => o[i], obj)
  } else {
    return obj[key]
  }
}

const DB_NAME = 'origin-event-cache'
const EVENT_STORE = 'events'
const SCHEMA_VERSION = 1
// TODO: Fill out the indexes
const INDEXES = [
  '[blockNumber+transactionHash+transactionIndex]',
  'event',
  'blockNumber',
  'transactionHash',
  'transactionIndex',
  'address',
  'returnValues.account',
  'returnValues.party',
  'returnValues.listingID',
  'returnValues.offerID'
]
const NORM_INDEXES = normalizedIndexes(INDEXES)
const ARG_TO_INDEX_MAP = createIndexeMap(INDEXES)

/**
 * @class
 * @classdesc IndexedDBBackend for running in-browser storage
 */
class IndexedDBBackend extends AbstractBackend {
  constructor(args) {
    const { testing = false, prefix = '' } = args || {}
    super()

    this.type = 'indexeddb'
    this.dbName = `${prefix}${DB_NAME}`
    this.ready = false
    this._db = null
    this._eventStore = null
    this.IndexedDB = null
    this.IDBKeyRange = null

    // Make sure we're sane
    if (testing) {
      if (typeof global === 'undefined') {
        throw new Error('Environment not sane for testing.')
      }
      /**
       * We're testing here, anything goes!
       */
      require('fake-indexeddb/auto')
      this.IndexedDB = require('fake-indexeddb')
      this.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange')
    } else {
      checkForIndexedDB()
    }
  }

  /**
   * Idle until the DB initialization is done
   */
  async waitForReady() {
    if (this.ready) {
      return
    }

    const { db, eventStore, lastIndexedBlock } = await initDB({
      IndexedDB: this.IndexedDB,
      IDBKeyRange: this.IDBKeyRange,
      dbName: this.dbName
    })

    this.latestBlock = lastIndexedBlock
    this._db = db
    this._eventStore = eventStore
    this.ready = true
  }

  /**
   * Dumps an array of event objects
   *
   * @returns {Array} of events
   */
  async serialize() {
    await this.waitForReady()
    return await this._eventStore.getAll(EVENT_STORE)
  }

  /**
   * Loads the serialized data from IPFS
   *
   * @param ipfsData {Array} An array of events to load
   */
  async loadSerialized(ipfsData) {
    await this.waitForReady()

    if (!(ipfsData instanceof Array)) {
      throw new TypeError('Serialized data should be an Array of objects')
    }

    await this.addEvents(ipfsData)
  }

  /**
   * Fetch events from the store matching objects
   *
   * @param argMatchObject {object} A JS object representing the event
   * @returns {Array} An array of event objects
   */
  async get(argMatchObject) {
    await this.waitForReady()

    const indexedArgs = Object.keys(argMatchObject).filter(key => {
      if (
        typeof argMatchObject[key] !== 'undefined' &&
        NORM_INDEXES.includes(key)
      ) {
        return key
      }
    })

    const unindexedArgs = Object.keys(argMatchObject).filter(key => {
      if (
        typeof argMatchObject[key] !== 'undefined' &&
        !NORM_INDEXES.includes(key)
      ) {
        return key
      }
    })

    /**
     * A little hinky, but first get the results from any indexed args. There's
     * apparently no way to utilize multiple indexes at once, so, we're kind of
     * getting spicy here.
     *
     * Since we also don't know the granularity of each index, we're going to
     * run a query against every matching index, then intersect them ourselves
     * for the results.
     */
    const indexedSet = []
    if (indexedArgs.length > 0) {
      let matchedSet = []

      // Query against each index that maches an arg
      for (let i = 0; i < indexedArgs.length; i++) {
        // We need to iterate the index manually if we're checking an array
        if (argMatchObject[indexedArgs[i]] instanceof Array) {
          const res = await this._eventStore
            .where(ARG_TO_INDEX_MAP[indexedArgs[i]])
            .anyOf(argMatchObject[indexedArgs[i]])
            .toArray()

          indexedSet.push(res)
        } else {
          try {
            const res = await this._eventStore
              .where(ARG_TO_INDEX_MAP[indexedArgs[i]])
              .equals(argMatchObject[indexedArgs[i]])
              .toArray()
            indexedSet.push(res)
          } catch (err) {
            console.log('Error trying to do an index get')
            console.log(err)
            throw err
          }
        }
      }

      // Get only the objects that matched all the indexed args
      matchedSet = intersectionBy(...indexedSet, el => {
        return `${el.event}-${el.transactionHash}-${el.logIndex}`
      })

      // And do further matching against the unindexed args, if any
      if (unindexedArgs.length > 0) {
        return matchedSet.filter(el => {
          const matches = Object.keys(unindexedArgs).filter(key => {
            if (typeof argMatchObject[key] !== 'undefined') {
              if (
                (argMatchObject[key] instanceof Array &&
                  argMatchObject[key].indexOf(getFromObject(key, el)) > -1) ||
                argMatchObject[key] == getFromObject(key, el)
              ) {
                return el
              }
            }
          })

          // Make sure all provided keys were matched
          if (matches.length === Object.keys(unindexedArgs).length) {
            return el
          }
        })
      }

      return matchedSet.sort(compareEvents)
    } else {
      // What the hell, index your life
      debug('unindexed get(). This will be slow!', argMatchObject)

      const everything = await this._eventStore.toArray()

      return everything
        .filter(el => {
          const matches = Object.keys(unindexedArgs).filter(key => {
            if (typeof argMatchObject[key] !== 'undefined') {
              if (
                (argMatchObject[key] instanceof Array &&
                  argMatchObject[key].indexOf(getFromObject(key, el)) > -1) ||
                argMatchObject[key] == getFromObject(key, el)
              ) {
                return el
              }
            }
          })

          // Make sure all provided keys were matched
          if (matches.length === Object.keys(unindexedArgs).length) {
            return el
          }
        })
        .sort(compareEvents)
    }
  }

  /**
   * Fetch all events from the store
   *
   * @returns {Array} An array of event objects
   */
  async all() {
    await this.waitForReady()

    const items = await this._eventStore.toArray()
    return items.sort(compareEvents)
  }

  /**
   * Stores multiple events
   *
   * @param {Array} An array of JS object representing the event
   */
  async addEvents(eventObjects) {
    await this.waitForReady()

    await this._eventStore.bulkAdd(eventObjects)
    this.setLatestBlock(eventObjects[eventObjects.length - 1].blockNumber)
  }

  /**
   * Returns the latest block number known by the backend
   * @returns {number} The latest known block number
   */
  async getLatestBlock() {
    await this.waitForReady()
    return this.latestBlock
  }

  /**
   * Stores a single event
   *
   * For more info on the eventObject, see: https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#contract-events-return
   *
   * @param eventObject {object} A JS object representing the event
   */
  async addEvent(eventObject) {
    await this.waitForReady()

    try {
      await this._eventStore.add(eventObject)
    } catch (err) {
      if (String(err).includes('exists')) {
        debug('duplicate event')
      } else {
        throw err
      }
    }
    this.setLatestBlock(eventObject.blockNumber)
  }
}

module.exports = {
  IndexedDBBackend
}
