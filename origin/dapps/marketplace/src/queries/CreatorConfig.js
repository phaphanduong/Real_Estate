import gql from 'graphql-tag'

export default gql`
  query CreatorConfig($creatorConfigUrl: String) {
    creatorConfig(creatorConfigUrl: $creatorConfigUrl) {
      title
      about
      logoUrl
      faviconUrl
      marketplacePublisher
      isCreatedMarketplace
      cssVars {
        defaultFont
        headingFont
        lightFooter
        background
        dark
        darkTwo
        light
        clearBlue
        paleClearBlue
        darkGreyBlue
        darkClearBlue
        darkGrey
        paleGrey
        paleGreyTwo
        paleGreyThree
        paleGreyFour
        paleGreyFive
        paleGreySix
        paleGreySeven
        paleGreyTwoDarker
        paleGreyEight
        dusk
        lightDusk
        steel
        greenblue
        paleGreenblue
        paleYellow
        mustard
        gold
        goldenRod
        goldenRodLight
        lightGreenblue
        bluishPurple
        blueyGrey
        darkBlueGrey
        orangeRed
        orangeRedLight
        red
        darkRed
        lightRed
        darkPurple
        boostLow
        boostMedium
        boostHigh
        boostPremium
        defaultRadius
      }
      listingFilters {
        name
        value
        operator
        valueType
      }
      forceType {
        category
        subCategory
        typename
      }
    }
  }
`
