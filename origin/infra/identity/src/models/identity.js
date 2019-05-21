'use strict'

module.exports = (sequelize, DataTypes) => {
  const Identity = sequelize.define(
    'Identity',
    {
      ethAddress: { type: DataTypes.STRING, primaryKey: true },
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      airbnb: DataTypes.STRING,
      twitter: DataTypes.STRING,
      facebookVerified: DataTypes.BOOLEAN,
      googleVerified: DataTypes.BOOLEAN,
      data: DataTypes.JSONB,
      country: DataTypes.CHAR(2),
      avatarUrl: DataTypes.STRING,
      website: DataTypes.STRING
    },
    {
      tableName: 'identity'
    }
  )

  return Identity
}
