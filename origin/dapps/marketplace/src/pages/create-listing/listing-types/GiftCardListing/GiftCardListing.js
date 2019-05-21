import React from 'react'

import Steps from '../Steps'
import Details from './Details'
import Boost from './Boost'
import Review from './Review'

const GiftCardListing = props => (
  <Steps
    {...props}
    steps={[
      { step: 1, component: Details, require: 'subCategory' },
      { step: 2, component: Boost, path: 'boost', require: 'retailer' },
      { step: 3, component: Review, path: 'review' }
    ]}
  />
)

export default GiftCardListing
