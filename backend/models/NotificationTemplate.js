'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NotificationTemplate extends Model {
    static associate(models) {
      // No direct associations for templates
    }
  }

  NotificationTemplate.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM(
      // Order notifications
      'order_created',
      'order_updated',
      'order_status_changed',
      'order_payment_updated',
      'order_high_value',
      'order_failed',
      
      // Inventory notifications
      'stock_low',
      'stock_medium',
      'stock_out',
      'restock_recommendation',
      
      // Business notifications
      'customer_registered',
      'sales_summary_daily',
      'sales_summary_weekly',
      'system_alert',
      'maintenance_notice'
    ),
    allowNull: false
  },
  language: {
    type: DataTypes.ENUM('en', 'ar'),
    allowNull: false
  },
  channel: {
    type: DataTypes.ENUM('in_app', 'email'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Template title with placeholders like {{customerName}}'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Template message with placeholders'
  },
  emailSubject: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Email subject template (for email channel only)'
  },
  emailHtml: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'HTML email template (for email channel only)'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
  }, {
    sequelize,
    modelName: 'NotificationTemplate',
    tableName: 'notification_templates',
    timestamps: true,
    indexes: [
      {
        fields: ['type', 'language', 'channel'],
        unique: true
      }
    ]
  });

  return NotificationTemplate;
};
