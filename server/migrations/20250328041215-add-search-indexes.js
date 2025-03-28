'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('CellSites', ['name'], {
      name: 'cell_sites_name_idx',
      using: 'BTREE'
    });

    await queryInterface.addIndex('CellSites', ['status'], {
      name: 'cell_sites_status_idx',
      using: 'BTREE'
    });

    await queryInterface.addIndex('CellSites', ['technologies'], {
      name: 'cell_sites_technologies_idx',
      using: 'GIN'
    });

    await queryInterface.addIndex('CellSites', ['alerts'], {
      name: 'cell_sites_alerts_idx',
      using: 'GIN'
    });

    await queryInterface.addIndex('CellSites', ['workTasks'], {
      name: 'cell_sites_work_tasks_idx',
      using: 'GIN'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('CellSites', 'cell_sites_name_idx');
    await queryInterface.removeIndex('CellSites', 'cell_sites_status_idx');
    await queryInterface.removeIndex('CellSites', 'cell_sites_technologies_idx');
    await queryInterface.removeIndex('CellSites', 'cell_sites_alerts_idx');
    await queryInterface.removeIndex('CellSites', 'cell_sites_work_tasks_idx');
  }
};
