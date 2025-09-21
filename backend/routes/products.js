const express = require('express');
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getLowStockProducts,
  getCategories,
  createCategory,
  getProductStatistics
} = require('../controllers/productController');

const {
  authenticate,
  requireAdmin,
  requireStaff
} = require('../middleware/auth');

const {
  validateProduct,
  validateId,
  validatePagination
} = require('../middleware/validation');

const { uploadSingle } = require('../middleware/upload');

const { body } = require('express-validator');

// Stock update validation
const validateStockUpdate = [
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

/**
 * @route   GET /api/products
 * @desc    Get all products with pagination, search, and filtering
 * @access  Private (Staff/Admin)
 */
router.get('/', authenticate, requireStaff, validatePagination, getAllProducts);

/**
 * @route   GET /api/products/statistics
 * @desc    Get product statistics
 * @access  Private (Staff/Admin)
 */
router.get('/statistics', authenticate, requireStaff, getProductStatistics);

/**
 * @route   GET /api/products/categories
 * @desc    Get all product categories
 * @access  Private (Staff/Admin)
 */
router.get('/categories', authenticate, requireStaff, getCategories);

/**
 * @route   POST /api/products/categories
 * @desc    Create a new product category
 * @access  Private (Admin)
 */
router.post('/categories', authenticate, requireAdmin, createCategory);

/**
 * @route   GET /api/products/low-stock
 * @desc    Get products with low stock
 * @access  Private (Staff/Admin)
 */
router.get('/low-stock', authenticate, requireStaff, getLowStockProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID with sales history
 * @access  Private (Staff/Admin)
 */
router.get('/:id', authenticate, requireStaff, validateId, getProductById);

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private (Admin)
 */
router.post('/', authenticate, requireAdmin, uploadSingle('image'), validateProduct, createProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Admin)
 */
router.put('/:id', authenticate, requireAdmin, validateId, uploadSingle('image'), validateProduct, updateProduct);

/**
 * @route   PUT /api/products/:id/stock
 * @desc    Update product stock
 * @access  Private (Admin)
 */
router.put('/:id/stock', authenticate, requireAdmin, validateId, validateStockUpdate, updateStock);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, requireAdmin, validateId, deleteProduct);

module.exports = router;
