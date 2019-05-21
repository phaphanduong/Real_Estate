import React, { Component } from 'react'
import AvailabilityCalculator from '@origin/graphql/src/utils/AvailabilityCalculator'
import AvailabilityCalculatorHourly from '@origin/graphql/src/utils/AvailabilityCalculatorHourly'
import get from 'lodash/get'
import { fbt } from 'fbt-runtime'

import withWallet from 'hoc/withWallet'

import Gallery from 'components/Gallery'
import Reviews from 'components/Reviews'
import AboutParty from 'components/AboutParty'
import ListingBadge from 'components/ListingBadge'
import Calendar from 'components/Calendar'
import WeekCalendar from 'components/WeekCalendar'
import DocumentTitle from 'components/DocumentTitle'
import Category from 'components/Category'

import Sold from './_ListingSold'
import Pending from './_ListingPending'
import Withdrawn from './_ListingWithdrawn'
import EditOnly from './_ListingEditOnly'
import OfferMade from './_ListingOfferMade'
import SingleUnit from './_BuySingleUnit'
import MultiUnit from './_BuyMultiUnit'
import Fractional from './_BuyFractional'
import FractionalHourly from './_BuyFractionalHourly'

import countryCodeMapping from '@origin/graphql/src/constants/CountryCodes'
import { CurrenciesByCountryCode } from 'constants/Currencies'

class ListingDetail extends Component {
  constructor(props) {
    super(props)
    this.state = { mobile: window.innerWidth < 767 }
    this.onResize = this.onResize.bind(this)
    if (props.listing.__typename === 'FractionalListing') {
      this.state.availability = new AvailabilityCalculator({
        weekdayPrice: get(props, 'listing.price.amount'),
        weekendPrice: get(props, 'listing.weekendPrice.amount'),
        booked: get(props, 'listing.booked'),
        unavailable: get(props, 'listing.unavailable'),
        customPricing: get(props, 'listing.customPricing')
      })
    }
    if (props.listing.__typename === 'FractionalHourlyListing') {
      this.state.availabilityHourly = new AvailabilityCalculatorHourly({
        booked: get(props, 'listing.booked'),
        unavailable: get(props, 'listing.unavailable'),
        customPricing: get(props, 'listing.customPricing'),
        timeZone: get(props, 'listing.timeZone'),
        workingHours: get(props, 'listing.workingHours'),
        price: get(props, 'listing.price.amount')
      })
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize)
  }

  onResize() {
    if (window.innerWidth < 767 && !this.state.mobile) {
      this.setState({ mobile: true })
    } else if (window.innerWidth >= 767 && this.state.mobile) {
      this.setState({ mobile: false })
    }
  }

  render() {
    const { listing } = this.props
    const isMobile = this.state.mobile

    return (
      <div className="container listing-detail">
        <DocumentTitle pageTitle={listing.title} />
        <div className="header">
          <div className="category">
            <Category listing={listing} />
          </div>
          <ListingBadge status={listing.status} featured={listing.featured} />
        </div>
        <h2>{listing.title}</h2>

        {isMobile ? (
          <>
            {this.renderListing()}
            {this.renderAction()}
            <h5>
              <fbt desc="listingDetail.about-the-seller">About the Seller</fbt>
            </h5>
            <AboutParty id={listing.seller.id} />
            <Reviews id={listing.seller.id} seller />
          </>
        ) : (
          <div className="row">
            <div className="col-md-8 pb-3">
              {this.renderListing()}
              <hr />
              <Reviews id={listing.seller.id} seller />
            </div>
            <div className="col-md-4">
              {this.renderAction()}
              <h5>
                <fbt desc="listingDetail.about-the-seller">
                  About the Seller
                </fbt>
              </h5>
              <AboutParty id={listing.seller.id} />
            </div>
          </div>
        )}
      </div>
    )
  }

