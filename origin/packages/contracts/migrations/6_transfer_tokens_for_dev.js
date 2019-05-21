const OriginToken = artifacts.require('./token/OriginToken.sol')
const assert = require('assert')

// NOTE: this file will only have an effect for local blockchains

module.exports = function(deployer, network) {
  return deployer.then(() => {
    if (network === 'development') {
      console.log('Transferring OGN to test accounts')
      return transferTokensToTestAccounts(deployer, network)
    } else {
      console.log('Skipping')
    }
  })
}

// Distribute tokens to test accounts when using a local blockchain.
async function transferTokensToTestAccounts(deployer, network) {
  // The testnets have the token faucet, so we don't need this there.
  assert (network === 'development')

  const accounts = await new Promise((resolve, reject) => {
    web3.eth.getAccounts((error, result) => {
      if (error) {
        reject(error)
      }
      resolve(result)
    })
  })

  const lastAccount = accounts[accounts.length - 1]
  const token = await OriginToken.deployed()
  const contractOwner = await token.owner()
  const decimals = await token.decimals()

  // The last account will receive the bulk of the tokens. This is to give a
  // more representative UX for the other accounts
  await token.transfer(
    lastAccount,
    await token.balanceOf(accounts[0]),
    { from: contractOwner }
  )

  // Everyone else gets a fixed number of tokens to test with.
  // const tokensPerAccount = 200
  // const tokensPerAccount = web3.utils.toBN(200)
  // // const tokenAmount = '0x'+tokensPerAccount.mul(web3.utils.toBN(10).pow(decimals)).toString('hex')
  // const tokenAmount = 2e18.toString()

  // // for (let i = 0; i < accounts.length - 1; i++) {
  // //   console.log('index 50')
  // //   await token.transfer(
  // //     accounts[i],
  // //     // tokensPerAccount * 10**decimals,
  // //     tokenAmount,
  // //     { from: lastAccount }
  // //   )
  // //   console.log(`Transfered ${tokenAmount} from ${lastAccount} to ${accounts[i]}`)
  // // }
  
  //   console.log('index 50')
  //   await token.transfer(
  //     accounts[1],
  //     // tokensPerAccount * 10**decimals,
  //     tokenAmount,
  //     { from: accounts[0] }
  //   )
  //   console.log(`Transfered ${tokenAmount} from ${accounts[0]} to ${accounts[1]}`)

}
