'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('customers', [
      {
        firstName: 'Emma',
        lastName: 'Thompson',
        email: 'emma.thompson@email.com',
        phone: '+1234567890',
        address: '123 Fashion Street',
        city: 'New York',
        postalCode: '10001',
        dateOfBirth: '1985-03-15',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Sophia',
        lastName: 'Rodriguez',
        email: 'sophia.rodriguez@email.com',
        phone: '+1234567891',
        address: '456 Style Avenue',
        city: 'Los Angeles',
        postalCode: '90210',
        dateOfBirth: '1990-07-22',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Isabella',
        lastName: 'Chen',
        email: 'isabella.chen@email.com',
        phone: '+1234567892',
        address: '789 Boutique Boulevard',
        city: 'San Francisco',
        postalCode: '94102',
        dateOfBirth: '1988-11-08',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Olivia',
        lastName: 'Johnson',
        email: 'olivia.johnson@email.com',
        phone: '+1234567893',
        address: '321 Designer Drive',
        city: 'Chicago',
        postalCode: '60601',
        dateOfBirth: '1992-05-30',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Ava',
        lastName: 'Williams',
        email: 'ava.williams@email.com',
        phone: '+1234567894',
        address: '654 Luxury Lane',
        city: 'Miami',
        postalCode: '33101',
        dateOfBirth: '1987-09-12',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('customers', {
      email: {
        [Sequelize.Op.in]: [
          'emma.thompson@email.com',
          'sophia.rodriguez@email.com',
          'isabella.chen@email.com',
          'olivia.johnson@email.com',
          'ava.williams@email.com'
        ]
      }
    }, {});
  }
};
