const express = require('express');
const router = express.Router();

const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerPurchaseHistory,
  getCustomerStatistics
} = require('../controllers/customerController');

const {
  authenticate,
  requireAdmin,
  requireStaff
} = require('../middleware/auth');

const {
  validateCustomer,
  validateId,
  validatePagination
} = require('../middleware/validation');

/**
 * @route   GET /api/customers
 * @desc    Get all customers with pagination and search
 * @access  Private (Staff/Admin)
 */
router.get('/', authenticate, requireStaff, validatePagination, getAllCustomers);

/**
 * @route   GET /api/customers/statistics
 * @desc    Get customer statistics
 * @access  Private (Staff/Admin)
 */
router.get('/statistics', authenticate, requireStaff, getCustomerStatistics);

/**
 * @route   GET /api/customers/:id
 * @desc    Get customer by ID with full details
 * @access  Private (Staff/Admin)
 */
router.get('/:id', authenticate, requireStaff, validateId, getCustomerById);

/**
 * @route   POST /api/customers
 * @desc    Create new customer
 * @access  Private (Staff/Admin)
 */
router.post('/', authenticate, requireStaff, validateCustomer, createCustomer);

/**
 * @route   PUT /api/customers/:id
 * @desc    Update customer
 * @access  Private (Staff/Admin)
 */
router.put('/:id', authenticate, requireStaff, validateId, validateCustomer, updateCustomer);

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete customer (Admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, requireAdmin, validateId, deleteCustomer);

/**
 * @route   GET /api/customers/:id/orders
 * @desc    Get customer purchase history
 * @access  Private (Staff/Admin)
 */
router.get('/:id/orders', authenticate, requireStaff, validateId, validatePagination, getCustomerPurchaseHistory);

module.exports = router;
