const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testCustomerNotification() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'reebo20004@gmail.com',
      password: 'Reebo@2004'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get a product with stock
    const productsResponse = await axios.get(`${API_BASE}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const product = productsResponse.data.products.find(p => p.stockQuantity > 0);
    if (!product) {
      console.log('❌ No products with stock available');
      return;
    }
    console.log(`📦 Using product: ${product.name} (ID: ${product.id}) - Stock: ${product.stockQuantity}`);

    // Create order with new customer
    console.log('\n🆕 Creating order with new customer...');
    const orderData = {
      customerInfo: {
        name: 'Debug Customer ' + Date.now()
      },
      orderItems: [{
        productId: product.id,
        quantity: 1,
        unitPrice: product.price
      }],
      notes: 'Debug test order'
    };

    console.log('📤 Sending order data...');
    const orderResponse = await axios.post(`${API_BASE}/orders`, orderData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Order created: #${orderResponse.data.order.id}`);
    console.log(`✅ Customer created: ${orderResponse.data.order.customer.firstName} ${orderResponse.data.order.customer.lastName} (ID: ${orderResponse.data.order.customer.id})`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check notifications
    console.log('\n🔔 Checking notifications...');
    const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const notifications = notificationsResponse.data.notifications;
    const customerNotifications = notifications.filter(n => n.type === 'customer_registered');
    
    console.log(`📊 Total customer notifications: ${customerNotifications.length}`);
    
    // Show the most recent customer notification
    if (customerNotifications.length > 0) {
      const latest = customerNotifications[0];
      console.log(`📋 Latest customer notification:`);
      console.log(`   Title: ${latest.title}`);
      console.log(`   Message: ${latest.message}`);
      console.log(`   Created: ${new Date(latest.createdAt).toLocaleString()}`);
      console.log(`   Related Customer ID: ${latest.relatedEntityId}`);
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('📝 Validation details:', error.response.data.details);
    }
  }
}

testCustomerNotification();
