const { Sequelize } = require('sequelize');
const config = require('config');
const CellSite = require('../models/cell-site');

const sequelize = new Sequelize(
  config.get('db.name'),
  config.get('db.user'),
  config.get('db.password'),
  {
    host: config.get('db.host'),
    port: config.get('db.port'),
    dialect: 'postgres',
    logging: console.log
  }
);

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connection to database established successfully.');

    // Sync all models
    await CellSite.sync({ force: true });
    console.log('Database tables created successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Unable to initialize database:', error);
    process.exit(1);
  }
}

initializeDatabase();
