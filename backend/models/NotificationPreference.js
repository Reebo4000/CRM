'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NotificationPreference extends Model {
    static associate(models) {
      // NotificationPreference belongs to User
      NotificationPreference.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  NotificationPreference.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notificationType: {
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
  inAppEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Enable in-app notifications'
  },
  emailEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Enable email notifications'
  },
  threshold: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Custom thresholds for stock alerts, high-value orders, etc.'
  },
  language: {
    type: DataTypes.ENUM('en', 'ar'),
    defaultValue: 'en',
    comment: 'Preferred language for notifications'
  }
  }, {
    sequelize,
    modelName: 'NotificationPreference',
    tableName: 'notification_preferences',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'notificationType'],
        unique: true
      }
    ]
  });

  return NotificationPreference;
};
