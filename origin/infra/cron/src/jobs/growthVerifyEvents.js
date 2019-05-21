const logger = require('../logger')
const VerifyEvents = require('@origin/growth/src/scripts/verifyEvents')

async function GrowthVerifyEventsJob(job) {
  logger.info(
    `Starting job GrowthVerifyEventsJob id=${job.id} data=${job.data} pid=${
      process.pid
    }`
  )
  job.progress(0)

  const config = {
    // By default run in dry-run mode unless explicitly specified.
    persist: job.data.persist !== undefined ? job.data.persist : false
  }
  logger.info('Config:', config)
  const verifier = new VerifyEvents(config)

  try {
    await verifier.process()
  } catch (err) {
    logger.error('Job failed: ', err)
    return Promise.reject(err)
  }

  const stats = verifier.stats
  logger.info('Events verification stats:')
  logger.info('  Number of events processed:          ', stats.numProcessed)
  logger.info('  Number of events marked as verified :', stats.numVerified)
  logger.info('  Number of events marked as fraud    :', stats.numFraud)

  logger.info(`Job GrowthVerifyEventsJob id=${job.id} finished.`)
  job.progress(100)
  return Promise.resolve({ stats })
}

module.exports = GrowthVerifyEventsJob
