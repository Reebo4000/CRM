'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('products', [
      {
        name: 'Classic Leather Tote Bag',
        description: 'Elegant leather tote bag perfect for everyday use. Features multiple compartments and premium leather construction.',
        price: 149.99,
        stockQuantity: 25,
        category: 'Tote Bags',
        brand: 'LuxeLeather',
        color: 'Black',
        material: 'Genuine Leather',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Designer Crossbody Purse',
        description: 'Stylish crossbody purse with adjustable strap. Perfect for hands-free convenience without compromising style.',
        price: 89.99,
        stockQuantity: 40,
        category: 'Crossbody Bags',
        brand: 'StyleCraft',
        color: 'Brown',
        material: 'Faux Leather',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Evening Clutch Bag',
        description: 'Sophisticated evening clutch with gold chain strap. Perfect for formal occasions and special events.',
        price: 79.99,
        stockQuantity: 15,
        category: 'Clutch Bags',
        brand: 'GlamourNight',
        color: 'Gold',
        material: 'Satin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Canvas Shoulder Bag',
        description: 'Casual canvas shoulder bag with vintage design. Durable and perfect for everyday adventures.',
        price: 45.99,
        stockQuantity: 60,
        category: 'Shoulder Bags',
        brand: 'UrbanStyle',
        color: 'Navy Blue',
        material: 'Canvas',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Mini Backpack Purse',
        description: 'Trendy mini backpack that doubles as a purse. Compact yet spacious with multiple pockets.',
        price: 65.99,
        stockQuantity: 30,
        category: 'Backpack Purses',
        brand: 'TrendyPack',
        color: 'Pink',
        material: 'Synthetic Leather',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Luxury Hobo Bag',
        description: 'Premium hobo bag with soft leather construction. Spacious interior with elegant curved design.',
        price: 199.99,
        stockQuantity: 12,
        category: 'Hobo Bags',
        brand: 'LuxeLeather',
        color: 'Burgundy',
        material: 'Genuine Leather',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Quilted Chain Bag',
        description: 'Classic quilted design with gold chain strap. Timeless elegance meets modern functionality.',
        price: 129.99,
        stockQuantity: 20,
        category: 'Chain Bags',
        brand: 'ClassicChic',
        color: 'Black',
        material: 'Quilted Leather',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Woven Straw Beach Bag',
        description: 'Natural woven straw bag perfect for beach days and summer outings. Lightweight and spacious.',
        price: 35.99,
        stockQuantity: 45,
        category: 'Beach Bags',
        brand: 'SummerVibes',
        color: 'Natural',
        material: 'Woven Straw',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Structured Satchel Bag',
        description: 'Professional structured satchel perfect for work. Multiple compartments for organization.',
        price: 119.99,
        stockQuantity: 18,
        category: 'Satchel Bags',
        brand: 'WorkChic',
        color: 'Tan',
        material: 'Genuine Leather',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Bohemian Fringe Bag',
        description: 'Boho-style bag with fringe details and ethnic patterns. Perfect for festival season.',
        price: 55.99,
        stockQuantity: 22,
        category: 'Bohemian Bags',
        brand: 'BohoChic',
        color: 'Multi-Color',
        material: 'Suede',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
  }
};
