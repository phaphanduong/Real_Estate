import React, { Component, Fragment } from 'react'
import { withApollo, Query } from 'react-apollo'
import { fbt } from 'fbt-runtime'

import formatTimeDifference from 'utils/formatTimeDifference'
import QueryError from 'components/QueryError'
import profileQuery from 'queries/Profile'
import AccountTokenBalance from 'queries/TokenBalance'
import ActionList from 'pages/growth/ActionList'
import GrowthInvite from 'pages/growth/Invite'
import ProgressBar from 'components/ProgressBar'
import withGrowthCampaign from 'hoc/withGrowthCampaign'
import withIsMobile from 'hoc/withIsMobile'

const GrowthEnum = require('Growth$FbtEnum')
const maxProgressBarTokens = 1000

const GrowthTranslation = ({ stringKey }) => {
  return (
    <fbt desc="growth">
      <fbt:enum enum-range={GrowthEnum} value={stringKey} />
    </fbt>
  )
}

function NavigationItem(props) {
  const { selected, onClick, title } = props
  return (
    <a
      href="#"
      onClick={e => {
        e.preventDefault()
        onClick()
      }}
      className="pt-4 pr-4"
    >
      <div className="d-flex flex-column align-items-center">
        <div className={`title ${selected ? 'active' : ''}`}>{title}</div>
        {selected && <div className="select-bar" />}
      </div>
    </a>
  )
}

function CampaignNavList(props) {
  const { onNavigationClick, navigation, isMobile } = props
  return (
    <div
      className={`campaign-list d-flex justify-content-left ${
        !isMobile ? 'mt-4' : ''
      }`}
    >
      <NavigationItem
        selected={navigation === 'currentCampaign'}
        onClick={() => onNavigationClick('currentCampaign')}
        title={fbt('Current Campaign', 'growth.campaigns.currentCampaign')}
      />
      <NavigationItem
        selected={navigation === 'pastCampaigns'}
        onClick={() => onNavigationClick('pastCampaigns')}
        title={fbt('Past Campaigns', 'growth.campaigns.pastCampaigns')}
      />
    </div>
  )
}

function Campaign(props) {
  const { campaign, handleNavigationChange, decimalDivision, isMobile } = props

  const {
    startDate,
    endDate,
    status,
    rewardEarned,
    actions,
    nameKey
  } = campaign

  let timeLabel = ''
  let subTitleText = ''

  if (status === 'Active') {
    timeLabel = `${fbt(
      'Time left',
      'RewardCampaigns.timeLeft'
    )}:${formatTimeDifference(Date.now(), endDate)}`
    subTitleText = fbt(
      'Get Origin Tokens by completing the steps below',
      'RewardCampaigns.getOriginTokensSteps'
    )
  } else if (status === 'Pending') {
    timeLabel = `${fbt(
      'Starts in',
      'RewardCampaigns.startsIn'
    )}:${formatTimeDifference(Date.now(), startDate)}`
    subTitleText = fbt(
      `This campaign hasn't started yet`,
      'RewardCampaigns.hasntStartedYet'
    )
  } else if (status === 'Completed' || status === 'CapReached') {
    subTitleText = fbt(
      'This campaign has finished',
      'RewardCampaigns.campaignHasFinished'
    )
  }

  // campaign rewards converted normalized to token value according to number of decimals
  const tokensEarned = web3.utils
    .toBN(rewardEarned ? rewardEarned.amount : 0)
    .div(decimalDivision)
  const tokenEarnProgress = Math.min(
    maxProgressBarTokens,
    tokensEarned.toString()
  )

  return (
    <Fragment>
      <div className="d-flex justify-content-between">
        <h1 className="mb-2 pt-3">
          {GrowthEnum[nameKey] ? (
            <GrowthTranslation stringKey={nameKey} />
          ) : (
            fbt('Campaign', 'Campaign')
          )}
        </h1>
      </div>
      <div className="subtitle">{subTitleText}</div>
      <div className="d-flex justify-content-between campaign-info">
        <div>
          {status !== 'Pending' && (
            <Fragment>
              <span className="font-weight-bold">
                <fbt desc="Campaign.tokensEarned">Tokens earned</fbt>
              </span>
              <img className="ogn-icon pl-2 pr-1" src="images/ogn-icon.svg" />
              <span className="ogn-amount font-weight-bold">
                {tokensEarned.toString()}
              </span>
            </Fragment>
          )}
        </div>
        <div className="font-weight-bold">{timeLabel}</div>
      </div>
      <ProgressBar
        maxValue={maxProgressBarTokens}
        progress={tokenEarnProgress}
        showIndicators={!isMobile}
      />
      <ActionList
        actions={actions}
        decimalDivision={decimalDivision}
        handleNavigationChange={handleNavigationChange}
        isMobile={isMobile}
      />
    </Fragment>
  )
}

