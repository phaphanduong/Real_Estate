import React, { Component } from 'react'
import pick from 'lodash/pick'
import get from 'lodash/get'

import withCreatorConfig from 'hoc/withCreatorConfig'
import withCurrencies from 'hoc/withCurrencies'
import CreateListing from '../create-listing/CreateListing'

class EditListing extends Component {
  constructor(props) {
    super(props)
    // Translate listing from schema representation to form
    // representation.
    // TODO: Can we unify field names or otherwise keep knowledge of
    // special fields limited to their file in `listings-types` dir?
    const tokens = get(props, 'listing.acceptedTokens', []).map(t => t.id)
    this.state = {
      listing: {
        // FractionalListing fields:
        weekendPrice: get(props, 'listing.weekendPrice.amount', ''),
        booked: get(props, 'listing.booked', []),
        customPricing: get(props, 'listing.customPricing', []),
        unavailable: get(props, 'listing.unavailable', []),
        // HourlyFractionalListing fields:
        timeZone: get(props, 'listing.timeZone', ''),
        workingHours: get(props, 'listing.workingHours', []),
        // GiftCardListing fields:
        retailer: get(props, 'listing.retailer', ''),
        cardAmount: get(props, 'listing.cardAmount', ''),
        issuingCountry: get(props, 'listing.issuingCountry', 'US'),
        isDigital: get(props, 'listing.isDigital', false),
        isCashPurchase: get(props, 'listing.isCashPurchase', false),
        receiptAvailable: get(props, 'listing.receiptAvailable', false),

        // Marketplace creator fields:
        marketplacePublisher: get(props, 'creatorConfig.marketplacePublisher'),

        ...pick(props.listing, [
          'id',
          '__typename',
          'title',
          'description',
          'category',
          'subCategory'
        ]),
        acceptedTokens: tokens.length ? tokens : ['token-ETH'],
        quantity: String(props.listing.unitsTotal),
        currency: get(props, 'listing.price.currency.id', ''),
        price: String(props.listing.price.amount),
        boost: '0',
        boostLimit: '0',
        media: props.listing.media
      }
    }
  }

  render() {
    const listing = this.state.listing,
      currencies = this.props.currencies

    // Convert legacy listings priced in ETH to USD
    if (listing.currency === 'token-ETH') {
      listing.currency = 'fiat-USD'
      const ethCurrency = currencies.find(c => c.id === 'token-ETH')
      if (ethCurrency) {
        listing.price = String(
          Number(listing.price) * ethCurrency.priceInUSD
        ).replace(/^([0-9]+\.[0-9]{2}).*/, '$1')
        if (listing.weekendPrice) {
          listing.weekendPrice = String(
            Number(listing.weekendPrice) * ethCurrency.priceInUSD
          ).replace(/^([0-9]+\.[0-9]{2}).*/, '$1')
        }
      }
    }

    return <CreateListing listing={listing} refetch={this.props.refetch} />
  }
}

export default withCreatorConfig(withCurrencies(EditListing))

require('react-styl')(`
`)
