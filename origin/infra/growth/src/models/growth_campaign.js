'use strict'

const enums = require('../enums')

module.exports = (sequelize, DataTypes) => {
  const GrowthCampaign = sequelize.define(
    'GrowthCampaign',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nameKey: DataTypes.STRING,
      shortNameKey: DataTypes.STRING,
      rules: DataTypes.JSONB,
      startDate: DataTypes.DATE,
      endDate: DataTypes.DATE,
      distributionDate: DataTypes.DATE,
      cap: DataTypes.DECIMAL,
      capUsed: DataTypes.DECIMAL,
      currency: DataTypes.STRING,
      rewardStatus: DataTypes.ENUM(enums.GrowthCampaignRewardStatuses)
    },
    {
      tableName: 'growth_campaign'
    }
  )

  return GrowthCampaign
}
