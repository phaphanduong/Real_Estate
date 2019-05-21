import React from 'react'
import { Query, Mutation } from 'react-apollo'
import gql from 'graphql-tag'
import populate from '@origin/graphql/fixtures/populate'

import { Button } from '@blueprintjs/core'

import LoadingSpinner from 'components/LoadingSpinner'

import NodeAccounts from './_NodeAccounts'
import Toaster from '../Toaster'
import CreateWallet from './mutations/CreateWallet'

import Contracts from '../contracts/Contracts'

import query from 'queries/AllAccounts'

import AccountBalances from './AccountBalances'

const SetNetworkMutation = gql`
  mutation SetNetwork($network: String) {
    setNetwork(network: $network)
  }
`

function updateTruffle() {
  fetch('/update-truffle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      marketplace: localStorage.marketplaceContract,
      token: localStorage.OGNContract
    })
  }).then(() => {
    Toaster.show({
      icon: 'tick',
      intent: 'success',
      message: 'Truffle contracts updated',
      timeout: 2000
    })
  })
}

function contractAddresses() {
  let tokens = ''
  const net = localStorage.ognNetwork
  if (localStorage[`${net}Tokens`]) {
    tokens = `localStorage.${net}Tokens = ${JSON.stringify(
      localStorage[`${net}Tokens`]
    )}\n`
  }
  return (
    `localStorage.clear()\n` +
    `sessionStorage.clear()\n` +
    `localStorage.OGNContract = "${localStorage.OGNContract}"\n` +
    `localStorage.marketplaceContract = "${
      localStorage.marketplaceContract
    }"\n` +
    `localStorage.identityEventsContract = "${
      localStorage.identityEventsContract
    }"\n` +
    `localStorage.uniswapDaiExchange = "${localStorage.uniswapDaiExchange}"\n` +
    tokens +
    `location.reload()\n`
  )
}

const Accounts = () => (
  <Query query={query} notifyOnNetworkStatusChange={true}>
    {({ networkStatus, error, data, refetch, client }) => {
      if (networkStatus === 1) {
        return <LoadingSpinner />
      }
      if (error) {
        console.log(error)
        return <p className="mt-3">Error :(</p>
      }
      if (!data || !data.web3) {
        return null
      }

      const maxNodeAccount = [...data.web3.nodeAccounts].sort((a, b) => {
        if (Number(a.balance.eth) > Number(b.balance.eth)) return -1
        if (Number(a.balance.eth) < Number(b.balance.eth)) return 1
        return 0
      })[0]

      return (
        <div className="p-3">
          <CreateWallet />
          <AccountBalances
            maxNodeAccount={maxNodeAccount ? maxNodeAccount.id : null}
          />
          <NodeAccounts data={data.web3.nodeAccounts} />
          <Mutation mutation={SetNetworkMutation}>
            {(setNetwork, { client }) => (
              <Button
                style={{ marginTop: '1rem' }}
                intent="danger"
                onClick={async () => {
                  localStorage.clear()
                  web3.eth.accounts.wallet.clear()
                  setNetwork({ variables: { network: 'localhost' } })
                  await client.resetStore()
                }}
                text="Reset"
              />
            )}
          </Mutation>
          <Button
            style={{ marginTop: '1rem', marginLeft: '0.5rem' }}
            intent="success"
            onClick={() => populate(client, console.log)}
            text="Populate"
          />
          <Button
            style={{ marginTop: '1rem', marginLeft: '0.5rem' }}
            onClick={() => updateTruffle()}
            text="Update Truffle"
          />
          <Button
            style={{ marginTop: '1rem', marginLeft: '0.5rem' }}
            icon="refresh"
            onClick={() => refetch()}
          />
          <hr style={{ marginTop: '1.5rem', marginBottom: '1rem' }} />
          <Contracts />
          <hr style={{ marginTop: '1.5rem', marginBottom: '1rem' }} />
          <div>Paste into dapp console:</div>
          <textarea
            readOnly
            style={{
              height: '100px',
              width: '100%',
              fontFamily: 'Roboto, monospace',
              display: 'table-caption',
              overflowY: 'scroll'
            }}
            onClick={e => e.target.select()}
            value={contractAddresses()}
          />
        </div>
      )
    }}
  </Query>
)

export default Accounts
