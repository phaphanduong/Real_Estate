'use strict'

import React, { Component } from 'react'
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet
} from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'

import WelcomePage from 'components/welcome-page'
import WelcomePagination from 'components/welcome-pagination'

const IMAGES_PATH = '../../assets/images/'

// hotfix: https://github.com/facebook/react-native/issues/16710
const itemVisibleHotfix = { itemVisiblePercentThreshold: 100 }

class Welcome extends Component {
  constructor() {
    super()

    this.state = {
      currentPage: 0,
      previousPage: null
    }
  }

  onSwipePageChange = ({ viewableItems }) => {
    if (!viewableItems[0] || this.state.currentPage === viewableItems[0].index)
      return

    this.setState(state => {
      this.props.pageIndexCallback &&
        this.props.pageIndexCallback(viewableItems[0].index)
      return {
        previousPage: state.currentPage,
        currentPage: viewableItems[0].index
      }
    })
  }

  goNext = () => {
    this.flatList.scrollToIndex({
      animated: true,
      index: this.state.currentPage + 1
    })
  }

  keyExtractor = (item, index) => index.toString()

  renderItem = ({ item }) => {
    const { image, title, subtitle } = item
    const { width } = Dimensions.get('window')

    return (
      <WelcomePage
        height={'100%'}
        image={image}
        subtitle={subtitle}
        title={title}
        width={width}
      />
    )
  }

  render() {
    const {
      controlStatusBar,
      pages,
      onCompletion,
      onEnableNotifications
    } = this.props
    const { width } = Dimensions.get('window')

    return (
      <Animated.View style={styles.container}>
        <StatusBar barStyle={'light-content'} />
        <SafeAreaView style={{ alignItems: 'center', width }}>
          <Image source={require(IMAGES_PATH + 'origin-logo-light.png')} />
        </SafeAreaView>
        <FlatList
          ref={list => {
            this.flatList = list
          }}
          data={pages}
          pagingEnabled
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={this.renderItem}
          keyExtractor={this.keyExtractor}
          onViewableItemsChanged={this.onSwipePageChange}
          viewabilityConfig={itemVisibleHotfix}
          initialNumToRender={1}
        />
        <SafeAreaView>
          <WelcomePagination
            currentPage={this.state.currentPage}
            controlStatusBar={controlStatusBar}
            pagesCount={pages.length}
            onCompletion={onCompletion}
            onEnableNotifications={onEnableNotifications}
            onNext={this.goNext}
          />
        </SafeAreaView>
      </Animated.View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#293f55',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20,
    paddingTop: 56
  }
})

export default Welcome
