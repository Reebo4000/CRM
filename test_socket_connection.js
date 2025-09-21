const axios = require('axios');

async function testSocketAndNotifications() {
  try {
    console.log('🧪 Testing Socket Connection and Notifications...\n');

    // 1. Login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // 2. Get current unread count
    console.log('\n2. Getting current unread count...');
    const unreadResponse = await axios.get('http://localhost:5000/api/notifications/unread-count', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('📊 Current unread count:', unreadResponse.data.count);

    // 3. Create a test broadcast notification
    console.log('\n3. Creating test broadcast notification...');
    const notificationResponse = await axios.post('http://localhost:5000/api/notifications/broadcast', {
      type: 'test_notification',
      title: 'Test Socket Notification',
      titleAr: 'إشعار اختبار المقبس',
      message: 'This is a test notification to verify socket connection',
      messageAr: 'هذا إشعار اختبار للتحقق من اتصال المقبس',
      priority: 'medium',
      isBroadcast: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Broadcast notification created:', notificationResponse.data.notification.title);
    console.log('📊 Recipients:', notificationResponse.data.recipientCount);

    // 4. Check unread count again
    console.log('\n4. Checking unread count after notification...');
    const newUnreadResponse = await axios.get('http://localhost:5000/api/notifications/unread-count', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('📊 New unread count:', newUnreadResponse.data.count);

    // 5. Get notifications list
    console.log('\n5. Getting notifications list...');
    const notificationsResponse = await axios.get('http://localhost:5000/api/notifications?page=1&limit=5', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 Recent notifications:');
    notificationsResponse.data.notifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.title} (${notif.isRead ? 'Read' : 'Unread'})`);
    });

    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 If the unread count increased, notifications are working.');
    console.log('💡 Check the frontend console for socket connection logs.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSocketAndNotifications();
