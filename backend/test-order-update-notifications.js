const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testOrderUpdateNotifications() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'reebo20004@gmail.com',
      password: 'Reebo@2004'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get available products
    console.log('\n📦 Getting available products...');
    const productsResponse = await axios.get(`${API_BASE}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const availableProduct = productsResponse.data.products.find(p => p.stockQuantity > 0);
    if (!availableProduct) {
      console.log('❌ No products with stock available');
      return;
    }
    
    console.log(`✅ Found product: ${availableProduct.name} (ID: ${availableProduct.id}) - Stock: ${availableProduct.stockQuantity}`);

    // Get existing customers
    console.log('\n👤 Getting existing customers...');
    const customersResponse = await axios.get(`${API_BASE}/customers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const existingCustomer = customersResponse.data.customers[0];
    if (!existingCustomer) {
      console.log('❌ No existing customers found');
      return;
    }
    
    console.log(`✅ Found customer: ${existingCustomer.firstName} ${existingCustomer.lastName} (ID: ${existingCustomer.id})`);

    // Create an order first
    console.log('\n🆕 Creating initial order...');
    const initialOrderData = {
      customerId: existingCustomer.id,
      orderItems: [{
        productId: availableProduct.id,
        quantity: 1,
        unitPrice: availableProduct.price
      }],
      notes: 'Initial test order'
    };

    const orderResponse = await axios.post(`${API_BASE}/orders`, initialOrderData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const orderId = orderResponse.data.order.id;
    console.log(`✅ Order created successfully! Order ID: ${orderId}`);

    // Wait a moment for notifications to process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 1: Update order with existing customer
    console.log('\n📝 Test 1: Updating order with existing customer...');
    const updateData1 = {
      customerId: existingCustomer.id,
      orderItems: [{
        productId: availableProduct.id,
        quantity: 2, // Changed quantity
        unitPrice: availableProduct.price
      }],
      notes: 'Updated test order - quantity changed'
    };

    const updateResponse1 = await axios.put(`${API_BASE}/orders/${orderId}`, updateData1, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order updated successfully (Test 1)');
    console.log(`📋 Updated order total: ${updateResponse1.data.order.totalAmount}`);

    // Wait a moment for notifications to process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Update order with new customer creation
    console.log('\n📝 Test 2: Updating order with new customer creation...');
    const updateData2 = {
      customerInfo: {
        name: 'New Test Customer ' + Date.now()
      },
      orderItems: [{
        productId: availableProduct.id,
        quantity: 1,
        unitPrice: availableProduct.price
      }],
      notes: 'Updated test order - new customer created'
    };

    const updateResponse2 = await axios.put(`${API_BASE}/orders/${orderId}`, updateData2, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order updated successfully (Test 2)');
    console.log(`📋 New customer created: ${updateResponse2.data.order.customer.firstName} ${updateResponse2.data.order.customer.lastName}`);

    // Check notifications
    console.log('\n🔔 Checking notifications...');
    const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const orderNotifications = notificationsResponse.data.notifications.filter(n => 
      n.relatedEntityType === 'order' && n.relatedEntityId === orderId
    );

    console.log(`📊 Found ${orderNotifications.length} notifications for this order:`);
    orderNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.type}: ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
      console.log(`     Priority: ${notification.priority}`);
      console.log(`     Created: ${new Date(notification.createdAt).toLocaleString()}`);
      console.log('');
    });

    console.log('\n🎉 Order update notification test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('📝 Validation details:', error.response.data.details);
    }
  }
}

testOrderUpdateNotifications();
