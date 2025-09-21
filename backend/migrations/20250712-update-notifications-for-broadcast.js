'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Create the user_notifications junction table (if it doesn't exist)
      const tableExists = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_notifications'",
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (tableExists.length === 0) {
        await queryInterface.createTable('user_notifications', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
          primaryKey: true
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        notificationId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'notifications',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        isRead: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        readAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        isEmailSent: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        },
        emailSentAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        isVisible: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        },
        hiddenAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });
      }

      // 2. Add indexes to user_notifications table (if they don't exist)
      const indexExists = await queryInterface.sequelize.query(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'user_notifications' AND indexname = 'user_notification_unique'",
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (indexExists.length === 0) {
        await queryInterface.addIndex('user_notifications', ['userId', 'notificationId'], {
          unique: true,
          name: 'user_notification_unique',
          transaction
        });
      }

      // Check and add other indexes if they don't exist
      const readStatusIndexExists = await queryInterface.sequelize.query(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'user_notifications' AND indexname = 'user_notification_read_status'",
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (readStatusIndexExists.length === 0) {
        await queryInterface.addIndex('user_notifications', ['userId', 'isRead'], {
          name: 'user_notification_read_status',
          transaction
        });
      }

      const visibilityIndexExists = await queryInterface.sequelize.query(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'user_notifications' AND indexname = 'user_notification_visibility'",
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (visibilityIndexExists.length === 0) {
        await queryInterface.addIndex('user_notifications', ['userId', 'isVisible'], {
          name: 'user_notification_visibility',
          transaction
        });
      }

      const notificationIdIndexExists = await queryInterface.sequelize.query(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'user_notifications' AND indexname = 'user_notification_notification_id'",
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (notificationIdIndexExists.length === 0) {
        await queryInterface.addIndex('user_notifications', ['notificationId'], {
          name: 'user_notification_notification_id',
          transaction
        });
      }

      // 3. Migrate existing notification data to the new structure
      // First, check if the old structure exists
      const notificationsTableDesc = await queryInterface.describeTable('notifications');

      if (notificationsTableDesc.userId) {
        // Old structure exists, migrate data
        const existingNotifications = await queryInterface.sequelize.query(
          'SELECT id, "userId", "isRead", "isEmailSent", "createdAt" FROM notifications',
          { type: Sequelize.QueryTypes.SELECT, transaction }
        );

        // Create user_notification records for existing notifications
        for (const notification of existingNotifications) {
          await queryInterface.bulkInsert('user_notifications', [{
            userId: notification.userId,
            notificationId: notification.id,
            isRead: notification.isRead,
            readAt: notification.isRead ? notification.createdAt : null,
            isEmailSent: notification.isEmailSent,
            emailSentAt: notification.isEmailSent ? notification.createdAt : null,
            isVisible: true,
            hiddenAt: null,
            createdAt: notification.createdAt,
            updatedAt: notification.createdAt
          }], { transaction });
        }
      }

      // 4. Update notifications table structure (only if old structure exists)
      if (notificationsTableDesc.userId) {
        // Change userId to createdBy and make it nullable
        await queryInterface.renameColumn('notifications', 'userId', 'createdBy', { transaction });
        await queryInterface.changeColumn('notifications', 'createdBy', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        }, { transaction });
      }

      // Add new broadcast-related columns (if they don't exist)
      if (!notificationsTableDesc.isBroadcast) {
        await queryInterface.addColumn('notifications', 'isBroadcast', {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
          allowNull: false
        }, { transaction });
      }

      if (!notificationsTableDesc.targetRoles) {
        await queryInterface.addColumn('notifications', 'targetRoles', {
          type: Sequelize.ARRAY(Sequelize.STRING),
          allowNull: true
        }, { transaction });
      }

      // Remove user-specific columns from notifications table (if they exist)
      if (notificationsTableDesc.isRead) {
        await queryInterface.removeColumn('notifications', 'isRead', { transaction });
      }
      if (notificationsTableDesc.isEmailSent) {
        await queryInterface.removeColumn('notifications', 'isEmailSent', { transaction });
      }

      // 5. Update indexes on notifications table
      // Check if old index exists before removing
      const oldIndexExists = await queryInterface.sequelize.query(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'notifications' AND indexname = 'notifications_user_id_is_read'",
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (oldIndexExists.length > 0) {
        await queryInterface.removeIndex('notifications', 'notifications_user_id_is_read', { transaction });
      }

      // Check if new indexes exist before adding
      const createdByIndexExists = await queryInterface.sequelize.query(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'notifications' AND indexname = 'notifications_created_by'",
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (createdByIndexExists.length === 0) {
        await queryInterface.addIndex('notifications', ['createdBy'], {
          name: 'notifications_created_by',
          transaction
        });
      }

      const broadcastIndexExists = await queryInterface.sequelize.query(
        "SELECT indexname FROM pg_indexes WHERE tablename = 'notifications' AND indexname = 'notifications_broadcast_created'",
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (broadcastIndexExists.length === 0) {
        await queryInterface.addIndex('notifications', ['isBroadcast', 'createdAt'], {
          name: 'notifications_broadcast_created',
          transaction
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // This is a complex migration to reverse, so we'll implement a basic rollback
      // In production, you might want to create a backup before running this migration
      
      // 1. Add back user-specific columns to notifications
      await queryInterface.addColumn('notifications', 'isRead', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }, { transaction });

      await queryInterface.addColumn('notifications', 'isEmailSent', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }, { transaction });

      // 2. Rename createdBy back to userId
      await queryInterface.renameColumn('notifications', 'createdBy', 'userId', { transaction });
      await queryInterface.changeColumn('notifications', 'userId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      }, { transaction });

      // 3. Remove broadcast-related columns
      await queryInterface.removeColumn('notifications', 'isBroadcast', { transaction });
      await queryInterface.removeColumn('notifications', 'targetRoles', { transaction });

      // 4. Drop user_notifications table
      await queryInterface.dropTable('user_notifications', { transaction });

      // 5. Restore original indexes
      await queryInterface.removeIndex('notifications', 'notifications_created_by', { transaction });
      await queryInterface.removeIndex('notifications', 'notifications_broadcast_created', { transaction });
      await queryInterface.addIndex('notifications', ['userId', 'isRead'], {
        name: 'notifications_user_id_is_read',
        transaction
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
