const { Notification, NotificationPreference, NotificationTemplate, User, UserNotification } = require('../models');
const emailService = require('./emailService');
const socketService = require('./socketService');
const { Op } = require('sequelize');

/**
 * Core Notification Service
 * Handles creation, delivery, and management of notifications
 */
class NotificationService {
  constructor() {
    this.socketIO = null;
  }

  /**
   * Initialize with Socket.IO instance
   */
  setSocketIO(io) {
    this.socketIO = io;
  }

  /**
   * Create and broadcast a notification to all users or specific recipients
   */
  async createNotification({
    userIds = [],
    targetRoles = null,
    type,
    title,
    titleAr,
    message,
    messageAr,
    priority = 'medium',
    relatedEntityType = null,
    relatedEntityId = null,
    metadata = {},
    expiresAt = null,
    createdBy = null,
    isBroadcast = true
  }) {
    try {
      // Create the main notification record
      const notification = await Notification.create({
        createdBy,
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
        isBroadcast,
        targetRoles
      });

      // Determine recipients
      let recipients = [];
      if (userIds.length > 0) {
        // Specific users provided
        recipients = await User.findAll({
          where: { id: { [Op.in]: userIds } },
          attributes: ['id', 'email', 'firstName', 'lastName', 'role']
        });
      } else if (targetRoles && targetRoles.length > 0) {
        // Target specific roles
        recipients = await User.findAll({
          where: { role: { [Op.in]: targetRoles } },
          attributes: ['id', 'email', 'firstName', 'lastName', 'role']
        });
      } else if (isBroadcast) {
        // Broadcast to all active users
        recipients = await User.findAll({
          attributes: ['id', 'email', 'firstName', 'lastName', 'role']
        });
      } else {
        // Fallback to role-based recipients
        recipients = await this.getRecipientsForNotificationType(type);
      }

      // Create UserNotification records for each recipient (only if they want in-app notifications)
      const userNotifications = [];
      for (const user of recipients) {
        // Check if user wants in-app notifications for this type
        const userPrefs = await this.getUserPreferences(user.id, type);

        // Check threshold conditions if applicable
        const shouldSendBasedOnThreshold = await this.checkThresholdConditions(type, metadata, userPrefs.threshold, user.id);

        // Only create in-app notification if user has it enabled and threshold conditions are met
        if (userPrefs.inAppEnabled && shouldSendBasedOnThreshold) {
          const userNotification = await UserNotification.create({
            userId: user.id,
            notificationId: notification.id,
            isRead: false,
            isEmailSent: false,
            isVisible: true
          });

          userNotifications.push({
            ...userNotification.toJSON(),
            user: user.toJSON(),
            notification: notification.toJSON()
          });

          // Send real-time notification via Socket.IO
          await this.sendRealTimeNotification(user.id, {
            notification: notification.toJSON(),
            userNotification: userNotification.toJSON()
          });
        }

        // Always check email preferences separately (independent of in-app) and threshold
        if (userPrefs.emailEnabled && shouldSendBasedOnThreshold) {
          await this.sendEmailNotification(user, notification);
        }
      }

      console.log(`📢 Broadcast notification created: ${title} (${recipients.length} recipients)`);

      return {
        notification,
        userNotifications,
        recipientCount: recipients.length
      };
    } catch (error) {
      console.error('Error creating broadcast notification:', error);
      throw error;
    }
  }

  /**
   * Create a notification for specific users (legacy method for backward compatibility)
   */
  async createUserNotification({
    userId,
    type,
    title,
    titleAr,
    message,
    messageAr,
    priority = 'medium',
    relatedEntityType = null,
    relatedEntityId = null,
    metadata = {},
    expiresAt = null,
    createdBy = null
  }) {
    return this.createNotification({
      userIds: [userId],
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
      createdBy,
      isBroadcast: false
    });
  }

