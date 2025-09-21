const { Notification, UserNotification, User, Customer } = require('./models');

async function checkNotifications() {
  try {
    console.log('🔍 Checking database for notifications...');
    
    // Get all notifications from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const notifications = await Notification.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: oneHourAgo
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    console.log(`📊 Found ${notifications.length} notifications in the last hour:`);
    
    notifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.type}: ${notification.title}`);
      console.log(`     Message: ${notification.message}`);
      console.log(`     Priority: ${notification.priority}`);
      console.log(`     Related: ${notification.relatedEntityType} (ID: ${notification.relatedEntityId})`);
      console.log(`     Created: ${new Date(notification.createdAt).toLocaleString()}`);
      console.log('');
    });
    
    // Check specifically for customer notifications
    const customerNotifications = notifications.filter(n => n.type === 'customer_registered');
    console.log(`👤 Customer registration notifications: ${customerNotifications.length}`);
    
    // Check for recent customers
    const recentCustomers = await Customer.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: oneHourAgo
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    console.log(`👥 Recent customers created: ${recentCustomers.length}`);
    recentCustomers.forEach((customer, index) => {
      console.log(`  ${index + 1}. ${customer.firstName} ${customer.lastName} (ID: ${customer.id})`);
      console.log(`     Created: ${new Date(customer.createdAt).toLocaleString()}`);
    });
    
    // Check user notifications
    const userNotifications = await UserNotification.findAll({
      include: [
        {
          model: Notification,
          as: 'notification',
          where: {
            createdAt: {
              [require('sequelize').Op.gte]: oneHourAgo
            }
          }
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    console.log(`📬 User notifications created: ${userNotifications.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking notifications:', error);
    process.exit(1);
  }
}

checkNotifications();