  renderListing() {
    const { listing } = this.props
    const isFractional = listing.__typename === 'FractionalListing'
    const isFractionalHourly = listing.__typename === 'FractionalHourlyListing'
    const isGiftCard = listing.__typename === 'GiftCardListing'
    const isOwnerViewing = listing.seller.id === this.props.wallet
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const isDifferentTimeZone = listing.timeZone !== userTimeZone
    return (
      <>
        <Gallery pics={listing.media} />

        {isGiftCard || isFractional || isFractionalHourly ? null : (
          <div className="description">{listing.description}</div>
        )}
        {!isGiftCard ? null : (
          <>
            <div className="row">
              <div className="card-details col-sm-6">
                <div className="field-row">
                  <span>
                    <fbt desc="create.details.retailer">Retailer</fbt>
                  </span>
                  <span>{listing.retailer}</span>
                </div>
                <div className="field-row">
                  <span>
                    <fbt desc="create.details.cardAmount">Amount on Card</fbt>
                  </span>
                  <span>
                    {CurrenciesByCountryCode[listing.issuingCountry][2]}
                    {listing.cardAmount}
                  </span>
                </div>
                <div className="field-row">
                  <span>
                    <fbt desc="create.details.issuingCountry">
                      Issuing Country
                    </fbt>
                  </span>
                  <span>
                    <img
                      className="country-flag-img"
                      src={`images/flags/${listing.issuingCountry.toLowerCase()}.svg`}
                    />
                    {countryCodeMapping['en'][listing.issuingCountry]}
                  </span>
                </div>
              </div>
              <div className="card-details col-sm-6">
                <div className="field-row">
                  <span>
                    <fbt desc="create.details.giftcard.isDigital">
                      Card type
                    </fbt>
                  </span>
                  <span>
                    {listing.isDigital ? (
                      <fbt desc="digital">Digital</fbt>
                    ) : (
                      <fbt desc="physical">Physical</fbt>
                    )}
                  </span>
                </div>
                <div className="field-row">
                  <span>
                    <fbt desc="create.details.giftcard.isCashPurchase">
                      Was this a cash purchase?
                    </fbt>
                  </span>
                  <span>
                    {listing.isCashPurchase ? (
                      <fbt desc="yes">Yes</fbt>
                    ) : (
                      <fbt desc="no">No</fbt>
                    )}
                  </span>
                </div>
                <div className="field-row">
                  <span>
                    <fbt desc="create.details.giftcard.receiptAvailable">
                      Is a receipt available?
                    </fbt>
                  </span>
                  <span>
                    {listing.receiptAvailable ? (
                      <fbt desc="yes">Yes</fbt>
                    ) : (
                      <fbt desc="no">No</fbt>
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="description">{listing.description}</div>
          </>
        )}
        {!isFractional ? null : (
          <>
            <div className="description">{listing.description}</div>

            <hr />
            <Calendar
              interactive={!isOwnerViewing}
              small={true}
              onChange={state => this.setState(state)}
              availability={this.state.availability}
              currency={listing.price.currency}
            />
            <div className="availability-help">
              <fbt desc="listingDetail.clickAndDrag">
                * Click and drag to select a date range
              </fbt>
            </div>
          </>
        )}
        {!isFractionalHourly ? null : (
          <>
            <div className="description">{listing.description}</div>

            <hr />
            <div className="timeZone">
              <div>
                <fbt desc="listingDetail.timeZone">Time Zone:</fbt>{' '}
                {listing.timeZone}
                {isDifferentTimeZone && (
                  <div>
                    <fbt desc="listingDetail.timeZoneWarning">
                      NOTE: This is different from your time zone of
                      <fbt:param name="userTimeZone">{userTimeZone}</fbt:param>
                    </fbt>
                  </div>
                )}
              </div>
            </div>
            <WeekCalendar
              interactive={!isOwnerViewing}
              small={true}
              onChange={state => this.setState(state)}
              availability={this.state.availabilityHourly}
              currency={listing.price.currency}
            />
            <div className="availability-help">
              <fbt desc="listingDetail.weekCalendarHelp">
                * Click and drag to select a time range
              </fbt>
            </div>
          </>
        )}
      </>
    )
  }

  renderAction() {
    const { listing } = this.props
    const isFractional = listing.__typename === 'FractionalListing'
    const isFractionalHourly = listing.__typename === 'FractionalHourlyListing'
    const isAnnouncement = listing.__typename === 'AnnouncementListing'
    const isPendingBuyer = listing.pendingBuyers.some(
      b => b.id === this.props.wallet
    )

    if (listing.seller.id === this.props.wallet) {
      return (
        <EditOnly
          {...this.props}
          isAnnouncement={isAnnouncement}
          isFractional={isFractional}
          isFractionalHourly={isFractionalHourly}
        />
      )
    } else if (isAnnouncement) {
      return null
    } else if (listing.status === 'sold') {
      return <Sold />
    } else if (isPendingBuyer && !listing.multiUnit) {
      return <OfferMade />
    } else if (isPendingBuyer && listing.multiUnit) {
      return (
        <>
          <MultiUnit {...this.props} />
          <OfferMade />
        </>
      )
    } else if (listing.status === 'pending') {
      return <Pending />
    } else if (listing.status === 'withdrawn') {
      return <Withdrawn />
    } else if (isFractional) {
      return (
        <Fractional
          {...this.props}
          range={this.state.range}
          availability={this.state.availability}
        />
      )
    } else if (isFractionalHourly) {
      return (
        <FractionalHourly
          {...this.props}
          range={this.state.range}
          availability={this.state.availabilityHourly}
        />
      )
    } else if (listing.multiUnit) {
      return <MultiUnit {...this.props} isPendingBuyer={isPendingBuyer} />
    }
    return <SingleUnit {...this.props} />
  }
}

export default withWallet(ListingDetail)

require('react-styl')(`
  .listing-detail
    margin-top: 2.5rem

    h2
      font-family: var(--heading-font)
      font-size: 40px
      font-weight: 200
      font-style: normal
      color: var(--dark)
      line-height: 1.25

    .header
      display: flex
      align-items: center
      justify-content: space-between

    .category
      font-family: var(--default-font)
      font-size: 14px
      color: var(--dusk)
      font-weight: normal
      text-transform: uppercase
      margin-top: 0.75rem

    .badge
      margin-top: 0.75rem

    .gallery
      margin-bottom: 1rem

    .main-pic
      padding-top: 56.6%
      background-size: contain
      background-repeat: no-repeat
      background-position: top center
      border: 1px solid var(--pale-grey-two)

    .description
      white-space: pre-wrap

    .timeZone
      font-size: 1rem
      margin-bottom: 1rem

    .availability-help
      font-size: 14px
      margin-bottom: 1rem

    .field-row
      display: flex
      justify-content: space-between
      font-weight: normal
      margin-bottom: 1rem
      > span:nth-child(2)
        font-weight: bold
        text-align: right
    .country-flag-img
      width: 2rem
      height: 2rem
      margin-right: .5rem;

    .listing-buy
      padding: 1.5rem
      border-radius: var(--default-radius)
      background-color: var(--pale-grey-eight)
      margin-bottom: 1rem
      .btn-primary
        border-radius: 2rem
        padding: 0.5rem 1rem
        width: 100%
      .quantity,.total
        font-family: var(--default-font)
        font-size: 18px
        color: #000
        font-weight: normal
        display: flex
        justify-content: space-between
        margin-bottom: 1rem
        span:last-child
          font-weight: bold
      .total
        padding-top: 0

      .price
        font-family: var(--default-font)
        font-size: 22px
        color: var(--dark)
        font-weight: bold
        line-height: 1
        margin-bottom: 1rem
        span.desc
          font-weight: normal
          margin-left: 0.25rem
        .orig
          color: var(--steel)
          font-weight: normal
          margin-left: 1rem
          font-size: 16px
      .price-old
        display: flex
        align-items: baseline
        margin-bottom: 1.5rem
        white-space: nowrap
        flex-wrap: wrap
        .eth
          background: url(images/eth-icon.svg) no-repeat
          background-size: 1.5rem
          padding-left: 2rem
          line-height: 1.5rem
          font-family: var(--default-font)
          font-size: 24px
          font-weight: bold
          font-style: normal
          color: #000000
          > span
            font-weight: normal
        .usd
          color: var(--steel)
          font-weight: normal
          margin-left: 1rem
          font-size: 16px
      &.fractional
        .choose-dates
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem

          div:nth-child(1),div:nth-child(3)
            border-radius: var(--default-radius);
            padding: 0 5px;
            cursor: pointer
            &:hover
              background: var(--pale-grey-seven);
          div:nth-child(1)
            margin-left: -5px;
          div:nth-child(3)
            margin-right: -5px;

          div:nth-child(2)
            flex: 1
            background: url(images/arrow-right.svg) no-repeat center
            background-size: 1.25rem
          div:nth-child(3)
            text-align: right
      &.pending
        text-align: center
        font-weight: normal
        > div:nth-child(2)
          font-size: 24px;
          margin: 1rem 0;
        > div:nth-child(3)
          margin-bottom: 1rem

  @media (max-width: 767.98px)
    .listing-detail
      margin-top: 0.5rem
      h2
        font-size: 32px
      .description
        margin-top: 1rem
        margin-bottom: 2rem
      .about-party
        margin-bottom: 2rem
`)
