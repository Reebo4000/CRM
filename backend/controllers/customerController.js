const { Customer, Order, OrderItem, Product } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const notificationTriggers = require('../services/notificationTriggers');
const db = require('../models');
const sequelize = db.sequelize;

/**
 * Get all customers with pagination and search
 */
const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: customers } = await Customer.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: Order,
          as: 'orders',
          attributes: ['id', 'orderDate', 'totalAmount', 'status'],
          limit: 5,
          order: [['orderDate', 'DESC']]
        }
      ]
    });

    res.json({
      message: 'Customers retrieved successfully',
      customers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalCustomers: count,
        hasNext: offset + customers.length < count,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      error: 'Failed to retrieve customers',
      message: 'Internal server error'
    });
  }
};

/**
 * Get customer by ID with full details
 */
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'orders',
          include: [
            {
              model: OrderItem,
              as: 'orderItems',
              include: [
                {
                  model: Product,
                  as: 'product',
                  attributes: ['id', 'name', 'category', 'brand']
                }
              ]
            }
          ],
          order: [['orderDate', 'DESC']]
        }
      ]
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: `Customer with ID ${id} does not exist`
      });
    }

    // Calculate customer statistics
    const totalOrders = customer.orders.length;
    const totalSpent = customer.orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrderDate = totalOrders > 0 ? customer.orders[0].orderDate : null;

    res.json({
      message: 'Customer retrieved successfully',
      customer,
      statistics: {
        totalOrders,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        lastOrderDate,
        customerAge: customer.getAge()
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      error: 'Failed to retrieve customer',
      message: 'Internal server error'
    });
  }
};

/**
 * Create new customer
 */
const createCustomer = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { firstName, lastName, email, phone, address, city, postalCode, dateOfBirth } = req.body;

    // Check if customer with same email or phone already exists
    const existingCustomer = await Customer.findOne({
      where: {
        [Op.or]: [
          email ? { email } : null,
          { phone }
        ].filter(Boolean)
      }
    });

    if (existingCustomer) {
      return res.status(409).json({
        error: 'Customer already exists',
        message: 'A customer with this email or phone number already exists'
      });
    }

    const customer = await Customer.create({
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      dateOfBirth
    });

    // Trigger notification for new customer registration
    try {
      await notificationTriggers.onCustomerRegistered(customer, req.user.id);
      console.log(`👤 Customer registration notification triggered for: ${customer.firstName} ${customer.lastName}`);
    } catch (notificationError) {
      console.error('Error sending customer registration notification:', notificationError);
      // Don't fail the customer creation if notifications fail
    }

    res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      error: 'Failed to create customer',
      message: 'Internal server error'
    });
  }
};

/**
 * Update customer
 */
const updateCustomer = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { firstName, lastName, email, phone, address, city, postalCode, dateOfBirth } = req.body;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: `Customer with ID ${id} does not exist`
      });
    }

    // Check if email or phone is being changed and if it's already taken
    if ((email && email !== customer.email) || (phone && phone !== customer.phone)) {
      const existingCustomer = await Customer.findOne({
        where: {
          id: { [Op.ne]: id },
          [Op.or]: [
            email && email !== customer.email ? { email } : null,
            phone && phone !== customer.phone ? { phone } : null
          ].filter(Boolean)
        }
      });

      if (existingCustomer) {
        return res.status(409).json({
          error: 'Update failed',
          message: 'Email or phone number is already in use by another customer'
        });
      }
    }

    await customer.update({
      firstName: firstName || customer.firstName,
      lastName: lastName || customer.lastName,
      email: email || customer.email,
      phone: phone || customer.phone,
      address: address !== undefined ? address : customer.address,
      city: city !== undefined ? city : customer.city,
      postalCode: postalCode !== undefined ? postalCode : customer.postalCode,
      dateOfBirth: dateOfBirth !== undefined ? dateOfBirth : customer.dateOfBirth
    });

    res.json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      error: 'Failed to update customer',
      message: 'Internal server error'
    });
  }
};

/**
 * Delete customer
 */
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id, {
      include: [{ model: Order, as: 'orders' }]
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: `Customer with ID ${id} does not exist`
      });
    }

    // Check if customer has orders
    if (customer.orders && customer.orders.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete customer',
        message: 'Customer has existing orders and cannot be deleted. Consider archiving instead.'
      });
    }

    await customer.destroy();

    res.json({
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      error: 'Failed to delete customer',
      message: 'Internal server error'
    });
  }
};

/**
 * Get customer purchase history
 */
const getCustomerPurchaseHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const customer = await Customer.findByPk(id);
    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: `Customer with ID ${id} does not exist`
      });
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { customerId: id },
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'category', 'brand', 'color']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['orderDate', 'DESC']]
    });

    res.json({
      message: 'Purchase history retrieved successfully',
      customer: {
        id: customer.id,
        name: customer.getFullName(),
        email: customer.email,
        phone: customer.phone
      },
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalOrders: count,
        hasNext: offset + orders.length < count,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get purchase history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve purchase history',
      message: 'Internal server error'
    });
  }
};

/**
 * Get customer statistics
 */
const getCustomerStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause = {};
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const [
      totalCustomers,
      newCustomersThisMonth,
      topCustomersByOrders
    ] = await Promise.all([
      // Total customers count
      Customer.count({ where: whereClause }),

      // New customers this month
      Customer.count({
        where: {
          ...whereClause,
          createdAt: {
            [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),

      // Top customers by order count
      Customer.findAll({
        include: [
          {
            model: Order,
            as: 'orders',
            attributes: []
          }
        ],
        attributes: [
          'id',
          'firstName',
          'lastName',
          'email',
          [sequelize.fn('COUNT', sequelize.col('orders.id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('orders.totalAmount')), 'totalSpent']
        ],
        group: ['Customer.id', 'Customer.firstName', 'Customer.lastName', 'Customer.email'],
        order: [[sequelize.fn('COUNT', sequelize.col('orders.id')), 'DESC']],
        limit: 10,
        subQuery: false
      })
    ]);

    res.json({
      message: 'Customer statistics retrieved successfully',
      statistics: {
        totalCustomers,
        newCustomersThisMonth,
        topCustomers: topCustomersByOrders.map(customer => ({
          id: customer.id,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          orderCount: parseInt(customer.dataValues.orderCount) || 0,
          totalSpent: parseFloat((parseFloat(customer.dataValues.totalSpent) || 0).toFixed(2))
        }))
      }
    });
  } catch (error) {
    console.error('Get customer statistics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve customer statistics',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerPurchaseHistory,
  getCustomerStatistics
};
