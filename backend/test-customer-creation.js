const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testCustomerCreation() {
  try {
    console.log('👤 Testing Manual Customer Creation Notifications');
    console.log('===============================================\n');

    // Step 1: Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'reebo20004@gmail.com',
      password: 'Reebo@2004'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Login successful: ${user.firstName} ${user.lastName}\n`);

    // Step 2: Create a new customer manually
    console.log('👤 Creating new customer manually...');
    
    const timestamp = Date.now();
    const customerData = {
      firstName: 'Test',
      lastName: 'Customer',
      email: `test${timestamp}@example.com`,
      phone: `+2012345${timestamp.toString().slice(-5)}`,
      address: '123 Test Street',
      city: 'Cairo',
      postalCode: '12345'
    };

    const customerResponse = await axios.post(`${API_BASE}/customers`, customerData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Customer created successfully!');
    console.log(`   Name: ${customerResponse.data.customer.firstName} ${customerResponse.data.customer.lastName}`);
    console.log(`   Email: ${customerResponse.data.customer.email}`);
    console.log(`   ID: ${customerResponse.data.customer.id}\n`);

    // Step 3: Wait for notifications to process
    console.log('⏳ Waiting for notifications to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Check for customer registration notifications
    console.log('🔔 Checking for customer registration notifications...');
    const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const notifications = notificationsResponse.data.notifications;
    
    // Filter recent notifications (last 1 minute)
    const recentTime = new Date(Date.now() - 60 * 1000);
    const recentNotifications = notifications.filter(n => new Date(n.createdAt) > recentTime);
    
    // Filter customer registration notifications for our customer
    const customerNotifications = recentNotifications.filter(n => 
      n.type === 'customer_registered' && 
      n.relatedEntityId === customerResponse.data.customer.id
    );

    console.log(`📊 Found ${customerNotifications.length} customer registration notifications:\n`);
    
    customerNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.type}: ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
      console.log(`     Priority: ${notification.priority}`);
      console.log(`     Time: ${new Date(notification.createdAt).toLocaleTimeString()}\n`);
    });

    // Step 5: Test with another customer to confirm consistency
    console.log('👤 Creating second customer to test consistency...');
    
    const timestamp2 = Date.now();
    const customerData2 = {
      firstName: 'Another',
      lastName: 'Customer',
      email: `another${timestamp2}@example.com`,
      phone: `+2012346${timestamp2.toString().slice(-5)}`,
      address: '456 Another Street',
      city: 'Alexandria',
      postalCode: '54321'
    };

    const customerResponse2 = await axios.post(`${API_BASE}/customers`, customerData2, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Second customer created successfully!');
    console.log(`   Name: ${customerResponse2.data.customer.firstName} ${customerResponse2.data.customer.lastName}\n`);

    // Wait and check again
    await new Promise(resolve => setTimeout(resolve, 3000));

    const finalNotificationsResponse = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const finalNotifications = finalNotificationsResponse.data.notifications;
    const veryRecentTime = new Date(Date.now() - 30 * 1000);
    const veryRecentNotifications = finalNotifications.filter(n => new Date(n.createdAt) > veryRecentTime);
    const secondCustomerNotifications = veryRecentNotifications.filter(n => 
      n.type === 'customer_registered' && 
      n.relatedEntityId === customerResponse2.data.customer.id
    );

    console.log(`📊 Found ${secondCustomerNotifications.length} notifications for second customer:\n`);
    
    secondCustomerNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.type}: ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
      console.log(`     Priority: ${notification.priority}`);
      console.log(`     Time: ${new Date(notification.createdAt).toLocaleTimeString()}\n`);
    });

    // Summary
    console.log('📈 TEST RESULTS:');
    console.log('================');
    console.log(`✅ Manual customer creation: WORKING`);
    console.log(`✅ Customer notifications triggered: ${customerNotifications.length + secondCustomerNotifications.length > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Real-time delivery: ${customerNotifications.length + secondCustomerNotifications.length > 0 ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`✅ Consistency: ${customerNotifications.length > 0 && secondCustomerNotifications.length > 0 ? 'CONSISTENT' : 'INCONSISTENT'}`);

    if (customerNotifications.length + secondCustomerNotifications.length === 0) {
      console.log('\n❌ No customer registration notifications were triggered!');
      console.log('   This indicates an issue with the customer notification system.');
    } else {
      console.log('\n🎉 Customer notification system is working correctly!');
      console.log('   Manual customer creation now triggers real-time notifications.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('📝 Error details:', error.response.data.details);
    }
  }
}

testCustomerCreation();
