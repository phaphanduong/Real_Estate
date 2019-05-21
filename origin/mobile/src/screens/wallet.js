'use strict'

import React, { Component } from 'react'
import { Alert, Clipboard, ScrollView, StyleSheet, View } from 'react-native'
import { connect } from 'react-redux'

import Address from 'components/address'
import Currency from 'components/currency'

import currencies from 'utils/currencies'
import { evenlySplitAddress } from 'utils/user'

class WalletScreen extends Component {
  static navigationOptions = {
    title: 'Wallet',
    headerTitleStyle: {
      fontFamily: 'Poppins',
      fontSize: 17,
      fontWeight: 'normal'
    }
  }

  componentDidMount() {}

  handleFunding(currency) {
    const { address } = this.props.wallet.activeAccount

    Alert.alert(
      'Funding',
      `For now, you will need to transfer ${currency} into your Orign Wallet from another source.`,
      [
        {
          text: 'Show Address',
          onPress: () => {
            Alert.alert(
              'Wallet Address',
              evenlySplitAddress(address).join('\n')
            )
          }
        },
        {
          text: 'Copy Address',
          onPress: async () => {
            await Clipboard.setString(address)

            Alert.alert(
              'Copied to clipboard!',
              evenlySplitAddress(address).join('\n')
            )
          }
        }
      ]
    )
  }

  render() {
    const { wallet } = this.props

    return (
      <>
        <View style={styles.addressContainer}>
          <Address
            address={wallet.activeAccount.address}
            label={'Wallet Address'}
            style={styles.address}
          />
        </View>
        <ScrollView
          style={styles.svContainer}
          contentContainerStyle={styles.walletSVContainer}
        >
          <Currency
            abbreviation={'ETH'}
            balance={wallet.accountBalance.eth}
            labelColor={currencies['eth'].color}
            name={currencies['eth'].name}
            imageSource={currencies['eth'].icon}
            onPress={() => this.handleFunding('ETH')}
          />
          <Currency
            abbreviation={'DAI'}
            balance={wallet.accountBalance.dai || 0}
            labelColor={currencies['dai'].color}
            name={currencies['dai'].name}
            imageSource={currencies['dai'].icon}
            precision={2}
            onPress={() => this.handleFunding('DAI')}
          />
          <Currency
            abbreviation={'OGN'}
            balance={wallet.accountBalance.ogn || 0}
            labelColor={currencies['ogn'].color}
            name={currencies['ogn'].name}
            imageSource={currencies['ogn'].icon}
            precision={0}
            onPress={() => this.handleFunding('OGN')}
          />
        </ScrollView>
      </>
    )
  }
}

const mapStateToProps = ({ wallet }) => {
  return { wallet }
}

export default connect(mapStateToProps)(WalletScreen)

const styles = StyleSheet.create({
  address: {
    color: '#6a8296',
    fontFamily: 'Lato',
    fontSize: 13,
    fontWeight: '300',
    textAlign: 'center'
  },
  addressContainer: {
    paddingHorizontal: 18 * 3,
    paddingVertical: 22
  },
  container: {
    backgroundColor: '#f7f8f8',
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  placeholder: {
    fontFamily: 'Lato',
    fontSize: 13,
    opacity: 0.5,
    textAlign: 'center'
  },
  separator: {
    backgroundColor: 'white',
    height: 1,
    marginRight: 'auto',
    width: '5%'
  },
  svContainer: {
    flex: 1
  },
  walletSVContainer: {
    paddingHorizontal: 10
  }
})
