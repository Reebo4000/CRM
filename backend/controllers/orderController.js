const { Order, OrderItem, Customer, Product, User, sequelize } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const notificationTriggers = require('../services/notificationTriggers');

/**
 * Get all orders with pagination, search, and filtering
 */
const getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      customerId,
      startDate,
      endDate,
      sortBy = 'orderDate', 
      sortOrder = 'DESC' 
    } = req.query;
    
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    // Search functionality
    if (search) {
      const customers = await Customer.findAll({
        where: {
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${search}%` } },
            { lastName: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } }
          ]
        },
        attributes: ['id']
      });
      
      const customerIds = customers.map(c => c.id);
      if (customerIds.length > 0) {
        whereClause.customerId = { [Op.in]: customerIds };
      }
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by customer
    if (customerId) {
      whereClause.customerId = parseInt(customerId);
    }

    // Date range filter
    if (startDate || endDate) {
      whereClause.orderDate = {};
      if (startDate) whereClause.orderDate[Op.gte] = new Date(startDate);
      if (endDate) whereClause.orderDate[Op.lte] = new Date(endDate);
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
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
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]]
    });

    res.json({
      message: 'Orders retrieved successfully',
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
    console.error('Get orders error:', error);
    res.status(500).json({
      error: 'Failed to retrieve orders',
      message: 'Internal server error'
    });
  }
};

/**
 * Get order by ID with full details
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: `Order with ID ${id} does not exist`
      });
    }

    res.json({
      message: 'Order retrieved successfully',
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      error: 'Failed to retrieve order',
      message: 'Internal server error'
    });
  }
};

/**
 * Create new order with transaction handling
 */
const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { customerId, customerInfo, orderItems, notes } = req.body;
    const userId = req.user.id;

    // Debug logging removed for production

    let customer;

    // Handle customer - either find existing or create new
    if (customerId) {
      // Verify existing customer
      customer = await Customer.findByPk(customerId);
      if (!customer) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Customer not found',
          message: `Customer with ID ${customerId} does not exist`
        });
      }
    } else if (customerInfo) {
      // Create new customer
      const customerName = customerInfo.name.trim();

      // Split name into first and last name (simple approach)
      const nameParts = customerName.split(' ');
      const firstName = nameParts[0] || customerName;
      const lastName = nameParts.slice(1).join(' ') || 'Customer';

      customer = await Customer.create({
        firstName,
        lastName,
        email: null,
        phone: 'Not provided',
        address: null,
        city: null,
        postalCode: null,
        dateOfBirth: null
      }, { transaction });

      // Customer notification will be triggered after transaction commit
    } else {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Either customerId or customerInfo must be provided'
      });
    }

    // Verify all products exist and have sufficient stock
    const productChecks = [];
    for (const item of orderItems) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Product not found',
          message: `Product with ID ${item.productId} does not exist`
        });
      }

      if (product.stockQuantity < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Product "${product.name}" has only ${product.stockQuantity} units in stock, but ${item.quantity} requested`
        });
      }

      productChecks.push({
        product,
        requestedQuantity: item.quantity
      });
    }

    // Create the order
    const order = await Order.create({
      customerId: customer.id,
      userId,
      orderDate: new Date(),
      totalAmount: 0,
      status: 'pending',
      notes
    }, { transaction });

    let totalAmount = 0;

    // Create order items and update stock
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      const { product } = productChecks[i];

      const unitPrice = product.price;
      const totalPrice = parseFloat(unitPrice) * item.quantity;
      totalAmount += totalPrice;

      // Create order item
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice
      }, { transaction });

      // Update product stock
      await product.update({
        stockQuantity: product.stockQuantity - item.quantity
      }, { transaction });
    }

    // Update order total
    await order.update({ totalAmount }, { transaction });

    await transaction.commit();

    // Fetch the complete order with all relations
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        }
      ]
    });

    // Trigger notifications for new order (after transaction commit)
    try {
      await notificationTriggers.onOrderCreated(completeOrder, req.user.id);
      await notificationTriggers.onHighValueOrder(completeOrder, 1000, req.user.id); // High-value threshold: 1000 EGP

      // If a new customer was created, trigger customer notification
      if (customerInfo && customer) {
        await notificationTriggers.onCustomerRegistered(customer, req.user.id);
      }

      // Check for inventory alerts after stock updates
      for (const check of productChecks) {
        const updatedProduct = await Product.findByPk(check.product.id);
        await notificationTriggers.onStockLevelChange(updatedProduct, req.user.id);
      }
    } catch (notificationError) {
      console.error('Error sending order notifications:', notificationError);
      // Don't fail the order creation if notifications fail
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: completeOrder
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      error: 'Failed to create order',
      message: 'Internal server error'
    });
  }
};

