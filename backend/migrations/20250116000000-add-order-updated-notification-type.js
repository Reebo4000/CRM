'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if 'order_updated' already exists in enum_notifications_type
    const [notificationTypeResults] = await queryInterface.sequelize.query(`
      SELECT enumlabel FROM pg_enum WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'enum_notifications_type'
      ) AND enumlabel = 'order_updated';
    `);

    if (notificationTypeResults.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_notifications_type" ADD VALUE 'order_updated';
      `);
    }

    // Check if 'order_updated' already exists in enum_notification_preferences_notificationType
    const [preferencesTypeResults] = await queryInterface.sequelize.query(`
      SELECT enumlabel FROM pg_enum WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'enum_notification_preferences_notificationType'
      ) AND enumlabel = 'order_updated';
    `);

    if (preferencesTypeResults.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_notification_preferences_notificationType" ADD VALUE 'order_updated';
      `);
    }

    // Check if 'order_updated' already exists in enum_notification_templates_type
    const [templatesTypeResults] = await queryInterface.sequelize.query(`
      SELECT enumlabel FROM pg_enum WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'enum_notification_templates_type'
      ) AND enumlabel = 'order_updated';
    `);

    if (templatesTypeResults.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_notification_templates_type" ADD VALUE 'order_updated';
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum types, which is complex
    // For now, we'll leave the enum values in place
    console.log('Warning: Cannot remove enum values in PostgreSQL. The order_updated type will remain.');
  }
};
