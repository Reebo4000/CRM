const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate: auth } = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
// Temporarily simplified import to debug
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
  createBroadcastNotification,
  sendTestNotification,
  getStatistics
} = require('../controllers/notificationController');

/**
 * @route GET /api/notifications
 * @desc Get user notifications with pagination
 * @access Private
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20)
 * @query {boolean} unreadOnly - Get only unread notifications (default: false)
 */
router.get('/', auth, getNotifications);

/**
 * @route GET /api/notifications/unread-count
 * @desc Get unread notification count for current user
 * @access Private
 */
router.get('/unread-count', auth, getUnreadCount);

/**
 * @route PATCH /api/notifications/:id/read
 * @desc Mark specific notification as read
 * @access Private
 */
router.patch('/:id/read', auth, markAsRead);

/**
 * @route PATCH /api/notifications/mark-all-read
 * @desc Mark all notifications as read for current user
 * @access Private
 */
router.patch('/mark-all-read', auth, markAllAsRead);

/**
 * @route GET /api/notifications/preferences
 * @desc Get user notification preferences
 * @access Private
 */
router.get('/preferences', auth, getPreferences);

/**
 * @route PUT /api/notifications/preferences
 * @desc Update user notification preferences
 * @access Private
 */
router.put('/preferences', [
  auth,
  body('preferences').isArray().withMessage('Preferences must be an array'),
  body('preferences.*.notificationType').isIn([
    'order_created',
    'order_status_changed',
    'order_payment_updated',
    'order_high_value',
    'order_failed',
    'stock_low',
    'stock_medium',
    'stock_out',
    'restock_recommendation',
    'customer_registered',
    'sales_summary_daily',
    'sales_summary_weekly',
    'system_alert',
    'maintenance_notice'
  ]).withMessage('Invalid notification type'),
  body('preferences.*.inAppEnabled').isBoolean().withMessage('inAppEnabled must be boolean'),
  body('preferences.*.emailEnabled').isBoolean().withMessage('emailEnabled must be boolean'),
  body('preferences.*.language').optional().isIn(['en', 'ar']).withMessage('Language must be en or ar')
], updatePreferences);

/**
 * @route POST /api/notifications/broadcast
 * @desc Create broadcast notification (Admin only)
 * @access Private (Admin)
 */
router.post('/broadcast', [
  auth,
  roleAuth(['admin']),
  body('type').isIn([
    'order_created',
    'order_status_changed',
    'order_payment_updated',
    'order_high_value',
    'order_failed',
    'stock_low',
    'stock_medium',
    'stock_out',
    'restock_recommendation',
    'customer_registered',
    'sales_summary_daily',
    'sales_summary_weekly',
    'system_alert',
    'maintenance_notice'
  ]).withMessage('Invalid notification type'),
  body('title').isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 characters'),
  body('titleAr').optional().isLength({ min: 1, max: 255 }).withMessage('Arabic title must be 1-255 characters'),
  body('message').isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters'),
  body('messageAr').optional().isLength({ min: 1, max: 1000 }).withMessage('Arabic message must be 1-1000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('targetRoles').optional().isArray().withMessage('Target roles must be an array'),
  body('userIds').optional().isArray().withMessage('User IDs must be an array'),
  body('relatedEntityType').optional().isIn(['order', 'product', 'customer', 'user', 'system']).withMessage('Invalid entity type'),
  body('relatedEntityId').optional().isInt().withMessage('Related entity ID must be an integer'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  body('expiresAt').optional().isISO8601().withMessage('Expires at must be a valid date')
], createBroadcastNotification);

/**
 * @route POST /api/notifications/test
 * @desc Send test notification (Admin only)
 * @access Private (Admin)
 */
router.post('/test', [
  auth,
  roleAuth(['admin']),
  body('title').optional().isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 characters'),
  body('message').optional().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('userIds').optional().isArray().withMessage('User IDs must be an array')
], sendTestNotification);

/**
 * @route GET /api/notifications/statistics
 * @desc Get notification statistics (Admin only)
 * @access Private (Admin)
 * @query {string} startDate - Start date for statistics (optional)
 * @query {string} endDate - End date for statistics (optional)
 */
router.get('/statistics', auth, roleAuth(['admin']), getStatistics);

module.exports = router;
