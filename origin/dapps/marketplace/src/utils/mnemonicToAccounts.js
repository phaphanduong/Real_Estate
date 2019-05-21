import bip39 from 'bip39'
import HDKey from 'hdkey'

const Names = ['Admin', 'Stan', 'Nick', 'Origin', 'Origin']
const Roles = ['Admin', 'Seller', 'Buyer', 'Arbitrator', 'Affiliate']

export const defaultMnemonic =
  'enlist bamboo horror cream exit message dismiss asthma cruel sustain reason below'

export default function mnemonicToAccounts(
  mnemonic = defaultMnemonic,
  num = 5
) {
  const keys = []
  for (let offset = 0; offset < num; offset++) {
    const seed = bip39.mnemonicToSeed(mnemonic)
    const acct = HDKey.fromMasterSeed(seed).derive(`m/44'/60'/0'/0/${offset}`)
    keys.push({
      name: Names[offset],
      role: Roles[offset],
      privateKey: `0x${acct.privateKey.toString('hex')}`
    })
  }
  return keys
}
