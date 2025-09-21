const express = require('express');
const router = express.Router();

const {
  createCustomer,
  getCustomer,
  createProduct,
  updateInventory,
  createOrder,
  getProducts,
  healthCheck
} = require('../controllers/integrationController');

const {
  authenticateIntegration,
  integrationRateLimit
} = require('../middleware/integrationAuth');

const {
  validateCustomer,
  validateProduct,
  validateOrder
} = require('../middleware/validation');

const { body, param, query } = require('express-validator');

// Integration-specific validation
const validateIntegrationOrder = [
  body('customerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a positive integer'),
  
  body('customerInfo')
    .optional()
    .isObject()
    .withMessage('Customer info must be an object'),
  
  body('customerInfo.firstName')
    .if(body('customerInfo').exists())
    .notEmpty()
    .withMessage('Customer first name is required'),
  
  body('customerInfo.lastName')
    .if(body('customerInfo').exists())
    .notEmpty()
    .withMessage('Customer last name is required'),
  
  body('customerInfo.phone')
    .if(body('customerInfo').exists())
    .notEmpty()
    .withMessage('Customer phone is required'),
  
  body('orderItems')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  
  body('orderItems.*.productId')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  
  body('orderItems.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

const validateInventoryUpdate = [
  param('productId')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('operation')
    .optional()
    .isIn(['set', 'add', 'subtract'])
    .withMessage('Operation must be set, add, or subtract'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason must not exceed 200 characters')
];

const validateCustomerQuery = [
  query('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number (international format supported)'),

  query('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
];

// Apply authentication and rate limiting to all integration routes
router.use(authenticateIntegration);
router.use(integrationRateLimit);

/**
 * @route   GET /api/integration/health
 * @desc    Health check for integration API
 * @access  Integration API Key
 */
router.get('/health', healthCheck);

/**
 * @route   POST /api/integration/customers
 * @desc    Create a new customer
 * @access  Integration API Key
 */
router.post('/customers', validateCustomer, createCustomer);

/**
 * @route   GET /api/integration/customers
 * @desc    Get customer by phone or email
 * @access  Integration API Key
 */
router.get('/customers', validateCustomerQuery, getCustomer);

/**
 * @route   POST /api/integration/products
 * @desc    Create a new product
 * @access  Integration API Key
 */
router.post('/products', validateProduct, createProduct);

/**
 * @route   GET /api/integration/products
 * @desc    Get products with stock information
 * @access  Integration API Key
 */
router.get('/products', getProducts);

/**
 * @route   PUT /api/integration/products/:productId/inventory
 * @desc    Update product inventory
 * @access  Integration API Key
 */
router.put('/products/:productId/inventory', validateInventoryUpdate, updateInventory);

/**
 * @route   POST /api/integration/orders
 * @desc    Create a new order
 * @access  Integration API Key
 */
router.post('/orders', validateIntegrationOrder, createOrder);

module.exports = router;
