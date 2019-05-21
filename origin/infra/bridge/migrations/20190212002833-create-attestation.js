'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('attestation', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      eth_address: {
        type: Sequelize.STRING
      },
      method: {
        type: Sequelize.ENUM('PHONE', 'EMAIL', 'AIRBNB', 'FACEBOOK', 'TWITTER')
      },
      value: {
        type: Sequelize.STRING
      },
      signature: {
        type: Sequelize.STRING
      },
      remote_ip_address: {
        type: Sequelize.INET
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      }
    })
  },
  down: queryInterface => {
    return queryInterface.dropTable('attestation')
  }
}
