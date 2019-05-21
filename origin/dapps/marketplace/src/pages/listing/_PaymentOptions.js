import React from 'react'
import { fbt } from 'fbt-runtime'

import withCanTransact from 'hoc/withCanTransact'
import withWallet from 'hoc/withWallet'
import withWeb3 from 'hoc/withWeb3'

import CoinPrice from 'components/CoinPrice'
import Price from 'components/Price'
import Tooltip from 'components/Tooltip'

const NotEnoughEth = ({ tryDai, noEthOrDai }) =>
  noEthOrDai ? (
    <fbt desc="paymentOptions.notEnoughEthOrDai">
      You don’t have enough ETH or DAI in your wallet to make this purchase.
    </fbt>
  ) : tryDai ? (
    <fbt desc="paymentOptions.notEnoughEthTryDai">
      You don’t have enough ETH in your wallet to make this purchase. Try using
      Dai instead.
    </fbt>
  ) : (
    <fbt desc="paymentOptions.notEnoughEth">
      You don’t have enough ETH in your wallet to make this purchase.
    </fbt>
  )

const PayWithDai = () => (
  <fbt desc="paymentOptions.payWithDai">
    Your DAI will be transferred to an escrow contract and held until the sale
    is completed.
  </fbt>
)

const PayWithEth = () => (
  <fbt desc="paymentOptions.payWithEth">
    Your ETH will be transferred to an escrow contract and held until the sale
    is completed.
  </fbt>
)

const SwapEthToDai = ({ ethPrice }) => (
  <fbt desc="paymentOptions.swapEthToDai">
    You don’t have enough DAI to make this purchase. You can convert
    approximately <fbt:param name="EthPrice">{ethPrice}</fbt:param> into the
    amount of DAI that you need.
  </fbt>
)

const CannotPurchase = () => (
  <div className="cannot-purchase">
    <a href="#/about/crypto" target="_blank" rel="noopener noreferrer">
      <fbt desc="paymentOptions.howToGetCrypto">
        How do I get cryptocurrency?
      </fbt>
    </a>
  </div>
)

