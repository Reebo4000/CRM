const notificationService = require('./notificationService');
const socketService = require('./socketService');
const { User } = require('../models');

/**
 * Notification Triggers
 * Handles all business logic triggers for notifications
 */
class NotificationTriggers {
  
  /**
   * ORDER NOTIFICATIONS
   */

  /**
   * Trigger when new order is created
   */
  async onOrderCreated(orderData, createdBy) {
    try {
      const customerName = orderData.customer
        ? `${orderData.customer.firstName} ${orderData.customer.lastName}`
        : 'Unknown Customer';

      await notificationService.createNotification({
        type: 'order_created',
        title: `New Order #${orderData.id}`,
        titleAr: `طلب جديد #${orderData.id}`,
        message: `New order placed by ${customerName} for ${orderData.totalAmount} EGP`,
        messageAr: `طلب جديد من ${customerName} بقيمة ${orderData.totalAmount} ج م`,
        priority: 'medium',
        createdBy,
        relatedEntityType: 'order',
        relatedEntityId: orderData.id,
        metadata: {
          orderId: orderData.id,
          customerName,
          totalAmount: orderData.totalAmount,
          status: orderData.status,
          orderDate: orderData.orderDate
        }
      });

      // Send real-time update
      socketService.sendOrderUpdate(orderData);

      console.log(`📦 Order created notification sent for order #${orderData.id}`);
    } catch (error) {
      console.error('Error sending order created notification:', error);
    }
  }

  /**
   * Trigger when order is updated (not just status change)
   */
  async onOrderUpdated(orderData, createdBy, changes = {}) {
    try {
      const customerName = orderData.customer
        ? `${orderData.customer.firstName} ${orderData.customer.lastName}`
        : 'Unknown Customer';

      // Build change summary for the message
      const changesList = [];
      if (changes.customer) {
        changesList.push(`customer changed to ${changes.customer}`);
      }
      if (changes.items) {
        changesList.push('order items modified');
      }
      if (changes.notes) {
        changesList.push('notes updated');
      }
      if (changes.totalAmount) {
        changesList.push(`total amount changed to ${changes.totalAmount} EGP`);
      }

      const changesText = changesList.length > 0
        ? ` (${changesList.join(', ')})`
        : '';

      await notificationService.createNotification({
        type: 'order_updated',
        title: `Order #${orderData.id} Updated`,
        titleAr: `تم تحديث الطلب #${orderData.id}`,
        message: `Order #${orderData.id} has been updated${changesText}`,
        messageAr: `تم تحديث الطلب #${orderData.id}${changesText}`,
        priority: 'medium',
        createdBy,
        relatedEntityType: 'order',
        relatedEntityId: orderData.id,
        metadata: {
          orderId: orderData.id,
          customerName,
          totalAmount: orderData.totalAmount,
          status: orderData.status,
          changes,
          updateTime: new Date().toISOString()
        }
      });

      // Send real-time update
      socketService.sendOrderUpdate(orderData);

      console.log(`📝 Order updated notification sent for order #${orderData.id}`);
    } catch (error) {
      console.error('Error sending order updated notification:', error);
    }
  }

