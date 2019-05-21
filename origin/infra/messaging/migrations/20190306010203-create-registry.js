'use strict'
const TableName = 'msg_registry'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(TableName, {
      eth_address: {
        type: Sequelize.STRING(64),
        primaryKey: true
      },
      data: {
        type: Sequelize.JSON
      },
      signature: {
        type: Sequelize.STRING(256)
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: (queryInterface) => {
    return queryInterface.dropTable(TableName)
  }
}
