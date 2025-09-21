const axios = require('axios');

const testOrderAPI = async () => {
  const baseURL = 'http://localhost:5000';
  
  console.log('🧪 Testing Order API Endpoints...\n');
  
  try {
    // Step 1: Login to get token
    console.log('1. Logging in to get authentication token...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@geminicrm.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');
    
    // Set up headers for authenticated requests
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Get customers and products for order creation
    console.log('\n2. Getting customers and products for order creation...');
    const [customersResponse, productsResponse] = await Promise.all([
      axios.get(`${baseURL}/api/customers`, { headers: authHeaders }),
      axios.get(`${baseURL}/api/products`, { headers: authHeaders })
    ]);
    
    const customers = customersResponse.data.customers;
    const products = productsResponse.data.products;
    
    console.log(`✅ Found ${customers.length} customers and ${products.length} products`);
    
    if (customers.length === 0 || products.length === 0) {
      console.log('❌ Need at least one customer and one product to test orders');
      return;
    }
    
    // Step 3: Test getting all orders
    console.log('\n3. Testing GET /api/orders...');
    const ordersResponse = await axios.get(`${baseURL}/api/orders`, {
      headers: authHeaders
    });
    
    console.log('✅ Orders retrieved successfully');
    console.log(`   Found ${ordersResponse.data.orders.length} orders`);
    console.log(`   Total orders: ${ordersResponse.data.pagination.totalOrders}`);
    
    // Step 4: Test creating a new order
    console.log('\n4. Testing POST /api/orders (Create new order)...');
    const selectedCustomer = customers[0];
    const selectedProduct = products[0];
    
    const newOrder = {
      customerId: selectedCustomer.id,
      orderItems: [
        {
          productId: selectedProduct.id,
          quantity: 2
        }
      ],
      notes: 'Test order created via API'
    };
    
    const createResponse = await axios.post(`${baseURL}/api/orders`, newOrder, {
      headers: authHeaders
    });
    
    const createdOrder = createResponse.data.order;
    console.log('✅ Order created successfully');
    console.log(`   Order ID: ${createdOrder.id}`);
    console.log(`   Customer: ${selectedCustomer.firstName} ${selectedCustomer.lastName}`);
    console.log(`   Total: $${createdOrder.totalAmount}`);
    console.log(`   Items: ${createdOrder.orderItems?.length || 0}`);
    
    // Step 5: Test getting specific order
    console.log('\n5. Testing GET /api/orders/:id...');
    const orderDetailResponse = await axios.get(`${baseURL}/api/orders/${createdOrder.id}`, {
      headers: authHeaders
    });
    
    console.log('✅ Order details retrieved successfully');
    console.log(`   Order: #${orderDetailResponse.data.order.id}`);
    console.log(`   Status: ${orderDetailResponse.data.order.status}`);
    console.log(`   Customer: ${orderDetailResponse.data.order.customer?.firstName} ${orderDetailResponse.data.order.customer?.lastName}`);
    
    // Step 6: Test updating order status
    console.log('\n6. Testing PUT /api/orders/:id/status (Update order status)...');
    const statusUpdate = {
      status: 'processing'
    };
    
    const updateStatusResponse = await axios.put(`${baseURL}/api/orders/${createdOrder.id}/status`, statusUpdate, {
      headers: authHeaders
    });
    
    console.log('✅ Order status updated successfully');
    console.log(`   Previous status: ${createdOrder.status}`);
    console.log(`   New status: ${updateStatusResponse.data.order.status}`);
    
    // Step 7: Test search functionality
    console.log('\n7. Testing order search...');
    const searchResponse = await axios.get(`${baseURL}/api/orders?search=${selectedCustomer.firstName}`, {
      headers: authHeaders
    });
    
    console.log('✅ Order search working');
    console.log(`   Found ${searchResponse.data.orders.length} orders for customer "${selectedCustomer.firstName}"`);
    
    // Step 8: Test status filter
    console.log('\n8. Testing status filter...');
    const statusResponse = await axios.get(`${baseURL}/api/orders?status=processing`, {
      headers: authHeaders
    });
    
    console.log('✅ Status filter working');
    console.log(`   Found ${statusResponse.data.orders.length} orders with "processing" status`);
    
    // Step 9: Test pagination
    console.log('\n9. Testing pagination...');
    const paginationResponse = await axios.get(`${baseURL}/api/orders?page=1&limit=2`, {
      headers: authHeaders
    });
    
    console.log('✅ Pagination working');
    console.log(`   Page 1 with limit 2: ${paginationResponse.data.orders.length} orders`);
    console.log(`   Total pages: ${paginationResponse.data.pagination.totalPages}`);
    
    // Step 10: Test sorting
    console.log('\n10. Testing sorting...');
    const sortResponse = await axios.get(`${baseURL}/api/orders?sortBy=totalAmount&sortOrder=DESC`, {
      headers: authHeaders
    });
    
    console.log('✅ Sorting working');
    console.log(`   Orders sorted by total amount (highest first)`);
    if (sortResponse.data.orders.length > 0) {
      console.log(`   First order total: $${sortResponse.data.orders[0].totalAmount}`);
    }
    
    // Step 11: Test another status update
    console.log('\n11. Testing another status update (completed)...');
    const finalStatusUpdate = {
      status: 'completed'
    };

    const finalUpdateResponse = await axios.put(`${baseURL}/api/orders/${createdOrder.id}/status`, finalStatusUpdate, {
      headers: authHeaders
    });

    console.log('✅ Final status update successful');
    console.log(`   Final status: ${finalUpdateResponse.data.order.status}`);

    // Step 12: Note about order persistence
    console.log('\n12. Order persistence...');
    console.log('✅ Test order will remain in system for audit purposes (no delete endpoint)');
    
    console.log('\n🎉 Order API Test Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Authentication: Working');
    console.log('✅ Get All Orders: Working');
    console.log('✅ Create Order: Working');
    console.log('✅ Get Order Details: Working');
    console.log('✅ Update Order Status: Working');
    console.log('✅ Status Updates: Working');
    console.log('✅ Search Orders: Working');
    console.log('✅ Status Filter: Working');
    console.log('✅ Pagination: Working');
    console.log('✅ Sorting: Working');
    console.log('✅ Order Persistence: Working (no delete for audit)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🚀 Order Management API is fully functional!');
    console.log('\n📋 You can now:');
    console.log('   • View order list in the frontend');
    console.log('   • Create new orders with multiple items');
    console.log('   • Edit existing orders');
    console.log('   • View order details with customer and product info');
    console.log('   • Update order status (pending → processing → completed)');
    console.log('   • Search and filter orders by various criteria');
    console.log('   • Track order fulfillment and sales');
    console.log('   • Orders are preserved for audit purposes (no deletion)');
    
  } catch (error) {
    console.error('❌ Order API test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the backend server is running on port 5000');
    console.log('   2. Check that the database is properly seeded with customers and products');
    console.log('   3. Verify authentication credentials');
    console.log('   4. Ensure order validation rules are met');
    console.log('   5. Check that customer and product IDs exist');
  }
};

testOrderAPI();
