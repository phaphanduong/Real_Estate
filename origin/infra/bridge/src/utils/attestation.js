'use strict'

const Web3 = require('web3')
const Attestation = require('../models/index').Attestation
const constants = require('../constants')
const stringify = require('json-stable-stringify')
const { generateSignature } = require('./index.js')

async function generateAttestation(
  attestationType,
  attestationBody,
  attestationValue,
  ethAddress,
  remoteAddress
) {
  ethAddress = ethAddress.toLowerCase()

  const data = {
    issuer: constants.ISSUER,
    issueDate: new Date(),
    attestation: attestationBody
  }

  const signature = {
    bytes: generateAttestationSignature(
      process.env.ATTESTATION_SIGNING_KEY,
      ethAddress,
      // Use stringify rather than JSON.stringify to produce deterministic JSON
      // so the validation of the signature works.
      stringify(data)
    ),
    version: '1.0.0'
  }

  // Save the attestation in the database
  await Attestation.create({
    method: attestationType,
    ethAddress: ethAddress,
    value: attestationValue,
    signature: signature['bytes'],
    remoteIpAddress: remoteAddress
  })

  return {
    schemaId: 'https://schema.originprotocol.com/attestation_1.0.0.json',
    data: data,
    signature: signature
  }
}

function generateAttestationSignature(privateKey, subject, data) {
  const hashToSign = Web3.utils.soliditySha3(
    {
      t: 'address',
      v: Web3.utils.toChecksumAddress(subject)
    },
    {
      t: 'bytes32',
      v: Web3.utils.sha3(data)
    }
  )

  return generateSignature(privateKey, hashToSign)
}

module.exports = {
  generateAttestation,
  generateAttestationSignature
}
