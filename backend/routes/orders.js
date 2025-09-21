const express = require('express');
const router = express.Router();

const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  getOrderStatistics
} = require('../controllers/orderController');

const {
  authenticate,
  requireAdmin,
  requireStaff
} = require('../middleware/auth');

const {
  validateOrder,
  validateId,
  validatePagination
} = require('../middleware/validation');

const { body } = require('express-validator');

// Order status update validation
const validateOrderStatus = [
  body('status')
    .isIn(['pending', 'processing', 'completed', 'cancelled'])
    .withMessage('Status must be one of: pending, processing, completed, cancelled'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

/**
 * @route   GET /api/orders
 * @desc    Get all orders with pagination, search, and filtering
 * @access  Private (Staff/Admin)
 */
router.get('/', authenticate, requireStaff, validatePagination, getAllOrders);

/**
 * @route   GET /api/orders/statistics
 * @desc    Get order statistics
 * @access  Private (Staff/Admin)
 */
router.get('/statistics', authenticate, requireStaff, getOrderStatistics);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID with full details
 * @access  Private (Staff/Admin)
 */
router.get('/:id', authenticate, requireStaff, validateId, getOrderById);

/**
 * @route   POST /api/orders
 * @desc    Create new order
 * @access  Private (Staff/Admin)
 */
router.post('/', authenticate, requireStaff, validateOrder, createOrder);

/**
 * @route   PUT /api/orders/:id
 * @desc    Update order
 * @access  Private (Staff/Admin)
 */
router.put('/:id', authenticate, requireStaff, validateId, validateOrder, updateOrder);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Staff/Admin)
 */
router.put('/:id/status', authenticate, requireStaff, validateId, validateOrderStatus, updateOrderStatus);

module.exports = router;
