const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('./logger');

let sequelize;

if (env.db.dialect === 'postgres') {
  if (!env.db.url) {
    throw new Error('DATABASE_URL is required when DB_DIALECT=postgres');
  }
  sequelize = new Sequelize(env.db.url, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: env.nodeEnv === 'production' ? {
      ssl: { require: true, rejectUnauthorized: false },
    } : {},
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  });
} else {
  // Zero-install local/dev fallback — never used in production.
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: env.db.sqliteStorage,
    logging: false,
  });
}

module.exports = sequelize;
