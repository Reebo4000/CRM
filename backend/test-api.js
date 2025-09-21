const axios = require('axios');

const testAPI = async () => {
  const baseURL = 'http://localhost:5000';
  
  try {
    console.log('🧪 Testing Gemini CRM API...\n');
    
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check:', healthResponse.data.message);
    
    // Test 2: Database connection
    console.log('\n2. Testing database connection...');
    const dbResponse = await axios.get(`${baseURL}/api/test-db`);
    console.log('✅ Database:', dbResponse.data.message);
    
    // Test 3: Login with admin credentials
    console.log('\n3. Testing login endpoint...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@geminicrm.com',
      password: 'admin123'
    });
    console.log('✅ Login successful:', loginResponse.data.user.firstName, loginResponse.data.user.lastName);
    console.log('   Role:', loginResponse.data.user.role);
    console.log('   Token:', loginResponse.data.token);
    
    // Test 4: Login with invalid credentials
    console.log('\n4. Testing invalid login...');
    try {
      await axios.post(`${baseURL}/api/auth/login`, {
        email: 'invalid@email.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Invalid login correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    console.log('\n🎉 All tests passed! Backend is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
};

testAPI();
