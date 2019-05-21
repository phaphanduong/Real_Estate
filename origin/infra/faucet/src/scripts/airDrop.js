// Tool to distribute OGN tokens to a list of ETH addresses stored in a text file.
//
// Command line example:
//  #> export MAINNET_PROVIDER_URL=https://mainnet.infura.io/v3/<project_id>
//  #> export MAINNET_PRIVATE_KEY=<pk>
//  #> node airDrop.js --recipientsFilename=addresses.txt --networkId=1 --campaignId=1

'use strict'

const BigNumber = require('bignumber.js')
const fs = require('fs')
const Logger = require('logplease')
const Web3 = require('web3')

const Token = require('@origin/token/src/token')
const { createProviders } = require('@origin/token/src/config')

const enums = require('../enums')
const db = require('../models')

Logger.setLogLevel(process.env.LOG_LEVEL || 'INFO')
const logger = Logger.create('airdrop')

// 20% over default gas price to make transaction go faster.
const gasPriceMultiplier = 1.2

/**
 * Parse command line arguments into a dict.
 * @returns {Object} - Parsed arguments.
 */
function parseArgv() {
  const args = {}
  for (const arg of process.argv) {
    const elems = arg.split('=')
    const key = elems[0]
    const val = elems.length > 1 ? elems[1] : true
    args[key] = val
  }
  return args
}

/**
 * Reads a file having an eth address on each line
 * @param filename
 * @returns {string[]}
 */
function readRecipients(filename) {
  const data = fs.readFileSync(filename).toString()
  const addresses = data
    .split('\n')
    .map(l => l.trim().toLowerCase())
    .filter(l => Boolean(l))
  const seen = {}
  for (const address of addresses) {
    if (!Web3.utils.isAddress(address)) {
      throw new Error(`Invalid address: ${address}`)
    }
    if (seen[address]) {
      throw new Error(`Duplicate address: ${address}`)
    }
    seen[address] = true
  }
  logger.info(`Read ${addresses.length} recipient addresses.`)
  return addresses
}

class AirDrop {
  /**
   * Calculates gas price to use for sending transactions. We use a slightly
   * higher gas price in order for transactions to get mined faster.
   * @returns {Promise<{BigNumber}>}
   */
  async _calcGasPrice() {
    // Get default gas price from web3 which is determined by the
    // last few blocks median gas price.
    const web3 = this.token.web3(this.networkId)
    const medianGasPrice = await web3.eth.getGasPrice()

    // Apply our ratio.
    const gasPrice = BigNumber(medianGasPrice).times(gasPriceMultiplier)
    return gasPrice.integerValue()
  }

  /**
   * Sends OGN to an address.
   *
   * @param networkId
   * @param toAddress
   * @param amount
   * @returns {Promise<string>} Transaction hash
   * @private
   */
  async _send(networkId, toAddress, amount) {
    const gasPrice = await this._calcGasPrice()
    const receipt = await this.token.credit(networkId, toAddress, amount, {
      gasPrice
    })
    const txnHash = receipt.transactionHash
    logger.info(`${amount} OGN -> ${toAddress} TxHash=${txnHash}`)
    return txnHash
  }

  /**
   * Sends OGN to all recipients.
   *
   * @returns {Promise<void>}
   */
  async _process() {
    for (const toAddress of this.recipients) {
      logger.info('Processing airdrop to ', toAddress)
      const faucetTxn = await db.FaucetTxn.create({
        campaignId: this.campaignId,
        status: enums.FaucetTxnStatuses.Pending,
        fromAddress: this.sender.toLowerCase(),
        toAddress: toAddress.toLowerCase(),
        amount: this.amount, // Amount in natural units.
        currency: 'OGN'
      })

      if (!this.dryRun) {
        try {
          const txnHash = await this._send(
            this.networkId,
            toAddress,
            this.amount
          )
          await faucetTxn.update({
            status: enums.FaucetTxnStatuses.Confirmed,
            txnHash
          })
          logger.info(`Sent ${this.amount} OGN to ${toAddress}`)
        } catch (error) {
          logger.error('Failed sending OGN to ', toAddress, error, error.stack)
          // Bail out - operator should manually review what went wrong
          // and clean up data before resuming.
          throw error
        }
      } else {
        logger.info(`Would send ${this.amount} OGN to ${toAddress}`)
      }

      this.stats.numTxns++
      this.stats.totalAmountWei = this.stats.totalAmountWei.plus(this.amount)
      this.stats.totalAmountOgn = this.token.toTokenUnit(
        this.stats.totalAmountWei
      )
    }
  }