  /**
   * Trigger when order status changes
   */
  async onOrderStatusChanged(orderData, oldStatus, newStatus, createdBy) {
    try {
      const customerName = orderData.customer 
        ? `${orderData.customer.firstName} ${orderData.customer.lastName}`
        : 'Unknown Customer';

      const statusMessages = {
        en: {
          pending: 'pending',
          processing: 'processing',
          shipped: 'shipped',
          delivered: 'delivered',
          completed: 'completed',
          cancelled: 'cancelled'
        },
        ar: {
          pending: 'في الانتظار',
          processing: 'قيد المعالجة',
          shipped: 'تم الشحن',
          delivered: 'تم التسليم',
          completed: 'مكتمل',
          cancelled: 'ملغي'
        }
      };

      await notificationService.createNotification({
        type: 'order_status_changed',
        title: `Order #${orderData.id} Status Updated`,
        titleAr: `تم تحديث حالة الطلب #${orderData.id}`,
        message: `Order #${orderData.id} status changed from ${statusMessages.en[oldStatus]} to ${statusMessages.en[newStatus]}`,
        messageAr: `تم تغيير حالة الطلب #${orderData.id} من ${statusMessages.ar[oldStatus]} إلى ${statusMessages.ar[newStatus]}`,
        priority: newStatus === 'cancelled' ? 'high' : 'medium',
        relatedEntityType: 'order',
        relatedEntityId: orderData.id,
        createdBy,
        metadata: {
          orderId: orderData.id,
          customerName,
          oldStatus,
          newStatus,
          totalAmount: orderData.totalAmount
        }
      });

      // Send real-time update
      socketService.sendOrderUpdate(orderData);

      console.log(`📦 Order status change notification sent for order #${orderData.id}: ${oldStatus} → ${newStatus}`);
    } catch (error) {
      console.error('Error sending order status change notification:', error);
    }
  }

  /**
   * Trigger for high-value orders
   */
  async onHighValueOrder(orderData, createdBy) {
    try {
      const customerName = orderData.customer
        ? `${orderData.customer.firstName} ${orderData.customer.lastName}`
        : 'Unknown Customer';

      // Let the notification service handle threshold checking based on user preferences
      await notificationService.createNotification({
        type: 'order_high_value',
        title: `High-Value Order Alert #${orderData.id}`,
        titleAr: `تنبيه طلب عالي القيمة #${orderData.id}`,
        message: `High-value order (${orderData.totalAmount} EGP) placed by ${customerName}`,
        messageAr: `طلب عالي القيمة (${orderData.totalAmount} ج م) من ${customerName}`,
        priority: 'high',
        relatedEntityType: 'order',
        relatedEntityId: orderData.id,
        createdBy,
        metadata: {
          orderId: orderData.id,
          customerName,
          totalAmount: orderData.totalAmount,
          amount: orderData.totalAmount // For threshold checking
        }
      });

      console.log(`💰 High-value order notification triggered for order #${orderData.id} (${orderData.totalAmount} EGP)`);
    } catch (error) {
      console.error('Error sending high-value order notification:', error);
    }
  }

  /**
   * Trigger for failed order processing
   */
  async onOrderFailed(orderData, errorMessage, createdBy = null) {
    try {
      const customerName = orderData.customer 
        ? `${orderData.customer.firstName} ${orderData.customer.lastName}`
        : 'Unknown Customer';

      await notificationService.createNotification({
        type: 'order_failed',
        title: `Order Processing Failed #${orderData.id}`,
        titleAr: `فشل في معالجة الطلب #${orderData.id}`,
        message: `Order #${orderData.id} processing failed: ${errorMessage}`,
        messageAr: `فشل في معالجة الطلب #${orderData.id}: ${errorMessage}`,
        priority: 'critical',
        createdBy,
        relatedEntityType: 'order',
        relatedEntityId: orderData.id,
        metadata: {
          orderId: orderData.id,
          customerName,
          errorMessage,
          totalAmount: orderData.totalAmount
        }
      });

      console.log(`❌ Order failed notification sent for order #${orderData.id}`);
    } catch (error) {
      console.error('Error sending order failed notification:', error);
    }
  }

  /**
   * INVENTORY NOTIFICATIONS
   */

