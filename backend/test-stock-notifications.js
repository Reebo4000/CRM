const { sequelize } = require('./models');
const { User, Product, NotificationPreference } = require('./models');
const notificationTriggers = require('./services/notificationTriggers');

async function testStockNotifications() {
  try {
    console.log('🧪 TESTING DYNAMIC STOCK NOTIFICATIONS');
    console.log('='.repeat(50));

    // Get admin user
    const adminUser = await User.findOne({ where: { role: 'admin' } });
    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }

    console.log(`👤 Testing with user: ${adminUser.firstName} ${adminUser.lastName}`);

    // Set custom thresholds for testing
    console.log('\n🔧 Setting custom notification thresholds...');
    
    await NotificationPreference.upsert({
      userId: adminUser.id,
      notificationType: 'stock_low',
      inAppEnabled: true,
      emailEnabled: false,
      threshold: { quantity: 3 },
      language: 'en'
    });

    await NotificationPreference.upsert({
      userId: adminUser.id,
      notificationType: 'stock_medium',
      inAppEnabled: true,
      emailEnabled: false,
      threshold: { quantity: 8 },
      language: 'en'
    });

    console.log('✅ Thresholds set: Low=3, Medium=8');

    // Get a test product
    const testProduct = await Product.findOne();
    if (!testProduct) {
      console.log('❌ No products found for testing');
      return;
    }

    console.log(`\n📦 Testing with product: ${testProduct.name}`);
    console.log(`   Original stock: ${testProduct.stockQuantity}`);

    // Test different stock levels
    const testCases = [
      { stock: 15, expected: 'No notification (above thresholds)' },
      { stock: 8, expected: 'Medium stock notification' },
      { stock: 5, expected: 'Medium stock notification' },
      { stock: 3, expected: 'Low stock notification' },
      { stock: 1, expected: 'Low stock notification' },
      { stock: 0, expected: 'Out of stock notification' }
    ];

    console.log('\n🎯 TESTING STOCK LEVEL SCENARIOS:');
    console.log('-'.repeat(40));

    for (const testCase of testCases) {
      console.log(`\n📊 Setting stock to: ${testCase.stock} units`);
      console.log(`   Expected: ${testCase.expected}`);
      
      // Update product stock
      testProduct.stockQuantity = testCase.stock;
      await testProduct.save();

      // Trigger notification
      console.log('🔔 Triggering stock level change notification...');
      await notificationTriggers.onStockLevelChange(testProduct, adminUser.id);
      
      console.log('✅ Test case completed');
      console.log('-'.repeat(20));
    }

    console.log('\n🎉 DYNAMIC STOCK NOTIFICATION TESTING COMPLETED!');

  } catch (error) {
    console.error('❌ Error testing stock notifications:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testStockNotifications();
