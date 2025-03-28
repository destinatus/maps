'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('config');
const db = {};

const sequelize = new Sequelize(
  config.get('db.name'),
  config.get('db.user'),
  config.get('db.password'),
  {
    host: config.get('db.host'),
    port: config.get('db.port'),
    dialect: 'postgres',
    logging: console.log,
    retry: {
      max: 5,
      timeout: 5000
    },
    dialectOptions: {
      useUTC: false,
      ssl: config.get('db.ssl') ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    timezone: config.get('db.timezone') || 'America/Chicago'
  }
);

// Test the connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

// Import models
db.CellSite = require('./cell-site')(sequelize, Sequelize.DataTypes);
db.SavedSearch = require('./saved-search')(sequelize, Sequelize.DataTypes);

// Add associations if needed
// db.CellSite.hasMany(db.SavedSearch);
// db.SavedSearch.belongsTo(db.CellSite);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
