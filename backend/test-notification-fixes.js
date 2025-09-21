const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testNotificationFixes() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'reebo20004@gmail.com',
      password: 'Reebo@2004'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get available products with low stock
    console.log('\n📦 Getting products...');
    const productsResponse = await axios.get(`${API_BASE}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const products = productsResponse.data.products;
    console.log(`Found ${products.length} products`);
    
    // Find products with different stock levels
    const lowStockProduct = products.find(p => p.stockQuantity > 0 && p.stockQuantity <= 5);
    const mediumStockProduct = products.find(p => p.stockQuantity > 5 && p.stockQuantity <= 10);
    const highStockProduct = products.find(p => p.stockQuantity > 10);
    
    console.log('Stock levels found:');
    if (lowStockProduct) console.log(`  Low stock: ${lowStockProduct.name} (${lowStockProduct.stockQuantity} units)`);
    if (mediumStockProduct) console.log(`  Medium stock: ${mediumStockProduct.name} (${mediumStockProduct.stockQuantity} units)`);
    if (highStockProduct) console.log(`  High stock: ${highStockProduct.name} (${highStockProduct.stockQuantity} units)`);

    // Test 1: Create order with new customer to trigger customer notification
    console.log('\n🆕 Test 1: Creating order with new customer...');
    const orderData = {
      customerInfo: {
        name: 'Test Customer ' + Date.now()
      },
      orderItems: [{
        productId: highStockProduct ? highStockProduct.id : products[0].id,
        quantity: 1,
        unitPrice: highStockProduct ? highStockProduct.price : products[0].price
      }],
      notes: 'Test order for customer notification'
    };

    const orderResponse = await axios.post(`${API_BASE}/orders`, orderData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Order created: #${orderResponse.data.order.id}`);
    console.log(`✅ New customer created: ${orderResponse.data.order.customer.firstName} ${orderResponse.data.order.customer.lastName}`);

    // Wait for notifications to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Create order that will trigger stock notifications
    if (lowStockProduct) {
      console.log('\n📦 Test 2: Creating order to trigger stock notifications...');
      const stockTestOrder = {
        customerInfo: {
          name: 'Stock Test Customer ' + Date.now()
        },
        orderItems: [{
          productId: lowStockProduct.id,
          quantity: Math.min(lowStockProduct.stockQuantity, 2), // Don't exceed available stock
          unitPrice: lowStockProduct.price
        }],
        notes: 'Test order for stock notifications'
      };

      const stockOrderResponse = await axios.post(`${API_BASE}/orders`, stockTestOrder, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Stock test order created: #${stockOrderResponse.data.order.id}`);
    }

    // Wait for notifications to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check notifications
    console.log('\n🔔 Checking notifications...');
    const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const notifications = notificationsResponse.data.notifications;
    console.log(`📊 Found ${notifications.length} total notifications`);

    // Filter recent notifications (last 5 minutes)
    const recentTime = new Date(Date.now() - 5 * 60 * 1000);
    const recentNotifications = notifications.filter(n => new Date(n.createdAt) > recentTime);

    console.log(`📊 Found ${recentNotifications.length} recent notifications:`);

    // Also check all customer notifications to debug
    const allCustomerNotifications = notifications.filter(n => n.type === 'customer_registered');
    console.log(`📊 Found ${allCustomerNotifications.length} total customer notifications`);

    const customerNotifications = recentNotifications.filter(n => n.type === 'customer_registered');
    const stockNotifications = recentNotifications.filter(n => n.type.startsWith('stock_'));
    const orderNotifications = recentNotifications.filter(n => n.type.startsWith('order_'));

    console.log('\n👤 Customer Notifications:');
    customerNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
      console.log(`     Priority: ${notification.priority}`);
      console.log(`     Created: ${new Date(notification.createdAt).toLocaleString()}`);
      console.log('');
    });

    console.log('📦 Stock Notifications:');
    stockNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.type}: ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
      console.log(`     Priority: ${notification.priority}`);
      console.log(`     Created: ${new Date(notification.createdAt).toLocaleString()}`);
      console.log('');
    });

    console.log('📋 Order Notifications:');
    orderNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.type}: ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
      console.log(`     Priority: ${notification.priority}`);
      console.log(`     Created: ${new Date(notification.createdAt).toLocaleString()}`);
      console.log('');
    });

    // Summary
    console.log('\n📈 Test Summary:');
    console.log(`✅ Customer notifications: ${customerNotifications.length > 0 ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`✅ Stock notifications: ${stockNotifications.length > 0 ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`✅ Order notifications: ${orderNotifications.length > 0 ? 'WORKING' : 'NOT WORKING'}`);

    console.log('\n🎉 Notification test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('📝 Validation details:', error.response.data.details);
    }
  }
}

testNotificationFixes();