const PaymentOptions = ({
  acceptedTokens,
  value,
  onChange,
  price,
  tokens,
  hasBalance,
  hasEthBalance,
  children,
  cannotTransact
}) => {
  if (cannotTransact && cannotTransact !== 'no-balance') {
    return children
  }
  if (!Object.keys(tokens).length) {
    return children
  }

  const daiActive = value === 'token-DAI' ? ' active' : ''
  const ethActive = value === 'token-ETH' ? ' active' : ''
  const acceptsDai = acceptedTokens.find(t => t.id === 'token-DAI')
  const daiDisabled = acceptsDai ? '' : ' disabled'
  const acceptsEth =
    !acceptsDai || acceptedTokens.find(t => t.id === 'token-ETH')
  const ethDisabled = acceptsEth ? '' : ' disabled'

  const ethPrice = <Price price={price} target="token-ETH" />
  const daiPrice = <Price price={price} target="token-DAI" />

  let cannotPurchase = false,
    content,
    needsSwap = false

  if (acceptsDai && acceptsEth && daiActive) {
    if (hasBalance) {
      content = <PayWithDai />
    } else if (!hasBalance && !hasEthBalance) {
      cannotPurchase = true
      content = <NotEnoughEth noEthOrDai />
    } else {
      needsSwap = true
      content = <SwapEthToDai ethPrice={ethPrice} />
    }
  } else if (acceptsDai && acceptsEth && ethActive) {
    if (hasBalance) {
      content = <PayWithEth />
    } else {
      cannotPurchase = true
      content = <NotEnoughEth />
    }
  } else if (acceptsDai) {
    if (hasBalance) {
      content = <PayWithDai />
    } else if (hasEthBalance) {
      needsSwap = true
      content = <SwapEthToDai ethPrice={ethPrice} />
    } else {
      cannotPurchase = true
      content = <NotEnoughEth />
    }
  } else if (acceptsEth) {
    if (hasBalance) {
      content = <PayWithEth />
    } else {
      cannotPurchase = true
      content = <NotEnoughEth />
    }
  }

  const noDaiTooltip = fbt(
    'The seller does not accept DAI for this listing.',
    'PaymentOptions.noDai'
  )

  const noEthTooltip = fbt(
    'The seller does not accept Eth for this listing.',
    'PaymentOptions.noDai'
  )

  return (
    <div className="payment-options">
      <h6>
        <fbt desc="paymentOptions.payWith">Pay with</fbt>
      </h6>
      <div className="btn-group">
        <Tooltip tooltip={acceptsDai ? null : noDaiTooltip} placement="top">
          <button
            className={`btn btn-outline-secondary${daiActive}${daiDisabled}`}
            onClick={() => (daiDisabled ? null : onChange('token-DAI'))}
          >
            <CoinPrice iconOnly coin="dai" className="lg" />
            DAI
          </button>
        </Tooltip>
        <Tooltip tooltip={acceptsEth ? null : noEthTooltip} placement="top">
          <button
            className={`btn btn-outline-secondary${ethActive}${ethDisabled}`}
            onClick={() => (ethDisabled ? null : onChange('token-ETH'))}
          >
            <CoinPrice iconOnly coin="eth" className="lg" />
            ETH
          </button>
        </Tooltip>
      </div>
      <div className="payment-total">
        <span>
          <fbt desc="paymentOptions.payment">Payment</fbt>
        </span>
        <span className={cannotPurchase || needsSwap ? 'danger' : ''}>
          {ethActive ? ethPrice : daiPrice}
        </span>
      </div>
      {ethActive || hasBalance || needsSwap ? null : (
        <div className="exchanged">{ethPrice}</div>
      )}
      <div className={`help${cannotPurchase || needsSwap ? ' danger' : ''}`}>
        {content}
      </div>
      {!needsSwap ? null : (
        <div className="needs-swap">
          <div>Swap currency</div>
          <div>
            <div>
              <Price price={price} target="token-ETH" decimals={3} />
            </div>
            <div className="chevron" />
            <div>{daiPrice}</div>
          </div>
        </div>
      )}
      {cannotPurchase ? <CannotPurchase /> : children}
    </div>
  )
}

export default withWeb3(withWallet(withCanTransact(PaymentOptions)))

require('react-styl')(`
  .payment-options
    border-top: 1px solid var(--light)
    padding-top: 1.5rem
    margin-top: 1.5rem
    h6
      color: var(--dark)
      font-size: 14px
      font-weight: normal
    .btn-group
      width: 100%
      .btn
        font-size: 18px
        font-weight: normal
      .btn-outline-secondary
        color: var(--dark)
        border-color: var(--light)
        &:not(.disabled):hover
          border-color: var(--dusk)
          color: var(--white)
        &.active
          border-color: var(--dusk)
          background-color: var(--dusk)
    .payment-total
      margin-top: 1.5rem
      display: flex
      justify-content: space-between
      font-size: 24px
      font-weight: normal
      line-height: 1
      span:last-child
        font-weight: bold
      span.danger
        color: var(--orange-red)
    .exchanged
      font-size: 14px
      color: var(--steel)
      text-align: right
      font-weight: bold
      margin-bottom: 0.5rem
    .help
      margin-top: 1rem
      font-size: 14px
      color: var(--steel)
      font-weight: normal
      line-height: normal
      margin-bottom: 1.5rem
      &.danger
        color: var(--orange-red)
    .cannot-purchase
      text-align: center
      font-weight: normal
      border-top: 1px solid var(--light)
      padding-top: 1.5rem
      font-size: 14px
    .needs-swap
      border-top: 1px solid var(--light)
      padding-top: 1.25rem
      margin-top: 1.5rem
      font-weight: normal
      div.chevron
        border-width: 1px 1px 0 0
        border-style: solid
        border-color: #000
        transform: rotate(45deg) translate(10px, 10px)
        width: 10px
        height: 10px
      > div:nth-child(1)
        font-size: 14px
      > div:nth-child(2)
        display: flex
        flex-direction: row
        justify-content: space-around
        font-size: 24px
        margin: 1rem 0 1.5rem 0
`)
