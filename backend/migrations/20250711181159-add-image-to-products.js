'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if the column already exists
    const tableDescription = await queryInterface.describeTable('products');

    if (!tableDescription.imagePath) {
      await queryInterface.addColumn('products', 'imagePath', {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Path to the product image file'
      });
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('products', 'imagePath');
  }
};
