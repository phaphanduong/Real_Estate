import { post } from '@origin/ipfs'
import txHelper, { checkMetaMask } from '../_txHelper'
import contracts from '../../contracts'
import cost from '../_gasCost'
import parseId from '../../utils/parseId'
import { listingInputToIPFS } from './createListing'

async function updateListing(_, args) {
  const { data, unitData, fractionalData, autoApprove } = args
  const from = args.from || contracts.defaultMobileAccount
  const { listingId } = parseId(args.listingID)
  await checkMetaMask(from)

  const ipfsData = listingInputToIPFS(data, unitData, fractionalData)
  const ipfsHash = await post(contracts.ipfsRPC, ipfsData)

  let tx
  const additionalDeposit = contracts.web3.utils.toWei(
    args.additionalDeposit,
    'ether'
  )

  // Ensure that the new total units exceeds the sum of units purchased through
  // all valid offers for this listing. This prevents unitsAvailable from going
  // negative.
  const newUnitsTotal = Number(ipfsData.unitsTotal) || 0
  const listing = await contracts.eventSource.getListing(listingId)
  if (newUnitsTotal < listing.unitsPending) {
    throw new Error('New unitsTotal is lower than units pending sale')
  }

  if (autoApprove && additionalDeposit > 0) {
    const fnSig = contracts.web3.eth.abi.encodeFunctionSignature(
      'updateListingWithSender(address,uint256,bytes32,uint256)'
    )
    const params = contracts.web3.eth.abi.encodeParameters(
      ['uint256', 'bytes32', 'uint256'],
      [listingId, ipfsHash, additionalDeposit]
    )
    tx = contracts.ognExec.methods.approveAndCallWithSender(
      contracts.marketplace._address,
      additionalDeposit,
      fnSig,
      params
    )
  } else {
    tx = contracts.marketplaceExec.methods.updateListing(
      listingId,
      ipfsHash,
      additionalDeposit
    )
  }

  return txHelper({
    tx,
    from,
    mutation: 'updateListing',
    gas: cost.updateListing
  })
}

export default updateListing
