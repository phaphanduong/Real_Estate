import pick from 'lodash/pick'

export default function applyListingData(props, data) {
  const { listing } = props

  const variables = {
    ...data,
    autoApprove: true,
    data: {
      typename: listing.__typename,
      title: listing.title,
      description: listing.description,
      price: { currency: listing.currency, amount: listing.price },
      acceptedTokens: listing.acceptedTokens,
      category: listing.category,
      subCategory: listing.subCategory,
      media: listing.media.map(m => pick(m, 'contentType', 'url')),
      commissionPerUnit: listing.boost,
      marketplacePublisher: listing.marketplacePublisher
    }
  }

  switch (listing.__typename) {
    case 'UnitListing': {
      const unitsTotal = Number(listing.quantity)
      variables.unitData = { unitsTotal }
      variables.commission = unitsTotal > 1 ? listing.boostLimit : listing.boost
      break
    }

    case 'FractionalListing':
    case 'FractionalHourlyListing':
      variables.fractionalData = {
        weekendPrice: {
          currency: listing.currency,
          amount: listing.weekendPrice
        },
        timeZone: listing.timeZone,
        workingHours: listing.workingHours,
        booked: listing.booked,
        customPricing: listing.customPricing,
        unavailable: listing.unavailable
      }
      variables.commission = listing.boostLimit
      break

    case 'GiftCardListing':
      const unitsTotal = Number(listing.quantity)
      variables.unitData = {
        unitsTotal: unitsTotal,
        retailer: listing.retailer,
        cardAmount: listing.cardAmount,
        issuingCountry: listing.issuingCountry,
        isDigital: listing.isDigital,
        isCashPurchase: listing.isCashPurchase,
        receiptAvailable: listing.receiptAvailable
      }
      variables.commission = unitsTotal > 1 ? listing.boostLimit : listing.boost
      break

    case 'AnnouncementListing':
      break

    default:
      throw new Error(`Unknown listing.__typename: ${listing.__typename}`)
  }

  return variables
}
