'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      // Notification belongs to User
      Notification.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  Notification.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'User who created this notification'
  },
  isBroadcast: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Whether this notification should be broadcast to all users'
  },
  targetRoles: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    comment: 'Specific roles to target (null means all roles)'
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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  titleAr: {
    type: DataTypes.STRING,
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  messageAr: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },

  relatedEntityType: {
    type: DataTypes.ENUM('order', 'product', 'customer', 'user', 'system'),
    allowNull: true
  },
  relatedEntityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data like order amount, product name, etc.'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Optional expiration date for temporary notifications'
  }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['createdBy']
      },
      {
        fields: ['type', 'createdAt']
      },
      {
        fields: ['priority', 'createdAt']
      },
      {
        fields: ['relatedEntityType', 'relatedEntityId']
      },
      {
        fields: ['isBroadcast', 'createdAt']
      }
    ]
  });

  Notification.associate = (models) => {
    // Association with creator (User who created the notification)
    Notification.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });

    // Many-to-many association with Users through UserNotification
    Notification.belongsToMany(models.User, {
      through: models.UserNotification,
      foreignKey: 'notificationId',
      otherKey: 'userId',
      as: 'recipients'
    });

    // Direct association with UserNotification for easier querying
    Notification.hasMany(models.UserNotification, {
      foreignKey: 'notificationId',
      as: 'userNotifications'
    });
  };

  return Notification;
};
