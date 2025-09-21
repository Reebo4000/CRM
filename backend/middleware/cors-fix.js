/**
 * Enhanced CORS Middleware
 * Ensures Access-Control-Allow-Origin header is always present
 * Addresses the specific error: "No 'Access-Control-Allow-Origin' header is present on the requested resource"
 */

const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Log CORS request for debugging
  console.log(`CORS Request - Origin: ${origin}, Method: ${req.method}, URL: ${req.url}`);
  
  // Define allowed origins
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000'
  ];
  
  // Determine which origin to allow
  let allowedOrigin = '*';
  
  if (origin) {
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      allowedOrigin = origin;
    }
    // For development, allow any localhost origin
    else if (process.env.NODE_ENV === 'development' && 
             (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      allowedOrigin = origin;
    }
    // For development, allow all origins
    else if (process.env.NODE_ENV === 'development') {
      allowedOrigin = origin;
    }
  }
  
  // Set CORS headers - ALWAYS set these headers
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control,X-File-Name');
  res.header('Access-Control-Expose-Headers', 'X-RateLimit-Limit,X-RateLimit-Remaining,X-RateLimit-Reset');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('Handling preflight OPTIONS request');
    res.status(200).end();
    return;
  }
  
  console.log(`CORS Headers Set - Allow-Origin: ${allowedOrigin}`);
  next();
};

// Error handler that ensures CORS headers are set even for errors
const corsErrorHandler = (err, req, res, next) => {
  const origin = req.headers.origin;
  
  // Ensure CORS headers are set for error responses
  if (!res.headersSent) {
    let allowedOrigin = '*';
    
    if (origin) {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173'
      ];
      
      if (allowedOrigins.includes(origin) || 
          (process.env.NODE_ENV === 'development' && 
           (origin.includes('localhost') || origin.includes('127.0.0.1')))) {
        allowedOrigin = origin;
      }
    }
    
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  next(err);
};

module.exports = {
  corsMiddleware,
  corsErrorHandler
};
