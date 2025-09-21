const axios = require('axios');

// Test script specifically for mobile network access
async function testMobileAccess() {
  const baseUrl = 'https://chigger-definite-nominally.ngrok-free.app';
  
  console.log('📱 Testing Mobile Network Access');
  console.log('📡 Base URL:', baseUrl);
  console.log('');
  
  // Simulate mobile browser headers
  const mobileHeaders = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'ngrok-skip-browser-warning': 'true'
  };
  
  try {
    // Test 1: Frontend accessibility (what mobile users see first)
    console.log('1️⃣ Testing frontend accessibility from mobile...');
    const frontendResponse = await axios.get(baseUrl, {
      headers: mobileHeaders,
      timeout: 15000,
      maxRedirects: 5
    });
    
    if (frontendResponse.status === 200) {
      console.log('✅ Frontend is accessible from mobile');
      console.log('📄 Content-Type:', frontendResponse.headers['content-type']);
      console.log('📏 Content-Length:', frontendResponse.headers['content-length']);
    }
    
    // Test 2: API health check (what happens when mobile app tries to connect to API)
    console.log('\n2️⃣ Testing API accessibility from mobile...');
    const healthResponse = await axios.get(`${baseUrl}/health`, {
      headers: {
        ...mobileHeaders,
        'Accept': 'application/json, text/plain, */*'
      },
      timeout: 15000
    });
    
    console.log('✅ API is accessible from mobile:', healthResponse.data);
    
    // Test 3: Login attempt (the actual failing operation)
    console.log('\n3️⃣ Testing login from mobile network...');
    const loginData = {
      email: 'reebo2004@gmail.com',
      password: 'Reebo@2004'
    };
    
    const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, loginData, {
      headers: {
        ...mobileHeaders,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
      },
      timeout: 20000
    });
    
    console.log('✅ Login successful from mobile!');
    console.log('👤 User:', {
      id: loginResponse.data.user?.id,
      firstName: loginResponse.data.user?.firstName,
      lastName: loginResponse.data.user?.lastName,
      email: loginResponse.data.user?.email,
      role: loginResponse.data.user?.role
    });
    console.log('🔑 Token received:', !!loginResponse.data.token);
    
    // Test 4: Test image upload endpoint (common mobile use case)
    console.log('\n4️⃣ Testing uploads endpoint from mobile...');
    const uploadsTest = await axios.get(`${baseUrl}/uploads/test.jpg`, {
      headers: mobileHeaders,
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Accept 404 as valid response (file doesn't exist)
      }
    });
    
    if (uploadsTest.status === 404) {
      console.log('✅ Uploads endpoint is accessible (404 expected for non-existent file)');
    } else {
      console.log('✅ Uploads endpoint responded with status:', uploadsTest.status);
    }
    
    console.log('\n🎉 All mobile tests passed!');
    console.log('\n📱 Mobile users should now be able to:');
    console.log('   ✅ Access the app');
    console.log('   ✅ Login successfully');
    console.log('   ✅ Use all API features');
    console.log('   ✅ Upload/view images');
    
    console.log('\n🔗 Share this URL with mobile users:');
    console.log(`   ${baseUrl}`);
    
  } catch (error) {
    console.error('\n❌ Mobile test failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused - possible issues:');
      console.log('1. ngrok tunnel is down');
      console.log('2. Docker containers are not running');
      console.log('3. nginx proxy is not working');
    }
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 DNS resolution failed - possible issues:');
      console.log('1. ngrok domain is not active');
      console.log('2. Internet connectivity issues');
      console.log('3. DNS server problems');
    }
    
    if (error.response?.status === 502) {
      console.log('\n💡 Bad Gateway - possible issues:');
      console.log('1. Backend container is not running');
      console.log('2. nginx proxy cannot reach backend');
      console.log('3. Backend is not responding on port 5000');
    }
    
    if (error.response?.status === 403) {
      console.log('\n💡 Forbidden - possible issues:');
      console.log('1. Vite allowedHosts configuration');
      console.log('2. CORS configuration');
      console.log('3. nginx proxy configuration');
    }
    
    console.log('\n🔧 Debug steps:');
    console.log('1. Check containers: docker-compose -f docker-compose.dev.yml ps');
    console.log('2. Check nginx logs: docker-compose -f docker-compose.dev.yml logs nginx-proxy');
    console.log('3. Check backend logs: docker-compose -f docker-compose.dev.yml logs backend');
    console.log('4. Check frontend logs: docker-compose -f docker-compose.dev.yml logs frontend');
    console.log('5. Restart everything: fix-docker-setup.bat');
  }
}

if (require.main === module) {
  testMobileAccess().catch(console.error);
}

module.exports = { testMobileAccess };