  /**
   * Smart stock notification trigger that determines the appropriate notification type
   * based on stock levels and dynamic user thresholds
   */
  async onStockLevelChange(productData, createdBy) {
    try {
      const stockQuantity = productData.stockQuantity;
      const { User } = require('../models');

      console.log(`📊 Checking stock levels for ${productData.name}: ${stockQuantity} units`);

      // Get all users to determine the most restrictive thresholds
      const users = await User.findAll({
        where: { role: ['admin', 'staff'] }
      });

      // Collect all user thresholds to determine the highest thresholds to check against
      let maxLowThreshold = 0;
      let maxMediumThreshold = 0;

      // Import notification service for dynamic threshold loading
      const notificationService = require('./notificationService');

      for (const user of users) {
        const lowStockPrefs = await notificationService.getUserPreferences(user.id, 'stock_low');
        const mediumStockPrefs = await notificationService.getUserPreferences(user.id, 'stock_medium');

        const lowThreshold = lowStockPrefs.threshold?.quantity || 5;
        const mediumThreshold = mediumStockPrefs.threshold?.quantity || 10;

        maxLowThreshold = Math.max(maxLowThreshold, lowThreshold);
        maxMediumThreshold = Math.max(maxMediumThreshold, mediumThreshold);
      }

      console.log(`🎯 Dynamic thresholds determined: maxLow=${maxLowThreshold}, maxMedium=${maxMediumThreshold}`);

      // Determine which notification type(s) to send based on stock level and dynamic thresholds
      if (stockQuantity <= 0) {
        // Out of stock - highest priority
        console.log(`🚨 Triggering OUT OF STOCK notification (stock: ${stockQuantity})`);
        await this.onOutOfStock(productData, createdBy);
      } else if (stockQuantity <= maxLowThreshold) {
        // Low stock - send low stock notification
        console.log(`🔴 Triggering LOW STOCK notification (stock: ${stockQuantity} <= threshold: ${maxLowThreshold})`);
        await this.onLowStock(productData, createdBy);
      } else if (stockQuantity <= maxMediumThreshold) {
        // Medium stock - send medium stock notification
        console.log(`🟡 Triggering MEDIUM STOCK notification (stock: ${stockQuantity} <= threshold: ${maxMediumThreshold})`);
        await this.onMediumStock(productData, createdBy);
      } else {
        console.log(`✅ Stock level ${stockQuantity} for ${productData.name} is above all thresholds - no notification needed`);
      }
    } catch (error) {
      console.error('Error in smart stock notification trigger:', error);
    }
  }

  /**
   * Trigger for low stock alert
   */
  async onLowStock(productData, createdBy) {
    try {
      // Let the notification service handle threshold checking based on user preferences
      await notificationService.createNotification({
        type: 'stock_low',
        title: `Low Stock Alert: ${productData.name}`,
        titleAr: `تنبيه مخزون منخفض: ${productData.name}`,
        message: `${productData.name} is running low on stock (${productData.stockQuantity} units remaining)`,
        messageAr: `${productData.name} ينخفض مخزونه (${productData.stockQuantity} وحدة متبقية)`,
        priority: 'medium',
        relatedEntityType: 'product',
        relatedEntityId: productData.id,
        createdBy,
        metadata: {
          productId: productData.id,
          productName: productData.name,
          stockQuantity: productData.stockQuantity, // For threshold checking
          quantity: productData.stockQuantity, // Alternative field name for threshold checking
          currentStock: productData.stockQuantity,
          category: productData.category
        }
      });

      // Send real-time update
      socketService.sendInventoryUpdate(productData, 'low');

      console.log(`📦 Low stock notification triggered for product: ${productData.name} (${productData.stockQuantity} units)`);
    } catch (error) {
      console.error('Error sending low stock notification:', error);
    }
  }

  /**
   * Trigger for medium stock warning
   */
  async onMediumStock(productData, createdBy) {
    try {
      // Let the notification service handle threshold checking based on user preferences
      await notificationService.createNotification({
        type: 'stock_medium',
        title: `Medium Stock Warning: ${productData.name}`,
        titleAr: `تحذير مخزون متوسط: ${productData.name}`,
        message: `${productData.name} stock is getting low (${productData.stockQuantity} units remaining)`,
        messageAr: `مخزون ${productData.name} ينخفض (${productData.stockQuantity} وحدة متبقية)`,
        priority: 'low',
        relatedEntityType: 'product',
        relatedEntityId: productData.id,
        createdBy,
        metadata: {
          productId: productData.id,
          productName: productData.name,
          stockQuantity: productData.stockQuantity, // For threshold checking
          quantity: productData.stockQuantity, // Alternative field name for threshold checking
          currentStock: productData.stockQuantity,
          category: productData.category
        }
      });

      // Send real-time update
      socketService.sendInventoryUpdate(productData, 'medium');

      console.log(`📦 Medium stock notification triggered for product: ${productData.name} (${productData.stockQuantity} units)`);
    } catch (error) {
      console.error('Error sending medium stock notification:', error);
    }
  }

