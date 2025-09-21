# API Authentication & Security

Complete authentication and security guide for the Gemini CRM API.

## 🔐 Authentication Overview

The Gemini CRM API uses JWT (JSON Web Token) authentication for secure access control. All protected endpoints require a valid JWT token in the request headers.

### Base URLs
- **Development**: `http://localhost:5000/api`
- **Production**: `https://yourdomain.com/api`

## 🚀 Getting Started

### 1. User Registration
```http
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "role": "staff"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "staff"
  }
}
```

### 2. User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@geminicrm.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@geminicrm.com",
    "role": "admin"
  }
}
```

### 3. Using Authentication Token
Include the JWT token in the Authorization header for all protected endpoints:

```http
GET /customers
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔑 Token Management

### Token Verification
```http
GET /auth/verify
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@geminicrm.com",
    "role": "admin"
  }
}
```

### Token Refresh
Tokens expire after 7 days by default. Users need to login again to get a new token.

### Logout
While there's no explicit logout endpoint, clients should:
1. Remove the token from local storage
2. Clear any cached user data
3. Redirect to login page

## 👤 User Profile Management

### Get Current User Profile
```http
GET /auth/profile
Authorization: Bearer <your-jwt-token>
```

### Update User Profile
```http
PUT /auth/profile
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com"
}
```

