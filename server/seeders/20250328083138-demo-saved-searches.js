'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('SavedSearches', [
      {
        name: 'Test Search',
        description: 'A test saved search',
        criteria: JSON.stringify({
          name: 'Test Site',
          technology: '',
          status: ''
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '5G Sites',
        description: 'All 5G cell sites',
        criteria: JSON.stringify({
          name: '',
          technology: '5G',
          status: ''
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('SavedSearches', null, {});
  }
};
