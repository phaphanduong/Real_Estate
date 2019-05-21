import React, { Component } from 'react'
import { Mutation } from 'react-apollo'
import get from 'lodash/get'
import numberFormat from 'utils/numberFormat'
import { withRouter } from 'react-router-dom'
import store from 'utils/store'
const sessionStore = store('sessionStorage')

import MakeOfferMutation from 'mutations/MakeOffer'
import SwapToTokenMutation from 'mutations/SwapToToken'
import AllowTokenMutation from 'mutations/AllowToken'

import Modal from 'components/Modal'
import TransactionError from 'components/TransactionError'
import WaitForTransaction from 'components/WaitForTransaction'
import Redirect from 'components/Redirect'

import withCanTransact from 'hoc/withCanTransact'
import withWallet from 'hoc/withWallet'
import withWeb3 from 'hoc/withWeb3'
import { fbt } from 'fbt-runtime'

class Buy extends Component {
  state = {}

  hasBalance() {
    return get(this.props, 'tokenStatus.hasBalance', false)
  }

  hasAllowance() {
    return get(this.props, 'tokenStatus.hasAllowance', false)
  }

  render() {
    if (this.state.onboard) {
      return <Redirect to={`/listing/${this.props.listing.id}/onboard`} />
    }
    let content

    let action = (
      <button
        className={this.props.className}
        onClick={() => this.setState({ modal: true })}
        children={this.props.children}
      />
    )

    if (this.state.error) {
      content = this.renderTransactionError()
    } else if (this.state.waitFor) {
      content = this.renderWaitModal()
    } else if (this.state.waitForAllow) {
      content = this.renderWaitAllowModal()
    } else if (this.state.waitForSwap) {
      content = this.renderWaitSwapModal()
    } else if (this.state.allow) {
      content = this.renderAllowTokenModal()
    } else if (!this.hasBalance()) {
      action = this.renderSwapTokenMutation(
        this.props.cannotTransact ? 'Purchase' : 'Swap Now'
      )
      content = this.renderSwapTokenModal()
    } else if (!this.hasAllowance()) {
      action = this.renderAllowTokenMutation('Purchase')
      content = this.renderAllowTokenModal()
    } else {
      action = this.renderMakeOfferMutation()
    }

    return (
      <>
        {action}
        {!this.state.modal ? null : (
          <Modal
            onClose={() =>
              this.setState({ error: false, modal: false, shouldClose: false })
            }
            shouldClose={this.state.shouldClose}
          >
            {content}
          </Modal>
        )}
      </>
    )
  }

  renderTransactionError() {
    return (
      <TransactionError
        reason={this.state.error}
        data={this.state.errorData}
        contentOnly={true}
        onClose={() => this.setState({ shouldClose: true })}
      />
    )
  }

  renderSwapTokenModal() {
    return (
      <>
        <h2>Swap for DAI</h2>
        Click below to swap ETH for DAI
        <div className="actions">
          <button
            className="btn btn-outline-light"
            onClick={() => this.setState({ shouldClose: true })}
            children={fbt('Cancel', 'Cancel')}
          />
          {this.renderSwapTokenMutation()}
        </div>
      </>
    )
  }

  renderSwapTokenMutation(buttonContent) {
    return (
      <Mutation
        mutation={SwapToTokenMutation}
        onCompleted={({ swapToToken }) => {
          this.setState({ waitForSwap: swapToToken.id })
        }}
        onError={errorData =>
          this.setState({ waitForSwap: false, error: 'mutation', errorData })
        }
      >
        {swapToToken => (
          <button
            className={buttonContent ? this.props.className : 'btn btn-clear'}
            onClick={() => this.onSwapToToken(swapToToken)}
            children={buttonContent || fbt('buy.DaiSwapNow', 'Swap Now')}
          />
        )}
      </Mutation>
    )
  }

