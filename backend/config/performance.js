/**
 * Performance optimization configuration for production
 */

const compression = require('compression');

// Compression middleware configuration
const compressionConfig = {
  // Only compress responses that are larger than this threshold
  threshold: 1024,
  
  // Compression level (1-9, higher = better compression but slower)
  level: 6,
  
  // Only compress these MIME types
  filter: (req, res) => {
    // Don't compress if the request includes a Cache-Control no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    
    // Use compression filter function
    return compression.filter(req, res);
  }
};

// Database connection pool optimization
const dbPoolConfig = {
  max: process.env.NODE_ENV === 'production' ? 20 : 5,
  min: process.env.NODE_ENV === 'production' ? 5 : 1,
  acquire: 30000,
  idle: 10000,
  evict: 1000,
  handleDisconnects: true
};

// Cache configuration for static assets
const cacheConfig = {
  // Cache static assets for 1 year
  staticAssets: {
    maxAge: '1y',
    etag: true,
    lastModified: true
  },
  
  // Cache API responses for 5 minutes
  apiResponses: {
    maxAge: '5m',
    etag: true
  },
  
  // Cache images for 30 days
  images: {
    maxAge: '30d',
    etag: true,
    immutable: true
  }
};

// Request timeout configuration
const timeoutConfig = {
  // General API timeout
  api: 30000, // 30 seconds
  
  // PDF generation timeout (longer due to processing time)
  pdf: 120000, // 2 minutes
  
  // File upload timeout
  upload: 60000, // 1 minute
  
  // Database query timeout
  database: 30000 // 30 seconds
};

// Memory usage optimization
const memoryConfig = {
  // Limit request body size
  bodyLimit: '10mb',
  
  // Limit file upload size
  fileLimit: '5mb',
  
  // Enable garbage collection optimization
  gcOptimization: process.env.NODE_ENV === 'production'
};

// Logging configuration for production
const loggingConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  
  // Skip logging for health checks and static assets
  skip: (req, res) => {
    return req.url === '/api/health' || 
           req.url.startsWith('/uploads/') ||
           req.url.startsWith('/static/');
  }
};

// WebSocket optimization
const socketConfig = {
  // Connection timeout
  pingTimeout: 60000,
  pingInterval: 25000,
  
  // Maximum connections per IP
  maxConnections: process.env.NODE_ENV === 'production' ? 10 : 100,
  
  // Enable compression for WebSocket messages
  compression: true,
  
  // Heartbeat configuration
  heartbeat: {
    interval: 30000,
    timeout: 5000
  }
};

// PDF generation optimization
const pdfConfig = {
  // Puppeteer launch options for production
  launchOptions: {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--memory-pressure-off',
      '--max_old_space_size=4096'
    ]
  },
  
  // PDF generation timeout
  timeout: 120000,
  
  // Maximum concurrent PDF generations
  maxConcurrent: 3,
  
  // Page optimization
  pageOptions: {
    width: 1200,
    height: 800,
    deviceScaleFactor: 1
  }
};

// API response optimization
const apiOptimization = {
  // Enable response compression
  compression: true,
  
  // Enable ETag for caching
  etag: true,
  
  // Remove unnecessary headers
  removeHeaders: [
    'X-Powered-By',
    'Server'
  ],
  
  // JSON response optimization
  jsonSpaces: process.env.NODE_ENV === 'production' ? 0 : 2,
  
  // Enable response caching for GET requests
  cacheGetRequests: process.env.NODE_ENV === 'production'
};

module.exports = {
  compressionConfig,
  dbPoolConfig,
  cacheConfig,
  timeoutConfig,
  memoryConfig,
  loggingConfig,
  socketConfig,
  pdfConfig,
  apiOptimization
};