### Change Password
```http
PUT /auth/change-password
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

## 👥 Role-Based Access Control

### User Roles

#### Admin Role
- Full system access
- User management capabilities
- All CRUD operations
- System configuration access

#### Staff Role
- Customer management
- Product viewing (read-only inventory)
- Order management
- Limited reporting access

### Permission Checking
The API automatically checks user permissions based on their role. Insufficient permissions result in a 403 Forbidden response.

## 🔒 Security Features

### Password Security
- **Hashing**: bcrypt with salt rounds
- **Minimum Requirements**: 6 characters (configurable)
- **No Plain Text Storage**: Passwords are never stored in plain text

### JWT Security
- **Secret Key**: Strong secret key for token signing
- **Expiration**: Configurable token expiration (default: 7 days)
- **Algorithm**: HS256 (HMAC with SHA-256)

### Rate Limiting
- **Authentication Endpoints**: 5 requests per 15 minutes per IP
- **General API**: 100 requests per 15 minutes per IP
- **Integration API**: 100 requests per minute per API key

## 🛡️ Error Handling

### Authentication Errors

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

#### 422 Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## 🔧 Implementation Examples

### JavaScript/Axios Example
```javascript
// Login and store token
const login = async (email, password) => {
  try {
    const response = await axios.post('/api/auth/login', {
      email,
      password
    });

    // Store token
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Set up axios interceptor for authentication
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### React Hook Example
```javascript
// useAuth hook
import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }

    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 🧪 Testing Authentication

### Test User Accounts
```javascript
// Default test accounts (development only)
const testAccounts = {
  admin: {
    email: 'admin@geminicrm.com',
    password: 'admin123',
    role: 'admin'
  },
  staff: {
    email: 'staff@geminicrm.com',
    password: 'staff123',
    role: 'staff'
  }
};
```

### Postman Testing
1. **Login Request**: Save token from login response
2. **Set Environment Variable**: Store token as `{{auth_token}}`
3. **Use in Requests**: Add `Authorization: Bearer {{auth_token}}`

---

**Last Updated**: July 2025
**JWT Version**: Latest
**Security Level**: Production Ready


**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for name or email
- `sortBy` (optional): Sort field (firstName, lastName, email, createdAt)
- `sortOrder` (optional): Sort direction (asc, desc)

**Response:**
```json
{
  "success": true,
  "customers": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@email.com",
      "phone": "1234567890",
      "address": "123 Main St",
      "city": "New York",
      "postalCode": "10001",
      "dateOfBirth": "1990-01-01",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

### Create Customer
```http
POST /customers
Content-Type: application/json
Authorization: Bearer <token>

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@email.com",
  "phone": "0987654321",
  "address": "456 Oak Ave",
  "city": "Los Angeles",
  "postalCode": "90210",
  "dateOfBirth": "1985-05-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer created successfully",
  "customer": {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@email.com",
    "phone": "0987654321",
    "address": "456 Oak Ave",
    "city": "Los Angeles",
    "postalCode": "90210",
    "dateOfBirth": "1985-05-15",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Customer Details
```http
GET /customers/:id
Authorization: Bearer <token>
```

### Update Customer
```http
PUT /customers/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "1111111111"
}
```

### Delete Customer (Admin Only)
```http
DELETE /customers/:id
Authorization: Bearer <token>
```

### Get Customer Order History
```http
GET /customers/:id/orders
Authorization: Bearer <token>
```

## Product Management

### List Products
```http
GET /products?page=1&limit=10&search=handbag&category=Evening&sortBy=name
```

**Query Parameters:**
- `page`, `limit`, `search`, `sortBy`, `sortOrder`: Same as customers
- `category` (optional): Filter by product category
- `minPrice`, `maxPrice` (optional): Price range filter
- `inStock` (optional): Filter by stock availability (true/false)

### Create Product
```http
POST /products
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Elegant Evening Clutch",
  "description": "A sophisticated evening clutch perfect for special occasions",
  "price": 149.99,
  "stockQuantity": 25,
  "category": "Evening Bags",
  "brand": "Gemini Collection",
  "color": "Black",
  "material": "Satin"
}
```

### Update Product Stock
```http
PUT /products/:id/stock
Content-Type: application/json
Authorization: Bearer <token>

{
  "quantity": 10,
  "operation": "add",
  "reason": "New inventory received"
}
```

**Operations:**
- `add`: Increase stock
- `subtract`: Decrease stock
- `set`: Set absolute stock level

## Order Management

### List Orders
```http
GET /orders?page=1&limit=10&status=pending&customerId=1
```

**Query Parameters:**
- `status` (optional): Filter by order status (pending, processing, shipped, delivered, cancelled)
- `customerId` (optional): Filter by customer ID
- `startDate`, `endDate` (optional): Date range filter (YYYY-MM-DD)

### Create Order

#### Option 1: Create Order with Existing Customer
```http
POST /orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "customerId": 1,
  "orderItems": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 149.99
    },
    {
      "productId": 2,
      "quantity": 1,
      "unitPrice": 89.99
    }
  ],
  "notes": "Customer requested gift wrapping"
}
```

#### Option 2: Create Order with New Customer (Auto-create)
```http
POST /orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "customerInfo": {
    "name": "John Smith"
  },
  "orderItems": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": 149.99
    }
  ],
  "notes": "New customer order"
}
```

**Note:** When using `customerInfo.name`, the system will automatically create a new customer with the provided name and default values for other fields. The customer will be created with email format: `customer{id}@geminicrm.com`

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": 1,
    "customerId": 1,
    "totalAmount": 389.97,
    "status": "pending",
    "notes": "Customer requested gift wrapping",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "customer": {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@email.com"
    },
    "orderItems": [
      {
        "id": 1,
        "productId": 1,
        "quantity": 2,
        "unitPrice": 149.99,
        "totalPrice": 299.98,
        "product": {
          "id": 1,
          "name": "Elegant Evening Clutch",
          "category": "Evening Bags"
        }
      }
    ]
  }
}
```

### Update Order Status
```http
PUT /orders/:id/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "processing"
}
```

**Valid Statuses:**
- `pending`: Order placed, awaiting processing
- `processing`: Order being prepared
- `shipped`: Order shipped to customer
- `delivered`: Order delivered successfully
- `cancelled`: Order cancelled

## User Management (Admin Only)

### List Users
```http
GET /auth/users
Authorization: Bearer <token>
```

