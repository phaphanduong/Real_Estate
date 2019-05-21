import contracts from '../contracts'
import parseId from '../utils/parseId'
import currencies from '../utils/currencies'
import get from 'lodash/get'

import { getFeatured, getHidden } from './marketplace/_featuredAndHidden'

export default {
  __resolveType() {
    return 'UnitListing'
  },
  events: async listing => {
    const { listingId } = parseId(listing.id)
    return await listing.contract.eventCache.getEvents({
      listingID: String(listingId)
    })
  },
  totalEvents: async listing => {
    const { listingId } = parseId(listing.id)
    return (await listing.contract.eventCache.getEvents({
      listingID: String(listingId)
    })).length
  },
  totalOffers: listing => {
    const { listingId } = parseId(listing.id)
    return listing.contract.methods.totalOffers(listingId).call()
  },
  offer: async (listing, args) => {
    const { listingId, offerId } = parseId(args.id)
    return contracts.eventSource.getOffer(listingId, offerId)
  },
  offers: async listing => listing.allOffers.filter(o => o.valid),
  createdEvent: async listing => {
    const { listingId } = parseId(listing.id)
    const events = await listing.contract.eventCache.getEvents({
      listingID: String(listingId),
      event: 'ListingCreated'
    })
    return events[0]
  },
  featured: async listing => {
    const { listingId } = parseId(listing.id)
    const featuredIds = await getFeatured(contracts.net)
    return featuredIds.indexOf(listingId) >= 0
  },
  hidden: async listing => {
    const { listingId } = parseId(listing.id)
    const hiddenIds = await getHidden(contracts.net)
    return hiddenIds.indexOf(listingId) >= 0
  },
  price: async listing => {
    return {
      amount: get(listing, 'price.amount'),
      currency: await currencies.get(
        get(listing, 'price.currency.id', 'token-ETH')
      )
    }
  }
}
