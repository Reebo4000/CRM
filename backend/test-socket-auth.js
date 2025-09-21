const axios = require('axios');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function testSocketAuth() {
  try {
    console.log('🔐 Testing Socket Authentication');
    console.log('================================\n');

    // Step 1: Login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'reebo20004@gmail.com',
      password: 'Reebo@2004'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Login successful: ${user.firstName} ${user.lastName} (ID: ${user.id})\n`);

    // Step 2: Test socket connection with authentication
    console.log('🔌 Connecting to Socket.IO with authentication...');
    
    const socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['polling', 'websocket']
    });

    // Set up event listeners
    socket.on('connect', () => {
      console.log(`✅ Socket connected: ${socket.id}`);
    });

    socket.on('welcome', (data) => {
      console.log('🎉 Welcome message received:', data);
    });

    socket.on('connected', (data) => {
      console.log('🔗 Connection confirmation:', data);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    // Test notification reception
    socket.on('notification', (notification) => {
      console.log('📢 Notification received:', {
        type: notification.notification?.type || notification.type,
        title: notification.notification?.title || notification.title,
        message: notification.notification?.message || notification.message
      });
    });

    // Wait for connection
    await new Promise((resolve, reject) => {
      socket.on('connect', resolve);
      socket.on('connect_error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });

    console.log('\n🧪 Testing notification delivery...');
    
    // Step 3: Create an order to trigger notifications
    const productsResponse = await axios.get(`${API_BASE}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const availableProduct = productsResponse.data.products.find(p => p.stockQuantity > 0);
    if (!availableProduct) {
      console.log('❌ No products with stock available');
      return;
    }
    
    console.log(`📦 Using product: ${availableProduct.name} (Stock: ${availableProduct.stockQuantity})`);

    const orderData = {
      customerInfo: {
        name: 'Socket Test Customer ' + Date.now()
      },
      orderItems: [{
        productId: availableProduct.id,
        quantity: 1,
        unitPrice: availableProduct.price
      }],
      notes: 'Socket authentication test order'
    };

    console.log('📤 Creating order to test real-time notifications...');
    const orderResponse = await axios.post(`${API_BASE}/orders`, orderData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Order created: #${orderResponse.data.order.id}`);
    console.log(`✅ Customer created: ${orderResponse.data.order.customer.firstName} ${orderResponse.data.order.customer.lastName}`);

    // Wait for notifications
    console.log('\n⏳ Waiting for real-time notifications...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🎯 Socket authentication test completed!');
    console.log('✅ Socket connection with JWT authentication is working');
    console.log('✅ Real-time notifications should be delivered to authenticated users');

    socket.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('📝 Error details:', error.response.data);
    }
    process.exit(1);
  }
}

testSocketAuth();
