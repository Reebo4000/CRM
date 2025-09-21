# CRM System - Complete API Endpoints Reference

## 🔗 Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://yourdomain.com/api`

## 🔐 Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📋 Complete API Endpoints List

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| GET | `/auth/profile` | Get current user profile | Yes |
| PUT | `/auth/profile` | Update user profile | Yes |
| PUT | `/auth/change-password` | Change password | Yes |
| GET | `/auth/verify` | Verify JWT token | Yes |
| GET | `/auth/users` | Get all users (Admin) | Yes (Admin) |
| POST | `/auth/users` | Create user (Admin) | Yes (Admin) |
| GET | `/auth/users/:id` | Get user by ID (Admin) | Yes (Admin) |
| PUT | `/auth/users/:id` | Update user (Admin) | Yes (Admin) |
| DELETE | `/auth/users/:id` | Delete user (Admin) | Yes (Admin) |

### 👥 Customers (`/api/customers`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/customers` | Get all customers | Yes |
| GET | `/customers/statistics` | Get customer statistics | Yes |
| GET | `/customers/:id` | Get customer by ID | Yes |
| POST | `/customers` | Create new customer | Yes |
| PUT | `/customers/:id` | Update customer | Yes |
| DELETE | `/customers/:id` | Delete customer (Admin) | Yes (Admin) |
| GET | `/customers/:id/orders` | Get customer orders | Yes |

### 📦 Products (`/api/products`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | Get all products | Yes |
| GET | `/products/statistics` | Get product statistics | Yes |
| GET | `/products/categories` | Get product categories | Yes |
| POST | `/products/categories` | Create category (Admin) | Yes (Admin) |
| GET | `/products/low-stock` | Get low stock products | Yes |
| GET | `/products/:id` | Get product by ID | Yes |
| POST | `/products` | Create product (Admin) | Yes (Admin) |
| PUT | `/products/:id` | Update product (Admin) | Yes (Admin) |
| PUT | `/products/:id/stock` | Update stock (Admin) | Yes (Admin) |
| DELETE | `/products/:id` | Delete product (Admin) | Yes (Admin) |

### 🛒 Orders (`/api/orders`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/orders` | Get all orders | Yes |
| GET | `/orders/statistics` | Get order statistics | Yes |
| GET | `/orders/:id` | Get order by ID | Yes |
| POST | `/orders` | Create new order | Yes |
| PUT | `/orders/:id` | Update order | Yes |
| PUT | `/orders/:id/status` | Update order status | Yes |
| DELETE | `/orders/:id` | Delete order (Admin) | Yes (Admin) |

### 📊 Analytics (`/api/analytics`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/analytics/sales` | Get sales analytics | Yes |
| GET | `/analytics/customers` | Get customer analytics | Yes |
| GET | `/analytics/products` | Get product analytics | Yes |
| GET | `/analytics/operations` | Get operations analytics | Yes |
| GET | `/analytics/dashboard` | Get dashboard analytics | Yes |
| GET | `/analytics/export-pdf` | Export PDF report | Yes |

### 🔔 Notifications (`/api/notifications`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notifications` | Get user notifications | Yes |
| GET | `/notifications/unread-count` | Get unread count | Yes |
| PATCH | `/notifications/:id/read` | Mark as read | Yes |
| PATCH | `/notifications/mark-all-read` | Mark all as read | Yes |
| GET | `/notifications/preferences` | Get preferences | Yes |
| PUT | `/notifications/preferences` | Update preferences | Yes |
| POST | `/notifications/broadcast` | Broadcast (Admin) | Yes (Admin) |
| POST | `/notifications/test` | Send test (Admin) | Yes (Admin) |
| GET | `/notifications/statistics` | Get stats (Admin) | Yes (Admin) |

### 🏥 Health & Monitoring (`/api/health`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | System health check | No |
| GET | `/health/metrics` | System metrics (Admin) | Yes (Admin) |
| GET | `/health/ready` | Readiness probe | No |
| GET | `/health/live` | Liveness probe | No |

### 📁 File Uploads (`/api/uploads`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/uploads/:filename` | Serve uploaded files | No |

### 🔗 Integration API (`/api/integration`)
**Note**: Uses API Key authentication instead of JWT
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/integration/health` | Integration health | API Key |
| POST | `/integration/customers` | Create customer | API Key |
| GET | `/integration/customers` | Get customer by phone/email | API Key |
| POST | `/integration/products` | Create product | API Key |
| GET | `/integration/products` | Get products | API Key |
| PUT | `/integration/products/:id/inventory` | Update inventory | API Key |
| POST | `/integration/orders` | Create order | API Key |

## 📝 Query Parameters

### Common Parameters
- `page` - Page number for pagination (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `search` - Search term for filtering
- `startDate` - Start date for date range filtering (YYYY-MM-DD)
- `endDate` - End date for date range filtering (YYYY-MM-DD)

### Product-specific Parameters
- `category` - Filter by product category
- `lowStock` - Filter low stock products (boolean)
- `inStock` - Filter in-stock products (boolean)

### Order-specific Parameters
- `status` - Filter by order status (pending, processing, completed, cancelled)
- `customerId` - Filter by customer ID

### Analytics Parameters
- `period` - Time period grouping (daily, weekly, monthly, yearly)
- `reportType` - Report type (overview, sales, customers, products, operations)
- `language` - Language for PDF export (en, ar)

### Notification Parameters
- `unreadOnly` - Show only unread notifications (boolean)
- `type` - Filter by notification type

## 🔒 Authentication Types

### JWT Bearer Token
Used for most API endpoints:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key
Used for integration endpoints:
```http
X-API-Key: your-integration-api-key-here
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🚀 Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **PDF Export**: 8 requests per 5 minutes per IP
- **Integration API**: 60 requests per minute per API key

## 📱 WebSocket Events

### Connection
- **URL**: `ws://localhost:5000` or `wss://yourdomain.com`
- **Authentication**: Send JWT token after connection

### Events
- `notification` - New notification received
- `order_created` - New order created
- `order_updated` - Order status changed
- `low_stock_alert` - Product stock is low
- `user_activity` - User activity updates

## 🔧 Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Validation Error - Input validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## 📋 Postman Collections

Import these collections into Postman:
1. `postman/CRM_API_Collection.json` - Main API endpoints
2. `postman/CRM_API_Collection_Part2.json` - Orders & Analytics
3. `postman/CRM_API_Collection_Part3.json` - Notifications & Health
4. `postman/CRM_API_Collection_Integration.json` - Integration API

## 🔗 Environment Variables

Set these variables in Postman:
- `base_url` - API base URL
- `auth_token` - JWT token (auto-set after login)
- `integration_api_key` - API key for integration endpoints
