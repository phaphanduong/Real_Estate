'use strict'

const Web3 = require('web3')
const eth = require('web3-eth')
const dictionary = require('./dictionary')

function generateAirbnbCode(ethAddress, userId) {
  const hashCode = Web3.utils.sha3(ethAddress + userId).substr(-7)
  return Array.prototype.map
    .call(hashCode, i => dictionary[i.charCodeAt(0)])
    .join(' ')
}

function generateSignature(privateKey, message) {
  if (!Web3.utils.isHexStrict(privateKey)) {
    throw new Error('Invalid private key, not a hex string')
  }

  const signedMessage = new eth().accounts.sign(message, privateKey)
  return signedMessage.signature
}

function generateSixDigitCode() {
  return Math.floor(100000 + Math.random() * 900000)
}

function generateWebsiteCode(ethAddress, host) {
  const data = Web3.utils.sha3(`${ethAddress}--${host}`)
  const sign = generateSignature(process.env.ATTESTATION_SIGNING_KEY, data)

  // trim '0x' prefix
  return sign.slice(2)
}

function getAbsoluteUrl(relativeUrl, state) {
  const protocol = process.env.HTTPS ? 'https' : 'http'
  const host = process.env.HOST ? process.env.HOST : 'localhost:5000'
  const url = new URL(`${protocol}://${host}${relativeUrl}`)

  url.searchParams.append('state', state)

  return url.toString()
}

module.exports = {
  generateAirbnbCode,
  generateSignature,
  generateSixDigitCode,
  generateWebsiteCode,
  getAbsoluteUrl
}