  /**
   * Trigger for out of stock alert
   */
  async onOutOfStock(productData, createdBy) {
    try {
      if (productData.stockQuantity <= 0) {
        await notificationService.createNotification({
          type: 'stock_out',
          title: `Out of Stock: ${productData.name}`,
          titleAr: `نفد من المخزون: ${productData.name}`,
          message: `${productData.name} is now out of stock! Immediate restocking required.`,
          messageAr: `${productData.name} نفد من المخزون! مطلوب إعادة تخزين فورية.`,
          priority: 'critical',
          relatedEntityType: 'product',
          relatedEntityId: productData.id,
          createdBy,
          metadata: {
            productId: productData.id,
            productName: productData.name,
            stockQuantity: productData.stockQuantity,
            category: productData.category,
            lastStockUpdate: new Date().toISOString()
          }
        });

        // Send real-time update
        socketService.sendInventoryUpdate(productData, 'out');

        console.log(`🚨 Out of stock notification sent for product: ${productData.name}`);
      }
    } catch (error) {
      console.error('Error sending out of stock notification:', error);
    }
  }

  /**
   * Trigger for restock recommendation
   */
  async onRestockRecommendation(productData, salesData = {}, createdBy = null) {
    try {
      const { averageSales = 0, daysUntilEmpty = 0, recommendedQuantity = 0 } = salesData;

      await notificationService.createNotification({
        type: 'restock_recommendation',
        title: `Restock Recommendation: ${productData.name}`,
        titleAr: `توصية إعادة التخزين: ${productData.name}`,
        message: `Based on sales trends, ${productData.name} should be restocked. Current: ${productData.stockQuantity}, Recommended: ${recommendedQuantity}`,
        messageAr: `بناءً على اتجاهات المبيعات، يجب إعادة تخزين ${productData.name}. الحالي: ${productData.stockQuantity}، الموصى به: ${recommendedQuantity}`,
        priority: 'medium',
        createdBy,
        relatedEntityType: 'product',
        relatedEntityId: productData.id,
        metadata: {
          productId: productData.id,
          productName: productData.name,
          currentStock: productData.stockQuantity,
          recommendedQuantity,
          averageSales,
          daysUntilEmpty,
          category: productData.category,
          analysisDate: new Date().toISOString()
        }
      });

      // Send real-time update
      socketService.sendInventoryUpdate(productData, 'restock');

      console.log(`📈 Restock recommendation sent for product: ${productData.name} (Recommended: ${recommendedQuantity})`);
    } catch (error) {
      console.error('Error sending restock recommendation:', error);
    }
  }

  /**
   * Trigger for bulk inventory analysis
   */
  async onInventoryAnalysis(inventoryData, createdBy = null) {
    try {
      const { lowStockCount, outOfStockCount, totalProducts, criticalProducts } = inventoryData;

      if (lowStockCount > 0 || outOfStockCount > 0) {
        await notificationService.createNotification({
          type: 'inventory_analysis',
          title: `Inventory Analysis Report`,
          titleAr: `تقرير تحليل المخزون`,
          message: `Inventory analysis complete: ${outOfStockCount} out of stock, ${lowStockCount} low stock out of ${totalProducts} products`,
          messageAr: `تم تحليل المخزون: ${outOfStockCount} نفد من المخزون، ${lowStockCount} مخزون منخفض من أصل ${totalProducts} منتج`,
          priority: outOfStockCount > 0 ? 'high' : 'medium',
          createdBy,
          relatedEntityType: 'inventory',
          metadata: {
            lowStockCount,
            outOfStockCount,
            totalProducts,
            criticalProducts: criticalProducts || [],
            analysisDate: new Date().toISOString()
          }
        });

        console.log(`📊 Inventory analysis notification sent: ${outOfStockCount} out of stock, ${lowStockCount} low stock`);
      }
    } catch (error) {
      console.error('Error sending inventory analysis notification:', error);
    }
  }

