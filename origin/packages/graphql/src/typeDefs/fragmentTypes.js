// https://www.apollographql.com/docs/react/advanced/fragments.html#fragment-matcher

import { IntrospectionFragmentMatcher } from 'apollo-cache-inmemory'

const introspectionQueryResultData = {
  __schema: {
    types: [
      {
        kind: 'UNION',
        name: 'ListingResult',
        possibleTypes: [
          {
            name: 'GiftCardListing'
          },
          {
            name: 'UnitListing'
          },
          {
            name: 'FractionalListing'
          },
          {
            name: 'FractionalHourlyListing'
          },
          {
            name: 'GiftCardListing'
          },
          {
            name: 'AnnouncementListing'
          }
        ]
      },
      {
        kind: 'INTERFACE',
        name: 'Listing',
        possibleTypes: [
          {
            name: 'GiftCardListing'
          },
          {
            name: 'UnitListing'
          },
          {
            name: 'FractionalListing'
          },
          {
            name: 'FractionalHourlyListing'
          },
          {
            name: 'GiftCardListing'
          },
          {
            name: 'AnnouncementListing'
          }
        ]
      },
      {
        kind: 'UNION',
        name: 'CurrencyResult',
        possibleTypes: [
          {
            name: 'Token'
          },
          {
            name: 'FiatCurrency'
          }
        ]
      },
      {
        kind: 'INTERFACE',
        name: 'Currency',
        possibleTypes: [
          {
            name: 'Token'
          },
          {
            name: 'FiatCurrency'
          }
        ]
      }
    ]
  }
}

export default new IntrospectionFragmentMatcher({
  introspectionQueryResultData
})
