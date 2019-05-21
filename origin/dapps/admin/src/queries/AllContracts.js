import gql from 'graphql-tag'

export default gql`
  query AllContracts {
    marketplaces {
      address
      totalListings
      version
      token {
        id
      }
      owner {
        id
      }
    }
    tokens {
      id
      code
      address
      name
      decimals
      totalSupply
    }
    identityEvents {
      id
    }
  }
`
