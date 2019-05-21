import graphqlFields from 'graphql-fields'
import sortBy from 'lodash/sortBy'
import uniq from 'lodash/uniq'

import contracts from '../contracts'
import { listingsBySeller } from './marketplace/listings'
import { identity } from './IdentityEvents'
import { getIdsForPage, getConnection } from './_pagination'
import { transactions } from './web3/transactions'

const ec = () => contracts.marketplace.eventCache

async function resultsFromIds({ after, allIds, first, fields }) {
  let nodes = []
  const totalCount = allIds.length
  const { ids, start } = getIdsForPage({ after, ids: allIds, first })

  if (fields.nodes) {
    nodes = await Promise.all(
      ids.map(id => {
        const [listingId, offerId] = id.split('-')
        return contracts.eventSource.getOffer(listingId, offerId)
      })
    )
  }

  return getConnection({ start, first, nodes, ids, totalCount })
}

async function offers(buyer, { first = 10, after, filter }, _, info) {
  const fields = graphqlFields(info)
  const offerEvents = await ec().getEvents({
    event: 'OfferCreated',
    party: buyer.id
  })
  const offerIDs = offerEvents.map(e => e.returnValues.offerID)
  const completedOfferEvents = await ec().getEvents({
    event: ['OfferFinalized', 'OfferWithdrawn', 'OfferRuling'],
    offerID: offerIDs.map(id => String(id))
  })
  const completedIds = completedOfferEvents.map(ev => {
    return `${ev.returnValues.listingID}-${ev.returnValues.offerID}`
  })

  let filteredEvents = offerEvents
  if (filter === 'complete') {
    filteredEvents = offerEvents.filter(ev => {
      const id = `${ev.returnValues.listingID}-${ev.returnValues.offerID}`
      return completedIds.indexOf(id) > -1
    })
  } else if (filter === 'pending') {
    filteredEvents = offerEvents.filter(ev => {
      const id = `${ev.returnValues.listingID}-${ev.returnValues.offerID}`
      return completedIds.indexOf(id) < 0
    })
  }
  const allIds = filteredEvents
    .map(ev => `${ev.returnValues.listingID}-${ev.returnValues.offerID}`)
    .reverse()

  return await resultsFromIds({ after, allIds, first, fields })
}

async function sales(seller, { first = 10, after, filter }, _, info) {
  const fields = graphqlFields(info)

  const listings = await ec().getEvents({
    event: 'ListingCreated',
    party: seller.id
  })
  const listingIds = listings.map(e => e.returnValues.listingID)
  const events = await ec().getEvents({
    listingID: listingIds,
    event: 'OfferCreated'
  })

  let allIds = events
    .map(e => `${e.returnValues.listingID}-${e.returnValues.offerID}`)
    .reverse()

  if (filter) {
    const completedEvents = await ec().getEvents({
      event: ['OfferFinalized', 'OfferWithdrawn', 'OfferRuling'],
      offerID: events.map(e => e.returnValues.offerID)
    })
    const completedIds = uniq(
      completedEvents.map(
        e => `${e.returnValues.listingID}-${e.returnValues.offerID}`
      )
    )

    if (filter === 'complete') {
      allIds = allIds.filter(id => completedIds.indexOf(id) >= 0)
    } else if (filter === 'pending') {
      allIds = allIds.filter(id => completedIds.indexOf(id) < 0)
    }
  }

  return await resultsFromIds({ after, allIds, first, fields })
}

async function reviews(user) {
  const listings = await ec().getEvents({
    event: 'ListingCreated',
    party: user.id
  })
  const listingIds = listings.map(e => String(e.returnValues.listingID))
  const events = await ec().getEvents({
    listingID: listingIds,
    event: 'OfferFinalized'
  })

  let nodes = await Promise.all(
    events.map(event =>
      contracts.eventSource.getReview(
        event.returnValues.listingID,
        event.returnValues.offerID,
        event.returnValues.party,
        event.returnValues.ipfsHash,
        event
      )
    )
  )

  nodes = sortBy(nodes.filter(n => n.rating), n => -n.event.blockNumber)

  return {
    totalCount: nodes.length,
    nodes,
    pageInfo: {
      endCursor: '',
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: ''
    }
  }
}

