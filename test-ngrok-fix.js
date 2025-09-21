const axios = require('axios');

// Test script to verify ngrok fix
async function testNgrokFix() {
  const baseUrl = 'https://chigger-definite-nominally.ngrok-free.app';
  
  console.log('🧪 Testing ngrok Fix for Login Issue');
  console.log('📡 Base URL:', baseUrl);
  console.log('');
  
  try {
    // Test 1: Frontend accessibility
    console.log('1️⃣ Testing frontend accessibility...');
    const frontendResponse = await axios.get(baseUrl, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    if (frontendResponse.status === 200) {
      console.log('✅ Frontend is accessible');
      console.log('📄 Content-Type:', frontendResponse.headers['content-type']);
    }
    
    // Test 2: API health check through proxy
    console.log('\n2️⃣ Testing API health check through Vite proxy...');
    const healthResponse = await axios.get(`${baseUrl}/api/health`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    console.log('✅ API health check successful:', healthResponse.data);
    
    // Test 3: Login attempt
    console.log('\n3️⃣ Testing login through proxy...');
    const loginData = {
      email: 'reebo2004@gmail.com',
      password: 'Reebo@2004'
    };
    
    const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    console.log('✅ Login successful!');
    console.log('👤 User:', {
      id: loginResponse.data.user?.id,
      firstName: loginResponse.data.user?.firstName,
      lastName: loginResponse.data.user?.lastName,
      email: loginResponse.data.user?.email,
      role: loginResponse.data.user?.role
    });
    console.log('🔑 Token received:', !!loginResponse.data.token);
    
    // Test 4: Authenticated request
    if (loginResponse.data.token) {
      console.log('\n4️⃣ Testing authenticated request...');
      const profileResponse = await axios.get(`${baseUrl}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`,
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      console.log('✅ Authenticated request successful!');
      console.log('👤 Profile data received');
    }
    
    console.log('\n🎉 All tests passed! The ngrok setup is working correctly.');
    console.log('\n📱 You can now access the app from any network:');
    console.log(`   ${baseUrl}`);
    console.log('\n🔐 Login credentials:');
    console.log('   Email: reebo2004@gmail.com');
    console.log('   Password: Reebo@2004');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused - possible solutions:');
      console.log('1. Run: docker-compose -f docker-compose.dev.yml restart frontend');
      console.log('2. Check if containers are running: docker-compose -f docker-compose.dev.yml ps');
      console.log('3. Check ngrok tunnel status');
    }
    
    if (error.response?.status === 403) {
      console.log('\n💡 Forbidden error - possible solutions:');
      console.log('1. Vite allowedHosts configuration issue');
      console.log('2. Run the restart-frontend.bat script');
      console.log('3. Check Vite logs: docker-compose -f docker-compose.dev.yml logs frontend');
    }
    
    if (error.response?.status === 401) {
      console.log('\n💡 Authentication failed - possible solutions:');
      console.log('1. Check if user exists in database');
      console.log('2. Verify credentials are correct');
      console.log('3. Check backend logs: docker-compose -f docker-compose.dev.yml logs backend');
    }
    
    console.log('\n🔧 Debug commands:');
    console.log('docker-compose -f docker-compose.dev.yml logs frontend');
    console.log('docker-compose -f docker-compose.dev.yml logs backend');
    console.log('docker-compose -f docker-compose.dev.yml ps');
  }
}

if (require.main === module) {
  testNgrokFix().catch(console.error);
}

module.exports = { testNgrokFix };
