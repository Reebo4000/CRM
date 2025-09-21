const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserNotification = sequelize.define('UserNotification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    notificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'notifications',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isEmailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether this notification is visible to the user (can be hidden/dismissed)'
    },
    hiddenAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_notifications',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'notificationId'],
        name: 'user_notification_unique'
      },
      {
        fields: ['userId', 'isRead'],
        name: 'user_notification_read_status'
      },
      {
        fields: ['userId', 'isVisible'],
        name: 'user_notification_visibility'
      },
      {
        fields: ['notificationId'],
        name: 'user_notification_notification_id'
      }
    ]
  });

  UserNotification.associate = (models) => {
    // Association with User
    UserNotification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Association with Notification
    UserNotification.belongsTo(models.Notification, {
      foreignKey: 'notificationId',
      as: 'notification'
    });
  };

  return UserNotification;
};
