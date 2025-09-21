# API Integration Examples - Gemini CRM

## 🔗 Complete API Integration Guide

### Base Configuration

```javascript
// Common configuration for all API calls
const CRM_CONFIG = {
  baseURL: 'http://localhost:5000/api',
  apiKey: process.env.GEMINI_CRM_API_KEY,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
};

const headers = {
  'X-API-Key': CRM_CONFIG.apiKey,
  'Content-Type': 'application/json'
};
```

## 👥 Customer Management APIs

### 1. Customer Lookup by Phone/Telegram ID

```javascript
// N8N HTTP Request Node Configuration
{
  "method": "GET",
  "url": "http://localhost:5000/api/integration/customers",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "X-API-Key",
        "value": "={{ $env.GEMINI_CRM_API_KEY }}"
      }
    ]
  },
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "phone",
        "value": "={{ $json.userContext.phone }}"
      },
      {
        "name": "telegramId",
        "value": "={{ $json.userContext.telegramId }}"
      }
    ]
  }
}

// Expected Response
{
  "success": true,
  "customer": {
    "id": 123,
    "firstName": "أحمد",
    "lastName": "محمد",
    "email": "ahmed@example.com",
    "phone": "01234567890",
    "address": "شارع النيل، القاهرة",
    "city": "القاهرة",
    "totalPurchases": 1500.00,
    "createdAt": "2024-01-15T10:30:00Z",
    "lastOrderDate": "2024-01-20T14:20:00Z"
  }
}
```

### 2. Create New Customer

```javascript
// N8N HTTP Request Node Configuration
{
  "method": "POST",
  "url": "http://localhost:5000/api/integration/customers",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "X-API-Key",
        "value": "={{ $env.GEMINI_CRM_API_KEY }}"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "contentType": "json",
  "jsonBody": {
    "firstName": "{{ $json.userContext.userName.split(' ')[0] }}",
    "lastName": "{{ $json.userContext.userName.split(' ').slice(1).join(' ') || 'غير محدد' }}",
    "phone": "{{ $json.userContext.phone || 'telegram_' + $json.userContext.telegramId }}",
    "email": null,
    "address": "Telegram User",
    "city": "غير محدد",
    "notes": "Customer created via Telegram Bot - ID: {{ $json.userContext.telegramId }}"
  }
}

// Expected Response
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": 124,
    "firstName": "سارة",
    "lastName": "أحمد",
    "phone": "telegram_987654321",
    "email": null,
    "address": "Telegram User",
    "city": "غير محدد",
    "totalPurchases": 0.00,
    "createdAt": "2024-01-21T09:15:00Z"
  }
}
```

### 3. Get Customer Purchase History

```javascript
// N8N HTTP Request Node Configuration
{
  "method": "GET",
  "url": "http://localhost:5000/api/integration/customers/{{ $json.customerId }}/orders",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "X-API-Key",
        "value": "={{ $env.GEMINI_CRM_API_KEY }}"
      }
    ]
  },
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "limit",
        "value": "10"
      },
      {
        "name": "status",
        "value": "completed"
      }
    ]
  }
}

// Expected Response
{
  "success": true,
  "orders": [
    {
      "id": 456,
      "orderDate": "2024-01-20T14:20:00Z",
      "totalAmount": 750.00,
      "status": "completed",
      "orderItems": [
        {
          "productId": 1,
          "productName": "شنطة يد كلاسيكية",
          "quantity": 1,
          "unitPrice": 299.99,
          "totalPrice": 299.99
        },
        {
          "productId": 5,
          "productName": "حذاء رياضي نسائي",
          "quantity": 1,
          "unitPrice": 450.00,
          "totalPrice": 450.00
        }
      ]
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

## 🛍️ Product Management APIs

### 4. Get Available Products

```javascript
// N8N HTTP Request Node Configuration
{
  "method": "GET",
  "url": "http://localhost:5000/api/integration/products",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "X-API-Key",
        "value": "={{ $env.GEMINI_CRM_API_KEY }}"
      }
    ]
  },
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "limit",
        "value": "50"
      },
      {
        "name": "inStock",
        "value": "true"
      },
      {
        "name": "category",
        "value": "{{ $json.requestedCategory || '' }}"
      },
      {
        "name": "minPrice",
        "value": "{{ $json.minPrice || '' }}"
      },
      {
        "name": "maxPrice",
        "value": "{{ $json.maxPrice || '' }}"
      }
    ]
  }
}