  /**
   * CUSTOMER NOTIFICATIONS
   */

  /**
   * Trigger for new customer created during order processing
   */
  async onCustomerCreatedDuringOrder(customerData, orderId, createdBy) {
    try {
      const customerName = `${customerData.firstName} ${customerData.lastName}`;

      await notificationService.createNotification({
        type: 'customer_registered',
        title: `New Customer Created`,
        titleAr: `تم إنشاء عميل جديد`,
        message: `New customer ${customerName} was created during order #${orderId} processing`,
        messageAr: `تم إنشاء عميل جديد ${customerName} أثناء معالجة الطلب #${orderId}`,
        priority: 'low',
        createdBy,
        relatedEntityType: 'customer',
        relatedEntityId: customerData.id,
        metadata: {
          customerId: customerData.id,
          customerName,
          email: customerData.email,
          phone: customerData.phone,
          createdDuringOrderId: orderId,
          creationContext: 'order_processing'
        }
      });

      // Send real-time update
      socketService.sendCustomerUpdate(customerData);

      console.log(`👤 New customer notification sent for ${customerName} (created during order #${orderId})`);
    } catch (error) {
      console.error('Error sending new customer notification:', error);
    }
  }

  /**
   * Trigger for new customer registration
   */
  async onCustomerRegistered(customerData, createdBy = null) {
    try {
      const customerName = `${customerData.firstName} ${customerData.lastName}`;

      await notificationService.createNotification({
        type: 'customer_registered',
        title: `New Customer Registered`,
        titleAr: `عميل جديد مسجل`,
        message: `New customer ${customerName} has registered`,
        messageAr: `عميل جديد ${customerName} قام بالتسجيل`,
        priority: 'low',
        createdBy,
        relatedEntityType: 'customer',
        relatedEntityId: customerData.id,
        metadata: {
          customerId: customerData.id,
          customerName,
          email: customerData.email,
          phone: customerData.phone
        }
      });

      // Send real-time update
      socketService.sendCustomerRegistration(customerData);

      console.log(`👤 Customer registration notification sent for: ${customerName}`);
    } catch (error) {
      console.error('Error sending customer registration notification:', error);
    }
  }

  /**
   * Trigger for VIP customer activity
   */
  async onVIPCustomerActivity(customerData, activityType, metadata = {}, createdBy = null) {
    try {
      const customerName = `${customerData.firstName} ${customerData.lastName}`;

      const activityMessages = {
        order: {
          en: `VIP customer ${customerName} placed a new order`,
          ar: `العميل المميز ${customerName} قام بوضع طلب جديد`
        },
        large_purchase: {
          en: `VIP customer ${customerName} made a large purchase (${metadata.amount} EGP)`,
          ar: `العميل المميز ${customerName} قام بشراء كبير (${metadata.amount} ج م)`
        },
        complaint: {
          en: `VIP customer ${customerName} submitted a complaint`,
          ar: `العميل المميز ${customerName} قدم شكوى`
        }
      };

      await notificationService.createNotification({
        type: 'vip_customer_activity',
        title: `VIP Customer Activity`,
        titleAr: `نشاط عميل مميز`,
        message: activityMessages[activityType]?.en || `VIP customer ${customerName} activity: ${activityType}`,
        messageAr: activityMessages[activityType]?.ar || `نشاط العميل المميز ${customerName}: ${activityType}`,
        priority: 'high',
        createdBy,
        relatedEntityType: 'customer',
        relatedEntityId: customerData.id,
        metadata: {
          customerId: customerData.id,
          customerName,
          activityType,
          ...metadata
        }
      });

      console.log(`⭐ VIP customer activity notification sent for: ${customerName} (${activityType})`);
    } catch (error) {
      console.error('Error sending VIP customer activity notification:', error);
    }
  }