  renderWaitSwapModal() {
    return (
      <WaitForTransaction
        hash={this.state.waitForSwap}
        onClose={() => this.setState({ waitForSwap: null })}
        contentOnly={true}
        event="TokenPurchase"
      >
        {({ event }) => {
          const eth = numberFormat(
              web3.utils.fromWei(
                get(event, 'returnValuesArr.1.value', '0'),
                'ether'
              ),
              5
            ),
            dai = numberFormat(
              web3.utils.fromWei(
                get(event, 'returnValuesArr.2.value', '0'),
                'ether'
              ),
              2
            )
          return (
            <div className="make-offer-modal success">
              <div className="success-icon-lg" />
              <h5>
                <fbt desc="success">Success!</fbt>
              </h5>
              <div className="help">
                <fbt desc="buy.swappedEthForDai">
                  Swapped
                  <fbt:param name="eth">${eth}</fbt:param>
                  ETH for
                  <fbt:param name="dai">${dai}</fbt:param>
                  DAI
                </fbt>
              </div>
              {this.hasAllowance() ? (
                this.renderMakeOfferMutation(
                  <fbt desc="continue">Continue</fbt>
                )
              ) : (
                <>
                  <div className="help">
                    <fbt desc="buy.authorizeOriginMoveDai">
                      Please authorize Origin to move DAI on your behalf.
                    </fbt>
                  </div>
                  {this.renderAllowTokenMutation()}
                </>
              )}
            </div>
          )
        }}
      </WaitForTransaction>
    )
  }

  renderAllowTokenModal() {
    return (
      <>
        <h2>Approve DAI</h2>
        <fbt desc="buy.approveDaiOrigin">
          Click below to approve DAI for use on Origin
        </fbt>
        <div className="actions">
          <button
            className="btn btn-outline-light"
            onClick={() => this.setState({ shouldClose: true })}
            children={fbt('Cancel', 'Cancel')}
          />
          {this.renderAllowTokenMutation()}
        </div>
      </>
    )
  }

  renderAllowTokenMutation(buttonContent) {
    return (
      <Mutation
        mutation={AllowTokenMutation}
        onCompleted={({ updateTokenAllowance }) => {
          this.setState({ waitForAllow: updateTokenAllowance.id })
        }}
        onError={errorData =>
          this.setState({ waitForAllow: false, error: 'mutation', errorData })
        }
      >
        {allowToken => (
          <button
            className={buttonContent ? this.props.className : 'btn btn-clear'}
            onClick={() => this.onAllowToken(allowToken)}
            children={buttonContent || fbt('Approve', 'Approve')}
          />
        )}
      </Mutation>
    )
  }

  renderMakeOfferMutation(btnContent) {
    return (
      <Mutation
        mutation={MakeOfferMutation}
        onCompleted={({ makeOffer }) => {
          this.setState({ waitFor: makeOffer.id })
        }}
        onError={errorData =>
          this.setState({ waitFor: false, error: 'mutation', errorData })
        }
      >
        {makeOffer => (
          <button
            className={btnContent ? 'btn btn-clear' : this.props.className}
            onClick={() => this.onClick(makeOffer)}
            children={btnContent || this.props.children}
          />
        )}
      </Mutation>
    )
  }

  onClick(makeOffer) {
    if (!this.canTransact()) {
      return
    }

    this.setState({ modal: true, waitFor: 'pending' })

    const {
      listing,
      value,
      quantity,
      startDate,
      endDate,
      currency
    } = this.props

    const variables = {
      listingID: listing.id,
      value,
      currency: currency || 'token-ETH',
      from: this.props.wallet,
      quantity: Number(quantity)
    }

    if (
      listing.__typename === 'FractionalListing' ||
      listing.__typename === 'FractionalHourlyListing'
    ) {
      variables.fractionalData = { startDate, endDate }
    }

    makeOffer({ variables })
  }