// Expected Response
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "شنطة يد كلاسيكية",
      "description": "شنطة يد أنيقة مصنوعة من الجلد الطبيعي",
      "price": 299.99,
      "stockQuantity": 15,
      "category": "حقائب",
      "brand": "إليجانت",
      "color": "أسود",
      "material": "جلد طبيعي",
      "imagePath": "/uploads/products/handbag-classic-001.jpg",
      "createdAt": "2024-01-10T08:00:00Z"
    },
    {
      "id": 2,
      "name": "حذاء رياضي نسائي",
      "description": "حذاء رياضي مريح للاستخدام اليومي",
      "price": 450.00,
      "stockQuantity": 8,
      "category": "أحذية",
      "brand": "سبورت لايف",
      "color": "أبيض",
      "material": "قماش وجلد",
      "imagePath": "/uploads/products/sneakers-women-002.jpg",
      "createdAt": "2024-01-12T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

### 5. Get Product by ID with Details

```javascript
// N8N HTTP Request Node Configuration
{
  "method": "GET",
  "url": "http://localhost:5000/api/integration/products/{{ $json.productId }}",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "X-API-Key",
        "value": "={{ $env.GEMINI_CRM_API_KEY }}"
      }
    ]
  }
}

// Expected Response
{
  "success": true,
  "product": {
    "id": 1,
    "name": "شنطة يد كلاسيكية",
    "description": "شنطة يد أنيقة مصنوعة من الجلد الطبيعي عالي الجودة. مناسبة للاستخدام اليومي والمناسبات الرسمية. تحتوي على عدة جيوب داخلية لتنظيم المحتويات.",
    "price": 299.99,
    "stockQuantity": 15,
    "category": "حقائب",
    "brand": "إليجانت",
    "color": "أسود",
    "material": "جلد طبيعي",
    "imagePath": "/uploads/products/handbag-classic-001.jpg",
    "dimensions": "30cm x 25cm x 15cm",
    "weight": "0.8kg",
    "features": [
      "جلد طبيعي عالي الجودة",
      "جيوب داخلية متعددة",
      "حزام قابل للتعديل",
      "إغلاق بسحاب آمن"
    ],
    "salesCount": 45,
    "averageRating": 4.7,
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-20T15:30:00Z"
  }
}
```

### 6. Search Products by Keywords

```javascript
// N8N HTTP Request Node Configuration
{
  "method": "GET",
  "url": "http://localhost:5000/api/integration/products/search",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "X-API-Key",
        "value": "={{ $env.GEMINI_CRM_API_KEY }}"
      }
    ]
  },
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "q",
        "value": "{{ $json.searchQuery }}"
      },
      {
        "name": "limit",
        "value": "10"
      },
      {
        "name": "inStock",
        "value": "true"
      }
    ]
  }
}

// Example: Search for "شنطة"
// Expected Response
{
  "success": true,
  "query": "شنطة",
  "results": [
    {
      "id": 1,
      "name": "شنطة يد كلاسيكية",
      "price": 299.99,
      "category": "حقائب",
      "imagePath": "/uploads/products/handbag-classic-001.jpg",
      "relevanceScore": 0.95
    },
    {
      "id": 4,
      "name": "شنطة ظهر رياضية",
      "price": 180.00,
      "category": "حقائب",
      "imagePath": "/uploads/products/backpack-sport-004.jpg",
      "relevanceScore": 0.88
    }
  ],
  "totalResults": 2
}
```

## 📦 Order Management APIs

### 7. Create New Order

```javascript
// N8N HTTP Request Node Configuration
{
  "method": "POST",
  "url": "http://localhost:5000/api/integration/orders",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "X-API-Key",
        "value": "={{ $env.GEMINI_CRM_API_KEY }}"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "contentType": "json",
  "jsonBody": {
    "customerId": "{{ $json.customerId }}",
    "orderItems": [
      {
        "productId": "{{ $json.selectedProducts[0].id }}",
        "quantity": "{{ $json.selectedProducts[0].quantity }}",
        "unitPrice": "{{ $json.selectedProducts[0].price }}"
      }
    ],
    "notes": "Order created via Telegram Bot",
    "source": "telegram_bot"
  }
}

// Expected Response
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "id": 789,
    "customerId": 123,
    "orderDate": "2024-01-21T11:45:00Z",
    "totalAmount": 299.99,
    "status": "pending",
    "orderItems": [
      {
        "id": 1001,
        "productId": 1,
        "productName": "شنطة يد كلاسيكية",
        "quantity": 1,
        "unitPrice": 299.99,
        "totalPrice": 299.99
      }
    ],
    "notes": "Order created via Telegram Bot",
    "estimatedDelivery": "2024-01-23T12:00:00Z"
  }
}
```

### 8. Get Order Status

```javascript
// N8N HTTP Request Node Configuration
{
  "method": "GET",
  "url": "http://localhost:5000/api/integration/orders/{{ $json.orderId }}",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "X-API-Key",
        "value": "={{ $env.GEMINI_CRM_API_KEY }}"
      }
    ]
  }
}

// Expected Response
{
  "success": true,
  "order": {
    "id": 789,
    "customerId": 123,
    "customerName": "أحمد محمد",
    "orderDate": "2024-01-21T11:45:00Z",
    "totalAmount": 299.99,
    "status": "processing",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2024-01-21T11:45:00Z",
        "note": "Order received"
      },
      {
        "status": "processing",
        "timestamp": "2024-01-21T14:30:00Z",
        "note": "Order being prepared"
      }
    ],
    "estimatedDelivery": "2024-01-23T12:00:00Z",
    "trackingNumber": "TRK123456789",
    "orderItems": [
      {
        "productId": 1,
        "productName": "شنطة يد كلاسيكية",
        "quantity": 1,
        "unitPrice": 299.99,
        "totalPrice": 299.99
      }
    ]
  }
}
```

## 🖼️ Image and Media APIs

### 9. Get Product Image URL

```javascript
// N8N Code Node for Image URL Processing
const getProductImageUrl = (imagePath) => {
  if (!imagePath) {
    return 'https://via.placeholder.com/300x300?text=No+Image';
  }
  
  const baseUrl = 'http://localhost:5000';
  
  // Handle relative paths
  if (imagePath.startsWith('/uploads/')) {
    return `${baseUrl}${imagePath}`;
  }
  
  // Handle full URLs
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Default case
  return `${baseUrl}/uploads/products/${imagePath}`;
};

// Usage in workflow
const productImageUrl = getProductImageUrl($json.product.imagePath);

return {
  ...input.all()[0].json,
  productImageUrl: productImageUrl
};
```

### 10. Send Product Image via Telegram

```javascript
// N8N Telegram Node Configuration for Sending Photo
{
  "resource": "message",
  "operation": "sendPhoto",
  "chatId": "={{ $json.chatId }}",
  "binaryData": false,
  "photo": "{{ $json.productImageUrl }}",
  "additionalFields": {
    "caption": "🛍️ <b>{{ $json.productName }}</b>\n💰 السعر: {{ $json.productPrice }} جنيه\n📦 متوفر في المخزن: {{ $json.stockQuantity }} قطعة\n\n{{ $json.productDescription }}",
    "parse_mode": "HTML",
    "reply_markup": {
      "inline_keyboard": [
        [
          {
            "text": "🛒 أضف للسلة",
            "callback_data": "add_to_cart_{{ $json.productId }}"
          },
          {
            "text": "ℹ️ تفاصيل أكثر",
            "callback_data": "product_details_{{ $json.productId }}"
          }
        ],
        [
          {
            "text": "📞 اتصل بنا",
            "callback_data": "contact_support"
          }
        ]
      ]
    }
  }
}
```

## 🔍 Analytics and Reporting APIs

### 11. Get Customer Analytics

```javascript
// N8N HTTP Request Node Configuration
{
  "method": "GET",
  "url": "http://localhost:5000/api/integration/analytics/customer/{{ $json.customerId }}",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "X-API-Key",
        "value": "={{ $env.GEMINI_CRM_API_KEY }}"
      }
    ]
  },
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "period",
        "value": "6months"
      }
    ]
  }
}

// Expected Response
{
  "success": true,
  "analytics": {
    "customerId": 123,
    "totalOrders": 5,
    "totalSpent": 1750.00,
    "averageOrderValue": 350.00,
    "favoriteCategories": [
      {
        "category": "حقائب",
        "orderCount": 3,
        "totalSpent": 850.00
      },
      {
        "category": "أحذية",
        "orderCount": 2,
        "totalSpent": 900.00
      }
    ],
    "lastOrderDate": "2024-01-20T14:20:00Z",
    "customerSince": "2023-08-15T10:00:00Z",
    "loyaltyLevel": "gold",
    "recommendedProducts": [1, 5, 8, 12]
  }
}
```

## 🚨 Error Handling Examples

### 12. API Error Response Handling

```javascript
// N8N Code Node for Error Handling
const handleApiResponse = (response) => {
  try {
    // Check if response is successful
    if (response.success) {
      return {
        success: true,
        data: response.data || response.customer || response.product || response.order,
        message: response.message
      };
    }
    
    // Handle different error types
    const errorHandlers = {
      'CUSTOMER_NOT_FOUND': () => ({
        error: 'customer_not_found',
        userMessage: 'لم نتمكن من العثور على بياناتك. سنقوم بإنشاء حساب جديد لك.',
        shouldCreateCustomer: true
      }),
      
      'PRODUCT_OUT_OF_STOCK': () => ({
        error: 'out_of_stock',
        userMessage: 'عذراً، هذا المنتج غير متوفر حالياً. يمكنني اقتراح منتجات مشابهة.',
        shouldSuggestAlternatives: true
      }),
      
      'INVALID_API_KEY': () => ({
        error: 'auth_failed',
        userMessage: 'عذراً، حدث خطأ في النظام. يرجى المحاولة مرة أخرى.',
        shouldNotifyAdmin: true
      }),
      
      'RATE_LIMIT_EXCEEDED': () => ({
        error: 'rate_limited',
        userMessage: 'يرجى الانتظار قليلاً قبل إرسال طلب آخر.',
        retryAfter: 60
      })
    };
    
    const errorCode = response.error || response.errorCode || 'UNKNOWN_ERROR';
    const handler = errorHandlers[errorCode] || errorHandlers['UNKNOWN_ERROR'];
    
    return {
      success: false,
      ...handler(),
      originalError: response
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'processing_error',
      userMessage: 'عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.',
      originalError: error.message
    };
  }
};

// Usage
const result = handleApiResponse($input.first().json);
return result;
```

This comprehensive API integration guide provides all the necessary examples and configurations for seamlessly integrating your N8N workflow with the Gemini CRM system.