  /**
   * Handle email delivery for a user notification
   */
  async handleEmailDelivery(user, notification, userNotification) {
    try {
      const shouldSendEmail = await this.shouldSendEmail(user.id, notification.type);
      if (shouldSendEmail) {
        await this.sendEmailNotification(user, notification);

        // Update email sent status
        await userNotification.update({
          isEmailSent: true,
          emailSentAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error handling email delivery:', error);
    }
  }

  /**
   * Send real-time notification via Socket.IO
   */
  async sendRealTimeNotification(userId, notificationData) {
    try {
      if (this.socketIO) {
        this.socketIO.to(`user_${userId}`).emit('notification', notificationData);
      } else if (socketService && socketService.sendToUser) {
        socketService.sendToUser(userId, 'notification', notificationData);
      }
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }
  }

  /**
   * Legacy method - Send real-time notification via Socket.IO
   */
  async sendRealTimeNotificationLegacy(userId, notification) {
    if (!this.socketIO) return;

    try {
      // Send to user's room
      this.socketIO.to(`user_${userId}`).emit('notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        titleAr: notification.titleAr,
        message: notification.message,
        messageAr: notification.messageAr,
        priority: notification.priority,
        metadata: notification.metadata,
        createdAt: notification.createdAt
      });

      console.log(`Real-time notification sent to user ${userId}: ${notification.type}`);
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(userId, notification) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.email) return;

      // Get user's preferred language
      const preference = await NotificationPreference.findOne({
        where: { userId, notificationType: notification.type }
      });
      const language = preference?.language || 'en';

      // Get email template
      const template = await NotificationTemplate.findOne({
        where: {
          type: notification.type,
          language,
          channel: 'email'
        }
      });

      if (!template) {
        console.warn(`No email template found for ${notification.type} in ${language}`);
        return;
      }

      // Replace placeholders in template
      const emailData = this.replacePlaceholders(template, notification, user);

      await emailService.sendNotificationEmail({
        to: user.email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });

      // Mark email as sent
      await notification.update({ isEmailSent: true });

      console.log(`Email notification sent to ${user.email}: ${notification.type}`);
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  /**
   * Get recipients for notification type based on roles
   */
  async getRecipientsForNotificationType(type) {
    const roleMapping = {
      // Order notifications - admin and staff
      'order_created': ['admin', 'staff'],
      'order_status_changed': ['admin', 'staff'],
      'order_payment_updated': ['admin', 'staff'],
      'order_high_value': ['admin'],
      'order_failed': ['admin', 'staff'],
      
      // Inventory notifications - admin and staff
      'stock_low': ['admin', 'staff'],
      'stock_medium': ['admin', 'staff'],
      'stock_out': ['admin', 'staff'],
      'restock_recommendation': ['admin'],
      
      // Business notifications
      'customer_registered': ['admin', 'staff'],
      'sales_summary_daily': ['admin'],
      'sales_summary_weekly': ['admin'],
      'system_alert': ['admin'],
      'maintenance_notice': ['admin', 'staff']
    };

    const roles = roleMapping[type] || ['admin'];
    
    const users = await User.findAll({
      where: {
        role: { [Op.in]: roles }
      },
      attributes: ['id', 'email', 'firstName', 'lastName', 'role']
    });

    return users;
  }

  /**
   * Check if user wants email notifications for this type
   */
  async shouldSendEmail(userId, type) {
    const preference = await NotificationPreference.findOne({
      where: { userId, notificationType: type }
    });

    // Default to false for email notifications unless explicitly enabled
    return preference?.emailEnabled || false;
  }

  /**
   * Check if user wants in-app notifications for this type
   */
  async shouldSendInApp(userId, type) {
    const preference = await NotificationPreference.findOne({
      where: { userId, notificationType: type }
    });

    // Default to true for in-app notifications unless explicitly disabled
    return preference?.inAppEnabled !== false;
  }

  /**
   * Check user preferences for a notification type
   */
  async getUserPreferences(userId, type) {
    const preference = await NotificationPreference.findOne({
      where: { userId, notificationType: type }
    });

    return {
      inAppEnabled: preference?.inAppEnabled !== false, // Default true
      emailEnabled: preference?.emailEnabled || false,  // Default false
      threshold: preference?.threshold || null,
      language: preference?.language || 'en'
    };
  }

  /**
   * Check if notification should be sent based on threshold conditions
   */
  async checkThresholdConditions(type, metadata, userThreshold, userId = null) {
    // Define default thresholds for stock notifications
    const defaultThresholds = {
      stock_low: 5,
      stock_medium: 10,
      stock_out: 0,
      order_high_value: 1000
    };

    switch (type) {
      case 'order_high_value':
        const orderAmount = metadata.totalAmount || metadata.amount || 0;
        const amountThreshold = userThreshold?.amount || defaultThresholds.order_high_value;
        return orderAmount >= amountThreshold;

      case 'stock_low':
        const lowStockQuantity = metadata.stockQuantity || metadata.quantity || 0;
        const lowThreshold = userThreshold?.quantity || defaultThresholds.stock_low;
        const shouldSendLow = lowStockQuantity <= lowThreshold && lowStockQuantity > 0;

        console.log(`🔍 Low stock threshold check for ${metadata.productName || 'product'}: stock=${lowStockQuantity}, threshold=${lowThreshold}, shouldSend=${shouldSendLow}`);
        return shouldSendLow;

      case 'stock_medium':
        const mediumStockQuantity = metadata.stockQuantity || metadata.quantity || 0;
        const mediumThreshold = userThreshold?.quantity || defaultThresholds.stock_medium;

        // For medium stock, we need to check it's above low threshold but below medium threshold
        let mediumLowThreshold = defaultThresholds.stock_low; // Default fallback

        if (userId) {
          // Fetch the user's low stock threshold preference
          const lowStockPrefs = await this.getUserPreferences(userId, 'stock_low');
          mediumLowThreshold = lowStockPrefs.threshold?.quantity || defaultThresholds.stock_low;
        }

        const shouldSendMedium = mediumStockQuantity <= mediumThreshold && mediumStockQuantity > mediumLowThreshold;

        console.log(`🔍 Medium stock threshold check for ${metadata.productName || 'product'}: stock=${mediumStockQuantity}, mediumThreshold=${mediumThreshold}, lowThreshold=${mediumLowThreshold}, shouldSend=${shouldSendMedium}`);
        return shouldSendMedium;

      case 'stock_out':
        const outStockQuantity = metadata.stockQuantity || metadata.quantity || 0;
        const shouldSendOut = outStockQuantity <= 0;

        console.log(`🔍 Out of stock threshold check for ${metadata.productName || 'product'}: stock=${outStockQuantity}, shouldSend=${shouldSendOut}`);
        return shouldSendOut;

      default:
        // For notification types without threshold logic, always send
        return true;
    }
  }

  /**
   * Create default notification preferences for a new user
   */
  async createDefaultPreferences(userId, userRole = 'user') {
    try {
      const defaultPreferences = {
        admin: [
          { type: 'order_created', inApp: true, email: true },
          { type: 'order_status_changed', inApp: true, email: false },
          { type: 'order_high_value', inApp: true, email: true },
          { type: 'order_failed', inApp: true, email: true },
          { type: 'stock_low', inApp: true, email: true },
          { type: 'stock_out', inApp: true, email: true },
          { type: 'customer_registered', inApp: true, email: false },
          { type: 'sales_summary_daily', inApp: true, email: true },
          { type: 'system_alert', inApp: true, email: true }
        ],
        staff: [
          { type: 'order_created', inApp: true, email: false },
          { type: 'order_status_changed', inApp: true, email: false },
          { type: 'stock_low', inApp: true, email: false },
          { type: 'stock_out', inApp: true, email: true },
          { type: 'customer_registered', inApp: true, email: false }
        ],
        user: [
          { type: 'order_created', inApp: true, email: false },
          { type: 'order_status_changed', inApp: true, email: false }
        ]
      };

      const preferencesToCreate = defaultPreferences[userRole] || defaultPreferences.user;

      for (const pref of preferencesToCreate) {
        await NotificationPreference.findOrCreate({
          where: {
            userId,
            notificationType: pref.type
          },
          defaults: {
            userId,
            notificationType: pref.type,
            inAppEnabled: pref.inApp,
            emailEnabled: pref.email,
            language: 'en'
          }
        });
      }

      console.log(`✅ Default notification preferences created for user ${userId} (${userRole})`);
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  }

  /**
   * Replace placeholders in notification templates
   */
  replacePlaceholders(template, notification, user) {
    const placeholders = {
      '{{userName}}': `${user.firstName} ${user.lastName}`,
      '{{userFirstName}}': user.firstName,
      '{{userLastName}}': user.lastName,
      '{{userEmail}}': user.email,
      '{{notificationTitle}}': notification.title,
      '{{notificationMessage}}': notification.message,
      '{{metadata}}': JSON.stringify(notification.metadata),
      '{{date}}': new Date().toLocaleDateString(),
      '{{time}}': new Date().toLocaleTimeString()
    };

    // Add metadata-specific placeholders
    if (notification.metadata) {
      Object.keys(notification.metadata).forEach(key => {
        placeholders[`{{${key}}}`] = notification.metadata[key];
      });
    }

    let subject = template.emailSubject || template.title;
    let html = template.emailHtml || template.message;
    let text = template.message;

    // Replace all placeholders
    Object.keys(placeholders).forEach(placeholder => {
      const value = placeholders[placeholder] || '';
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      html = html.replace(new RegExp(placeholder, 'g'), value);
      text = text.replace(new RegExp(placeholder, 'g'), value);
    });

    return { subject, html, text };
  }

  /**
   * Mark notification as read for a specific user
   */
  async markAsRead(notificationId, userId) {
    try {
      const userNotification = await UserNotification.findOne({
        where: {
          notificationId,
          userId
        },
        include: [{
          model: Notification,
          as: 'notification'
        }]
      });

      if (userNotification && !userNotification.isRead) {
        await userNotification.update({
          isRead: true,
          readAt: new Date()
        });

        // Send real-time update
        if (socketService && socketService.sendNotificationReadUpdate) {
          socketService.sendNotificationReadUpdate(userId, notificationId, userNotification.id);
        } else {
          await this.sendRealTimeNotification(userId, {
            type: 'notification_read',
            notificationId,
            userNotificationId: userNotification.id
          });
        }

        console.log(`✅ Notification ${notificationId} marked as read for user ${userId}`);
      }

      return userNotification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      const result = await UserNotification.update(
        {
          isRead: true,
          readAt: new Date()
        },
        {
          where: {
            userId,
            isRead: false,
            isVisible: true
          }
        }
      );

      // Send real-time update
      if (socketService && socketService.sendMarkAllAsReadUpdate) {
        socketService.sendMarkAllAsReadUpdate(userId, result[0]);
      } else {
        await this.sendRealTimeNotification(userId, {
          type: 'notifications_all_read',
          updatedCount: result[0]
        });
      }

      console.log(`✅ Marked ${result[0]} notifications as read for user ${userId}`);
      return result[0];
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user with their individual read status
   */
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    try {
      const userNotificationWhere = {
        userId,
        isVisible: true
      };

      if (unreadOnly) {
        userNotificationWhere.isRead = false;
      }

      const { count, rows } = await UserNotification.findAndCountAll({
        where: userNotificationWhere,
        include: [{
          model: Notification,
          as: 'notification',
          include: [{
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false
          }]
        }],
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit
      });

      // Transform the data to match the expected format
      const notifications = rows.map(userNotification => ({
        id: userNotification.notification.id,
        type: userNotification.notification.type,
        title: userNotification.notification.title,
        titleAr: userNotification.notification.titleAr,
        message: userNotification.notification.message,
        messageAr: userNotification.notification.messageAr,
        priority: userNotification.notification.priority,
        relatedEntityType: userNotification.notification.relatedEntityType,
        relatedEntityId: userNotification.notification.relatedEntityId,
        metadata: userNotification.notification.metadata,
        expiresAt: userNotification.notification.expiresAt,
        createdAt: userNotification.notification.createdAt,
        updatedAt: userNotification.notification.updatedAt,
        creator: userNotification.notification.creator,
        // User-specific fields
        isRead: userNotification.isRead,
        readAt: userNotification.readAt,
        isEmailSent: userNotification.isEmailSent,
        emailSentAt: userNotification.emailSentAt,
        isVisible: userNotification.isVisible,
        userNotificationId: userNotification.id
      }));

      return {
        notifications,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        hasMore: page * limit < count
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId) {
    try {
      const count = await UserNotification.count({
        where: {
          userId,
          isRead: false,
          isVisible: true
        }
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deletedCount = await Notification.destroy({
        where: {
          createdAt: { [Op.lt]: cutoffDate },
          isRead: true
        }
      });

      console.log(`Cleaned up ${deletedCount} old notifications`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