  canTransact() {
    if (this.props.disabled) {
      return false
    }
    if (this.props.cannotTransact === 'no-wallet') {
      const { pathname, search } = this.props.location
      sessionStore.set('getStartedRedirect', { pathname, search })
      this.setState({ onboard: true })
      return false
    } else if (this.props.cannotTransact) {
      this.setState({
        modal: true,
        error: this.props.cannotTransact,
        errorData: this.props.cannotTransactData
      })
      return false
    }

    return true
  }

  onSwapToToken(swapToToken) {
    if (!this.canTransact()) {
      return
    }

    this.setState({ modal: true, waitForSwap: 'pending' })

    const variables = {
      from: this.props.wallet,
      token: this.props.currency,
      tokenValue: String(this.props.tokenStatus.needsBalance)
    }

    swapToToken({ variables })
  }

  onAllowToken(allowToken) {
    if (!this.canTransact()) {
      return
    }

    this.setState({ modal: true, waitForAllow: 'pending' })

    const variables = {
      token: this.props.currency,
      from: this.props.wallet,
      to: 'marketplace',
      value: this.props.value
    }

    allowToken({ variables })
  }

  renderWaitModal() {
    return (
      <WaitForTransaction
        hash={this.state.waitFor}
        event="OfferCreated"
        contentOnly={true}
      >
        {({ event }) => (
          <div className="make-offer-modal success">
            <div className="success-icon" />
            <h5>
              <fbt desc="success">Success!</fbt>
            </h5>
            <div className="disclaimer">
              <fbt desc="buy.successOffer">
                You have made an offer on this listing. Your offer will be
                visible within a few seconds. Your ETH payment has been
                transferred to an escrow contract.
              </fbt>
            </div>
            <button
              href="#"
              className="btn btn-outline-light"
              onClick={() => {
                this.setState({ loading: true })
                const netId = get(this.props, 'web3.networkId')
                const { listingID, offerID } = event.returnValues
                const offerId = `${netId}-000-${listingID}-${offerID}`
                const redirect = `/purchases/${offerId}`

                if (this.props.refetch) {
                  this.props.refetch(redirect)
                }
              }}
              children={
                this.state.loading
                  ? fbt('Loading...', 'Loading...')
                  : fbt('View Purchase Details', 'View Purchase Details')
              }
            />
          </div>
        )}
      </WaitForTransaction>
    )
  }

  renderWaitAllowModal() {
    return (
      <WaitForTransaction hash={this.state.waitForAllow} contentOnly={true}>
        {() => (
          <div className="make-offer-modal success">
            <div className="success-icon-lg" />
            <h5>
              <fbt desc="success">Success!</fbt>
            </h5>
            <div className="help">
              <fbt desc="buy.sucessMoveDai">
                Origin may now move DAI on your behalf.
              </fbt>
            </div>
            {this.renderMakeOfferMutation(fbt('Continue', 'Continue'))}
          </div>
        )}
      </WaitForTransaction>
    )
  }
}

export default withWeb3(withWallet(withCanTransact(withRouter(Buy))))

require('react-styl')(`
  .make-offer-modal
    display: flex
    flex-direction: column
    align-items: center
    .success-icon
      background: url(images/circular-check-button.svg) no-repeat center
      background-size: contain
      height: 3.5rem
      width: 3.5rem
      margin-bottom: 2rem
    .success-icon-lg
      background: var(--greenblue) url(images/checkmark-white.svg) no-repeat center;
      background-size: 60%;
      border-radius: 3rem;
      border: 6px solid var(--white);
      height: 6rem;
      width: 6rem;
      margin-bottom: 2rem;
    .error-icon
      width: 100%
    .spinner,.error-icon
      margin-bottom: 2rem
    .btn
      margin-top: 2rem
    .disclaimer
      font-size: 14px
      margin-top: 1rem
    &.success
      ul
        text-align: left
        margin-bottom: 0
        margin-top: 1rem
        li
          margin-bottom: 0.5rem
    .metamask-video
      margin-bottom: 1rem

  @media (max-width: 767.98px)
    .make-offer-modal
      .btn
        margin-top: 1rem
      .spinner,.error-icon
        margin-bottom: 1rem

`)