  async _init(config) {
    this.networkId = config.networkId
    this.campaignId = config.campaignId
    this.recipients = config.recipients
    this.dryRun = config.dryRun

    // Load the campaign.
    const campaign = await db.FaucetCampaign.findOne({
      where: { id: this.campaignId }
    })
    if (!campaign) {
      throw new Error(`Failed loading campaign with id ${this.campaignId}`)
    }
    if (campaign.currency != 'OGN') {
      throw new Error(`Campaign currency is not OGN: ${campaign.currency}`)
    }

    // Create a token object for handling the distribution.
    this.token = new Token({ providers: createProviders([this.networkId]) })

    this.amount = BigNumber(campaign.amount)
    this.campaignId = campaign.id
    this.sender = await this.token.senderAddress(this.networkId)

    this.stats = {
      numTxns: 0,
      totalAmountWei: BigNumber(0),
      totalAmountOgn: BigNumber(0)
    }

    logger.info('AirDrop config:')
    logger.info('  Dryrun:         ', this.dryRun)
    logger.info('  Network Id:     ', this.networkId)
    logger.info('  Campaign Id:    ', this.campaignId)
    logger.info('  Num recipients: ', this.recipients.length)
    logger.info('  Amount (wei):   ', this.amount)
    logger.info('  Amount (OGN):   ', this.token.toTokenUnit(this.amount))
    logger.info('  Sender address: ', this.sender)
    logger.info(
      '  Token address:  ',
      this.token.contractAddress(this.networkId)
    )
  }

  async _checkSenderBalances() {
    const web3 = this.token.web3(this.networkId)
    const ognBalance = await this.token.balance(this.networkId, this.sender)
    const ethBalance = await web3.eth.getBalance(this.sender)

    // Check the sender account has enough OGN.
    const requiredOgnBalance = this.amount.times(this.recipients.length)
    if (BigNumber(ognBalance).lt(requiredOgnBalance)) {
      throw new Error(
        `Sender OGN balance is ${ognBalance}. Needs at least ${requiredOgnBalance}`
      )
    }

    // Check the sender account has enough ETH to pay for gas.
    const gasAmount = BigNumber(40000) // It takes about 40k gas to transfer ogn.
    const gasPrice = await this._calcGasPrice()
    const gasFees = gasAmount.times(gasPrice)
    const requiredEthBalance = gasFees.times(this.recipients.length)
    if (BigNumber(ethBalance).lt(requiredEthBalance)) {
      throw new Error(
        `Sender ETH balance is ${ethBalance}. Needs at least ${requiredEthBalance}`
      )
    }

    logger.info('Sender balances:')
    logger.info('  OGN: ', ognBalance.toFixed())
    logger.info('  ETH: ', ethBalance)
  }

  async main(config) {
    logger.info('Configuring job.')
    await this._init(config)
    await this._checkSenderBalances()
    logger.info('Starting distribution.')
    await this._process()
  }
}

/**
 * MAIN
 */
if (require.main === module) {
  const args = parseArgv()

  if (!args['--campaignId']) {
    logger.error('--campaignId is mandatory')
    process.exit(-1)
  }
  if (!args['--networkId']) {
    logger.error('--networkId is mandatory')
    process.exit(-1)
  }
  if (!args['--recipientsFilename']) {
    logger.error('--recipientsFilename is mandatory')
    process.exit(-1)
  }

  const config = {
    // By default use dry-run mode unless explicitly specified.
    dryRun: args['--dryRun'] ? args['--dryRun'] !== 'false' : true,
    campaignId: args['--campaignId'],
    networkId: parseInt(args['--networkId'])
  }

  // A provider must be set.
  if (!process.env.PROVIDER_URL) {
    logger.error('PROVIDER_URL not set')
    process.exit(-1)
  }
  config.providerUrl = process.env.PROVIDER_URL

  // Load and validate the recipients list.
  config.recipients = readRecipients(args['--recipientsFilename'])

  const job = new AirDrop()
  job
    .main(config)
    .then(() => {
      logger.info('AirDrop stats:')
      logger.info('  Number of txns:      ', job.stats.numTxns)
      logger.info(
        '  Total distributed (wei):',
        job.stats.totalAmountWei.toFixed()
      )
      logger.info('  Total distributed (OGN):', job.stats.totalAmountOgn)
      logger.info('Finished')
      process.exit()
    })
    .catch(err => {
      logger.error('Job failed: ', err)
      logger.error('Exiting')
      process.exit(-1)
    })
}
