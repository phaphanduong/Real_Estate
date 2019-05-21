/**
 * @class
 * @classdesc AbstractBackend to define the interface for EventCache backends
 */
class AbstractBackend {
  constructor() {
    this.type = null
    this.latestBlock = 0

    if (new.target === AbstractBackend) {
      throw new TypeError('AbstractBackend cannot be used directly')
    }
  }

  /**
   * Returns the latest block number known by the backend
   * @returns {number} The latest known block number
   */
  async getLatestBlock() {
    return this.latestBlock
  }

  /**
   * Sets the latest block number known by the backend
   */
  setLatestBlock(blockNumber) {
    if (!blockNumber || blockNumber < this.latestBlock) return
    this.latestBlock = blockNumber
  }

  /**
   * Serializes the stored events for storage
   */
  async serialize() {
    throw new TypeError('serialize() is not implemented by this backend')
  }

  /**
   * Fetch events from the store
   *
   * @param argMatchObject {object} A JS object representing the event
   * @returns {Array} An array of event objects
   */
  // eslint-disable-next-line no-unused-vars
  async get(argMatchObject) {
    throw new TypeError('get() must be ipmlemented')
  }

  /**
   * Fetch all events from the store
   *
   * @returns {Array} An array of event objects
   */
  async all() {
    throw new TypeError('all() must be ipmlemented')
  }

  /**
   * Stores a single event
   *
   * For more info on the eventObject, see: https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#contract-events-return
   *
   * @param {object} A JS object representing the event
   */
  // eslint-disable-next-line no-unused-vars
  async addEvent(eventObject) {
    throw new TypeError('addEvent() must be ipmlemented')
  }

  /**
   * Stores multiple events
   *
   * @param {Array} An array of JS object representing the event
   */
  async addEvents(eventObjects) {
    for (let i = 0; i < eventObjects.length; i++) {
      await this.addEvent(eventObjects[i])
    }
  }
}

module.exports = {
  AbstractBackend
}
