const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testNewCustomerOrderCreation() {
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

    // Test creating order with new customer
    console.log('\n🆕 Creating order with new customer...');
    const orderData = {
      customerInfo: {
        name: 'Test Customer ' + Date.now()
      },
      orderItems: [{
        productId: availableProduct.id,
        quantity: 1,
        unitPrice: availableProduct.price
      }],
      notes: 'Test order with new customer creation'
    };

    console.log('📤 Sending order data:', JSON.stringify(orderData, null, 2));

    const orderResponse = await axios.post(`${API_BASE}/orders`, orderData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order created successfully!');
    console.log('📋 Order details:', {
      orderId: orderResponse.data.order.id,
      customerId: orderResponse.data.order.customerId,
      customerName: orderResponse.data.order.customer ? 
        `${orderResponse.data.order.customer.firstName} ${orderResponse.data.order.customer.lastName}` : 
        'N/A',
      totalAmount: orderResponse.data.order.totalAmount,
      status: orderResponse.data.order.status
    });

    // Verify customer was created
    console.log('\n👤 Verifying customer was created...');
    const customerResponse = await axios.get(`${API_BASE}/customers/${orderResponse.data.order.customerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Customer verified:', {
      id: customerResponse.data.customer.id,
      name: `${customerResponse.data.customer.firstName} ${customerResponse.data.customer.lastName}`,
      email: customerResponse.data.customer.email
    });

    console.log('\n🎉 Test completed successfully! New customer order creation is working.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('📝 Validation details:', error.response.data.details);
    }
  }
}

testNewCustomerOrderCreation();