class PastCampaigns extends Component {
  render() {
    const { campaigns, decimalDivision } = this.props

    const pastCampaigns = campaigns.filter(
      campaign =>
        campaign.status === 'Completed' || campaign.status === 'CapReached'
    )

    const totalEarnings = pastCampaigns
      .map(campaign =>
        web3.utils.toBN(
          campaign.rewardEarned ? campaign.rewardEarned.amount : 0
        )
      )
      .reduce(
        (accumulator, currentValue) => accumulator.add(currentValue),
        web3.utils.toBN(0)
      )
      .div(decimalDivision)

    return (
      <div className="past-campaigns d-flex flex-column">
        <div className="title">
          <fbt desc="growth.campaigns.totalEarnings">Total Earnings</fbt>
        </div>
        <div className="total-earned d-flex mt-2 align-items-center">
          <img className="mr-1" src="images/ogn-icon.svg" />
          <div>{totalEarnings.toString()}</div>
        </div>
        <div>
          {pastCampaigns.map(campaign => {
            const nameKey = campaign.nameKey
            const tokensEarned = web3.utils
              .toBN(campaign.rewardEarned ? campaign.rewardEarned.amount : 0)
              .div(decimalDivision)

            return (
              <div key={nameKey} className="past-campaign">
                <div className="campaign-title">
                  {GrowthEnum[nameKey] ? (
                    <GrowthTranslation stringKey={nameKey} />
                  ) : (
                    'Campaign'
                  )}
                </div>
                <div className="d-flex align-items-center tokens-earned-holder">
                  <div className="tokens-earned mr-2">
                    <fbt desc="growth.campaigns.tokensEarned">
                      Tokens earned
                    </fbt>
                  </div>
                  <div className="total-earned d-flex align-items-center">
                    <img className="mr-1" src="images/ogn-icon.svg" />
                    <div>{tokensEarned.toString()}</div>
                  </div>
                </div>
                <ProgressBar
                  maxValue={maxProgressBarTokens}
                  progress={Math.min(
                    tokensEarned.toString(),
                    maxProgressBarTokens
                  )}
                  showIndicators={false}
                  style="compact"
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}

class GrowthCampaign extends Component {
  state = {
    navigation: 'currentCampaign'
  }

  render() {
    const { navigation } = this.state

    const {
      handleNavigationChange,
      campaigns,
      accountId,
      decimalDivision,
      isMobile
    } = this.props

    const activeCampaign = campaigns.find(
      campaign => campaign.status === 'Active'
    )

    return (
      <Fragment>
        <CampaignNavList
          campaigns={campaigns}
          navigation={navigation}
          onNavigationClick={navigation => {
            this.setState({ navigation })
          }}
          isMobile={isMobile}
        />
        {navigation === 'currentCampaign' && (
          <Campaign
            campaign={activeCampaign}
            accountId={accountId}
            handleNavigationChange={navigation =>
              handleNavigationChange(navigation)
            }
            decimalDivision={decimalDivision}
            isMobile={isMobile}
          />
        )}
        {navigation === 'pastCampaigns' && (
          <PastCampaigns
            campaigns={campaigns}
            decimalDivision={decimalDivision}
          />
        )}
      </Fragment>
    )
  }
}

class GrowthCampaigns extends Component {
  state = {
    first: 5,
    navigation: 'Campaigns'
  }

  handleNavigationChange(navigation) {
    this.setState({ navigation })
  }

  componentDidUpdate() {
    if (
      this.props.growthEnrollmentStatus === 'NotEnrolled' ||
      this.props.growthEnrollmentStatus === 'Banned'
    ) {
      this.props.history.push('/welcome')
    }
  }

  render() {
    const { navigation } = this.state
    const isMobile = this.props.ismobile === 'true'

    return (
      <div className={`container growth-campaigns ${isMobile ? 'mobile' : ''}`}>
        <Query query={profileQuery} notifyOnNetworkStatusChange={true}>
          {({ error, data, networkStatus, loading }) => {
            if (networkStatus === 1 || loading) {
              return (
                <h5 className="p-2">
                  <fbt desc="Loading...">Loading...</fbt>
                </h5>
              )
            } else if (error) {
              return <QueryError error={error} query={profileQuery} />
            }

            if (!data.web3.primaryAccount) {
              return ''
            }

            const accountId = data.web3.primaryAccount.id

            if (!this.props.growthCampaigns) {
              return (
                <h5 className="p-2">
                  <fbt desc="Loading...">Loading...</fbt>
                </h5>
              )
            }

            const campaigns = this.props.growthCampaigns
            if (campaigns.length == 0) {
              return (
                <h5 className="p-2">
                  <fbt desc="growth.campaigns.noCampaignsDetected">
                    No campaigns detected
                  </fbt>
                </h5>
              )
            }

            const activeCampaign = campaigns.find(
              campaign => campaign.status === 'Active'
            )

            return (
              <Query
                query={AccountTokenBalance}
                variables={{ account: accountId, token: 'OGN' }}
              >
                {({ loading, error, data }) => {
                  let decimalDivision = web3.utils
                    .toBN(10)
                    .pow(web3.utils.toBN(18))

                  if (!loading && !error) {
                    const tokenHolder = data.web3.account.token
                    if (tokenHolder && tokenHolder.token) {
                      decimalDivision = web3.utils
                        .toBN(10)
                        .pow(web3.utils.toBN(tokenHolder.token.decimals))
                    }
                  }

                  return (
                    <Fragment>
                      {navigation === 'Campaigns' && (
                        <GrowthCampaign
                          campaigns={campaigns}
                          accountId={accountId}
                          decimalDivision={decimalDivision}
                          handleNavigationChange={navigation =>
                            this.handleNavigationChange(navigation)
                          }
                          isMobile={isMobile}
                        />
                      )}
                      {navigation === 'Invite' && (
                        <GrowthInvite
                          handleNavigationChange={navigation =>
                            this.handleNavigationChange(navigation)
                          }
                          activeCampaign={activeCampaign}
                          decimalDivision={decimalDivision}
                          isMobile={isMobile}
                        />
                      )}
                    </Fragment>
                  )
                }}
              </Query>
            )
          }}
        </Query>
      </div>
    )
  }
}

export default withIsMobile(withApollo(withGrowthCampaign(GrowthCampaigns)))

require('react-styl')(`
  .growth-campaigns.container
    max-width: 760px
  .growth-campaigns
    .info-icon
      padding-top: 30px
    .info-icon img
      width: 28px
    .ogn-amount
      color: var(--clear-blue)
    .ogn-icon
      position: relative
      top: -3px
    .campaign-info
      padding-top: 40px
    h5
      text-align: center
    .action-title
      font-weight: bold
      color: var(--steel)
      margin-top: 30px
      margin-left: 5px
      margin-bottom: -5px
    .campaign-list
      .select-bar
        background-color: var(--clear-blue)
        height: 4px
        width: 100%
      .title
        font-size: 0.88rem
        line-height: 1.93
        color: var(--bluey-grey)
        font-weight: normal
      .title.active
        color: var(--dark)
    .past-campaigns
      .title
        font-size: 1.31rem
        font-weight: bold
        font-style: normal
        padding-top: 1.875rem
      .total-earned
        font-size: 38px
        font-weight: bold
        color: var(--clear-blue)
        line-height: 0.71
      .total-earned img
        width: 34px
        height: 34px
      .past-campaign
        margin-top: 45px
        .campaign-title
          font-family: Poppins
          font-size: 24px
          font-weight: 300
          color: var(--dark)
        .tokens-earned-holder
          margin-top: 12px
          .tokens-earned
            font-family: Lato
            color: var(--dark)
            font-weight: normal
        .total-earned
          font-size: 18px
          font-weight: bold
          color: var(--clear-blue)
          line-height: 1.5
        .total-earned img
          width: 20px
          height: 20px
  .growth-campaigns.mobile
    h1
      font-size: 2rem
    .subtitle
      font-size: 1rem
    .campaign-info
      font-size: 1rem
      padding-top: 1.875rem
      .ogn-icon
        width: 1.875rem
    .past-campaigns
      .title
        font-size: 1.12rem
        padding-top: 0.8rem
      .total-earned
        font-size: 1.6rem
      .total-earned img
        width: 1.6rem
        height: 1.6rem
      .past-campaign
        margin-top: 2rem
        .campaign-title
          font-size: 1.3rem
        .tokens-earned-holder
          margin-top: 0.6rem
          .tokens-earned
            font-size: 1.1rem
        .total-earned
          font-size: 1rem
          line-height: 1.3
        .total-earned img
          width: 1rem
          height: 1rem

`)
