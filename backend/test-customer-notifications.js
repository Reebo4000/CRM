const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testCustomerNotifications() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'reebo20004@gmail.com',
      password: 'Reebo@2004'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Check all notifications for customer-related ones
    console.log('\n🔔 Checking all customer notifications...');
    const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const customerNotifications = notificationsResponse.data.notifications.filter(n => 
      n.relatedEntityType === 'customer' || n.type === 'customer_registered'
    );

    console.log(`📊 Found ${customerNotifications.length} customer-related notifications:`);
    customerNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.type}: ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
      console.log(`     Priority: ${notification.priority}`);
      console.log(`     Related Entity: ${notification.relatedEntityType} (ID: ${notification.relatedEntityId})`);
      if (notification.metadata) {
        console.log(`     Metadata:`, JSON.stringify(notification.metadata, null, 6));
      }
      console.log(`     Created: ${new Date(notification.createdAt).toLocaleString()}`);
      console.log('');
    });

    console.log('\n🎉 Customer notification check completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCustomerNotifications();
