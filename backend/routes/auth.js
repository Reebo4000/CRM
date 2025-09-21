const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/authController');

const {
  authenticate,
  requireAdmin,
  requireStaff
} = require('../middleware/auth');

const {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateUserUpdate,
  validatePasswordChange,
  validatePagination,
  validateId
} = require('../middleware/validation');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public (but in production, this might be admin-only)
 */
router.post('/register', validateRegistration, register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, validateProfileUpdate, updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authenticate, validatePasswordChange, changePassword);

/**
 * @route   POST /api/auth/users
 * @desc    Create new user (Admin only)
 * @access  Private (Admin)
 */
router.post('/users', authenticate, requireAdmin, validateRegistration, createUser);





/**
 * @route   GET /api/auth/users/:id
 * @desc    Get user by ID (Admin only)
 * @access  Private (Admin)
 */
router.get('/users/:id', authenticate, requireAdmin, validateId, getUserById);

/**
 * @route   PUT /api/auth/users/:id
 * @desc    Update user (Admin only)
 * @access  Private (Admin)
 */
router.put('/users/:id', authenticate, requireAdmin, validateId, validateUserUpdate, updateUser);

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Delete user (Admin only)
 * @access  Private (Admin)
 */
router.delete('/users/:id', authenticate, requireAdmin, validateId, deleteUser);

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (Admin only)
 * @access  Private (Admin)
 */
router.get('/users', authenticate, requireAdmin, validatePagination, getAllUsers);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token and return user info
 * @access  Private
 */
router.get('/verify', authenticate, (req, res) => {
  res.json({
    message: 'Token is valid',
    user: req.user.toJSON()
  });
});

module.exports = router;
