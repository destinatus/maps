'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CellSites', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false
      },
      technologies: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      inventory: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      alerts: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      workTasks: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'active'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('CellSites', ['latitude', 'longitude']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CellSites');
  }
};
