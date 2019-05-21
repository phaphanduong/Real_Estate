export default {
  // Marketplace
  // -----------
  createListing: 189553,
  updateListing: 38048,
  makeOffer: 301785,
  acceptOffer: 48099,
  finalizeOffer: 150000,
  withdrawOffer: 41321,
  withdrawListing: 60000,
  addFunds: 200000, // Needs real value. Needs GraphQL tests.
  updateRefund: 200000, // Needs real value. Needs GraphQL tests.
  disputeOffer: 60000, // Contract test at 32164.
  executeRuling: 200000, // If ERC20 token used, actual cost will vary
  addData: 28690, // Contract test. Uses offer addData, since amount is larger.

  // Identity
  // -----------
  emitIdentityUpdated: 30000 // Manual test at 25116. Needs GraphQL tests.
}
