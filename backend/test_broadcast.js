// Test script for broadcast notification system
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test credentials (try different admin users)
const testCredentials = [
  { email: 'admin@example.com', password: 'admin123' },
  { email: 'admin@geminicrm.com', password: 'admin123' },
  { email: 'admin@test.com', password: 'password' },
  { email: 'test@example.com', password: 'password' },
  { email: 'mohamed@example.com', password: 'password' },
  { email: 'user@example.com', password: 'password' }
];

async function testBroadcastNotifications() {
  try {
    console.log('🧪 Testing Broadcast Notification System...\n');

    // 1. Login to get auth token
    console.log('1. Trying to login as admin...');
    let token = null;
    let loginSuccess = false;

    for (const credentials of testCredentials) {
      try {
        console.log(`   Trying ${credentials.email}...`);
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, credentials);
        token = loginResponse.data.token;
        console.log(`✅ Login successful with ${credentials.email}\n`);
        loginSuccess = true;
        break;
      } catch (error) {
        console.log(`   ❌ Failed with ${credentials.email}`);
      }
    }

    if (!loginSuccess) {
      console.log('❌ Could not login with any test credentials');
      console.log('💡 Please check the frontend to see existing users or create an admin user');
      return;
    }

    // 2. Create a broadcast notification
    console.log('2. Creating broadcast notification...');
    const broadcastData = {
      type: 'system_alert',
      title: 'System Maintenance Notice',
      titleAr: 'إشعار صيانة النظام',
      message: 'The system will undergo maintenance tonight from 2 AM to 4 AM. Please save your work.',
      messageAr: 'سيخضع النظام للصيانة الليلة من الساعة 2 صباحاً حتى 4 صباحاً. يرجى حفظ عملكم.',
      priority: 'high',
      targetRoles: null, // Broadcast to all users
      userIds: [],
      metadata: {
        maintenanceWindow: '2 AM - 4 AM',
        affectedServices: ['CRM', 'Analytics']
      }
    };

    const broadcastResponse = await axios.post(
      `${API_BASE}/notifications/broadcast`,
      broadcastData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Broadcast notification created successfully!');
    console.log(`📊 Recipients: ${broadcastResponse.data.recipientCount} users`);
    console.log(`📝 Notification ID: ${broadcastResponse.data.notification.id}\n`);

    // 3. Get notifications for current user
    console.log('3. Fetching notifications for admin user...');
    const notificationsResponse = await axios.get(
      `${API_BASE}/notifications?page=1&limit=5`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Notifications fetched successfully!');
    console.log(`📋 Total notifications: ${notificationsResponse.data.total}`);
    console.log(`📄 Current page: ${notificationsResponse.data.page}`);
    
    if (notificationsResponse.data.notifications.length > 0) {
      const latestNotification = notificationsResponse.data.notifications[0];
      console.log('\n📢 Latest notification:');
      console.log(`   Title: ${latestNotification.title}`);
      console.log(`   Message: ${latestNotification.message}`);
      console.log(`   Priority: ${latestNotification.priority}`);
      console.log(`   Read Status: ${latestNotification.isRead ? 'Read' : 'Unread'}`);
      console.log(`   Created: ${new Date(latestNotification.createdAt).toLocaleString()}`);
    }

    // 4. Get unread count
    console.log('\n4. Checking unread notification count...');
    const unreadResponse = await axios.get(
      `${API_BASE}/notifications/unread-count`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log(`✅ Unread notifications: ${unreadResponse.data.count}\n`);

    // 5. Test role-based broadcast
    console.log('5. Creating role-based broadcast notification...');
    const roleBroadcastData = {
      type: 'sales_summary_daily',
      title: 'Daily Sales Report Available',
      titleAr: 'تقرير المبيعات اليومي متاح',
      message: 'The daily sales report for today is now available in the analytics section.',
      messageAr: 'تقرير المبيعات اليومي لليوم متاح الآن في قسم التحليلات.',
      priority: 'medium',
      targetRoles: ['admin'], // Only to admins
      userIds: [],
      metadata: {
        reportDate: new Date().toISOString().split('T')[0],
        reportType: 'daily_sales'
      }
    };

    const roleBroadcastResponse = await axios.post(
      `${API_BASE}/notifications/broadcast`,
      roleBroadcastData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✅ Role-based broadcast notification created successfully!');
    console.log(`📊 Recipients: ${roleBroadcastResponse.data.recipientCount} admin users\n`);

    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Authentication working');
    console.log('   ✅ Broadcast notifications working');
    console.log('   ✅ Role-based targeting working');
    console.log('   ✅ Notification retrieval working');
    console.log('   ✅ Unread count working');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('💡 Tip: Make sure you have an admin user with email "admin@example.com" and password "admin123"');
    }
  }
}

// Run the test
testBroadcastNotifications();
