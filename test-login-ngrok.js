const axios = require('axios');

// Test script for login functionality through ngrok
async function testLogin() {
  const baseUrl = 'https://chigger-definite-nominally.ngrok-free.app';
  
  console.log('🧪 Testing Login Functionality through ngrok');
  console.log('📡 Base URL:', baseUrl);
  
  // Test credentials
  const credentials = {
    email: 'reebo2004@gmail.com',
    password: 'Reebo@2004'
  };
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${baseUrl}/health`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test 2: API health check
    console.log('\n2️⃣ Testing API health endpoint...');
    const apiHealthResponse = await axios.get(`${baseUrl}/api/health`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    console.log('✅ API health check passed:', apiHealthResponse.data);
    
    // Test 3: Login attempt
    console.log('\n3️⃣ Testing login...');
    console.log('📧 Email:', credentials.email);
    console.log('🔐 Password:', '*'.repeat(credentials.password.length));
    
    const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, credentials, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('📋 Response:', {
      success: loginResponse.data.success,
      message: loginResponse.data.message,
      hasToken: !!loginResponse.data.token,
      tokenPreview: loginResponse.data.token ? `${loginResponse.data.token.substring(0, 20)}...` : 'No token',
      user: {
        id: loginResponse.data.user?.id,
        firstName: loginResponse.data.user?.firstName,
        lastName: loginResponse.data.user?.lastName,
        email: loginResponse.data.user?.email,
        role: loginResponse.data.user?.role
      }
    });
    
    // Test 4: Test authenticated request
    if (loginResponse.data.token) {
      console.log('\n4️⃣ Testing authenticated request...');
      
      const profileResponse = await axios.get(`${baseUrl}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      console.log('✅ Authenticated request successful!');
      console.log('👤 Profile:', {
        id: profileResponse.data.user?.id,
        firstName: profileResponse.data.user?.firstName,
        lastName: profileResponse.data.user?.lastName,
        email: profileResponse.data.user?.email,
        role: profileResponse.data.user?.role
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused - possible issues:');
      console.log('1. Docker containers are not running');
      console.log('2. ngrok tunnel is not active');
      console.log('3. nginx proxy is not configured correctly');
    }
    
    if (error.response?.status === 401) {
      console.log('\n💡 Authentication failed - possible issues:');
      console.log('1. Invalid credentials');
      console.log('2. User account does not exist');
      console.log('3. Database connection issues');
    }
    
    if (error.response?.status === 500) {
      console.log('\n💡 Server error - check backend logs:');
      console.log('docker-compose -f docker-compose.dev.yml logs backend');
    }
  }
}

// Test CORS preflight
async function testCORS() {
  const baseUrl = 'https://chigger-definite-nominally.ngrok-free.app';
  
  console.log('\n5️⃣ Testing CORS preflight...');
  
  try {
    const corsResponse = await axios.options(`${baseUrl}/api/auth/login`, {
      headers: {
        'Origin': 'https://chigger-definite-nominally.ngrok-free.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    console.log('✅ CORS preflight successful!');
    console.log('📋 CORS Headers:', {
      'access-control-allow-origin': corsResponse.headers['access-control-allow-origin'],
      'access-control-allow-methods': corsResponse.headers['access-control-allow-methods'],
      'access-control-allow-headers': corsResponse.headers['access-control-allow-headers']
    });
    
  } catch (error) {
    console.error('❌ CORS preflight failed:', error.response?.status, error.response?.data);
  }
}

// Run all tests
async function runAllTests() {
  await testLogin();
  await testCORS();
  
  console.log('\n🏁 Tests completed!');
  console.log('\n💡 Next steps if tests pass:');
  console.log('1. Restart your Docker containers');
  console.log('2. Access the app via: https://chigger-definite-nominally.ngrok-free.app');
  console.log('3. Try logging in with the provided credentials');
  
  console.log('\n🔧 Commands to restart Docker:');
  console.log('docker-compose -f docker-compose.dev.yml down');
  console.log('docker-compose -f docker-compose.dev.yml up -d');
  console.log('docker-compose -f docker-compose.dev.yml logs -f');
}

if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testLogin, testCORS };
