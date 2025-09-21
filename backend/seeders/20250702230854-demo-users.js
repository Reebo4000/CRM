'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const staffPassword = await bcrypt.hash('staff123', 12);

    await queryInterface.bulkInsert('users', [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@geminicrm.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Staff',
        lastName: 'Member',
        email: 'staff@geminicrm.com',
        password: staffPassword,
        role: 'staff',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@geminicrm.com',
        password: staffPassword,
        role: 'staff',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: [
          'admin@geminicrm.com',
          'staff@geminicrm.com',
          'sarah.johnson@geminicrm.com'
        ]
      }
    }, {});
  }
};
