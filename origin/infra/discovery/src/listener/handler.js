const esmImport = require('esm')(module)
const ApolloClient = esmImport('apollo-client').default
const { link, cache } = esmImport('@origin/graphql')

const logger = require('./logger')
const { withRetrys } = require('./utils')
const MarketplaceEventHandler = require('./handler_marketplace')
const IdentityEventHandler = require('./handler_identity')

const {
  postToEmailWebhook,
  postToDiscordWebhook,
  postToWebhook,
  publishToGcloudPubsub
} = require('./webhooks')

// Adding a mapping here makes the listener listen for the event
// and call the associated handler when the event is received.
const EVENT_TO_HANDLER_MAP = {
  // Marketplace Events
  ListingCreated: MarketplaceEventHandler,
  ListingUpdated: MarketplaceEventHandler,
  ListingWithdrawn: MarketplaceEventHandler,
  ListingData: MarketplaceEventHandler,
  ListingArbitrated: MarketplaceEventHandler,
  OfferCreated: MarketplaceEventHandler,
  OfferWithdrawn: MarketplaceEventHandler,
  OfferAccepted: MarketplaceEventHandler,
  OfferDisputed: MarketplaceEventHandler,
  OfferRuling: MarketplaceEventHandler,
  OfferFinalized: MarketplaceEventHandler,
  OfferData: MarketplaceEventHandler,
  // Identity Events
  IdentityUpdated: IdentityEventHandler
  // TODO(franck): handle IdentityDeleted
}

// Initializing a new ApolloClient so cache can be disabled
const graphqlClient = new ApolloClient({
  link,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache'
    },
    query: {
      fetchPolicy: 'no-cache'
    }
  }
})

/**
 *  Main entry point for processing events.
 *   - Logs the event in the DB.
 *   - Calls the event's handler.
 *   - Optionally calls webhooks.
 */
async function handleEvent(event, context) {
  // Fetch block to retrieve timestamp.
  let block
  await withRetrys(async () => {
    block = await context.web3.eth.getBlock(event.blockNumber)
  })

  const eventDetails = `blockNumber=${event.blockNumber} \
    transactionIndex=${event.transactionIndex} \
    eventName=${event.event}`
  logger.info(`Processing event: ${eventDetails}`)

  // Call the event handler.
  //
  // Note: we run the handler with a retry since we've seen in production cases where we fail loading
  // from smart contracts the data pointed to by the event. This may occur due to load balancing
  // across ethereum nodes and if some nodes are lagging. For example the node we end up
  // connecting to for reading the data may lag compared to the node we received the event from.
  const handlerClass = EVENT_TO_HANDLER_MAP[event.event]
  if (!handlerClass) {
    logger.info(`No handler found for: ${event.event}`)
    return
  }

  const handler = new handlerClass(context.config, graphqlClient)

  let result
  try {
    await withRetrys(async () => {
      result = await handler.process(block, event)
    }, false)
  } catch (e) {
    logger.error(`Handler failed. Skipping log.`)
    context.errorCounter.inc()
    return
  }

  const output = {
    event: event,
    related: result
  }

  // Call the notification webhook
  const json = JSON.stringify(output, null, 2)
  logger.debug(`Handler result: ${json}`)

  if (context.config.webhook) {
    logger.warn(`'webhook' is deprecated. Use 'notifications-webhook' instead.`)
  }

  // Call the notifications server webhook
  if (handler.webhookEnabled() && context.config.notificationsWebhook) {
    logger.info(
      `Notifications Webhook to ${context.config.notificationsWebhook}`
    )
    try {
      await withRetrys(async () => {
        return postToWebhook(context.config.notificationsWebhook, json)
      }, false)
    } catch (e) {
      logger.error(`Skipping notifications webhook for ${eventDetails}`)
      logger.error(e)
    }
  }

  // Call the add to email list webhook
  if (handler.emailWebhookEnabled() && context.config.emailWebhook) {
    logger.info(`Mailing list webhook to ${context.config.emailWebhook}`)
    try {
      await withRetrys(async () => {
        return postToEmailWebhook(context.config.emailWebhook, output)
      }, false)
    } catch (e) {
      logger.error(`Skipping email webhook for ${eventDetails}`)
      logger.error(e)
    }
  }

  // Call the Discord webhook
  if (handler.discordWebhookEnabled() && context.config.discordWebhook) {
    logger.info(`Discord webhook to ${context.config.discordWebhook}`)
    try {
      await withRetrys(async () => {
        return postToDiscordWebhook(context.config.discordWebhook, output)
      }, false)
    } catch (e) {
      logger.error(`Skipping discord webhook for ${eventDetails}`)
      logger.error(e)
    }
  }

  // Publish the output to Google Cloud Pub/sub
  if (handler.gcloudPubsubEnabled() && context.config.gcloudPubsubTopic) {
    logger.info(
      `Google Cloud Pub/Sub publish to ${context.config.gcloudPubsubTopic}`
    )
    try {
      await withRetrys(async () => {
        return publishToGcloudPubsub(
          context.config.gcloudProjectId,
          context.config.gcloudPubsubTopic,
          output
        )
      }, false)
    } catch (e) {
      logger.error(`Skipping Google Cloud Pub/Sub for ${eventDetails}`)
      logger.error(e)
    }
  }

  return handler
}

module.exports = { handleEvent }
