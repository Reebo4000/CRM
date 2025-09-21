# API Documentation

Complete API reference for the Gemini CRM system.

## 📋 API Overview

The Gemini CRM API provides comprehensive REST endpoints for managing customers, products, orders, users, and system integrations. All endpoints return JSON responses and use standard HTTP status codes.

### Base URLs
- **Development**: `http://localhost:5000/api`
- **Docker Development**: `http://localhost:5000/api`
- **Docker Production**: `http://localhost/api`
- **Manual Production**: `https://yourdomain.com/api`

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📚 Documentation Sections

### [Complete API Endpoints](./endpoints.md)
Comprehensive list of all available API endpoints with parameters, responses, and examples.

### [Authentication & Security](./authentication.md)
Detailed authentication documentation including:
- User registration and login
- JWT token management
- Role-based access control
- Security best practices

### [Integration API](./integration.md)
External integration endpoints for:
- n8n workflow automation
- WhatsApp integration
- Third-party system connections

## 🚀 Quick Start

1. **Authentication**: Start by logging in to get a JWT token
2. **Explore Endpoints**: Use the [endpoints reference](./endpoints.md) to find the API you need
3. **Test with Postman**: Import the provided Postman collections from `/postman/`
4. **Integration**: Use the [integration API](./integration.md) for external systems

## 📦 Postman Collections

Import these collections into Postman for easy API testing:
- `postman/CRM_API_Collection.json` - Main API endpoints (Auth, Customers, Products)
- `postman/CRM_API_Collection_Part2.json` - Orders & Analytics
- `postman/CRM_API_Collection_Part3.json` - Notifications & Health
- `postman/CRM_API_Collection_Integration.json` - Integration API

## 🔒 Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **Integration API**: 100 requests per minute per API key

## 📊 Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "pagination": {
    // Pagination info (for paginated endpoints)
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  }
}
```

## 🔧 Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Validation Error - Input validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## 🛠️ Development Tools

### API Testing
- Use Postman collections for comprehensive testing
- Enable CORS for local development
- Check network tab in browser dev tools for debugging

### Error Handling
- Always check the `success` field in responses
- Handle rate limiting with exponential backoff
- Implement proper error logging and user feedback

## 📞 Support

For API-related questions:
1. Check the specific endpoint documentation
2. Review the authentication requirements
3. Test with Postman collections
4. Check server logs for detailed error information

---

**Last Updated**: January 2025
**API Version**: 1.0.0