/**
 * Update order (general update for order details)
 */
const updateOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { customerId, customerInfo, orderItems, notes } = req.body;
    const userId = req.user.id;

    // Find the existing order
    const existingOrder = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }]
        }
      ],
      transaction
    });

    if (!existingOrder) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'Order not found',
        message: `Order with ID ${id} does not exist`
      });
    }

    let customer;

    // Handle customer - either find existing or create new
    if (customerId) {
      // Verify existing customer
      customer = await Customer.findByPk(customerId);
      if (!customer) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Customer not found',
          message: `Customer with ID ${customerId} does not exist`
        });
      }
    } else if (customerInfo) {
      // Create new customer
      const customerName = customerInfo.name.trim();

      // Split name into first and last name (simple approach)
      const nameParts = customerName.split(' ');
      const firstName = nameParts[0] || customerName;
      const lastName = nameParts.slice(1).join(' ') || 'Customer';

      customer = await Customer.create({
        firstName,
        lastName,
        email: null,
        phone: 'Not provided',
        address: null,
        city: null,
        postalCode: null,
        dateOfBirth: null
      }, { transaction });

      // Customer notification will be triggered after transaction commit
    } else {
      await transaction.rollback();
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Either customerId or customerInfo must be provided'
      });
    }

    // Restore stock for existing order items
    for (const existingItem of existingOrder.orderItems) {
      await existingItem.product.update({
        stockQuantity: existingItem.product.stockQuantity + existingItem.quantity
      }, { transaction });
    }

    // Delete existing order items
    await OrderItem.destroy({
      where: { orderId: id },
      transaction
    });

    // Verify all new products exist and have sufficient stock
    const productChecks = [];
    for (const item of orderItems) {
      const product = await Product.findByPk(item.productId, { transaction });
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          error: 'Product not found',
          message: `Product with ID ${item.productId} does not exist`
        });
      }

      if (product.stockQuantity < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Product "${product.name}" has only ${product.stockQuantity} units in stock, but ${item.quantity} requested`
        });
      }

      productChecks.push({
        product,
        requestedQuantity: item.quantity
      });
    }

    let totalAmount = 0;

    // Create new order items and update stock
    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      const { product } = productChecks[i];

      const unitPrice = product.price;
      const totalPrice = parseFloat(unitPrice) * item.quantity;
      totalAmount += totalPrice;

      // Create order item
      await OrderItem.create({
        orderId: id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice
      }, { transaction });

      // Update product stock
      await product.update({
        stockQuantity: product.stockQuantity - item.quantity
      }, { transaction });
    }

    // Update order
    await existingOrder.update({
      customerId: customer.id,
      totalAmount,
      notes
    }, { transaction });

    await transaction.commit();

    // Fetch the complete updated order with all relations
    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        }
      ]
    });

    // Trigger notifications for order update
    try {
      // Determine what changed for notification
      const changes = {};

      if (existingOrder.customerId !== customer.id) {
        const oldCustomer = await Customer.findByPk(existingOrder.customerId);
        const oldCustomerName = oldCustomer ? `${oldCustomer.firstName} ${oldCustomer.lastName}` : 'Unknown';
        const newCustomerName = `${customer.firstName} ${customer.lastName}`;
        changes.customer = `${oldCustomerName} → ${newCustomerName}`;
      }

      if (existingOrder.totalAmount !== totalAmount) {
        changes.totalAmount = totalAmount;
      }

      if (existingOrder.notes !== notes) {
        changes.notes = true;
      }

      // Always mark items as changed since we recreate them
      changes.items = true;

      await notificationTriggers.onOrderUpdated(updatedOrder, userId, changes);

      // If a new customer was created, trigger customer notification
      if (customerInfo && customer.id) {
        await notificationTriggers.onCustomerCreatedDuringOrder(customer, id, userId);
      }

      // Check for inventory alerts after stock updates
      for (const check of productChecks) {
        const updatedProduct = await Product.findByPk(check.product.id);
        await notificationTriggers.onStockLevelChange(updatedProduct, userId);
      }
    } catch (notificationError) {
      console.error('Error sending order update notifications:', notificationError);
      // Don't fail the order update if notifications fail
    }

    res.json({
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update order error:', error);
    res.status(500).json({
      error: 'Failed to update order',
      message: 'Internal server error'
    });
  }
};

/**
 * Update order status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: pending, processing, completed, cancelled'
      });
    }

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItems',
          include: [{ model: Product, as: 'product' }]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: `Order with ID ${id} does not exist`
      });
    }

    const oldStatus = order.status;

    // If cancelling an order, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const transaction = await sequelize.transaction();

      try {
        for (const orderItem of order.orderItems) {
          await orderItem.product.update({
            stockQuantity: orderItem.product.stockQuantity + orderItem.quantity
          }, { transaction });
        }

        await order.update({
          status,
          notes: notes || order.notes
        }, { transaction });

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      await order.update({
        status,
        notes: notes || order.notes
      });
    }

    // Fetch updated order with customer data for notifications
    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer'
        }
      ]
    });

    // Trigger notification for status change
    try {
      await notificationTriggers.onOrderStatusChanged(updatedOrder, oldStatus, status, req.user.id);
    } catch (notificationError) {
      console.error('Error sending order status change notification:', notificationError);
      // Don't fail the status update if notifications fail
    }

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      error: 'Failed to update order status',
      message: 'Internal server error'
    });
  }
};

/**
 * Get order statistics
 */
const getOrderStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {};
    if (startDate || endDate) {
      whereClause.orderDate = {};
      if (startDate) whereClause.orderDate[Op.gte] = new Date(startDate);
      if (endDate) whereClause.orderDate[Op.lte] = new Date(endDate);
    }

    const [
      totalOrders,
      cancelledOrders,
      totalRevenue,
      ordersByStatus,
      topProducts
    ] = await Promise.all([
      // Total orders count (excluding cancelled orders)
      Order.count({
        where: {
          ...whereClause,
          status: { [Op.ne]: 'cancelled' }
        }
      }),

      // Cancelled orders count
      Order.count({
        where: {
          ...whereClause,
          status: 'cancelled'
        }
      }),

      // Total revenue
      Order.sum('totalAmount', {
        where: {
          ...whereClause,
          status: { [Op.ne]: 'cancelled' }
        }
      }),
      
      // Orders by status
      Order.findAll({
        where: whereClause,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
        ],
        group: ['status']
      }),
      
      // Top selling products
      OrderItem.findAll({
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'category']
          },
          {
            model: Order,
            as: 'order',
            where: {
              ...whereClause,
              status: { [Op.ne]: 'cancelled' }
            },
            attributes: []
          }
        ],
        attributes: [
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold'],
          [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue']
        ],
        group: ['product.id', 'product.name', 'product.category'],
        order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
        limit: 10
      })
    ]);

    res.json({
      message: 'Order statistics retrieved successfully',
      statistics: {
        totalOrders,
        cancelledOrders,
        totalRevenue: parseFloat((totalRevenue || 0).toFixed(2)),
        averageOrderValue: totalOrders > 0 ? parseFloat(((totalRevenue || 0) / totalOrders).toFixed(2)) : 0,
        ordersByStatus,
        topProducts
      }
    });
  } catch (error) {
    console.error('Get order statistics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve order statistics',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  getOrderStatistics
};
