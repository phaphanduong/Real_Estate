'use strict'

import { Component } from 'react'
import {
  Alert,
  AppState,
  DeviceEventEmitter,
  Platform,
  PushNotificationIOS
} from 'react-native'
import PushNotification from 'react-native-push-notification'
import { connect } from 'react-redux'

import { addNotification } from 'actions/Notification'
import { setDeviceToken, setNetwork } from 'actions/Settings'
import {
  DEFAULT_NOTIFICATION_PERMISSIONS,
  ETH_NOTIFICATION_TYPES,
  NETWORKS
} from './constants'
import { get } from 'utils'
import NavigationService from './NavigationService'
import withConfig from 'hoc/withConfig'

class PushNotifications extends Component {
  constructor(props) {
    super(props)

    this.state = {
      backgroundNotification: null
    }

    DeviceEventEmitter.addListener(
      'requestNotificationPermissions',
      this.requestNotificationPermissions.bind(this)
    )

    DeviceEventEmitter.addListener('removeAccount', this.unregister.bind(this))
  }

  async componentDidMount() {
    // Add an event listener to log registration errors in development
    if (__DEV__) {
      PushNotificationIOS.addEventListener('registrationError', error =>
        console.warn(error)
      )
    }

    PushNotification.configure({
      // Called when Token is generated (iOS and Android) (optional)
      onRegister: function(deviceToken) {
        // Save the device token into redux for later use with other accounts
        this.props.setDeviceToken(deviceToken['token'])
      }.bind(this),
      // Called when a remote or local notification is opened or received
      onNotification: function(notification) {
        this.onNotification(notification)
        // https://facebook.github.io/react-native/docs/pushnotificationios.html
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData)
        }
      }.bind(this),
      // Android only
      senderID: '162663374736',
      // iOS only
      permissions: DEFAULT_NOTIFICATION_PERMISSIONS,
      // Should the initial notification be popped automatically
      popInitialNotification: true,
      requestPermissions: Platform.OS !== 'ios'
    })

    if (Platform.os === 'ios') {
      // Get notifications that triggered an open of the app when the app was
      // completely closed
      PushNotificationIOS.getInitialNotification().then(notification => {
        if (notification) {
          // backgroundNotification is an instance of PushNotificationIOS, create
          // a notification object from it
          const notificationObj = {
            alert: this.state.backgroundNotification.getAlert(),
            data: this.state.backgroundNotification.getData()
          }
          // Pop the alert with option to redirect to WebView
          this.onNotification(notificationObj)
        }
      })

      // Get notifications that were triggered when the app was backgrounded
      PushNotificationIOS.addEventListener('notification', notification => {
        if (AppState.currentState === 'background') {
          // Save notification to state so it can be dealt with when the user
          // foregrounds the app
          console.debug('Setting background notification')
          this.setState({ backgroundNotification: notification })
        }
      })

      AppState.addEventListener('change', newState => {
        if (
          newState === 'active' &&
          this.state.backgroundNotification !== null
        ) {
          // backgroundNotification is an instance of PushNotificationIOS, create
          // a notification object from it
          const notification = {
            alert: this.state.backgroundNotification.getAlert(),
            data: this.state.backgroundNotification.getData()
          }
          // Pop the alert with option to redirect to WebView
          this.onNotification(notification)
          this.setState({ backgroundNotification: null })
        }
      })
    }

    // Make sure current active account is registered on mount
    await this.register()
  }

  componentWillUnmount() {
    AppState.removeEventListener('change')
  }

  async componentDidUpdate(prevProps) {
    // The following circumstances need to trigger the register function to
    // save the device token and Ethereum address of the active account to
    // the notifications server:
    //  - Change of active account
    //  - Change of device token
    //  - Change of network (due to different notifications server)

    const registerConditions = [
      // Change of active account
      get(prevProps.wallet.activeAccount, 'address') !==
        get(this.props.wallet.activeAccount, 'address'),
      // Change of device token
      get(prevProps.settings, 'deviceToken') !==
        get(this.props.settings, 'deviceToken'),
      // Change of network
      get(prevProps.config, 'notifications') !==
        get(this.props.config, 'notifications')
    ]

    // Trigger a register query to notifications server if any of the above
    // conditions are true
    if (registerConditions.includes(true)) {
      await this.register()
    }
  }

  /* Handles a notification by displaying an alert and saving it to redux
   */
  onNotification(notification) {
    console.debug('Handling notification: ', notification)

    const notificationObj = {}
    if (Platform.OS === 'ios') {
      notificationObj.title = notification.alert.title
      notificationObj.body = notification.alert.body
      notificationObj.url = notification.data.url
    } else {
      notificationObj.title = notification.title
      notificationObj.body = notification.message
      notificationObj.url = notification.url
    }

    // Popup notification in an alert
    if (notificationObj.title && notificationObj.body) {
      Alert.alert(notificationObj.title, notificationObj.body, [
        { text: 'Close' },
        {
          text: 'View',
          onPress: () => {
            // Check that we are on the right network
            const url = new URL(notificationObj.url)
            // Find network, default to Docker if network could not be found
            const network =
              NETWORKS.find(n => {
                return n.dappUrl === url.origin
              }) ||
              NETWORKS.find(n => {
                return n.name === 'Docker'
              })
            if (this.props.settings.network.name !== network.name) {
              console.debug('Change network for notification to: ', network)
              this.props.setNetwork(network)
            }
            NavigationService.navigate('Marketplace', {
              marketplaceUrl: notificationObj.url
            })
          }
        }
      ])
    } else if (notificationObj.url) {
      // FCM notification received may only have the URL
      NavigationService.navigate('Marketplace', {
        marketplaceUrl: notificationObj.url
      })
    }
    // Save notification to redux in case we want to display them later
    this.props.addNotification(notificationObj)
  }

  /* Register the Ethereum address and device token for notifications with the
   * notification server
   */
  async register() {
    const activeAddress = get(this.props, 'wallet.activeAccount.address')
    if (!activeAddress) {
      console.debug('No active address')
      return
    }

    const deviceToken = get(this.props, 'settings.deviceToken')
    if (!deviceToken) {
      console.debug('No device token')
      return
    }

    console.debug(
      `Registering ${activeAddress} and device token ${deviceToken}`
    )

    PushNotification.checkPermissions(permissions => {
      fetch(this.getNotificationServerUrl(), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eth_address: activeAddress,
          device_token: deviceToken,
          device_type: this.getNotificationType(),
          permissions: permissions
        })
      }).catch(error => {
        console.warn(
          'Failed to register notification address with notifications server',
          error
        )
      })
    })
  }

  /* Unregister for notifications for deleted accounts
   */
  async unregister(account) {
    const deviceToken = this.props.settings.deviceToken

    if (!deviceToken) {
      console.debug('No device token')
      return
    }

    console.debug(
      `Unregistering ${account.address} and device token ${deviceToken}`
    )

    return fetch(this.getNotificationServerUrl(), {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eth_address: account.address,
        device_token: deviceToken
      })
    }).catch(error => {
      console.warn(
        'Failed to unregister notification address with notifications server',
        error
      )
    })
  }

  getNotificationServerUrl() {
    const notificationServer =
      this.props.config.notifications ||
      'https://notifications.originprotocol.com'
    return `${notificationServer}/mobile/register`
  }

  /* Return the notification type that should be used for the platform
   */
  getNotificationType() {
    if (Platform.OS === 'ios') {
      return ETH_NOTIFICATION_TYPES.APN
    } else if (Platform.OS === 'android') {
      return ETH_NOTIFICATION_TYPES.FCM
    }
  }

  /* Request permissions to send push notifications
   */
  async requestNotificationPermissions() {
    console.debug('Requesting notification permissions')
    if (Platform.OS === 'ios') {
      DeviceEventEmitter.emit(
        'notificationPermission',
        await PushNotificationIOS.requestPermissions()
      )
    } else {
      // Android has push notifications enabled by default
      DeviceEventEmitter.emit(
        'notificationPermission',
        DEFAULT_NOTIFICATION_PERMISSIONS
      )
    }
  }

  /* This is a renderless component
   */
  render() {
    return null
  }
}

const mapStateToProps = ({ settings, wallet }) => {
  return { settings, wallet }
}

const mapDispatchToProps = dispatch => ({
  setNetwork: network => dispatch(setNetwork(network)),
  setDeviceToken: payload => dispatch(setDeviceToken(payload)),
  addNotification: notification => dispatch(addNotification(notification))
})

export default withConfig(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(PushNotifications)
)