### Register New User
```http
POST /auth/register
Content-Type: application/json
Authorization: Bearer <token>

{
  "firstName": "New",
  "lastName": "User",
  "email": "new.user@geminicrm.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "role": "staff"
}
```

### Update Profile
```http
PUT /auth/profile
Content-Type: application/json
Authorization: Bearer <token>

{
  "firstName": "Updated",
  "lastName": "Name",
  "email": "updated.email@geminicrm.com"
}
```

### Change Password
```http
PUT /auth/change-password
Content-Type: application/json
Authorization: Bearer <token>

{
  "currentPassword": "oldpassword",
  "newPassword": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}
```

## Notification System

### Get Notifications
```http
GET /notifications?page=1&limit=10&unreadOnly=true
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`, `limit`: Pagination parameters
- `unreadOnly` (optional): Filter to show only unread notifications (true/false)

### Mark Notification as Read
```http
PUT /notifications/:id/read
Authorization: Bearer <token>
```

### Mark All Notifications as Read
```http
PUT /notifications/mark-all-read
Authorization: Bearer <token>
```

### Get Notification Preferences
```http
GET /notifications/preferences
Authorization: Bearer <token>
```

### Update Notification Preferences
```http
PUT /notifications/preferences
Content-Type: application/json
Authorization: Bearer <token>

{
  "emailNotifications": true,
  "pushNotifications": false,
  "orderNotifications": true,
  "inventoryNotifications": true,
  "customerNotifications": false
}
```

## Analytics & Reports

### Get Analytics Data
```http
GET /analytics?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

### Export PDF Report
```http
GET /analytics/pdf?startDate=2024-01-01&endDate=2024-12-31&lang=en
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate`, `endDate`: Date range for the report (YYYY-MM-DD)
- `lang` (optional): Language for the report (en/ar, default: en)

**Response:** PDF file download with filename format: `Analytics_Report_YYYY-MM-DD.pdf`

## Integration API

For external integrations (n8n, WhatsApp), use the `X-API-Key` header instead of JWT:

```
X-API-Key: your-integration-api-key
```

### Health Check
```http
GET /integration/health
X-API-Key: your-integration-api-key
```

### Integration Endpoints
```http
GET /integration/customers    # List customers for integration
POST /integration/customers   # Create customer via integration
GET /integration/products     # List products for integration
POST /integration/orders      # Create order via integration
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Please check your input data",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate data)
- `500`: Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address. Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

All list endpoints support pagination with consistent response format:

```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Data Validation

### Customer Validation Rules
- `firstName`: Required, 2-50 characters
- `lastName`: Required, 2-50 characters
- `email`: Valid email format, unique
- `phone`: Required, 10-15 digits, unique
- `address`: Optional, max 500 characters
- `city`: Optional, max 50 characters
- `postalCode`: Optional, max 10 characters
- `dateOfBirth`: Valid date, not in future

### Product Validation Rules
- `name`: Required, 2-100 characters, unique
- `description`: Optional, max 1000 characters
- `price`: Required, positive number, max 99999.99
- `stockQuantity`: Required, non-negative integer
- `category`: Required, 2-50 characters
- `brand`: Optional, max 50 characters
- `color`: Optional, max 30 characters
- `material`: Optional, max 50 characters

### Order Validation Rules
- `customerId`: Required, valid customer ID
- `orderItems`: Required, non-empty array
- `orderItems[].productId`: Required, valid product ID
- `orderItems[].quantity`: Required, positive integer
- `notes`: Optional, max 500 characters

## Testing

The API can be tested using tools like Postman, curl, or any HTTP client. All endpoints follow RESTful conventions and return consistent JSON responses.

### Example Test Workflow:
1. Login to get authentication token
2. Create a customer
3. Create a product
4. Create an order
5. Update order status
6. Test notification system

## Support

For API support and questions:
- Check the error response details
- Verify authentication tokens
- Ensure proper request format
- Contact: support@geminicrm.com
