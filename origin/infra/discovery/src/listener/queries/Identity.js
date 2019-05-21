const gql = require('graphql-tag')

const identityQuery = gql`
  query Identity($id: ID!) {
    web3 {
      account(id: $id) {
        identity {
          id
          firstName
          lastName
          fullName
          description
          avatar
          avatarUrl
          strength
          attestations
          facebookVerified
          twitterVerified
          airbnbVerified
          phoneVerified
          emailVerified
          googleVerified
          websiteVerified
          ipfsHash
        }
      }
    }
  }
`

module.exports = identityQuery
