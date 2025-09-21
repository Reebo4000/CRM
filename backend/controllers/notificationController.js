const { Notification, NotificationPreference, User, UserNotification, sequelize } = require('../models');
const { validationResult } = require('express-validator');
const notificationService = require('../services/notificationService');
const notificationTriggers = require('../services/notificationTriggers');
const { Op } = require('sequelize');

/**
 * Get user notifications with pagination
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      message: 'Notifications retrieved successfully',
      ...result
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to get notifications',
      message: 'Internal server error'
    });
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      message: 'Unread count retrieved successfully',
      count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      error: 'Failed to get unread count',
      message: 'Internal server error'
    });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await notificationService.markAsRead(id, userId);

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found',
        message: 'Notification does not exist or does not belong to you'
      });
    }

    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: 'Internal server error'
    });
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await notificationService.markAllAsRead(userId);

    res.json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      message: 'Internal server error'
    });
  }
};

/**
 * Get user notification preferences
 */
const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await NotificationPreference.findAll({
      where: { userId }
    });

    // If no preferences exist, return default preferences
    if (preferences.length === 0) {
      const defaultPreferences = await createDefaultPreferences(userId);
      return res.json({
        message: 'Default preferences created',
        preferences: defaultPreferences
      });
    }

    res.json({
      message: 'Preferences retrieved successfully',
      preferences
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      error: 'Failed to get preferences',
      message: 'Internal server error'
    });
  }
};

/**
 * Update notification preferences
 */
const updatePreferences = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const userId = req.user.id;
    const { preferences } = req.body;

    const updatedPreferences = [];

    for (const pref of preferences) {
      const [preference, created] = await NotificationPreference.findOrCreate({
        where: {
          userId,
          notificationType: pref.notificationType
        },
        defaults: {
          inAppEnabled: pref.inAppEnabled,
          emailEnabled: pref.emailEnabled,
          threshold: pref.threshold,
          language: pref.language || 'en'
        }
      });

      if (!created) {
        await preference.update({
          inAppEnabled: pref.inAppEnabled,
          emailEnabled: pref.emailEnabled,
          threshold: pref.threshold,
          language: pref.language || preference.language
        });
      }

      updatedPreferences.push(preference);
    }

    res.json({
      message: 'Preferences updated successfully',
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      error: 'Failed to update preferences',
      message: 'Internal server error'
    });
  }
};

/**
 * Create broadcast notification (Admin only)
 */
const createBroadcastNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      type,
      title,
      titleAr,
      message,
      messageAr,
      priority = 'medium',
      targetRoles = null,
      userIds = [],
      relatedEntityType = null,
      relatedEntityId = null,
      metadata = {},
      expiresAt = null
    } = req.body;

    const result = await notificationService.createNotification({
      userIds,
      targetRoles,
      type,
      title,
      titleAr,
      message,
      messageAr,
      priority,
      relatedEntityType,
      relatedEntityId,
      metadata,
      expiresAt,
      createdBy: req.user.id,
      isBroadcast: true
    });

    res.status(201).json({
      message: 'Broadcast notification created successfully',
      notification: result.notification,
      recipientCount: result.recipientCount
    });
  } catch (error) {
    console.error('Create broadcast notification error:', error);
    res.status(500).json({
      error: 'Failed to create broadcast notification',
      message: 'Internal server error'
    });
  }
};

/**
 * Send test notification (Admin only)
 */
const sendTestNotification = async (req, res) => {
  try {
    const { type, title, message, priority = 'medium', userIds } = req.body;

    const notifications = await notificationService.createNotification({
      userIds: userIds || [req.user.id],
      type: type || 'system_alert',
      title: title || 'Test Notification',
      titleAr: 'إشعار تجريبي',
      message: message || 'This is a test notification from the CRM system.',
      messageAr: 'هذا إشعار تجريبي من نظام إدارة علاقات العملاء.',
      priority,
      metadata: {
        isTest: true,
        sentBy: req.user.id,
        sentAt: new Date().toISOString()
      }
    });

    res.json({
      message: 'Test notification sent successfully',
      notifications
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      error: 'Failed to send test notification',
      message: 'Internal server error'
    });
  }
};

/**
 * Get notification statistics (Admin only)
 */
const getStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};

    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const [
      totalNotifications,
      totalUserNotifications,
      unreadUserNotifications,
      notificationsByType,
      notificationsByPriority
    ] = await Promise.all([
      // Total unique notifications created
      Notification.count({ where: dateFilter }),

      // Total user-notification relationships
      UserNotification.count({
        include: [{
          model: Notification,
          as: 'notification',
          where: dateFilter,
          required: true
        }]
      }),

      // Unread user-notification relationships
      UserNotification.count({
        where: { isRead: false },
        include: [{
          model: Notification,
          as: 'notification',
          where: dateFilter,
          required: true
        }]
      }),

      // Notifications by type (with user counts)
      UserNotification.findAll({
        attributes: [
          [sequelize.col('notification.type'), 'type'],
          [sequelize.fn('COUNT', sequelize.col('UserNotification.id')), 'count']
        ],
        include: [{
          model: Notification,
          as: 'notification',
          where: dateFilter,
          attributes: []
        }],
        group: ['notification.type'],
        raw: true
      }),

      // Notifications by priority (with user counts)
      UserNotification.findAll({
        attributes: [
          [sequelize.col('notification.priority'), 'priority'],
          [sequelize.fn('COUNT', sequelize.col('UserNotification.id')), 'count']
        ],
        include: [{
          model: Notification,
          as: 'notification',
          where: dateFilter,
          attributes: []
        }],
        group: ['notification.priority'],
        raw: true
      })
    ]);

    res.json({
      message: 'Statistics retrieved successfully',
      statistics: {
        totalNotifications,
        totalUserNotifications,
        unreadUserNotifications,
        readRate: totalUserNotifications > 0 ? ((totalUserNotifications - unreadUserNotifications) / totalUserNotifications * 100).toFixed(2) : 0,
        byType: notificationsByType,
        byPriority: notificationsByPriority
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: 'Internal server error'
    });
  }
};

/**
 * Create default notification preferences for a user
 */
const createDefaultPreferences = async (userId) => {
  const user = await User.findByPk(userId);
  const isAdmin = user.role === 'admin';

  const defaultTypes = [
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
  ];

  const preferences = [];

  for (const type of defaultTypes) {
    const preference = await NotificationPreference.create({
      userId,
      notificationType: type,
      inAppEnabled: true,
      emailEnabled: isAdmin && ['order_failed', 'stock_out', 'system_alert'].includes(type),
      language: 'en'
    });
    preferences.push(preference);
  }

  return preferences;
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
  createBroadcastNotification,
  sendTestNotification,
  getStatistics
};
