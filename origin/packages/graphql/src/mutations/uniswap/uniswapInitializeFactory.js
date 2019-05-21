import { factoryAbi } from '../../contracts/UniswapExchange'
import txHelper, { checkMetaMask } from '../_txHelper'
import contracts from '../../contracts'

async function uniswapInitializeFactory(_, { from, exchange, factory }) {
  const web3 = contracts.web3Exec
  await checkMetaMask(from)
  if (!exchange) {
    throw new Error('No exchange template found')
  }
  const uniswapFactory = new web3.eth.Contract(factoryAbi, factory)
  const tx = uniswapFactory.methods.initializeFactory(exchange)

  return txHelper({
    tx,
    from,
    mutation: 'uniswapInitializeFactory',
    gas: 5500000
  })
}

export default uniswapInitializeFactory
