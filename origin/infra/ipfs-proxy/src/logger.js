'use strict'

const Logger = require('logplease')

Logger.setLogLevel('DEBUG')

module.exports = Logger.create('origin-ipfs-proxy', {
  color: Logger.Colors.Yellow
})
