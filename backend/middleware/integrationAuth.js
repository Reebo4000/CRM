/**
 * Integration API Key Authentication Middleware
 * For external services like n8n/WhatsApp integration
 */

const authenticateIntegration = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'API key is required. Provide it in X-API-Key header or Authorization header.'
      });
    }

    const validApiKey = process.env.INTEGRATION_API_KEY;
    
    if (!validApiKey) {
      console.error('INTEGRATION_API_KEY not configured in environment variables');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Integration API key not configured'
      });
    }

    if (apiKey !== validApiKey) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid API key'
      });
    }

    // Add integration context to request
    req.integration = {
      source: 'external_api',
      authenticated: true,
      timestamp: new Date()
    };

    next();
  } catch (error) {
    console.error('Integration authentication error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Rate limiting for integration endpoints
 */
const integrationRateLimit = (req, res, next) => {
  // This is a simple implementation. In production, you might want to use Redis
  // or a more sophisticated rate limiting solution
  
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // 100 requests per minute

  if (!global.integrationRateLimit) {
    global.integrationRateLimit = {};
  }

  if (!global.integrationRateLimit[clientId]) {
    global.integrationRateLimit[clientId] = {
      requests: [],
      blocked: false
    };
  }

  const clientData = global.integrationRateLimit[clientId];
  
  // Clean old requests
  clientData.requests = clientData.requests.filter(timestamp => now - timestamp < windowMs);
  
  if (clientData.requests.length >= maxRequests) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Too many requests. Maximum ${maxRequests} requests per minute allowed.`,
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }

  clientData.requests.push(now);
  next();
};

module.exports = {
  authenticateIntegration,
  integrationRateLimit
};
