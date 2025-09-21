const { body, param, query } = require('express-validator');

/**
 * Validation rules for user registration
 */
const validateRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z0-9\s]+$/)
    .withMessage('First name can only contain letters, numbers, and spaces (Arabic and English)'),

  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z0-9\s]+$/)
    .withMessage('Last name can only contain letters, numbers, and spaces (Arabic and English)'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'staff'])
    .withMessage('Role must be either admin or staff')
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for profile update
 */
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z0-9\s]+$/)
    .withMessage('First name can only contain letters, numbers, and spaces (Arabic and English)'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z0-9\s]+$/)
    .withMessage('Last name can only contain letters, numbers, and spaces (Arabic and English)'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

/**
 * Validation rules for user update (Admin only)
 */
const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z0-9\s]+$/)
    .withMessage('First name can only contain letters, numbers, and spaces (Arabic and English)'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z0-9\s]+$/)
    .withMessage('Last name can only contain letters, numbers, and spaces (Arabic and English)'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('role')
    .optional()
    .isIn(['admin', 'staff'])
    .withMessage('Role must be either admin or staff')
];

/**
 * Validation rules for password change
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6, max: 100 })
    .withMessage('New password must be between 6 and 100 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

/**
 * Validation rules for customer creation/update
 */
const validateCustomer = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces (Arabic and English)'),

  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces (Arabic and English)'),
  
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .matches(/^[\+]?[\d]{10,15}$/)
    .withMessage('Please provide a valid phone number (10-15 digits, international format supported)'),
  
  body('address')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z0-9\s\-\.\,\/]+$/)
    .withMessage('Address can only contain letters, numbers, spaces, and common punctuation (Arabic and English)'),
  
  body('city')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z\s\-\.]+$/)
    .withMessage('City can only contain letters, spaces, hyphens, and dots (Arabic and English)'),
  
  body('postalCode')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 10 })
    .withMessage('Postal code must be between 3 and 10 characters'),
  
  body('dateOfBirth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Date of birth cannot be in the future');
      }
      return true;
    })
];

/**
 * Validation rules for product creation/update
 */
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z0-9\s\-\.\,\/\(\)]+$/)
    .withMessage('Product name can only contain letters, numbers, spaces, and common punctuation (Arabic and English)'),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z0-9\s\-\.\,\/\(\)\n\r]+$/)
    .withMessage('Description can only contain letters, numbers, spaces, and common punctuation (Arabic and English)'),

  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),

  body('stockQuantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),

  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z\s\-]+$/)
    .withMessage('Category can only contain letters, spaces, and hyphens (Arabic and English)'),

  body('brand')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Brand must not exceed 50 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z0-9\s\-\.]*$/)
    .withMessage('Brand can only contain letters, numbers, spaces, hyphens, and dots (Arabic and English)'),
  
  body('color')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage('Color must not exceed 30 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z\s\-]*$/)
    .withMessage('Color can only contain letters, spaces, and hyphens (Arabic and English)'),

  body('material')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Material must not exceed 50 characters')
    .matches(/^[\u0600-\u06FFa-zA-Z\s\-]*$/)
    .withMessage('Material can only contain letters, spaces, and hyphens (Arabic and English)'),

    body('imagePath')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Image path must not exceed 500 characters')
];

/**
 * Validation rules for order creation
 */
const validateOrder = [
  // Either customerId or customerInfo must be provided
  body('customerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Customer ID must be a positive integer'),

  body('customerInfo')
    .optional()
    .isObject()
    .withMessage('Customer info must be an object'),

  body('customerInfo.name')
    .if(body('customerInfo').exists())
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),

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
    .withMessage('Notes must not exceed 500 characters'),

  // Custom validation to ensure either customerId or customerInfo is provided
  body().custom((value) => {
    if (!value.customerId && !value.customerInfo) {
      throw new Error('Either customerId or customerInfo must be provided');
    }
    return true;
  })
];

/**
 * Validation rules for ID parameters
 */
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

/**
 * Validation rules for pagination query parameters
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateUserUpdate,
  validatePasswordChange,
  validateCustomer,
  validateProduct,
  validateOrder,
  validateId,
  validatePagination
};
