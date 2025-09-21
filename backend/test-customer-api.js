const axios = require('axios');

const testCustomerAPI = async () => {
  const baseURL = 'http://localhost:5000';
  
  console.log('🧪 Testing Customer API Endpoints...\n');
  
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
    
    // Step 2: Test getting all customers
    console.log('\n2. Testing GET /api/customers...');
    const customersResponse = await axios.get(`${baseURL}/api/customers`, {
      headers: authHeaders
    });
    
    console.log('✅ Customers retrieved successfully');
    console.log(`   Found ${customersResponse.data.customers.length} customers`);
    console.log(`   Total customers: ${customersResponse.data.pagination.totalCustomers}`);
    
    // Step 3: Test creating a new customer
    console.log('\n3. Testing POST /api/customers (Create new customer)...');
    const newCustomer = {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test.customer@example.com',
      phone: '1234567890',
      address: '123 Test Street',
      city: 'Test City',
      postalCode: '12345',
      dateOfBirth: '1990-01-01'
    };
    
    const createResponse = await axios.post(`${baseURL}/api/customers`, newCustomer, {
      headers: authHeaders
    });
    
    const createdCustomer = createResponse.data.customer;
    console.log('✅ Customer created successfully');
    console.log(`   Customer ID: ${createdCustomer.id}`);
    console.log(`   Name: ${createdCustomer.firstName} ${createdCustomer.lastName}`);
    
    // Step 4: Test getting specific customer
    console.log('\n4. Testing GET /api/customers/:id...');
    const customerDetailResponse = await axios.get(`${baseURL}/api/customers/${createdCustomer.id}`, {
      headers: authHeaders
    });
    
    console.log('✅ Customer details retrieved successfully');
    console.log(`   Customer: ${customerDetailResponse.data.customer.firstName} ${customerDetailResponse.data.customer.lastName}`);
    console.log(`   Statistics: ${JSON.stringify(customerDetailResponse.data.statistics)}`);
    
    // Step 5: Test updating customer
    console.log('\n5. Testing PUT /api/customers/:id (Update customer)...');
    const updateData = {
      firstName: 'Updated',
      lastName: 'Customer',
      email: 'updated.customer@example.com',
      phone: '1987654321',
      city: 'Updated City'
    };
    
    const updateResponse = await axios.put(`${baseURL}/api/customers/${createdCustomer.id}`, updateData, {
      headers: authHeaders
    });
    
    console.log('✅ Customer updated successfully');
    console.log(`   Updated name: ${updateResponse.data.customer.firstName} ${updateResponse.data.customer.lastName}`);
    
    // Step 6: Test search functionality
    console.log('\n6. Testing customer search...');
    const searchResponse = await axios.get(`${baseURL}/api/customers?search=Updated`, {
      headers: authHeaders
    });
    
    console.log('✅ Customer search working');
    console.log(`   Found ${searchResponse.data.customers.length} customers matching "Updated"`);
    
    // Step 7: Test pagination
    console.log('\n7. Testing pagination...');
    const paginationResponse = await axios.get(`${baseURL}/api/customers?page=1&limit=2`, {
      headers: authHeaders
    });
    
    console.log('✅ Pagination working');
    console.log(`   Page 1 with limit 2: ${paginationResponse.data.customers.length} customers`);
    console.log(`   Total pages: ${paginationResponse.data.pagination.totalPages}`);
    
    // Step 8: Clean up - delete test customer
    console.log('\n8. Cleaning up - deleting test customer...');
    await axios.delete(`${baseURL}/api/customers/${createdCustomer.id}`, {
      headers: authHeaders
    });
    console.log('✅ Test customer deleted successfully');
    
    console.log('\n🎉 Customer API Test Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Authentication: Working');
    console.log('✅ Get All Customers: Working');
    console.log('✅ Create Customer: Working');
    console.log('✅ Get Customer Details: Working');
    console.log('✅ Update Customer: Working');
    console.log('✅ Search Customers: Working');
    console.log('✅ Pagination: Working');
    console.log('✅ Delete Customer: Working');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🚀 Customer Management API is fully functional!');
    console.log('\n📋 You can now:');
    console.log('   • View customer list in the frontend');
    console.log('   • Create new customers');
    console.log('   • Edit existing customers');
    console.log('   • View customer details and statistics');
    console.log('   • Search and filter customers');
    console.log('   • Delete customers (admin only)');
    
  } catch (error) {
    console.error('❌ Customer API test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the backend server is running on port 5000');
    console.log('   2. Check that the database is properly seeded');
    console.log('   3. Verify authentication credentials');
  }
};

testCustomerAPI();
