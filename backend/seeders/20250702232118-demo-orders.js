'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First, insert orders
    await queryInterface.bulkInsert('orders', [
      {
        id: 1,
        customerId: 1, // Emma Thompson
        userId: 2, // Staff Member
        orderDate: new Date('2024-06-15'),
        totalAmount: 149.99,
        status: 'completed',
        notes: 'Customer requested gift wrapping',
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-06-15')
      },
      {
        id: 2,
        customerId: 2, // Sophia Rodriguez
        userId: 2, // Staff Member
        orderDate: new Date('2024-06-20'),
        totalAmount: 235.98,
        status: 'completed',
        notes: null,
        createdAt: new Date('2024-06-20'),
        updatedAt: new Date('2024-06-20')
      },
      {
        id: 3,
        customerId: 3, // Isabella Chen
        userId: 3, // Sarah Johnson
        orderDate: new Date('2024-06-25'),
        totalAmount: 79.99,
        status: 'processing',
        notes: 'Rush order - needed by Friday',
        createdAt: new Date('2024-06-25'),
        updatedAt: new Date('2024-06-25')
      },
      {
        id: 4,
        customerId: 4, // Olivia Johnson
        userId: 2, // Staff Member
        orderDate: new Date('2024-07-01'),
        totalAmount: 91.98,
        status: 'pending',
        notes: null,
        createdAt: new Date('2024-07-01'),
        updatedAt: new Date('2024-07-01')
      },
      {
        id: 5,
        customerId: 5, // Ava Williams
        userId: 3, // Sarah Johnson
        orderDate: new Date('2024-07-02'),
        totalAmount: 325.97,
        status: 'completed',
        notes: 'VIP customer - priority handling',
        createdAt: new Date('2024-07-02'),
        updatedAt: new Date('2024-07-02')
      }
    ], {});

    // Then, insert order items
    await queryInterface.bulkInsert('order_items', [
      // Order 1 - Emma Thompson
      {
        orderId: 1,
        productId: 1, // Classic Leather Tote Bag
        quantity: 1,
        unitPrice: 149.99,
        totalPrice: 149.99,
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-06-15')
      },

      // Order 2 - Sophia Rodriguez
      {
        orderId: 2,
        productId: 2, // Designer Crossbody Purse
        quantity: 1,
        unitPrice: 89.99,
        totalPrice: 89.99,
        createdAt: new Date('2024-06-20'),
        updatedAt: new Date('2024-06-20')
      },
      {
        orderId: 2,
        productId: 4, // Canvas Shoulder Bag
        quantity: 1,
        unitPrice: 45.99,
        totalPrice: 45.99,
        createdAt: new Date('2024-06-20'),
        updatedAt: new Date('2024-06-20')
      },
      {
        orderId: 2,
        productId: 8, // Woven Straw Beach Bag
        quantity: 1,
        unitPrice: 35.99,
        totalPrice: 35.99,
        createdAt: new Date('2024-06-20'),
        updatedAt: new Date('2024-06-20')
      },
      {
        orderId: 2,
        productId: 5, // Mini Backpack Purse
        quantity: 1,
        unitPrice: 65.99,
        totalPrice: 65.99,
        createdAt: new Date('2024-06-20'),
        updatedAt: new Date('2024-06-20')
      },

      // Order 3 - Isabella Chen
      {
        orderId: 3,
        productId: 3, // Evening Clutch Bag
        quantity: 1,
        unitPrice: 79.99,
        totalPrice: 79.99,
        createdAt: new Date('2024-06-25'),
        updatedAt: new Date('2024-06-25')
      },

      // Order 4 - Olivia Johnson
      {
        orderId: 4,
        productId: 4, // Canvas Shoulder Bag
        quantity: 2,
        unitPrice: 45.99,
        totalPrice: 91.98,
        createdAt: new Date('2024-07-01'),
        updatedAt: new Date('2024-07-01')
      },

      // Order 5 - Ava Williams
      {
        orderId: 5,
        productId: 6, // Luxury Hobo Bag
        quantity: 1,
        unitPrice: 199.99,
        totalPrice: 199.99,
        createdAt: new Date('2024-07-02'),
        updatedAt: new Date('2024-07-02')
      },
      {
        orderId: 5,
        productId: 7, // Quilted Chain Bag
        quantity: 1,
        unitPrice: 129.99,
        totalPrice: 129.99,
        createdAt: new Date('2024-07-02'),
        updatedAt: new Date('2024-07-02')
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('order_items', null, {});
    await queryInterface.bulkDelete('orders', null, {});
  }
};
