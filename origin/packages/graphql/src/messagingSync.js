/**
 * Keeps Messaging status in sync with GraphQL cache
 */

import gql from 'graphql-tag'
import config from './contracts'
import createDebug from 'debug'

const debug = createDebug('messaging:')

const MessagingStateQuery = gql`
  query GetMessagingState {
    messaging(id: "currentAccount") {
      id
      enabled
      synced
      syncProgress
      pubKey
      pubSig
    }
  }
`

export default function messagingSync(client) {
  const msg = config.messaging
  if (!msg) {
    return
  }
  function refresh() {
    client
      .query({ query: MessagingStateQuery, fetchPolicy: 'network-only' })
      .then(() => {})
  }
  msg.events.on('initRemote', () => {
    debug('Messaging initialized')

    msg.synced = false
    msg.syncProgress = '0%'
    setTimeout(() => {
      msg.synced = true
      msg.syncProgress = '100%'
      refresh()
    }, 2000)

    // msg.global_keys.events.on(
    //   'load.progress',
    //   (address, hash, entry, progress, have) => {
    //     debug('load.progress', progress, have)
    //   }
    // )
    // // msg.global_keys.events.on('replicated', (address, length) => debug('replicated', address, length) )
    // msg.global_keys.events.on('load', (dbname) => debug('load', dbname) )
    // msg.global_keys.events.on('write', (address, entry, heads) =>
    //   debug('write', address, entry, heads)
    // )
    // msg.global_keys.events.on('ready', (dbname, heads) =>
    //   debug('ready', dbname, heads)
    // )
  })
  // msg.events.on('initRemote', () => {
  //   debug('Init Remote')
  // })
  // msg.events.on('new', accountKey => {
  //   debug('Messaging new', accountKey)
  // })

  // detect existing messaging account
  msg.events.on('ready', accountKey => {
    debug('Messaging ready', accountKey)
    refresh()
  })
  msg.events.on('signedSig', () => {
    debug('Messaging Signed Sig')
    refresh()
  })

  // detect existing messaging account
  // msg.events.on('pending_conv', conv => {
  //   debug('Messaging pending_conv', conv)
  // })

  // detect new decrypted messages
  /*msg.events.on('msg', obj => {
    // debug('New msg', obj)
    // this.props.addMessage(obj)
    //
    // this.debouncedFetchUser(obj.senderAddress)
  })*/

  // To Do: handle incoming messages when no Origin Messaging Private Key is available
  // msg.events.on('emsg', obj => {
  //   debug('A message has arrived that could not be decrypted:', obj)
  // })
}