// Sourced from offer events where user is alternate party
async function notifications(user, { first = 10, after, filter }, _, info) {
  const fields = graphqlFields(info)

  const sellerListings = await ec().getEvents({
    party: user.id,
    event: 'ListingCreated'
  })

  const sellerListingIds = sellerListings.map(e => e.returnValues.listingID)

  const unfilteredSellerEvents = await ec().getEvents({
    event: [
      'OfferCreated',
      'OfferFinalized',
      'OfferWithdrawn',
      'OfferFundsAdded',
      'OfferDisputed',
      'OfferRuling'
    ],
    listingID: sellerListingIds
  })
  const sellerEvents = unfilteredSellerEvents.filter(
    e => e.returnValues.party !== user.id
  )

  const buyerListings = await ec().getEvents({
    event: 'OfferCreated',
    party: user.id
  })

  const buyerListingIds = buyerListings.map(e => e.returnValues.listingID)

  const unfilteredBuyerEvents = await ec().getEvents({
    listingID: buyerListingIds,
    event: ['OfferAccepted', 'OfferRuling']
  })
  const buyerEvents = unfilteredBuyerEvents.filter(
    e => e.returnValues.party !== user.id
  )

  let allEvents = sortBy([...sellerEvents, ...buyerEvents], e => -e.blockNumber)

  if (filter === 'pending') {
    const allListingIds = allEvents.map(e => Number(e.returnValues.listingID))
    const allListings = await Promise.all(
      allListingIds.map(id => ec().offers(id))
    )

    allEvents = allEvents.filter(e => {
      const idx = allListingIds.indexOf(Number(e.returnValues.listingID))
      const events = allListings[idx]
      if (e.event === 'OfferFinalized') {
        return false
      } else if (
        e.event === 'OfferCreated' &&
        events.some(t => t.event.match(/Offer(Withdrawn|Finalized)/))
      ) {
        return false
      } else if (
        e.event === 'OfferAccepted' &&
        events.some(t => t.event === 'OfferFinalized')
      ) {
        return false
      } else {
        return true
      }
    })
  }

  const totalCount = allEvents.length,
    allIds = allEvents.map(e => e.id)

  const { ids, start } = getIdsForPage({ after, ids: allIds, first })
  const filteredEvents = allEvents.filter(e => ids.indexOf(e.id) >= 0)

  let offers = [],
    nodes = []

  if (fields.nodes) {
    offers = await Promise.all(
      filteredEvents.map(event =>
        contracts.eventSource.getOffer(
          event.returnValues.listingID,
          event.returnValues.offerID,
          event.blockNumber
        )
      )
    )
    nodes = filteredEvents.map((event, idx) => {
      const party = event.returnValues.party
      return {
        id: event.id,
        offer: offers[idx],
        party: { id: party, account: { id: party } },
        event,
        read: false
      }
    })
  }

  return getConnection({ start, first, nodes, ids, totalCount })
}

// Sourced from offer events where user is alternate party
async function counterparty(user, { first = 100, after, id }, _, info) {
  const fields = graphqlFields(info)
  const u1 = user.id,
    u2 = id

  const u1Listings = await ec().getEvents({
    event: 'ListingCreated',
    party: u1
  })
  const u1ListingIds = u1Listings.map(e => e.returnValues.listingID)
  const u2Listings = await ec().getEvents({
    event: 'ListingCreated',
    party: u2
  })
  const u2ListingIds = u2Listings.map(e => e.returnValues.listingID)

  const u1BuyerEvents = await ec().getEvents({
    event: 'OfferCreated',
    listingID: u2ListingIds,
    party: u1
  })

  const u2BuyerEvents = await ec().getEvents({
    event: 'OfferCreated',
    listingID: u1ListingIds,
    party: u2
  })
  const allListingIds = [...u1ListingIds, ...u2ListingIds]
  const allOfferIds = [...u1BuyerEvents, ...u2BuyerEvents].reduce((m, o) => {
    m[o.returnValues.listingID] = m[o.returnValues.listingID] || []
    if (m[o.returnValues.listingID].indexOf(o.returnValues.offerID) < 0) {
      m[o.returnValues.listingID].push(o.returnValues.offerID)
    }
    return m
  }, {})

  const unfilteredEvents = await ec().getEvents({
    listingID: allListingIds,
    party: [u1, u2]
  })
  const unsortedEvents = unfilteredEvents.filter(e => {
    const listingOffers = allOfferIds[e.returnValues.listingID]
    if (listingOffers) {
      return listingOffers.indexOf(e.returnValues.offerID) >= 0
    }
  })
  const allEvents = sortBy(unsortedEvents, e => -e.blockNumber)

  const totalCount = allEvents.length,
    allIds = allEvents.map(e => e.id)

  const { ids, start } = getIdsForPage({ after, ids: allIds, first })
  const filteredEvents = allEvents.filter(e => ids.indexOf(e.id) >= 0)

  let offers = [],
    nodes = []

  if (fields.nodes) {
    offers = await Promise.all(
      filteredEvents.map(event =>
        contracts.eventSource.getOffer(
          event.returnValues.listingID,
          event.returnValues.offerID,
          event.blockNumber
        )
      )
    )
    nodes = filteredEvents.map((event, idx) => {
      const party = event.returnValues.party
      return {
        id: event.id,
        offer: offers[idx],
        party: { id: party, account: { id: party } },
        event,
        read: false
      }
    })
  }

  return getConnection({ start, first, nodes, ids, totalCount })
}

export default {
  offers,
  sales,
  reviews,
  notifications,
  transactions,
  counterparty,
  listings: listingsBySeller,
  firstEvent: async user => {
    if (user.firstEvent) return user.firstEvent
    const events = await ec().allEvents(undefined, user.id)
    return events[0]
  },
  lastEvent: async user => {
    if (user.lastEvent) return user.lastEvent
    const events = await ec().allEvents(undefined, user.id)
    return events[events.length - 1]
  },
  identity: account => {
    return identity({ id: account.id })
  }
}
