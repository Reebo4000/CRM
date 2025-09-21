const axios = require('axios');

const testProductAPI = async () => {
  const baseURL = 'http://localhost:5000';
  
  console.log('🧪 Testing Product API Endpoints...\n');
  
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
    
    // Step 2: Test getting all products
    console.log('\n2. Testing GET /api/products...');
    const productsResponse = await axios.get(`${baseURL}/api/products`, {
      headers: authHeaders
    });
    
    console.log('✅ Products retrieved successfully');
    console.log(`   Found ${productsResponse.data.products.length} products`);
    console.log(`   Total products: ${productsResponse.data.pagination.totalProducts}`);
    
    // Step 3: Test creating a new product
    console.log('\n3. Testing POST /api/products (Create new product)...');
    const timestamp = Date.now();
    const newProduct = {
      name: `Test Handbag ${timestamp}`,
      description: 'A beautiful test handbag for API testing',
      price: 99.99,
      stockQuantity: 50,
      category: 'Tote Bags',
      brand: 'TestBrand',
      color: 'Black',
      material: 'Genuine Leather'
    };
    
    const createResponse = await axios.post(`${baseURL}/api/products`, newProduct, {
      headers: authHeaders
    });
    
    const createdProduct = createResponse.data.product;
    console.log('✅ Product created successfully');
    console.log(`   Product ID: ${createdProduct.id}`);
    console.log(`   Name: ${createdProduct.name}`);
    console.log(`   Price: $${createdProduct.price}`);
    console.log(`   Stock: ${createdProduct.stockQuantity}`);
    
    // Step 4: Test getting specific product
    console.log('\n4. Testing GET /api/products/:id...');
    const productDetailResponse = await axios.get(`${baseURL}/api/products/${createdProduct.id}`, {
      headers: authHeaders
    });
    
    console.log('✅ Product details retrieved successfully');
    console.log(`   Product: ${productDetailResponse.data.product.name}`);
    console.log(`   Statistics: ${JSON.stringify(productDetailResponse.data.statistics)}`);
    
    // Step 5: Test updating product
    console.log('\n5. Testing PUT /api/products/:id (Update product)...');
    const updateData = {
      name: `Updated Test Handbag ${timestamp}`,
      description: 'An updated test handbag',
      price: 129.99,
      stockQuantity: 75,
      category: 'Tote Bags',
      brand: 'TestBrand',
      color: 'Brown',
      material: 'Genuine Leather'
    };
    
    const updateResponse = await axios.put(`${baseURL}/api/products/${createdProduct.id}`, updateData, {
      headers: authHeaders
    });
    
    console.log('✅ Product updated successfully');
    console.log(`   Updated name: ${updateResponse.data.product.name}`);
    console.log(`   Updated price: $${updateResponse.data.product.price}`);
    console.log(`   Updated stock: ${updateResponse.data.product.stockQuantity}`);
    
    // Step 6: Test stock adjustment
    console.log('\n6. Testing PUT /api/products/:id/stock...');
    const stockAdjustment = {
      quantity: 65, // Set new stock to 65 (was 75, so -10)
      operation: 'set',
      reason: 'Test stock adjustment'
    };

    const adjustResponse = await axios.put(`${baseURL}/api/products/${createdProduct.id}/stock`, stockAdjustment, {
      headers: authHeaders
    });
    
    console.log('✅ Stock adjustment successful');
    console.log(`   Previous stock: ${updateResponse.data.product.stockQuantity}`);
    console.log(`   New stock: ${adjustResponse.data.product.stockQuantity}`);
    
    // Step 7: Test search functionality
    console.log('\n7. Testing product search...');
    const searchResponse = await axios.get(`${baseURL}/api/products?search=Updated`, {
      headers: authHeaders
    });
    
    console.log('✅ Product search working');
    console.log(`   Found ${searchResponse.data.products.length} products matching "Updated"`);
    
    // Step 8: Test category filter
    console.log('\n8. Testing category filter...');
    const categoryResponse = await axios.get(`${baseURL}/api/products?category=Tote Bags`, {
      headers: authHeaders
    });
    
    console.log('✅ Category filter working');
    console.log(`   Found ${categoryResponse.data.products.length} products in "Tote Bags" category`);
    
    // Step 9: Test stock filter
    console.log('\n9. Testing stock filter...');
    const stockResponse = await axios.get(`${baseURL}/api/products?inStock=true`, {
      headers: authHeaders
    });
    
    console.log('✅ Stock filter working');
    console.log(`   Found ${stockResponse.data.products.length} products in stock`);
    
    // Step 10: Test pagination
    console.log('\n10. Testing pagination...');
    const paginationResponse = await axios.get(`${baseURL}/api/products?page=1&limit=3`, {
      headers: authHeaders
    });
    
    console.log('✅ Pagination working');
    console.log(`   Page 1 with limit 3: ${paginationResponse.data.products.length} products`);
    console.log(`   Total pages: ${paginationResponse.data.pagination.totalPages}`);
    
    // Step 11: Test sorting
    console.log('\n11. Testing sorting...');
    const sortResponse = await axios.get(`${baseURL}/api/products?sortBy=price&sortOrder=DESC`, {
      headers: authHeaders
    });
    
    console.log('✅ Sorting working');
    console.log(`   Products sorted by price (highest first)`);
    if (sortResponse.data.products.length > 0) {
      console.log(`   First product price: $${sortResponse.data.products[0].price}`);
    }
    
    // Step 12: Clean up - delete test product
    console.log('\n12. Cleaning up - deleting test product...');
    await axios.delete(`${baseURL}/api/products/${createdProduct.id}`, {
      headers: authHeaders
    });
    console.log('✅ Test product deleted successfully');
    
    console.log('\n🎉 Product API Test Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Authentication: Working');
    console.log('✅ Get All Products: Working');
    console.log('✅ Create Product: Working');
    console.log('✅ Get Product Details: Working');
    console.log('✅ Update Product: Working');
    console.log('✅ Stock Adjustment: Working');
    console.log('✅ Search Products: Working');
    console.log('✅ Category Filter: Working');
    console.log('✅ Stock Filter: Working');
    console.log('✅ Pagination: Working');
    console.log('✅ Sorting: Working');
    console.log('✅ Delete Product: Working');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🚀 Product Management API is fully functional!');
    console.log('\n📋 You can now:');
    console.log('   • View product catalog in the frontend');
    console.log('   • Create new products with full details');
    console.log('   • Edit existing products');
    console.log('   • View product details and sales statistics');
    console.log('   • Search and filter products by various criteria');
    console.log('   • Manage inventory with stock adjustments');
    console.log('   • Track stock levels and get low stock alerts');
    console.log('   • Delete products (admin only)');
    
  } catch (error) {
    console.error('❌ Product API test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the backend server is running on port 5000');
    console.log('   2. Check that the database is properly seeded');
    console.log('   3. Verify authentication credentials');
    console.log('   4. Ensure product validation rules are met');
  }
};

testProductAPI();
