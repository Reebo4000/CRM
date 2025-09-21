const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getSalesAnalytics,
  getCustomerAnalytics,
  getProductAnalytics,
  getOperationalAnalytics,
  exportAnalyticsPDF
} = require('../controllers/analyticsController');
const {
  generateAnalyticsPDF
} = require('../controllers/puppeteerPdfController');

// All analytics routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin', 'staff'])); // Allow both admin and staff roles

/**
 * @route GET /api/analytics/sales
 * @desc Get sales analytics data
 * @access Private (Admin/Manager)
 * @query {string} startDate - Start date for analytics (optional)
 * @query {string} endDate - End date for analytics (optional)
 * @query {string} period - Period for trends: hourly, daily, weekly, monthly (default: daily)
 */
router.get('/sales', getSalesAnalytics);

/**
 * @route GET /api/analytics/customers
 * @desc Get customer analytics data
 * @access Private (Admin/Manager)
 * @query {string} startDate - Start date for analytics (optional)
 * @query {string} endDate - End date for analytics (optional)
 */
router.get('/customers', getCustomerAnalytics);

/**
 * @route GET /api/analytics/products
 * @desc Get product analytics data
 * @access Private (Admin/Manager)
 * @query {string} startDate - Start date for analytics (optional)
 * @query {string} endDate - End date for analytics (optional)
 */
router.get('/products', getProductAnalytics);

/**
 * @route GET /api/analytics/operations
 * @desc Get operational analytics data
 * @access Private (Admin/Manager)
 * @query {string} startDate - Start date for analytics (optional)
 * @query {string} endDate - End date for analytics (optional)
 */
router.get('/operations', getOperationalAnalytics);

/**
 * @route GET /api/analytics/dashboard
 * @desc Get combined dashboard analytics data
 * @access Private (Admin/Manager)
 * @query {string} startDate - Start date for analytics (optional)
 * @query {string} endDate - End date for analytics (optional)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get key metrics for dashboard overview
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { Order, OrderItem, Customer, Product, sequelize } = require('../models');
    const { Op } = require('sequelize');

    const whereClause = {
      orderDate: { [Op.between]: [start, end] }
    };

    const whereClauseNonCancelled = {
      orderDate: { [Op.between]: [start, end] },
      status: { [Op.ne]: 'cancelled' }
    };

    const whereClauseCancelled = {
      orderDate: { [Op.between]: [start, end] },
      status: 'cancelled'
    };

    // Key metrics
    const [
      totalRevenue,
      totalOrders,
      cancelledOrders,
      totalCustomers,
      totalProducts,
      allOrders,
      newCustomers
    ] = await Promise.all([
      // Total revenue (excluding cancelled orders)
      Order.sum('totalAmount', { where: whereClauseNonCancelled }),

      // Total orders (excluding cancelled orders)
      Order.count({ where: whereClauseNonCancelled }),

      // Cancelled orders count
      Order.count({ where: whereClauseCancelled }),
      
      // Total customers (all time)
      Customer.count(),
      
      // Total products
      Product.count(),
      
      // Get all non-cancelled orders for average calculation
      Order.findAll({
        where: whereClauseNonCancelled,
        attributes: ['totalAmount'],
        raw: true
      }),
      
      // New customers in period
      Customer.count({
        where: {
          createdAt: { [Op.between]: [start, end] }
        }
      })
    ]);

    // Calculate average order value
    const avgOrderValue = allOrders.length > 0
      ? allOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0) / allOrders.length
      : 0;

    // Recent orders (non-cancelled orders within date range)
    const recentOrders = await Order.findAll({
      where: whereClauseNonCancelled,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['firstName', 'lastName', 'email']
        }
      ],
      order: [['orderDate', 'DESC']],
      limit: 5,
      attributes: ['id', 'orderDate', 'totalAmount', 'status']
    });

    // Low stock alerts
    const lowStockProducts = await Product.findAll({
      where: {
        stockQuantity: { [Op.lte]: 10 }
      },
      order: [['stockQuantity', 'ASC']],
      limit: 5,
      attributes: ['id', 'name', 'stockQuantity', 'category']
    });

    res.json({
      message: 'Dashboard analytics retrieved successfully',
      data: {
        keyMetrics: {
          totalRevenue: parseFloat(totalRevenue || 0),
          totalOrders: totalOrders || 0,
          cancelledOrders: cancelledOrders || 0,
          totalCustomers: totalCustomers || 0,
          totalProducts: totalProducts || 0,
          averageOrderValue: parseFloat(avgOrderValue.toFixed(2)),
          newCustomers: newCustomers || 0
        },
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          orderDate: order.orderDate,
          totalAmount: parseFloat(order.totalAmount),
          status: order.status,
          customerName: `${order.customer.firstName} ${order.customer.lastName}`,
          customerEmail: order.customer.email
        })),
        lowStockAlerts: lowStockProducts.map(product => ({
          id: product.id,
          name: product.name,
          stockQuantity: product.stockQuantity,
          category: product.category
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve dashboard analytics',
      message: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/analytics/export-pdf
 * @desc Export analytics data to PDF (Puppeteer for all languages - better consistency and Arabic name support)
 * @access Private (Admin/Staff)
 * @query {string} startDate - Start date for analytics (optional)
 * @query {string} endDate - End date for analytics (optional)
 * @query {string} reportType - Type of report: overview, sales, customers, products, operations (default: overview)
 * @query {string} language - Language for the report: en, ar (default: en)
 */
router.get('/export-pdf', generateAnalyticsPDF);

/**
 * @route GET /api/analytics/export-pdf-html
 * @desc Export analytics data to PDF using Puppeteer (HTML to PDF - Better Arabic Support)
 * @access Private (Admin/Staff)
 * @query {string} startDate - Start date for analytics (optional)
 * @query {string} endDate - End date for analytics (optional)
 * @query {string} reportType - Type of report: overview, sales, customers, products (default: overview)
 * @query {string} language - Language for the report: en, ar (default: en)
 */
router.get('/export-pdf-html', generateAnalyticsPDF);

module.exports = router;
