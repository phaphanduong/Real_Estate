import createWallet from './web3/createWallet'
import importWallet from './web3/importWallet'
import importWallets from './web3/importWallets'
import removeWallet from './web3/removeWallet'
import sendFromWallet from './web3/sendFromWallet'
import sendFromNode from './web3/sendFromNode'
import setActiveWallet from './web3/setActiveWallet'
import setNetwork from './web3/setNetwork'
import signMessage from './web3/signMessage'
import toggleMetaMask from './web3/toggleMetaMask'

import acceptOffer from './marketplace/acceptOffer'
import addAffiliate from './marketplace/addAffiliate'
import addData from './marketplace/addData'
import addFunds from './marketplace/addFunds'
import createListing from './marketplace/createListing'
import deployMarketplace from './marketplace/deployMarketplace'
import disputeOffer from './marketplace/disputeOffer'
import executeRuling from './marketplace/executeRuling'
import finalizeOffer from './marketplace/finalizeOffer'
import makeOffer from './marketplace/makeOffer'
import updateListing from './marketplace/updateListing'
import updateRefund from './marketplace/updateRefund'
import withdrawListing from './marketplace/withdrawListing'
import withdrawOffer from './marketplace/withdrawOffer'

import enableMessaging from './messaging/enableMessaging'
import sendMessage from './messaging/sendMessage'
import markConversationRead from './messaging/markConversationRead'

import deployToken from './token/deployToken'
import transferToken from './token/transferToken'
import updateTokenAllowance from './token/updateTokenAllowance'
import useFaucet from './token/useFaucet'

import deployIdentity from './identity/deployIdentity'
import deployIdentityEvents from './identity/deployIdentityEvents'

import generateEmailCode from './attestations/generateEmailCode'
import verifyEmailCode from './attestations/verifyEmailCode'
import generatePhoneCode from './attestations/generatePhoneCode'
import verifyPhoneCode from './attestations/verifyPhoneCode'
import verifyFacebook from './attestations/verifyFacebook'
import verifyTwitter from './attestations/verifyTwitter'
import generateAirbnbCode from './attestations/generateAirbnbCode'
import verifyAirbnbCode from './attestations/verifyAirbnbCode'
import verifyGoogle from './attestations/verifyGoogle'
import generateWebsiteCode from './attestations/generateWebsiteCode'
import verifyWebsite from './attestations/verifyWebsite'

import swapToToken from './uniswap/swapToToken'
import uniswapDeployFactory from './uniswap/uniswapDeployFactory'
import uniswapDeployExchangeTemplate from './uniswap/uniswapDeployExchangeTemplate'
import uniswapInitializeFactory from './uniswap/uniswapInitializeFactory'
import uniswapCreateExchange from './uniswap/uniswapCreateExchange'
import uniswapAddLiquidity from './uniswap/uniswapAddLiquidity'

export default {
  acceptOffer,
  addAffiliate,
  addData,
  addFunds,
  createListing,
  createWallet,
  deployIdentity,
  deployIdentityEvents,
  deployMarketplace,
  deployToken,
  disputeOffer,
  enableMessaging,
  executeRuling,
  finalizeOffer,
  generateAirbnbCode,
  generateEmailCode,
  generatePhoneCode,
  generateWebsiteCode,
  importWallet,
  importWallets,
  makeOffer,
  markConversationRead,
  removeWallet,
  sendFromNode,
  sendFromWallet,
  sendMessage,
  setActiveWallet,
  setNetwork,
  signMessage,
  swapToToken,
  toggleMetaMask,
  transferToken,
  uniswapAddLiquidity,
  uniswapCreateExchange,
  uniswapDeployFactory,
  uniswapDeployExchangeTemplate,
  uniswapInitializeFactory,
  updateListing,
  updateRefund,
  updateTokenAllowance,
  useFaucet,
  verifyAirbnbCode,
  verifyEmailCode,
  verifyFacebook,
  verifyGoogle,
  verifyPhoneCode,
  verifyTwitter,
  verifyWebsite,
  withdrawListing,
  withdrawOffer,
  refetch: () => true
}
