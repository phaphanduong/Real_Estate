module.exports = `
  extend type Query {
    identityEvents: IdentityEvents
    identity(id: ID!): Identity
    identities(id: ID!): Identity
  }

  extend type Mutation {
    deployIdentity(
      from: String!
      profile: ProfileInput
      attestations: [String]
    ): Transaction

    deployIdentityEvents(from: String!): Transaction
  }

  input ProfileInput {
    firstName: String
    lastName: String
    description: String
    avatar: String
    avatarUrl: String
  }

  type IdentityEvents {
    id: ID
    identities(
      first: Int
      last: Int
      before: String
      after: String
      sort: String
    ): IdentityConnection
    facebookAuthUrl(redirect: String): String
    twitterAuthUrl(redirect: String): String
    googleAuthUrl(redirect: String): String
  }

  type IdentityConnection {
    nodes: [Identity]
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type Identity {
    id: ID!
    owner: Account

    firstName: String
    lastName: String
    fullName: String
    description: String
    avatar: String
    avatarUrl: String
    avatarUrlExpanded: String
    strength: Int

    facebookVerified: Boolean
    twitterVerified: Boolean
    airbnbVerified: Boolean
    phoneVerified: Boolean
    emailVerified: Boolean
    googleVerified: Boolean
    websiteVerified: Boolean

    name: String
    ipfsHash: String
    attestations: [String]
  }
`
