'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('notification_templates', [
      // English in-app template
      {
        type: 'order_updated',
        language: 'en',
        channel: 'in_app',
        title: 'Order #{{orderId}} Updated',
        message: 'Order #{{orderId}} has been updated{{#if changes}} ({{#if changes.customer}}customer changed{{/if}}{{#if changes.items}}{{#if changes.customer}}, {{/if}}items modified{{/if}}{{#if changes.totalAmount}}{{#if changes.customer}}{{else}}{{#if changes.items}}, {{/if}}{{/if}}total amount changed{{/if}}{{#if changes.notes}}{{#if changes.customer}}{{else}}{{#if changes.items}}{{else}}{{#if changes.totalAmount}}, {{/if}}{{/if}}{{/if}}notes updated{{/if}}){{/if}}',
        priority: 'medium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Arabic in-app template
      {
        type: 'order_updated',
        language: 'ar',
        channel: 'in_app',
        title: 'تم تحديث الطلب #{{orderId}}',
        message: 'تم تحديث الطلب #{{orderId}}{{#if changes}} ({{#if changes.customer}}تم تغيير العميل{{/if}}{{#if changes.items}}{{#if changes.customer}}، {{/if}}تم تعديل العناصر{{/if}}{{#if changes.totalAmount}}{{#if changes.customer}}{{else}}{{#if changes.items}}، {{/if}}{{/if}}تم تغيير المبلغ الإجمالي{{/if}}{{#if changes.notes}}{{#if changes.customer}}{{else}}{{#if changes.items}}{{else}}{{#if changes.totalAmount}}، {{/if}}{{/if}}{{/if}}تم تحديث الملاحظات{{/if}}){{/if}}',
        priority: 'medium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // English email template
      {
        type: 'order_updated',
        language: 'en',
        channel: 'email',
        title: 'Order #{{orderId}} Updated',
        message: 'Order #{{orderId}} has been updated for customer {{customerName}}',
        emailSubject: 'Order #{{orderId}} Updated - {{customerName}}',
        emailHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #495057; margin-bottom: 20px;">Order Updated</h2>
              
              <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <h3 style="color: #007bff; margin-top: 0;">Order #{{orderId}}</h3>
                <p><strong>Customer:</strong> {{customerName}}</p>
                <p><strong>Total Amount:</strong> {{totalAmount}} EGP</p>
                <p><strong>Status:</strong> {{status}}</p>
                <p><strong>Updated:</strong> {{updateTime}}</p>
                
                {{#if changes}}
                <div style="margin-top: 15px;">
                  <h4 style="color: #6c757d;">Changes Made:</h4>
                  <ul style="color: #6c757d;">
                    {{#if changes.customer}}<li>Customer: {{changes.customer}}</li>{{/if}}
                    {{#if changes.items}}<li>Order items were modified</li>{{/if}}
                    {{#if changes.totalAmount}}<li>Total amount changed to {{changes.totalAmount}} EGP</li>{{/if}}
                    {{#if changes.notes}}<li>Notes were updated</li>{{/if}}
                  </ul>
                </div>
                {{/if}}
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="{{baseUrl}}/orders/{{orderId}}" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  View Order Details
                </a>
              </div>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">
                <p>This is an automated notification from Gemini CRM System.</p>
                <p>If you have any questions, please contact your system administrator.</p>
              </div>
            </div>
          </div>
        `,
        priority: 'medium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Arabic email template
      {
        type: 'order_updated',
        language: 'ar',
        channel: 'email',
        title: 'تم تحديث الطلب #{{orderId}}',
        message: 'تم تحديث الطلب #{{orderId}} للعميل {{customerName}}',
        emailSubject: 'تم تحديث الطلب #{{orderId}} - {{customerName}}',
        emailHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #495057; margin-bottom: 20px;">تم تحديث الطلب</h2>
              
              <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <h3 style="color: #007bff; margin-top: 0;">الطلب #{{orderId}}</h3>
                <p><strong>العميل:</strong> {{customerName}}</p>
                <p><strong>المبلغ الإجمالي:</strong> {{totalAmount}} ج م</p>
                <p><strong>الحالة:</strong> {{status}}</p>
                <p><strong>تم التحديث:</strong> {{updateTime}}</p>
                
                {{#if changes}}
                <div style="margin-top: 15px;">
                  <h4 style="color: #6c757d;">التغييرات المُجراة:</h4>
                  <ul style="color: #6c757d;">
                    {{#if changes.customer}}<li>العميل: {{changes.customer}}</li>{{/if}}
                    {{#if changes.items}}<li>تم تعديل عناصر الطلب</li>{{/if}}
                    {{#if changes.totalAmount}}<li>تم تغيير المبلغ الإجمالي إلى {{changes.totalAmount}} ج م</li>{{/if}}
                    {{#if changes.notes}}<li>تم تحديث الملاحظات</li>{{/if}}
                  </ul>
                </div>
                {{/if}}
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="{{baseUrl}}/orders/{{orderId}}" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  عرض تفاصيل الطلب
                </a>
              </div>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px;">
                <p>هذا إشعار تلقائي من نظام Gemini CRM.</p>
                <p>إذا كان لديك أي أسئلة، يرجى الاتصال بمدير النظام.</p>
              </div>
            </div>
          </div>
        `,
        priority: 'medium',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('notification_templates', {
      type: 'order_updated'
    }, {});
  }
};
