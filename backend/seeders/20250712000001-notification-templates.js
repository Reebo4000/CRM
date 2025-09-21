'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const templates = [
      // Order Created - English
      {
        type: 'order_created',
        language: 'en',
        channel: 'in_app',
        title: 'New Order #{{orderId}}',
        message: 'New order placed by {{customerName}} for {{totalAmount}} EGP',
        priority: 'medium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'order_created',
        language: 'en',
        channel: 'email',
        title: 'New Order #{{orderId}}',
        message: 'New order placed by {{customerName}} for {{totalAmount}} EGP',
        emailSubject: 'New Order Created - #{{orderId}}',
        emailHtml: `
          <h2>New Order Created</h2>
          <p>A new order has been placed:</p>
          <ul>
            <li><strong>Order ID:</strong> #{{orderId}}</li>
            <li><strong>Customer:</strong> {{customerName}}</li>
            <li><strong>Total Amount:</strong> {{totalAmount}} EGP</li>
            <li><strong>Status:</strong> {{status}}</li>
          </ul>
          <p>Please review and process the order in the CRM system.</p>
        `,
        priority: 'medium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Order Created - Arabic
      {
        type: 'order_created',
        language: 'ar',
        channel: 'in_app',
        title: 'طلب جديد #{{orderId}}',
        message: 'طلب جديد من {{customerName}} بقيمة {{totalAmount}} ج م',
        priority: 'medium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'order_created',
        language: 'ar',
        channel: 'email',
        title: 'طلب جديد #{{orderId}}',
        message: 'طلب جديد من {{customerName}} بقيمة {{totalAmount}} ج م',
        emailSubject: 'طلب جديد - #{{orderId}}',
        emailHtml: `
          <div dir="rtl">
            <h2>طلب جديد</h2>
            <p>تم إنشاء طلب جديد:</p>
            <ul>
              <li><strong>رقم الطلب:</strong> #{{orderId}}</li>
              <li><strong>العميل:</strong> {{customerName}}</li>
              <li><strong>المبلغ الإجمالي:</strong> {{totalAmount}} ج م</li>
              <li><strong>الحالة:</strong> {{status}}</li>
            </ul>
            <p>يرجى مراجعة ومعالجة الطلب في نظام إدارة علاقات العملاء.</p>
          </div>
        `,
        priority: 'medium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Stock Low - English
      {
        type: 'stock_low',
        language: 'en',
        channel: 'in_app',
        title: 'Low Stock Alert: {{productName}}',
        message: '{{productName}} is running low on stock ({{currentStock}} units remaining)',
        priority: 'medium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'stock_low',
        language: 'en',
        channel: 'email',
        title: 'Low Stock Alert: {{productName}}',
        message: '{{productName}} is running low on stock ({{currentStock}} units remaining)',
        emailSubject: 'Low Stock Alert - {{productName}}',
        emailHtml: `
          <h2>⚠️ Low Stock Alert</h2>
          <p>The following product is running low on stock:</p>
          <ul>
            <li><strong>Product:</strong> {{productName}}</li>
            <li><strong>Current Stock:</strong> {{currentStock}} units</li>
            <li><strong>Category:</strong> {{category}}</li>
          </ul>
          <p>Please consider restocking this item soon.</p>
        `,
        priority: 'medium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Stock Low - Arabic
      {
        type: 'stock_low',
        language: 'ar',
        channel: 'in_app',
        title: 'تنبيه مخزون منخفض: {{productName}}',
        message: '{{productName}} ينخفض مخزونه ({{currentStock}} وحدة متبقية)',
        priority: 'medium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'stock_low',
        language: 'ar',
        channel: 'email',
        title: 'تنبيه مخزون منخفض: {{productName}}',
        message: '{{productName}} ينخفض مخزونه ({{currentStock}} وحدة متبقية)',
        emailSubject: 'تنبيه مخزون منخفض - {{productName}}',
        emailHtml: `
          <div dir="rtl">
            <h2>⚠️ تنبيه مخزون منخفض</h2>
            <p>المنتج التالي ينخفض مخزونه:</p>
            <ul>
              <li><strong>المنتج:</strong> {{productName}}</li>
              <li><strong>المخزون الحالي:</strong> {{currentStock}} وحدة</li>
              <li><strong>الفئة:</strong> {{category}}</li>
            </ul>
            <p>يرجى النظر في إعادة تخزين هذا المنتج قريباً.</p>
          </div>
        `,
        priority: 'medium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Out of Stock - English
      {
        type: 'stock_out',
        language: 'en',
        channel: 'in_app',
        title: 'Out of Stock: {{productName}}',
        message: '{{productName}} is now out of stock! Immediate restocking required.',
        priority: 'critical',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'stock_out',
        language: 'en',
        channel: 'email',
        title: 'Out of Stock: {{productName}}',
        message: '{{productName}} is now out of stock! Immediate restocking required.',
        emailSubject: 'Out of Stock Alert - {{productName}}',
        emailHtml: `
          <h2>🚨 Out of Stock Alert</h2>
          <p>The following product is now out of stock:</p>
          <ul>
            <li><strong>Product:</strong> {{productName}}</li>
            <li><strong>Category:</strong> {{category}}</li>
          </ul>
          <p><strong>Immediate action required!</strong> Please restock this item.</p>
        `,
        priority: 'critical',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Out of Stock - Arabic
      {
        type: 'stock_out',
        language: 'ar',
        channel: 'in_app',
        title: 'نفد من المخزون: {{productName}}',
        message: '{{productName}} نفد من المخزون! مطلوب إعادة تخزين فورية.',
        priority: 'critical',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'stock_out',
        language: 'ar',
        channel: 'email',
        title: 'نفد من المخزون: {{productName}}',
        message: '{{productName}} نفد من المخزون! مطلوب إعادة تخزين فورية.',
        emailSubject: 'تنبيه نفاد المخزون - {{productName}}',
        emailHtml: `
          <div dir="rtl">
            <h2>🚨 تنبيه نفاد المخزون</h2>
            <p>المنتج التالي نفد من المخزون:</p>
            <ul>
              <li><strong>المنتج:</strong> {{productName}}</li>
              <li><strong>الفئة:</strong> {{category}}</li>
            </ul>
            <p><strong>مطلوب إجراء فوري!</strong> يرجى إعادة تخزين هذا المنتج.</p>
          </div>
        `,
        priority: 'critical',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Customer Registered - English
      {
        type: 'customer_registered',
        language: 'en',
        channel: 'in_app',
        title: 'New Customer Registered',
        message: 'New customer {{customerName}} has registered',
        priority: 'low',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Customer Registered - Arabic
      {
        type: 'customer_registered',
        language: 'ar',
        channel: 'in_app',
        title: 'عميل جديد مسجل',
        message: 'عميل جديد {{customerName}} قام بالتسجيل',
        priority: 'low',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // System Alert - English
      {
        type: 'system_alert',
        language: 'en',
        channel: 'in_app',
        title: 'System Alert',
        message: '{{message}}',
        priority: 'high',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // System Alert - Arabic
      {
        type: 'system_alert',
        language: 'ar',
        channel: 'in_app',
        title: 'تنبيه النظام',
        message: '{{messageAr}}',
        priority: 'high',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('notification_templates', templates);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('notification_templates', null, {});
  }
};
