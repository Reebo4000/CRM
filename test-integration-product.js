const axios = require('axios');

// Test script for integration product creation with image URL
async function testIntegrationProduct() {
  const baseUrl = 'https://chigger-definite-nominally.ngrok-free.app';
  const apiKey = 'gemini_crm_integration_key_2024';
  
  console.log('🧪 Testing Integration Product Creation with Image URL');
  console.log('📡 Base URL:', baseUrl);
  
  // Test 1: Health check
  try {
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${baseUrl}/api/integration/health`, {
      headers: {
        'X-API-Key': apiKey,
        'ngrok-skip-browser-warning': 'true'
      }
    });
    console.log('✅ Health check passed:', healthResponse.data);
  } catch (error) {
    console.error('❌ Health check failed:', error.response?.data || error.message);
    return;
  }
  
  // Test 2: Create product with image URL
  try {
    console.log('\n2️⃣ Testing product creation with image URL...');
    
    const productData = {
      name: `Test Product ${Date.now()}`,
      description: 'Test product with image from URL',
      price: 99.99,
      stockQuantity: 10,
      category: 'Test Category',
      brand: 'Test Brand',
      color: 'Red',
      material: 'Leather',
      imageUrl: 'https://via.placeholder.com/300x300/FF0000/FFFFFF?text=Test+Product'
    };
    
    console.log('📤 Sending product data:', {
      ...productData,
      imageUrl: productData.imageUrl.substring(0, 50) + '...'
    });
    
    const response = await axios.post(`${baseUrl}/api/integration/products`, productData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    console.log('✅ Product created successfully!');
    console.log('📋 Response:', {
      success: response.data.success,
      productId: response.data.product?.id,
      productName: response.data.product?.name,
      imagePath: response.data.product?.imagePath
    });
    
    // Test 3: Verify image is accessible
    if (response.data.product?.imagePath) {
      console.log('\n3️⃣ Testing image accessibility...');
      const imageUrl = `${baseUrl}/uploads/${response.data.product.imagePath}`;
      console.log('🖼️ Image URL:', imageUrl);
      
      try {
        const imageResponse = await axios.head(imageUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        console.log('✅ Image is accessible!');
        console.log('📋 Image headers:', {
          'content-type': imageResponse.headers['content-type'],
          'content-length': imageResponse.headers['content-length']
        });
      } catch (imageError) {
        console.error('❌ Image not accessible:', imageError.response?.status, imageError.response?.statusText);
      }
    } else {
      console.log('⚠️ No imagePath returned in response');
    }
    
  } catch (error) {
    console.error('❌ Product creation failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

// Test 4: Alternative with imagePath instead of imageUrl
async function testWithImagePath() {
  const baseUrl = 'https://chigger-definite-nominally.ngrok-free.app';
  const apiKey = 'gemini_crm_integration_key_2024';
  
  console.log('\n4️⃣ Testing with imagePath instead of imageUrl...');
  
  try {
    const productData = {
      name: `Test Product Path ${Date.now()}`,
      description: 'Test product with imagePath URL',
      price: 149.99,
      stockQuantity: 5,
      category: 'Test Category',
      imagePath: 'https://via.placeholder.com/400x400/00FF00/FFFFFF?text=ImagePath+Test'
    };
    
    const response = await axios.post(`${baseUrl}/api/integration/products`, productData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    console.log('✅ Product with imagePath created!');
    console.log('📋 Response imagePath:', response.data.product?.imagePath);
    
  } catch (error) {
    console.error('❌ imagePath test failed:', error.response?.data || error.message);
  }
}

// Run tests
async function runAllTests() {
  await testIntegrationProduct();
  await testWithImagePath();
  
  console.log('\n🏁 Tests completed!');
  console.log('\n💡 Tips for debugging:');
  console.log('1. Check Docker logs: docker-compose -f docker-compose.dev.yml logs backend');
  console.log('2. Verify ngrok is pointing to backend:5000 (not frontend:5173)');
  console.log('3. Check uploads directory permissions in Docker container');
  console.log('4. Ensure INTEGRATION_API_KEY matches in environment');
}

if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testIntegrationProduct, testWithImagePath };
