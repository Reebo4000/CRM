const notificationTriggers = require('./services/notificationTriggers');
const { Customer } = require('./models');

async function testCustomerTriggerDirect() {
  try {
    console.log('🔍 Testing customer notification trigger directly...');
    
    // Get a recent customer
    const customer = await Customer.findOne({
      order: [['createdAt', 'DESC']]
    });
    
    if (!customer) {
      console.log('❌ No customers found');
      return;
    }
    
    console.log(`📋 Testing with customer: ${customer.firstName} ${customer.lastName} (ID: ${customer.id})`);
    
    // Call the notification trigger directly
    console.log('🔔 Calling notificationTriggers.onCustomerRegistered...');
    await notificationTriggers.onCustomerRegistered(customer, 14); // Use user ID 14 for testing
    console.log('✅ Customer notification trigger completed');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if notification was created
    const { Notification } = require('./models');
    const recentNotifications = await Notification.findAll({
      where: {
        type: 'customer_registered',
        relatedEntityId: customer.id
      },
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    console.log(`📊 Found ${recentNotifications.length} customer notifications for this customer:`);
    recentNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
      console.log(`     Created: ${new Date(notification.createdAt).toLocaleString()}`);
    });
    
    console.log('\n🎉 Direct trigger test completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
}

testCustomerTriggerDirect();
