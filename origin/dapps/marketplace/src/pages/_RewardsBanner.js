import React, { Component } from 'react'
import { fbt } from 'fbt-runtime'
import withEnrolmentModal from 'pages/growth/WithEnrolmentModal'

class RewardsBanner extends Component {
  constructor(props) {
    super(props)
    this.GetOgn = withEnrolmentModal('button')
  }

  render() {
    return (
      <>
        
      </>
    )
  }
}

export default RewardsBanner

require('react-styl')(`
  .rewards-banner
    background-color: var(--clear-blue)
    padding: 10px 0
    color: #fff
    font-size: 18px
    border-bottom: 1px solid var(--dark-two)
    img
      margin: 0 20px 10px 0
    strong
      top: 5px
    .text
      margin-top: 5px
      max-width: 60%
      white-space: nowrap
      overflow: auto
      text-overflow: ellipsis
    .btn
      background-color: var(--dark-grey-blue)
      color: var(--white) !important
      margin: 12px 0 12px auto
      width: 96px
      color: var(--dark-grey-blue)
      border-radius: 2rem
      &:hover
        background-color: var(--dark-blue-grey)
        color: var(--white)

  @media (max-width: 991.98px)
    .rewards-banner
      .text
        margin-top: 18px


`)
