# Integration API Documentation

This API provides secure endpoints for external integrations like n8n workflows and WhatsApp automation.

## Authentication

All integration endpoints require an API key for authentication. Include the API key in one of the following ways:

1. **X-API-Key Header** (Recommended):
   ```
   X-API-Key: your_integration_api_key_here
   ```

2. **Authorization Header**:
   ```
   Authorization: Bearer your_integration_api_key_here
   ```

## Rate Limiting

- **Limit**: 100 requests per minute per IP address
- **Response**: HTTP 429 when limit exceeded

## Base URL

```
http://localhost:5000/api/integration
```

## Endpoints

### Health Check

**GET** `/health`

Check if the integration API is running.

**Response:**
```json
{
  "success": true,
  "message": "Integration API is healthy",
  "timestamp": "2024-07-02T23:30:00.000Z",
  "version": "1.0.0"
}
```

### Customers

#### Create Customer

**POST** `/customers`

Create a new customer in the system.

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@email.com",
  "phone": "+1234567890",
  "address": "123 Main Street",
  "city": "New York",
  "postalCode": "10001",
  "dateOfBirth": "1990-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer created successfully",
  "customer": {
    "id": 1,
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@email.com",
    "phone": "+1234567890",
    "address": "123 Main Street",
    "city": "New York",
    "postalCode": "10001",
    "dateOfBirth": "1990-01-15",
    "createdAt": "2024-07-02T23:30:00.000Z",
    "updatedAt": "2024-07-02T23:30:00.000Z"
  }
}
```

#### Get Customer

**GET** `/customers?phone=+1234567890` or `/customers?email=jane.doe@email.com`

Retrieve customer information by phone or email.

**Query Parameters:**
- `phone` (optional): Customer's phone number
- `email` (optional): Customer's email address

**Response:**
```json
{
  "success": true,
  "message": "Customer retrieved successfully",
  "customer": {
    "id": 1,
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@email.com",
    "phone": "+1234567890",
    "orders": [...]
  }
}
```

### Products

#### Create Product

**POST** `/products`

Add a new product to the inventory.

**Request Body:**
```json
{
  "name": "Designer Handbag",
  "description": "Beautiful leather handbag",
  "price": 199.99,
  "stockQuantity": 50,
  "category": "Handbags",
  "brand": "LuxeBrand",
  "color": "Black",
  "material": "Leather"
}
```

#### Get Products

**GET** `/products?category=Handbags&inStock=true&limit=20`

Retrieve products with optional filtering.

**Query Parameters:**
- `category` (optional): Filter by product category
- `inStock` (optional): Filter by stock availability (true/false)
- `limit` (optional): Maximum number of products to return (default: 50)

#### Update Inventory

**PUT** `/products/{productId}/inventory`

Update product stock quantity.

**Request Body:**
```json
{
  "quantity": 10,
  "operation": "add",
  "reason": "New stock received"
}
```

**Operations:**
- `set`: Set stock to exact quantity
- `add`: Add quantity to current stock
- `subtract`: Subtract quantity from current stock

### Orders

#### Create Order

**POST** `/orders`

Create a new order. You can either provide an existing customer ID or customer information to create a new customer.

**Option 1: Existing Customer**
```json
{
  "customerId": 1,
  "orderItems": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 3,
      "quantity": 1
    }
  ],
  "notes": "Order from WhatsApp"
}
```

**Option 2: New Customer**
```json
{
  "customerInfo": {
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+1987654321",
    "email": "john.smith@email.com"
  },
  "orderItems": [
    {
      "productId": 1,
      "quantity": 1
    }
  ],
  "notes": "New customer order via WhatsApp"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": 1,
    "customerId": 1,
    "userId": 1,
    "orderDate": "2024-07-02T23:30:00.000Z",
    "totalAmount": 199.99,
    "status": "pending",
    "notes": "Order from WhatsApp",
    "customer": {...},
    "orderItems": [...]
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message",
  "details": [...] // Optional validation details
}
```

**Common HTTP Status Codes:**
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid API key)
- `404`: Not Found (resource doesn't exist)
- `409`: Conflict (duplicate resource)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Example n8n Workflow

Here's how you might use this API in an n8n workflow:

1. **WhatsApp Trigger**: Customer sends message
2. **HTTP Request**: GET `/customers?phone={{$node["WhatsApp Trigger"].json["from"]}}`
3. **IF Node**: Check if customer exists
4. **HTTP Request**: POST `/customers` (if new customer)
5. **HTTP Request**: POST `/orders` with customer and product info
6. **WhatsApp Response**: Send confirmation message

## Security Notes

- Keep your API key secure and never expose it in client-side code
- Use HTTPS in production
- Monitor API usage and set up alerts for unusual activity
- Rotate API keys regularly
