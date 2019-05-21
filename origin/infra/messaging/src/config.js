require('dotenv').config()
try {
  require('envkey')
} catch (error) {
  console.log('EnvKey not configured')
}

module.exports = Object.freeze({
  GLOBAL_KEYS: `${process.env.MESSAGING_NAMESPACE}:global`,
  CONV_INIT_PREFIX: `${process.env.MESSAGING_NAMESPACE}:convo-init-`,
  CONV: `${process.env.MESSAGING_NAMESPACE}:conv`,

  IPFS_ADDRESS: process.env.IPFS_ADDRESS || null,
  IPFS_PORT: process.env.IPFS_PORT || '5001',

  IPFS_MAX_CONNECTIONS: process.env.IPFS_MAX_CONNECTIONS
    ? Number(process.env.IPFS_MAX_CONNECTIONS)
    : 16384,
  IPFS_REPO_PATH: process.env.IPFS_REPO_PATH || './ipfs',
  IPFS_WS_ADDRESS: process.env.IPFS_WS_ADDRESS || '/ip4/0.0.0.0/tcp/9012/ws',

  NOTIFICATIONS_ENDPOINT_URL: process.env.NOTIFICATIONS_ENDPOINT_URL || null,

  ORBIT_DB_PATH: process.env.ORBIT_DB_PATH || './odb',

  RPC_SERVER: process.env.RPC_SERVER,
  SNAPSHOT_BATCH_SIZE: process.env.SNAPSHOT_BATCH_SIZE || 150,
  development: {
    use_env_variable: 'DATABASE_URL',
    define: {
      // Add the timestamp attributes (updatedAt, createdAt).
      timestamps: true,
      // Disable the modification of table names.
      freezeTableName: true,
      // Underscore style for field names.
      underscored: true
    },
    // Disable logging of SQL statements.
    logging: false
  },
  test: {
    use_env_variable: 'DATABASE_URL',
    define: {
      // Add the timestamp attributes (updatedAt, createdAt).
      timestamps: true,
      // Disable the modification of table names.
      freezeTableName: true,
      // Underscore style for field names.
      underscored: true
    },
    // Disable logging of SQL statements.
    logging: false
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    define: {
      // Add the timestamp attributes (updatedAt, createdAt).
      timestamps: true,
      // Disable the modification of table names.
      freezeTableName: true,
      // Underscore style for field names.
      underscored: true
    },
    // Disable logging of SQL statements.
    logging: false
  }
})
