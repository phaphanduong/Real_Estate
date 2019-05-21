import assert from 'assert'
import get from 'lodash/get'

import client from '../src/index'
import contracts from '../src/contracts'

import { getOffer, mutate } from './_helpers'
import queries from './_queries'
import mutations from './_mutations'
import { trackGas, showGasTable } from './_gasTable'

const ZeroAddress = '0x0000000000000000000000000000000000000000'

describe('Marketplace', function() {
  let Admin, Seller, Buyer, Arbitrator, Affiliate
  let OGN, Marketplace

  before(async function() {
    await trackGas()
    const res = await client.query({ query: queries.GetNodeAccounts })
    const nodeAccounts = get(res, 'data.web3.nodeAccounts').map(a => a.id)
    ;[Admin, Seller, Buyer, Arbitrator, Affiliate] = nodeAccounts
  })

  after(async function() {
    await showGasTable()
  })

  it('should deploy the token contract', async function() {
    const receipt = await mutate(mutations.DeployToken, {
      type: 'OriginToken',
      name: 'Origin Token',
      symbol: 'OGN',
      decimals: '18',
      supply: '10000000000000000000000', // 10,000 OGN
      from: Admin
    })
    OGN = receipt.contractAddress
    assert(OGN)
  })

  it('should deploy the marketplace contract', async function() {
    const receipt = await mutate(mutations.DeployMarketplace, {
      token: OGN,
      version: '001',
      autoWhitelist: true,
      from: Admin
    })
    Marketplace = receipt.contractAddress
    assert(Marketplace)
  })

  it('should add an affiliate to the marketplace contract', async function() {
    await mutate(mutations.AddAffiliate, {
      from: Admin,
      affiliate: Affiliate
    })
  })

  describe('Single-unit listing with no commission', function() {
    let listingData

    before(function() {
      listingData = {
        deposit: '0',
        depositManager: Arbitrator,
        from: Seller,
        data: {
          title: 'Test Listing',
          description: 'Test description',
          price: {
            currency: 'token-ETH',
            amount: '0.01'
          },
          category: 'Test category',
          subCategory: 'Test sub-category'
        },
        unitData: {
          unitsTotal: 1
        }
      }
    })

    it('should create a listing', async function() {
      const events = await mutate(mutations.CreateListing, listingData, true)
      assert(events.ListingCreated)
    })

    it('should retrieve listing data that matches the provided input', async function() {
      const res = await client.query({
        query: queries.GetListing,
        variables: { id: '999-000-0' }
      })

      const listing = get(res, 'data.marketplace.listing')
      assert.ok(listing)

      assert.strictEqual(listing.id, '999-000-0')
      assert.strictEqual(listing.deposit, listingData.deposit)
      assert.strictEqual(listing.arbitrator.id, listingData.depositManager)
      assert.strictEqual(listing.seller.id, listingData.from)
      assert.strictEqual(listing.title, listingData.data.title)
      assert.strictEqual(listing.description, listingData.data.description)
      assert.strictEqual(listing.price.amount, listingData.data.price.amount)
      assert.strictEqual(
        listing.price.currency.id,
        listingData.data.price.currency
      )
      assert.strictEqual(listing.price.amount, listingData.data.price.amount)
      assert.strictEqual(listing.category, listingData.data.category)
      assert.strictEqual(listing.subCategory, listingData.data.subCategory)
      assert.strictEqual(listing.unitsTotal, listingData.unitData.unitsTotal)
      assert.strictEqual(
        listing.unitsAvailable,
        listingData.unitData.unitsTotal
      )
      assert.strictEqual(listing.unitsSold, 0)
      assert.strictEqual(listing.commission, '0')
      assert.strictEqual(listing.commissionPerUnit, '0')
      assert.strictEqual(listing.featured, false)
      assert.strictEqual(listing.hidden, false)
    })

    it('should retrieve the listing as of a specfic block', async function() {
      const blockNumber = await contracts.marketplace.eventCache.getBlockNumber()
      const listingId = `999-000-0-${blockNumber}`
      const res = await client.query({
        query: queries.GetListing,
        variables: { id: listingId }
      })

      const id = get(res, 'data.marketplace.listing.id')
      assert.strictEqual(id, listingId)
      // TODO: verify the other listing fields
    })

    it('should create an invalid offer', async function() {
      const events = await mutate(
        mutations.MakeOffer,
        {
          listingID: '999-000-0',
          from: Buyer,
          finalizes: 123,
          affiliate: ZeroAddress,
          value: '0.005',
          currency: 'token-ETH',
          arbitrator: Arbitrator,
          quantity: 1
        },
        true
      )
      assert(events.OfferCreated)
    })

    it('should detect that the offer is invalid', async function() {
      const offer = await getOffer('999-000-0', 0, false)
      assert(!offer.valid)
      assert.strictEqual(
        offer.validationError,
        'Invalid offer: insufficient offer amount for listing'
      )
    })

    it('should create an offer', async function() {
      const events = await mutate(
        mutations.MakeOffer,
        {
          listingID: '999-000-0',
          from: Buyer,
          finalizes: 123,
          affiliate: ZeroAddress,
          value: '0.01',
          currency: 'token-ETH',
          arbitrator: Arbitrator,
          quantity: 1
        },
        true
      )
      assert(events.OfferCreated)
    })

    it('should add data to an offer', async function() {
      const events = await mutate(
        mutations.AddData,
        {
          offerID: '999-000-0-1',
          from: Seller,
          data: 'Testing'
        },
        true
      )
      assert(events.OfferData)
    })

    it('should accept an offer', async function() {
      const events = await mutate(
        mutations.AcceptOffer,
        {
          offerID: '999-000-0-1',
          from: Seller
        },
        true
      )
      assert(events.OfferAccepted)
    })

    it('should finalize an offer', async function() {
      const events = await mutate(
        mutations.FinalizeOffer,
        {
          offerID: '999-000-0-1',
          from: Buyer
        },
        true
      )
      assert(events.OfferFinalized)
    })
  })

  describe('Single-unit listing with commission', function() {
    let listingData

    before(async function() {
      listingData = {
        deposit: '1.5',
        depositManager: Arbitrator,
        from: Seller,
        autoApprove: true,
        data: {
          title: 'Test Listing',
          description: 'Test description',
          price: {
            currency: 'token-ETH',
            amount: '0.05'
          },
          category: 'Test category',
          subCategory: 'Test sub-category',
          commission: '1.5'
        },
        unitData: {
          unitsTotal: 1
        }
      }

      // Transfer tokens to the seller to cover the listing deposit.
      await mutate(mutations.TransferToken, {
        token: OGN,
        from: Admin,
        to: Seller,
        value: '1.5'
      })
    })

    it('should create a listing', async function() {
      await mutate(mutations.CreateListing, listingData)
    })

    it('should retrieve listing data that matches the provided input', async function() {
      const res = await client.query({
        query: queries.GetListing,
        variables: { id: '999-000-1' }
      })

      const listing = get(res, 'data.marketplace.listing')
      assert.ok(listing)

      const web3 = contracts.web3

      assert.strictEqual(listing.id, '999-000-1')
      assert.strictEqual(
        listing.deposit,
        web3.utils.toWei(listingData.deposit, 'ether')
      )
      assert.strictEqual(listing.arbitrator.id, listingData.depositManager)
      assert.strictEqual(listing.seller.id, listingData.from)
      assert.strictEqual(listing.title, listingData.data.title)
      assert.strictEqual(listing.description, listingData.data.description)
      assert.strictEqual(listing.price.amount, listingData.data.price.amount)
      assert.strictEqual(
        listing.price.currency.id,
        listingData.data.price.currency
      )
      assert.strictEqual(listing.price.amount, listingData.data.price.amount)
      assert.strictEqual(listing.category, listingData.data.category)
      assert.strictEqual(listing.subCategory, listingData.data.subCategory)
      assert.strictEqual(listing.unitsTotal, listingData.unitData.unitsTotal)
      assert.strictEqual(
        listing.unitsAvailable,
        listingData.unitData.unitsTotal
      )
      assert.strictEqual(listing.unitsSold, 0)
      assert.strictEqual(listing.commission, '1500000000000000000')
      assert.strictEqual(listing.commissionPerUnit, '1500000000000000000')
      assert.strictEqual(listing.featured, false)
      assert.strictEqual(listing.hidden, false)
    })

    it('should retrieve the listing', async function() {
      const res = await client.query({
        query: queries.GetListing,
        variables: { id: '999-000-1' }
      })

      const id = get(res, 'data.marketplace.listing.id')
      assert.strictEqual(id, '999-000-1')
      // TODO: verify the other listing fields
    })

    it('should create an offer', async function() {
      const events = await mutate(
        mutations.MakeOffer,
        {
          listingID: '999-000-1',
          from: Buyer,
          finalizes: 123,
          affiliate: Affiliate,
          value: '0.1',
          currency: 'token-ETH',
          arbitrator: Arbitrator,
          quantity: 1
        },
        true
      )
      assert(events.OfferCreated)
    })

    it('should accept an offer', async function() {
      const events = await mutate(
        mutations.AcceptOffer,
        {
          offerID: '999-000-1-0',
          from: Seller
        },
        true
      )
      assert(events.OfferAccepted)
    })

    it('should finalize an offer', async function() {
      await mutate(mutations.FinalizeOffer, {
        offerID: '999-000-1-0',
        from: Buyer
      })
    })
  })

  describe('Multi-unit listing with commission', async function() {
    let listingData

    before(async function() {
      await mutate(mutations.TransferToken, {
        token: OGN,
        from: Admin,
        to: Seller,
        value: '3'
      })
      // Setting the 'getEvents' parameter to true causes an error.
      listingData = {
        deposit: '3',
        depositManager: Arbitrator,
        from: Seller,
        autoApprove: true,
        data: {
          title: 'Multi-unit listing',
          description: 'Test description',
          price: {
            currency: 'token-ETH',
            amount: '0.01'
          },
          category: 'Test category',
          subCategory: 'Test sub-category',
          commission: '3',
          commissionPerUnit: '2'
        },
        unitData: {
          unitsTotal: 4
        }
      }
    })

    it('should create a listing', async function() {
      await mutate(mutations.CreateListing, listingData)
    })

    it('should create first offer with full commission', async function() {
      const events = await mutate(
        mutations.MakeOffer,
        {
          listingID: '999-000-2',
          from: Buyer,
          finalizes: 123,
          affiliate: Affiliate,
          value: '0.01',
          currency: 'token-ETH',
          arbitrator: Arbitrator,
          quantity: 1
        },
        true
      )
      assert(events.OfferCreated)

      const offer = await getOffer('999-000-2', 0)
      assert(offer.id === '999-000-2-0')
      assert(offer.status === 1)
      assert(offer.commission === '2000000000000000000')
    })

    it('should create second offer with partial commission', async function() {
      const events = await mutate(
        mutations.MakeOffer,
        {
          listingID: '999-000-2',
          from: Buyer,
          finalizes: 123,
          affiliate: Affiliate,
          value: '0.01',
          currency: 'token-ETH',
          arbitrator: Arbitrator,
          quantity: 1
        },
        true
      )
      assert(events.OfferCreated)

      const offer = await getOffer('999-000-2', 1)
      assert.strictEqual(offer.id, '999-000-2-1')
      assert.strictEqual(offer.status, 1)
      assert.strictEqual(offer.commission, '1000000000000000000')
    })

    // TODO: enable this after fixing unit accounting
    it('should accept second offer with partial commission', async function() {
      const events = await mutate(
        mutations.AcceptOffer,
        {
          offerID: '999-000-2-1',
          from: Seller
        },
        true
      )
      assert(events.OfferAccepted)

      const offer = await getOffer('999-000-2', 1)
      assert.strictEqual(offer.status, 2)
    })

    it('should count units sold and available', async function() {
      const res = await client.query({
        query: queries.GetListing,
        variables: { id: '999-000-2' }
      })
      const listing = get(res, 'data.marketplace.listing', {})
      assert.strictEqual(listing.unitsPending, 2)
      assert.strictEqual(listing.unitsSold, 0)
      assert.strictEqual(listing.unitsAvailable, 2)
    })

    it('should create third offer with no commission', async function() {
      const events = await mutate(
        mutations.MakeOffer,
        {
          listingID: '999-000-2',
          from: Buyer,
          finalizes: 123,
          affiliate: Affiliate,
          value: '0.02',
          currency: 'token-ETH',
          arbitrator: Arbitrator,
          quantity: 2
        },
        true
      )
      assert(events.OfferCreated)

      const offer = await getOffer('999-000-2', 2)
      assert.strictEqual(offer.status, 1)
      assert.strictEqual(offer.commission, '0')
    })

    it('should count units sold and available', async function() {
      const res = await client.query({
        query: queries.GetListing,
        variables: { id: '999-000-2' }
      })
      const listing = get(res, 'data.marketplace.listing', {})
      assert.strictEqual(listing.unitsPending, 4)
      assert.strictEqual(listing.unitsSold, 0)
      assert.strictEqual(listing.unitsAvailable, 0)
    })

    it('should withdraw first offer', async function() {
      const events = await mutate(
        mutations.WithdrawOffer,
        {
          offerID: '999-000-2-0',
          from: Buyer
        },
        true
      )
      assert(events.OfferWithdrawn)
    })

    it('should not count withdrawn offer as units pending', async function() {
      const res = await client.query({
        query: queries.GetListing,
        variables: { id: '999-000-2' }
      })

      const listing = get(res, 'data.marketplace.listing', {})
      assert.strictEqual(listing.unitsPending, 3)
      assert.strictEqual(listing.unitsAvailable, 1)
    })

    it('should refuse to decrease total units below units sold', async function() {
      const updatedListingData = Object.assign({}, listingData)
      updatedListingData.unitData.unitsTotal = 2
      await assert.rejects(
        mutate(
          mutations.UpdateListing,
          {
            listingID: '999-000-2',
            additionalDeposit: '0',
            from: Seller,
            data: updatedListingData.data,
            unitData: updatedListingData.unitData
          },
          true
        ),
        {
          message:
            'GraphQL error: New unitsTotal is lower than units pending sale'
        }
      )
    })

    it('should decline third offer', async function() {
      // "Decline offer" means seller withdraws offer
      const events = await mutate(
        mutations.WithdrawOffer,
        {
          offerID: '999-000-2-2',
          from: Seller
        },
        true
      )
      assert(events.OfferWithdrawn)
    })

    it('should not count declined offer as units sold', async function() {
      const res = await client.query({
        query: queries.GetListing,
        variables: { id: '999-000-2' }
      })

      const listing = get(res, 'data.marketplace.listing', {})
      assert.strictEqual(listing.unitsPending, 1)
      assert.strictEqual(listing.unitsAvailable, 3)
    })

    it('should finalize the second offer', async function() {
      const events = await mutate(
        mutations.FinalizeOffer,
        {
          offerID: '999-000-2-1',
          from: Buyer
        },
        true
      )
      assert(events.OfferFinalized)
    })

    it('should count units sold and available', async function() {
      const res = await client.query({
        query: queries.GetListing,
        variables: { id: '999-000-2' }
      })
      const listing = get(res, 'data.marketplace.listing', {})
      assert.strictEqual(listing.unitsPending, 0)
      assert.strictEqual(listing.unitsSold, 1)
      assert.strictEqual(listing.unitsAvailable, 3)
    })

    it('should decrease unitsTotal', async function() {
      const updatedListingData = Object.assign({}, listingData)
      updatedListingData.unitData.unitsTotal = 1
      const events = await mutate(
        mutations.UpdateListing,
        {
          listingID: '999-000-2',
          additionalDeposit: '0',
          from: Seller,
          data: updatedListingData.data,
          unitData: updatedListingData.unitData
        },
        true
      )
      assert(events.ListingUpdated)
    })

    it('should count units sold and available', async function() {
      const res = await client.query({
        query: queries.GetListing,
        variables: { id: '999-000-2' }
      })

      const unitsSold = get(res, 'data.marketplace.listing.unitsSold')
      assert.strictEqual(unitsSold, 1)
      const unitsAvailable = get(res, 'data.marketplace.listing.unitsAvailable')
      assert.strictEqual(unitsAvailable, 0)
    })

    it('should increase unitsTotal', async function() {
      const updatedListingData = Object.assign({}, listingData)
      updatedListingData.unitData.unitsTotal = 5
      const events = await mutate(
        mutations.UpdateListing,
        {
          listingID: '999-000-2',
          additionalDeposit: '0',
          from: Seller,
          data: updatedListingData.data,
          unitData: updatedListingData.unitData
        },
        true
      )
      assert(events.ListingUpdated)
    })

    it('should count units sold and available', async function() {
      const res = await client.query({
        query: queries.GetListing,
        variables: { id: '999-000-2' }
      })

      const unitsSold = get(res, 'data.marketplace.listing.unitsSold')
      assert.strictEqual(unitsSold, 1)
      const unitsAvailable = get(res, 'data.marketplace.listing.unitsAvailable')
      assert.strictEqual(unitsAvailable, 4)
    })

    it('should error when purchasing too many units', async function() {
      await assert.rejects(
        mutate(
          mutations.MakeOffer,
          {
            listingID: '999-000-2',
            from: Buyer,
            finalizes: 123,
            affiliate: Affiliate,
            value: '0.05',
            currency: 'token-ETH',
            arbitrator: Arbitrator,
            quantity: 5
          },
          true
        ),
        {
          message:
            'GraphQL error: Insufficient units available (4) for offer (5)'
        }
      )
    })
  })

  describe('Home share listing with commission', async function() {
    let listingData

    before(async function() {
      await mutate(mutations.TransferToken, {
        token: OGN,
        from: Admin,
        to: Seller,
        value: '3'
      })
      // Setting the 'getEvents' parameter to true causes an error.
      listingData = {
        deposit: '3',
        depositManager: Arbitrator,
        from: Seller,
        autoApprove: true,
        data: {
          title: 'Home share listing',
          description: 'Test description',
          price: {
            currency: 'token-ETH',
            amount: '0.01'
          },
          category: 'Test category',
          subCategory: 'Test sub-category',
          commission: '3',
          commissionPerUnit: '1'
        },
        fractionalData: {
          weekendPrice: {
            currency: 'token-ETH',
            amount: '0.02'
          }
        }
      }
    })

    it('should create a listing', async function() {
      await mutate(mutations.CreateListing, listingData)
    })
  })

  describe('Dispute flow', async function() {
    let listingIdx
    let listingId
    let offerIdx
    let offerId

    beforeEach(async function() {
      // Create Listing
      const listingData = {
        deposit: '0',
        depositManager: Arbitrator,
        from: Seller,
        data: {
          title: 'Test Listing',
          description: 'Test description',
          price: {
            currency: 'token-ETH',
            amount: '0.01'
          },
          category: 'Test category',
          subCategory: 'Test sub-category'
        },
        unitData: {
          unitsTotal: 1
        }
      }
      const listingEvents = await mutate(
        mutations.CreateListing,
        listingData,
        true
      )
      assert(listingEvents.ListingCreated)
      listingIdx = listingEvents.ListingCreated.listingID
      listingId = `999-000-${listingIdx}`

      // Create Offer
      const offerData = {
        listingID: listingId,
        from: Buyer,
        finalizes: 123,
        affiliate: ZeroAddress,
        value: '0.01',
        currency: 'token-ETH',
        arbitrator: Arbitrator,
        quantity: 1
      }
      const offerEvents = await mutate(mutations.MakeOffer, offerData, true)
      assert(offerEvents.OfferCreated)
      offerIdx = offerEvents.OfferCreated.offerID
      offerId = `999-000-${listingIdx}-${offerIdx}`

      // Accept Offer
      const acceptEvents = await mutate(
        mutations.AcceptOffer,
        {
          offerID: offerId,
          from: Seller
        },
        true
      )
      assert(acceptEvents.OfferAccepted)

      // Dispute Offer
      const disputeEvents = await mutate(
        mutations.DisputeOffer,
        {
          offerID: offerId,
          additionalDeposit: '0',
          from: Seller,
          data: JSON.stringify({})
        },
        true
      )
      assert(disputeEvents.OfferDisputed)
    })

    it('should allow a pay-seller ruling from an arbitrator', async function() {
      // Rule on dispute
      const rulingEvents = await mutate(
        mutations.ExecuteRuling,
        {
          offerID: offerId,
          from: Arbitrator,
          ruling: 'pay-seller',
          refund: '0.001',
          commission: 'refund',
          message: 'Buyer failed to show for non-refundable appointment.'
        },
        true
      )
      assert(rulingEvents.OfferRuling)
    })

    it('should allow a partial-refund ruling from an arbitrator', async function() {
      // Rule on dispute
      const rulingEvents = await mutate(
        mutations.ExecuteRuling,
        {
          offerID: offerId,
          from: Arbitrator,
          ruling: 'partial-refund',
          refund: contracts.web3.utils.toWei('0.001'),
          commission: 'pay',
          message: 'Product was shipped late, but was as described.'
        },
        true
      )
      assert(rulingEvents.OfferRuling)
    })

    it('should allow a refund-buyer ruling from an arbitrator', async function() {
      // Rule on dispute
      const events = await mutate(
        mutations.ExecuteRuling,
        {
          offerID: offerId,
          from: Arbitrator,
          ruling: 'refund-buyer',
          commission: 'pay',
          message: 'No tracking number provided by seller.'
        },
        true
      )
      assert(events.OfferRuling)
    })

    it('should not allow an invalid ruling', async function() {
      try {
        await mutate(
          mutations.ExecuteRuling,
          {
            offerID: offerId,
            from: Arbitrator,
            ruling: 'foo',
            refund: contracts.web3.utils.toWei('0.003'),
            commission: 'pay',
            message: 'No tracking number provided by seller.'
          },
          true
        )
        assert(false)
      } catch (e) {
        assert(true)
      }
    })

    it('should not allow an invalid commission', async function() {
      try {
        await mutate(
          mutations.ExecuteRuling,
          {
            offerID: offerId,
            from: Arbitrator,
            ruling: 'pay-seller',
            refund: contracts.web3.utils.toWei('0.001'),
            commission: 'foobar',
            message: 'No tracking number provided by seller.'
          },
          true
        )
        assert(false)
      } catch (e) {
        assert(true)
      }
    })
  })
})
