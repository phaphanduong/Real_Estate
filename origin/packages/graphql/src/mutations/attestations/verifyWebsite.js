import validator from '@origin/validator'
import get from 'lodash/get'

import contracts from '../../contracts'

async function verifyWebsite(_, { identity, website }) {
  const bridgeServer = contracts.config.bridge
  if (!bridgeServer) {
    return { success: false, reason: 'No bridge server configured' }
  }

  const url = `${bridgeServer}/api/attestations/website/verify`

  const response = await fetch(url, {
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify({ identity, website })
  })

  const data = await response.json()

  if (!response.ok) {
    return { success: false, reason: get(data, 'errors[0]') }
  }

  try {
    validator('https://schema.originprotocol.com/attestation_1.0.0.json', {
      ...data,
      schemaId: 'https://schema.originprotocol.com/attestation_1.0.0.json'
    })
  } catch (e) {
    return { success: false, reason: 'Invalid attestation' }
  }

  return {
    success: true,
    data: JSON.stringify(data)
  }
}

export default verifyWebsite
