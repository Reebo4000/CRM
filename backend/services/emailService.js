const nodemailer = require('nodemailer');

/**
 * Email Service for sending notification emails
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      // For development, use ethereal email (fake SMTP)
      // In production, configure with real SMTP settings
      if (process.env.NODE_ENV === 'production') {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      } else {
        // Development mode - use ethereal email for testing
        this.createTestAccount();
      }
    } catch (error) {
      console.error('Error initializing email transporter:', error);
    }
  }

  /**
   * Create test account for development
   */
  async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      this.isConfigured = true;
      console.log('📧 Email service configured with test account');
      console.log(`Test email user: ${testAccount.user}`);
    } catch (error) {
      console.error('Error creating test email account:', error);
    }
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail({ to, subject, html, text }) {
    if (!this.transporter) {
      console.warn('Email transporter not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'CRM <noreply@crm.com>',
        to,
        subject,
        text,
        html: html || text
      };

      const info = await this.transporter.sendMail(mailOptions);

      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 Email sent successfully');
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send order notification email
   */
  async sendOrderNotification({ to, orderData, type, language = 'en' }) {
    const templates = {
      en: {
        order_created: {
          subject: 'New Order Created - #{{orderId}}',
          html: `
            <h2>New Order Created</h2>
            <p>A new order has been placed:</p>
            <ul>
              <li><strong>Order ID:</strong> #{{orderId}}</li>
              <li><strong>Customer:</strong> {{customerName}}</li>
              <li><strong>Total Amount:</strong> {{totalAmount}}</li>
              <li><strong>Status:</strong> {{status}}</li>
            </ul>
            <p>Please review and process the order in the CRM system.</p>
          `
        },
        order_status_changed: {
          subject: 'Order Status Updated - #{{orderId}}',
          html: `
            <h2>Order Status Updated</h2>
            <p>Order #{{orderId}} status has been changed to: <strong>{{newStatus}}</strong></p>
            <p>Customer: {{customerName}}</p>
            <p>Total Amount: {{totalAmount}}</p>
          `
        },
        order_high_value: {
          subject: '🚨 High-Value Order Alert - #{{orderId}}',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">🚨 High-Value Order Alert</h2>
              <p>A high-value order has been placed:</p>
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <ul style="list-style: none; padding: 0;">
                  <li style="margin: 10px 0;"><strong>Order ID:</strong> #{{orderId}}</li>
                  <li style="margin: 10px 0;"><strong>Customer:</strong> {{customerName}}</li>
                  <li style="margin: 10px 0;"><strong>Total Amount:</strong> {{totalAmount}} EGP</li>
                  <li style="margin: 10px 0;"><strong>Threshold:</strong> {{threshold}} EGP</li>
                </ul>
              </div>
              <p style="color: #dc2626;"><strong>This order requires special attention due to its high value.</strong></p>
            </div>
          `
        },
        order_failed: {
          subject: '❌ Order Processing Failed - #{{orderId}}',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">❌ Order Processing Failed</h2>
              <p>Order processing has failed:</p>
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <ul style="list-style: none; padding: 0;">
                  <li style="margin: 10px 0;"><strong>Order ID:</strong> #{{orderId}}</li>
                  <li style="margin: 10px 0;"><strong>Customer:</strong> {{customerName}}</li>
                  <li style="margin: 10px 0;"><strong>Error:</strong> {{errorMessage}}</li>
                  <li style="margin: 10px 0;"><strong>Total Amount:</strong> {{totalAmount}} EGP</li>
                </ul>
              </div>
              <p style="color: #dc2626;"><strong>Please investigate and resolve this issue immediately.</strong></p>
            </div>
          `
        }
      },
      ar: {
        order_created: {
          subject: 'طلب جديد - #{{orderId}}',
          html: `
            <div dir="rtl">
              <h2>طلب جديد</h2>
              <p>تم إنشاء طلب جديد:</p>
              <ul>
                <li><strong>رقم الطلب:</strong> #{{orderId}}</li>
                <li><strong>العميل:</strong> {{customerName}}</li>
                <li><strong>المبلغ الإجمالي:</strong> {{totalAmount}}</li>
                <li><strong>الحالة:</strong> {{status}}</li>
              </ul>
              <p>يرجى مراجعة ومعالجة الطلب في نظام إدارة علاقات العملاء.</p>
            </div>
          `
        },
        order_status_changed: {
          subject: 'تحديث حالة الطلب - #{{orderId}}',
          html: `
            <div dir="rtl">
              <h2>تم تحديث حالة الطلب</h2>
              <p>تم تغيير حالة الطلب #{{orderId}} إلى: <strong>{{newStatus}}</strong></p>
              <p>العميل: {{customerName}}</p>
              <p>المبلغ الإجمالي: {{totalAmount}}</p>
            </div>
          `
        },
        order_high_value: {
          subject: '🚨 تنبيه طلب عالي القيمة - #{{orderId}}',
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; text-align: right;">
              <h2 style="color: #dc2626;">🚨 تنبيه طلب عالي القيمة</h2>
              <p>تم وضع طلب عالي القيمة:</p>
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #dc2626;">
                <ul style="list-style: none; padding: 0;">
                  <li style="margin: 10px 0;"><strong>رقم الطلب:</strong> #{{orderId}}</li>
                  <li style="margin: 10px 0;"><strong>العميل:</strong> {{customerName}}</li>
                  <li style="margin: 10px 0;"><strong>المبلغ الإجمالي:</strong> {{totalAmount}} ج م</li>
                  <li style="margin: 10px 0;"><strong>الحد الأدنى:</strong> {{threshold}} ج م</li>
                </ul>
              </div>
              <p style="color: #dc2626;"><strong>هذا الطلب يتطلب اهتماماً خاصاً بسبب قيمته العالية.</strong></p>
            </div>
          `
        },
        order_failed: {
          subject: '❌ فشل في معالجة الطلب - #{{orderId}}',
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl; text-align: right;">
              <h2 style="color: #dc2626;">❌ فشل في معالجة الطلب</h2>
              <p>فشل في معالجة الطلب:</p>
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #dc2626;">
                <ul style="list-style: none; padding: 0;">
                  <li style="margin: 10px 0;"><strong>رقم الطلب:</strong> #{{orderId}}</li>
                  <li style="margin: 10px 0;"><strong>العميل:</strong> {{customerName}}</li>
                  <li style="margin: 10px 0;"><strong>الخطأ:</strong> {{errorMessage}}</li>
                  <li style="margin: 10px 0;"><strong>المبلغ الإجمالي:</strong> {{totalAmount}} ج م</li>
                </ul>
              </div>
              <p style="color: #dc2626;"><strong>يرجى التحقيق وحل هذه المشكلة فوراً.</strong></p>
            </div>
          `
        }
      }
    };

    const template = templates[language]?.[type];
    if (!template) {
      console.warn(`No email template found for ${type} in ${language}`);
      return false;
    }

    // Replace placeholders
    let subject = template.subject;
    let html = template.html;

    Object.keys(orderData).forEach(key => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), orderData[key]);
      html = html.replace(new RegExp(placeholder, 'g'), orderData[key]);
    });

    return await this.sendNotificationEmail({
      to,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    });
  }

  /**
   * Send inventory alert email
   */
  async sendInventoryAlert({ to, productData, type, language = 'en' }) {
    const templates = {
      en: {
        stock_low: {
          subject: 'Low Stock Alert - {{productName}}',
          html: `
            <h2>⚠️ Low Stock Alert</h2>
            <p>The following product is running low on stock:</p>
            <ul>
              <li><strong>Product:</strong> {{productName}}</li>
              <li><strong>Current Stock:</strong> {{currentStock}} units</li>
              <li><strong>Category:</strong> {{category}}</li>
            </ul>
            <p>Please consider restocking this item soon.</p>
          `
        },
        stock_out: {
          subject: 'Out of Stock Alert - {{productName}}',
          html: `
            <h2>🚨 Out of Stock Alert</h2>
            <p>The following product is now out of stock:</p>
            <ul>
              <li><strong>Product:</strong> {{productName}}</li>
              <li><strong>Category:</strong> {{category}}</li>
            </ul>
            <p><strong>Immediate action required!</strong> Please restock this item.</p>
          `
        }
      },
      ar: {
        stock_low: {
          subject: 'تنبيه مخزون منخفض - {{productName}}',
          html: `
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
          `
        },
        stock_out: {
          subject: 'تنبيه نفاد المخزون - {{productName}}',
          html: `
            <div dir="rtl">
              <h2>🚨 تنبيه نفاد المخزون</h2>
              <p>المنتج التالي نفد من المخزون:</p>
              <ul>
                <li><strong>المنتج:</strong> {{productName}}</li>
                <li><strong>الفئة:</strong> {{category}}</li>
              </ul>
              <p><strong>مطلوب إجراء فوري!</strong> يرجى إعادة تخزين هذا المنتج.</p>
            </div>
          `
        }
      }
    };

    const template = templates[language]?.[type];
    if (!template) {
      console.warn(`No email template found for ${type} in ${language}`);
      return false;
    }

    // Replace placeholders
    let subject = template.subject;
    let html = template.html;

    Object.keys(productData).forEach(key => {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), productData[key]);
      html = html.replace(new RegExp(placeholder, 'g'), productData[key]);
    });

    return await this.sendNotificationEmail({
      to,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    });
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration() {
    try {
      const testResult = await this.sendNotificationEmail({
        to: 'test@example.com',
        subject: 'CRM Email Test',
        text: 'This is a test email from CRM notification system.',
        html: '<h2>CRM Email Test</h2><p>This is a test email from CRM notification system.</p>'
      });

      return testResult;
    } catch (error) {
      console.error('Email test failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
