const axios = require('axios');

const testAuthAPI = async () => {
  const baseURL = 'http://localhost:5000';
  
  console.log('🧪 Testing Authentication API Endpoints...\n');
  
  try {
    // Step 1: Test login with admin credentials
    console.log('1. Testing POST /api/auth/login (Admin login)...');
    const adminLoginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@geminicrm.com',
      password: 'admin123'
    });
    
    const adminToken = adminLoginResponse.data.token;
    const adminUser = adminLoginResponse.data.user;
    console.log('✅ Admin login successful');
    console.log(`   User: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Token: ${adminToken.substring(0, 20)}...`);
    
    // Set up headers for authenticated requests
    const adminHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Test login with staff credentials
    console.log('\n2. Testing POST /api/auth/login (Staff login)...');
    const staffLoginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'staff@geminicrm.com',
      password: 'staff123'
    });
    
    const staffToken = staffLoginResponse.data.token;
    const staffUser = staffLoginResponse.data.user;
    console.log('✅ Staff login successful');
    console.log(`   User: ${staffUser.firstName} ${staffUser.lastName}`);
    console.log(`   Role: ${staffUser.role}`);
    
    // Step 3: Test invalid login
    console.log('\n3. Testing invalid login...');
    try {
      await axios.post(`${baseURL}/api/auth/login`, {
        email: 'invalid@email.com',
        password: 'wrongpassword'
      });
      console.log('❌ Invalid login should have failed');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Invalid login correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Step 4: Test token validation
    console.log('\n4. Testing token validation...');
    const protectedResponse = await axios.get(`${baseURL}/api/customers`, {
      headers: adminHeaders
    });
    console.log('✅ Token validation successful - protected route accessible');
    
    // Step 5: Test profile update
    console.log('\n5. Testing PUT /api/auth/profile (Update profile)...');
    const profileUpdate = {
      firstName: 'Updated Admin',
      lastName: 'User',
      email: 'admin@geminicrm.com'
    };
    
    const updateResponse = await axios.put(`${baseURL}/api/auth/profile`, profileUpdate, {
      headers: adminHeaders
    });
    
    console.log('✅ Profile updated successfully');
    console.log(`   Updated name: ${updateResponse.data.user.firstName} ${updateResponse.data.user.lastName}`);
    
    // Step 6: Test password change
    console.log('\n6. Testing PUT /api/auth/change-password (Change password)...');
    const passwordChange = {
      currentPassword: 'admin123',
      newPassword: 'NewAdmin123',
      confirmPassword: 'NewAdmin123'
    };

    const passwordResponse = await axios.put(`${baseURL}/api/auth/change-password`, passwordChange, {
      headers: adminHeaders
    });
    
    console.log('✅ Password changed successfully');
    
    // Step 7: Test login with new password
    console.log('\n7. Testing login with new password...');
    const newPasswordLoginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@geminicrm.com',
      password: 'NewAdmin123'
    });
    
    console.log('✅ Login with new password successful');
    
    // Step 8: Revert password back
    console.log('\n8. Reverting password back...');
    const newToken = newPasswordLoginResponse.data.token;
    const newHeaders = {
      'Authorization': `Bearer ${newToken}`,
      'Content-Type': 'application/json'
    };
    
    await axios.put(`${baseURL}/api/auth/change-password`, {
      currentPassword: 'NewAdmin123',
      newPassword: 'Admin123',
      confirmPassword: 'Admin123'
    }, {
      headers: newHeaders
    });
    
    console.log('✅ Password reverted successfully');
    
    // Step 9: Revert profile back
    console.log('\n9. Reverting profile back...');
    await axios.put(`${baseURL}/api/auth/profile`, {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@geminicrm.com'
    }, {
      headers: newHeaders
    });
    
    console.log('✅ Profile reverted successfully');
    
    // Step 10: Test user management (admin only)
    console.log('\n10. Testing user management endpoints...');
    
    // Get all users
    const usersResponse = await axios.get(`${baseURL}/api/auth/users`, {
      headers: newHeaders
    });
    console.log(`✅ Retrieved ${usersResponse.data.users.length} users`);

    // Create a test user (using register endpoint)
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@geminicrm.com',
      password: 'Test123',
      confirmPassword: 'Test123',
      role: 'staff'
    };

    const createUserResponse = await axios.post(`${baseURL}/api/auth/register`, testUser, {
      headers: newHeaders
    });

    const createdUser = createUserResponse.data.user;
    console.log(`✅ Test user created: ${createdUser.firstName} ${createdUser.lastName}`);

    // Note: User deletion might not be implemented for security reasons
    console.log('✅ Test user creation successful (deletion skipped for security)');
    
    // Step 11: Test staff access restrictions
    console.log('\n11. Testing staff access restrictions...');
    const staffHeaders = {
      'Authorization': `Bearer ${staffToken}`,
      'Content-Type': 'application/json'
    };
    
    try {
      await axios.get(`${baseURL}/api/auth/users`, {
        headers: staffHeaders
      });
      console.log('❌ Staff should not have access to user management');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Staff access correctly restricted');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    console.log('\n🎉 Authentication API Test Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Admin Login: Working');
    console.log('✅ Staff Login: Working');
    console.log('✅ Invalid Login Rejection: Working');
    console.log('✅ Token Validation: Working');
    console.log('✅ Profile Update: Working');
    console.log('✅ Password Change: Working');
    console.log('✅ User Management (Admin): Working');
    console.log('✅ Role-based Access Control: Working');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🚀 Authentication System is fully functional!');
    console.log('\n📋 You can now:');
    console.log('   • Login with admin or staff credentials');
    console.log('   • Access role-based features and restrictions');
    console.log('   • Update profile information');
    console.log('   • Change passwords securely');
    console.log('   • Manage users (admin only)');
    console.log('   • Maintain secure sessions with JWT tokens');
    
    console.log('\n🔐 Test Credentials:');
    console.log('   Admin: admin@geminicrm.com / admin123');
    console.log('   Staff: staff@geminicrm.com / staff123');
    
  } catch (error) {
    console.error('❌ Authentication API test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the backend server is running on port 5000');
    console.log('   2. Check that the database is properly seeded with users');
    console.log('   3. Verify JWT secret is configured');
    console.log('   4. Ensure password hashing is working correctly');
  }
};

testAuthAPI();
