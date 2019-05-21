const Common = require('./Common')

module.exports = `
  ${Common}

  scalar JSON
  scalar DateTime

  ###############################################
  #
  # Query output schema for Growth Apollo server.
  #
  ###############################################

  enum GrowthCampaignStatus {
    Pending                   #not yet started
    Active
    CapReached
    Completed
  }

  enum GrowthActionStatus {
    Inactive
    Active
    Exhausted
    Completed
  }

  enum GrowthActionType {
    Email
    Phone
    Twitter
    Airbnb
    Facebook
    Google
    Referral
    Profile
    ListingCreated
    ListingPurchased
    ListingIdPurchased
    ListingSold
  }

  enum GrowthInviteStatus {
    Pending
    Completed
  }

  enum Eligibility {
    Unknown
    Eligible
    Restricted
    Forbidden
  }

  enum EnrollmentStatus {
    Enrolled
    NotEnrolled
    Banned
  }

  # TODO: use Common.Price
  type GrowthPrice {
    currency: String
    amount: String
  }

  type Invite {
    # only pending invites require an ID - for remind functionality
    pendingId: ID
    status: GrowthInviteStatus!
    walletAddress: ID
    # email or firstName + lastName of the contact
    contact: String
    reward: GrowthPrice
  }

  type InviteInfo {
    firstName: String
    lastName: String
  }

  type UnlockCondition {
    messageKey: String!
    iconSource: String!
  }

  interface GrowthBaseAction {
    type: GrowthActionType!
    status: GrowthActionStatus!
    rewardEarned: GrowthPrice
    reward: GrowthPrice            # information about reward
    unlockConditions: [UnlockCondition]
  }

  type GrowthAction implements GrowthBaseAction {
    type: GrowthActionType!
    status: GrowthActionStatus!
    rewardEarned: GrowthPrice
    reward: GrowthPrice            # information about reward
    unlockConditions: [UnlockCondition]
  }

  type GrowthInviteConnection {
    nodes: [Invite]
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ReferralAction implements GrowthBaseAction {
    type: GrowthActionType!
    status: GrowthActionStatus!
    rewardEarned: GrowthPrice
    rewardPending: GrowthPrice
    reward: GrowthPrice            # information about reward
    # first property specifies the number of items to return
    # after is the cursor
    invites(first: Int, after: String): GrowthInviteConnection
    unlockConditions: [UnlockCondition]
  }

  type ListingIdPurchasedAction implements GrowthBaseAction {
    type: GrowthActionType!
    status: GrowthActionStatus!
    rewardEarned: GrowthPrice
    reward: GrowthPrice
    unlockConditions: [UnlockCondition]
    listingId: String!
    titleKey: String!
    detailsKey: String!
    iconSrc: String!
  }

  type GrowthCampaign {
    id: Int!
    nameKey: String!
    shortNameKey: String!
    startDate: DateTime
    endDate: DateTime
    distributionDate: DateTime
    status: GrowthCampaignStatus!
    actions: [GrowthBaseAction]
    rewardEarned: GrowthPrice      # amount earned all actions combined
  }

  type GrowthCampaignConnection {
    nodes: [GrowthCampaign]
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type EligibilityInfo {
    eligibility: Eligibility
    countryName: String
    countryCode: String
  }

  type EnrollResponse {
    authToken: String
    isBanned: Boolean
  }

  type Query {
    # first property specifies the number of items to return
    # after is the cursor
    campaigns(first: Int, after: String): GrowthCampaignConnection
    campaign(id: String): GrowthCampaign
    inviteInfo(code: String!): InviteInfo
    inviteCode: String!
    isEligible: EligibilityInfo
    enrollmentStatus(walletAddress: ID!): EnrollmentStatus!
  }

  type Mutation {
    # Sends email invites with referral code on behalf of the referrer.
    invite(emails: [String!]!): Boolean
    # Enrolls user into the growth engine program.
    enroll(accountId: ID!, agreementMessage: String!, signature: String!, inviteCode: String, fingerprintData: JSON): EnrollResponse
    # Records a growth engine event.
    log(event: JSON!): Boolean
    # Remind a user that his invitation is still pending
    inviteRemind(invitationId: Int!): Boolean
  }
`
