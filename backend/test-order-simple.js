const axios = require('axios');

const testOrderSimple = async () => {
  const baseURL = 'http://localhost:5000';
  
  try {
    // Login
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'admin@geminicrm.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Get first customer and product
    const [customersResponse, productsResponse] = await Promise.all([
      axios.get(`${baseURL}/api/customers?limit=1`, { headers: authHeaders }),
      axios.get(`${baseURL}/api/products?limit=1`, { headers: authHeaders })
    ]);
    
    const customer = customersResponse.data.customers[0];
    const product = productsResponse.data.products[0];
    
    console.log('Customer:', customer.id, customer.firstName, customer.lastName);
    console.log('Product:', product.id, product.name, 'Price:', product.price, 'Stock:', product.stockQuantity);
    
    // Try to create order
    const orderData = {
      customerId: customer.id,
      orderItems: [
        {
          productId: product.id,
          quantity: 1
        }
      ],
      notes: 'Simple test order'
    };
    
    console.log('Sending order data:', JSON.stringify(orderData, null, 2));
    
    const createResponse = await axios.post(`${baseURL}/api/orders`, orderData, {
      headers: authHeaders
    });
    
    console.log('✅ Order created successfully:', createResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    }
    if (error.config) {
      console.error('Request config:', {
        method: error.config.method,
        url: error.config.url,
        data: error.config.data
      });
    }
  }
};

testOrderSimple();
