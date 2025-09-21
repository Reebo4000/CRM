# Backend Documentation

Complete guide for the Gemini CRM Node.js backend application.

## ⚙️ Overview

The backend is a robust Node.js application built with:
- **Node.js 18+** with Express.js framework
- **PostgreSQL** database with Sequelize ORM
- **JWT** authentication with bcrypt password hashing
- **Socket.io** for real-time notifications
- **Puppeteer** for PDF generation
- **Helmet** for security headers
- **Rate limiting** and input validation

## 🏗️ Architecture

### Project Structure
```
backend/
├── config/                 # Configuration files
│   ├── database.js         # Database configuration
│   └── config.js           # Application configuration
├── controllers/            # Route handlers and business logic
│   ├── authController.js   # Authentication logic
│   ├── customerController.js
│   ├── productController.js
│   ├── orderController.js
│   └── analyticsController.js
├── middleware/             # Express middleware
│   ├── auth.js             # Authentication middleware
│   ├── validation.js       # Input validation
│   ├── rateLimiter.js      # Rate limiting
│   └── errorHandler.js     # Error handling
├── models/                 # Sequelize database models
│   ├── User.js
│   ├── Customer.js
│   ├── Product.js
│   ├── Order.js
│   └── associations.js     # Model relationships
├── routes/                 # API route definitions
│   ├── auth.js
│   ├── customers.js
│   ├── products.js
│   ├── orders.js
│   └── analytics.js
├── services/               # Business logic services
│   ├── authService.js
│   ├── notificationService.js
│   ├── pdfService.js
│   └── emailService.js
├── utils/                  # Helper functions
│   ├── validators.js
│   ├── helpers.js
│   └── constants.js
├── migrations/             # Database migrations
├── seeders/               # Database seeders
├── uploads/               # File upload directory
├── server.js              # Main server entry point
└── package.json           # Dependencies and scripts
```

### Key Features
- **RESTful API**: Standard REST endpoints with proper HTTP methods
- **Authentication**: JWT-based authentication with role-based access
- **Real-time**: WebSocket support for live notifications
- **File Upload**: Secure file upload handling for product images
- **PDF Generation**: Server-side PDF report generation
- **Database**: PostgreSQL with Sequelize ORM and migrations
- **Security**: Comprehensive security measures and input validation

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure database
# Edit .env with your database credentials

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev
```

### Environment Configuration
Create `.env` file:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gemini_crm_dev
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Integration API
INTEGRATION_API_KEY=your_integration_api_key

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Gemini CRM <noreply@yourdomain.com>

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp
```

## 🗄️ Database Schema

### Core Models

#### User Model
```javascript
// models/User.js
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'staff'),
    defaultValue: 'staff'
  }
});
```

#### Customer Model
```javascript
// models/Customer.js
const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    validate: { isEmail: true }
  },
  phone: DataTypes.STRING,
  address: DataTypes.TEXT,
  totalPurchases: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  }
});
```

#### Product Model
```javascript
// models/Product.js
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: DataTypes.TEXT,
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  category: DataTypes.STRING,
  image: DataTypes.STRING
});
```

### Relationships
```javascript
// models/associations.js
// User associations
User.hasMany(Order, { foreignKey: 'createdBy' });
Order.belongsTo(User, { foreignKey: 'createdBy' });

// Customer associations
Customer.hasMany(Order, { foreignKey: 'customerId' });
Order.belongsTo(Customer, { foreignKey: 'customerId' });

// Product associations
Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

// Order associations
Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
```

## 🔐 Authentication & Security

### JWT Authentication
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};
```

### Role-based Access Control
```javascript
// middleware/auth.js
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};
```

### Security Measures
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing protection
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Comprehensive input sanitization
- **Password Hashing**: bcrypt for password security
- **SQL Injection Prevention**: Sequelize ORM protection

## 🔔 Real-time Notifications

### Socket.io Integration
```javascript
// services/notificationService.js
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Authentication middleware for Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = user;
    next();
  });
});

// Notification broadcasting
const broadcastNotification = (notification) => {
  io.emit('notification', notification);
};
```

### Notification Types
- **Order Events**: New orders, status changes, cancellations
- **Inventory Alerts**: Low stock warnings, out of stock alerts
- **Customer Events**: New customer registrations
- **System Notifications**: Maintenance, updates, announcements

## 📄 PDF Generation

### Puppeteer Integration
```javascript
// services/pdfService.js
const puppeteer = require('puppeteer');

class PDFService {
  async generateSalesReport(data, language = 'en') {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Generate HTML content
    const html = this.generateReportHTML(data, language);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' }
    });

    await browser.close();
    return pdf;
  }
}
```

## 🧪 Testing

### Test Setup
```bash
# Install testing dependencies
npm install --save-dev jest supertest

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Example Test
```javascript
// tests/auth.test.js
const request = require('supertest');
const app = require('../server');

describe('Authentication', () => {
  test('POST /api/auth/login - valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });

  test('POST /api/auth/login - invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server with nodemon
npm start               # Start production server
npm run debug           # Start with debugging enabled

# Database
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with sample data
npm run db:reset        # Reset database (drop and recreate)

# Testing
npm test               # Run test suite
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report

# Utilities
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
npm run validate       # Validate environment configuration
```

## 📊 API Response Format

### Standard Response Structure
```javascript
// Success response
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}

// Error response
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error information"
  }
}
```

## 🐛 Error Handling

### Global Error Handler
```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(error => error.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Invalid token', statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
};
```

---

**Last Updated**: July 2025  
**Node.js Version**: 18.x  
**Express Version**: 4.x  
**Sequelize Version**: 6.x
