'use strict'
module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define(
    'Conversation',
    {
      externalId: { type: DataTypes.STRING(128), unique: true },
      data: DataTypes.JSON, // this should contain the info about the conversation
      messageCount: { type: DataTypes.INTEGER, defaultValue: 0 }
    },
    {
      tableName: 'msg_conversation'
    }
  )
  Conversation.associate = function() {
    // associations can be defined here
  }
  return Conversation
}