  /**
   * Trigger for payment failures
   */
  async onPaymentFailed(orderData, paymentError, createdBy = null) {
    try {
      const customerName = orderData.customer
        ? `${orderData.customer.firstName} ${orderData.customer.lastName}`
        : 'Unknown Customer';

      await notificationService.createNotification({
        type: 'payment_failed',
        title: `Payment Failed for Order #${orderData.id}`,
        titleAr: `فشل الدفع للطلب #${orderData.id}`,
        message: `Payment failed for order #${orderData.id} (${orderData.totalAmount} EGP) - ${paymentError}`,
        messageAr: `فشل الدفع للطلب #${orderData.id} (${orderData.totalAmount} ج م) - ${paymentError}`,
        priority: 'high',
        createdBy,
        relatedEntityType: 'order',
        relatedEntityId: orderData.id,
        metadata: {
          orderId: orderData.id,
          customerName,
          totalAmount: orderData.totalAmount,
          paymentError,
          failureTime: new Date().toISOString()
        }
      });

      console.log(`💳 Payment failed notification sent for order #${orderData.id}`);
    } catch (error) {
      console.error('Error sending payment failed notification:', error);
    }
  }

  /**
   * Trigger for suspicious activity
   */
  async onSuspiciousActivity(activityData, createdBy = null) {
    try {
      const { type, description, severity, metadata } = activityData;

      await notificationService.createNotification({
        type: 'suspicious_activity',
        title: `Suspicious Activity Detected`,
        titleAr: `تم اكتشاف نشاط مشبوه`,
        message: `Suspicious activity detected: ${description}`,
        messageAr: `تم اكتشاف نشاط مشبوه: ${description}`,
        priority: severity === 'critical' ? 'critical' : 'high',
        createdBy,
        relatedEntityType: 'security',
        metadata: {
          activityType: type,
          description,
          severity,
          detectionTime: new Date().toISOString(),
          ...metadata
        }
      });

      // Broadcast to admin users only
      socketService.broadcastSecurityAlert(activityData);

      console.log(`🔒 Suspicious activity notification sent: ${description}`);
    } catch (error) {
      console.error('Error sending suspicious activity notification:', error);
    }
  }

  /**
   * SYSTEM NOTIFICATIONS
   */

  /**
   * Trigger for system alerts
   */
  async onSystemAlert(message, messageAr, priority = 'high', createdBy = null) {
    try {
      await notificationService.createNotification({
        type: 'system_alert',
        title: 'System Alert',
        titleAr: 'تنبيه النظام',
        message,
        messageAr,
        priority,
        createdBy,
        relatedEntityType: 'system',
        metadata: {
          alertTime: new Date().toISOString()
        }
      });

      // Broadcast to all connected users
      socketService.broadcastSystemAnnouncement(message, priority);

      console.log(`🚨 System alert notification sent: ${message}`);
    } catch (error) {
      console.error('Error sending system alert notification:', error);
    }
  }

  /**
   * Trigger for maintenance notices
   */
  async onMaintenanceNotice(message, messageAr, scheduledTime, createdBy = null) {
    try {
      await notificationService.createNotification({
        type: 'maintenance_notice',
        title: 'Maintenance Notice',
        titleAr: 'إشعار صيانة',
        message,
        messageAr,
        priority: 'medium',
        createdBy,
        relatedEntityType: 'system',
        metadata: {
          scheduledTime,
          noticeTime: new Date().toISOString()
        }
      });

      // Send maintenance notice to all users
      socketService.sendMaintenanceNotice(message, scheduledTime);

      console.log(`🔧 Maintenance notice sent: ${message}`);
    } catch (error) {
      console.error('Error sending maintenance notice:', error);
    }
  }
}

module.exports = new NotificationTriggers();
