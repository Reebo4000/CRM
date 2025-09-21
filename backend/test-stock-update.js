const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testStockUpdate() {
  try {
    console.log('📦 Testing Manual Stock Update Notifications');
    console.log('===========================================\n');

    // Step 1: Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'reebo20004@gmail.com',
      password: 'Reebo@2004'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Login successful: ${user.firstName} ${user.lastName}\n`);

    // Step 2: Get products
    console.log('📋 Getting products...');
    const productsResponse = await axios.get(`${API_BASE}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Find "Mini Backpack Purse" or any product with stock > 10
    let targetProduct = productsResponse.data.products.find(p => p.name.includes('Mini Backpack Purse'));
    
    if (!targetProduct) {
      targetProduct = productsResponse.data.products.find(p => p.stockQuantity > 10);
    }
    
    if (!targetProduct) {
      console.log('❌ No suitable product found for testing');
      return;
    }

    console.log(`📦 Target product: ${targetProduct.name}`);
    console.log(`   Current stock: ${targetProduct.stockQuantity}`);
    console.log(`   Product ID: ${targetProduct.id}\n`);

    // Step 3: Update stock to trigger low stock alert (set to 6)
    console.log('🔧 Updating stock to 6 (should trigger medium stock alert)...');
    
    const stockUpdateData = {
      quantity: 6,
      operation: 'set',
      reason: 'Manual test - triggering stock notifications'
    };

    const updateResponse = await axios.put(`${API_BASE}/products/${targetProduct.id}/stock`, stockUpdateData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Stock updated successfully!');
    console.log(`   Previous stock: ${updateResponse.data.stockChange.previousStock}`);
    console.log(`   New stock: ${updateResponse.data.stockChange.newStock}`);
    console.log(`   Operation: ${updateResponse.data.stockChange.operation}\n`);

    // Step 4: Wait for notifications to process
    console.log('⏳ Waiting for notifications to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 5: Check for recent notifications
    console.log('🔔 Checking for stock notifications...');
    const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const notifications = notificationsResponse.data.notifications;
    
    // Filter recent notifications (last 1 minute)
    const recentTime = new Date(Date.now() - 60 * 1000);
    const recentNotifications = notifications.filter(n => new Date(n.createdAt) > recentTime);
    
    // Filter stock notifications for our product
    const stockNotifications = recentNotifications.filter(n => 
      n.type.startsWith('stock_') && 
      n.relatedEntityId === targetProduct.id
    );

    console.log(`📊 Found ${stockNotifications.length} recent stock notifications for ${targetProduct.name}:\n`);
    
    stockNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.type}: ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
      console.log(`     Priority: ${notification.priority}`);
      console.log(`     Time: ${new Date(notification.createdAt).toLocaleTimeString()}\n`);
    });

    // Step 6: Test with very low stock (set to 2)
    console.log('🔧 Updating stock to 2 (should trigger low stock alert)...');
    
    const lowStockData = {
      quantity: 2,
      operation: 'set',
      reason: 'Manual test - triggering low stock alert'
    };

    await axios.put(`${API_BASE}/products/${targetProduct.id}/stock`, lowStockData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Stock updated to 2');

    // Wait and check again
    await new Promise(resolve => setTimeout(resolve, 3000));

    const finalNotificationsResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const finalNotifications = finalNotificationsResponse.data.notifications;
    const veryRecentTime = new Date(Date.now() - 30 * 1000);
    const veryRecentNotifications = finalNotifications.filter(n => new Date(n.createdAt) > veryRecentTime);
    const finalStockNotifications = veryRecentNotifications.filter(n => 
      n.type.startsWith('stock_') && 
      n.relatedEntityId === targetProduct.id
    );

    console.log(`📊 Found ${finalStockNotifications.length} additional stock notifications:\n`);
    
    finalStockNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.type}: ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
      console.log(`     Priority: ${notification.priority}`);
      console.log(`     Time: ${new Date(notification.createdAt).toLocaleTimeString()}\n`);
    });

    // Summary
    console.log('📈 TEST RESULTS:');
    console.log('================');
    console.log(`✅ Manual stock updates: WORKING`);
    console.log(`✅ Stock notifications triggered: ${stockNotifications.length + finalStockNotifications.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Real-time delivery: ${stockNotifications.length + finalStockNotifications.length > 0 ? 'WORKING' : 'NOT WORKING'}`);

    if (stockNotifications.length + finalStockNotifications.length === 0) {
      console.log('\n❌ No stock notifications were triggered!');
      console.log('   This indicates an issue with the notification system.');
    } else {
      console.log('\n🎉 Stock notification system is working correctly!');
      console.log('   Manual stock updates now trigger real-time notifications.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('📝 Error details:', error.response.data.details);
    }
  }
}

testStockUpdate();
