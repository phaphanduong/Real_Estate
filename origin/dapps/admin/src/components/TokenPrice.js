import React, { Component } from 'react'
import { Query } from 'react-apollo'

import gql from 'graphql-tag'

const CurrentTokenPrice = gql`
  query TokenPrice($id: String!) {
    token(id: $id) {
      symbol
      decimals
    }
  }
`

class TokenPrice extends Component {
  render() {
    const { amount, currency } = this.props
    if (amount === undefined) return '???'
    if (currency === 'ETH') {
      return `${amount} ETH`
    }
    return (
      <Query query={CurrentTokenPrice} variables={{ id: currency }}>
        {({ loading, error, data }) => {
          if (loading || error) return null

          const { decimals, symbol } = data.token

          if (amount.indexOf('.') >= 0) return `${amount} ${symbol}`

          const supplyBN = web3.utils.toBN(amount)
          const decimalsBN = web3.utils.toBN(
            web3.utils.padRight('1', decimals + 1)
          )
          const formatted = supplyBN.div(decimalsBN).toString()

          return <span>{`${formatted} ${symbol}`}</span>
        }}
      </Query>
    )
  }
}

export default TokenPrice
