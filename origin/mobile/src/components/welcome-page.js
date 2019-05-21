'use strict'

import React from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'

const WelcomePage = ({ image, title, subtitle }) => {
  let titleElement = title

  if (typeof title === 'string' || title instanceof String) {
    titleElement = (
      <View style={styles.padding}>
        <Text style={styles.title}>{title}</Text>
      </View>
    )
  }

  let subtitleElement = subtitle

  if (typeof subtitle === 'string' || subtitle instanceof String) {
    subtitleElement = (
      <View style={styles.padding}>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { width, height }]}>
      {image}
      {titleElement}
      {subtitleElement}
    </View>
  )
}

const { width, height } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'column',
    marginTop: width / 6
  },
  padding: {
    paddingHorizontal: 50
  },
  title: {
    color: 'white',
    fontFamily: 'Lato',
    fontSize: 20,
    fontWeight: '300',
    paddingBottom: 15,
    textAlign: 'center'
  },
  subtitle: {
    color: 'white',
    fontFamily: 'Lato',
    fontSize: 16,
    fontWeight: '300',
    textAlign: 'center'
  }
})

export default WelcomePage
