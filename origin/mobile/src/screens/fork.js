'use strict'

import React, { Component } from 'react'
import {
  DeviceEventEmitter,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { connect } from 'react-redux'
import SafeAreaView from 'react-native-safe-area-view'

import AccountModal from 'components/account-modal'
import OriginButton from 'components/origin-button'

const IMAGES_PATH = '../../assets/images/'

class ForkScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      modalOpen: false
    }
    this.toggleModal = this.toggleModal.bind(this)
  }

  static navigationOptions = {
    title: 'Get Started'
  }

  componentDidUpdate() {
    if (this.props.wallet.accounts.length > 0) {
      this.props.navigation.navigate('App')
    }
  }

  toggleModal() {
    this.setState({ modalOpen: !this.state.modalOpen })
  }

  render() {
    const { height } = Dimensions.get('window')
    const smallScreen = height < 812

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Image
            resizeMethod={'scale'}
            resizeMode={'contain'}
            source={require(IMAGES_PATH + 'wallet.png')}
            style={[styles.image, smallScreen ? { height: '33%' } : {}]}
          />
          <Text style={styles.title}>Create Or Import A Wallet</Text>
          <Text style={styles.subtitle}>
            Create a new wallet and transfer funds into it or import an existing
            wallet that you already use.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <OriginButton
            size="large"
            type="primary"
            style={styles.button}
            textStyle={{ fontSize: 18, fontWeight: '900' }}
            title={'Create New Wallet'}
            onPress={() => {
              DeviceEventEmitter.emit('createAccount')
            }}
          />
          <OriginButton
            size="large"
            type="primary"
            style={styles.button}
            textStyle={{ fontSize: 18, fontWeight: '900' }}
            title={'Import Existing Wallet'}
            onPress={this.toggleModal}
          />
        </View>
        <AccountModal
          dark={true}
          heading="Import Wallet"
          visible={this.state.modalOpen}
          onPress={this.toggleModal}
          onRequestClose={this.toggleModal}
        />
      </SafeAreaView>
    )
  }
}

const mapStateToProps = ({ wallet }) => {
  return { wallet }
}

export default connect(mapStateToProps)(ForkScreen)

const styles = StyleSheet.create({
  button: {
    marginBottom: 20,
    marginHorizontal: 50
  },
  buttonsContainer: {
    paddingTop: 10,
    width: '100%'
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#293f55',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    paddingTop: 0
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  image: {
    marginBottom: '10%'
  },
  title: {
    color: 'white',
    fontFamily: 'Lato',
    fontSize: 20,
    fontWeight: '300',
    marginHorizontal: 50,
    paddingBottom: 15,
    textAlign: 'center'
  },
  subtitle: {
    color: 'white',
    fontFamily: 'Lato',
    fontSize: 16,
    fontWeight: '300',
    marginHorizontal: 50,
    textAlign: 'center'
  }
})
