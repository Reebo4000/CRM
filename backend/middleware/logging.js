const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\nStack: ${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'crm-backend' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    }),
    
    // Access log file
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    logger.http('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });
  
  next(err);
};

// Database query logging
const dbLogger = {
  log: (message, meta = {}) => {
    logger.debug('Database query', {
      query: message,
      ...meta,
      timestamp: new Date().toISOString()
    });
  }
};

// Security event logging
const securityLogger = {
  loginAttempt: (email, success, ip, userAgent) => {
    logger.info('Login attempt', {
      email,
      success,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  rateLimitExceeded: (ip, endpoint, userAgent) => {
    logger.warn('Rate limit exceeded', {
      ip,
      endpoint,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  suspiciousActivity: (description, ip, userAgent, additionalData = {}) => {
    logger.warn('Suspicious activity detected', {
      description,
      ip,
      userAgent,
      ...additionalData,
      timestamp: new Date().toISOString()
    });
  },
  
  authFailure: (reason, ip, userAgent, additionalData = {}) => {
    logger.warn('Authentication failure', {
      reason,
      ip,
      userAgent,
      ...additionalData,
      timestamp: new Date().toISOString()
    });
  }
};

// Performance logging
const performanceLogger = {
  slowQuery: (query, duration, meta = {}) => {
    logger.warn('Slow database query detected', {
      query,
      duration: `${duration}ms`,
      ...meta,
      timestamp: new Date().toISOString()
    });
  },
  
  slowRequest: (method, url, duration, meta = {}) => {
    logger.warn('Slow request detected', {
      method,
      url,
      duration: `${duration}ms`,
      ...meta,
      timestamp: new Date().toISOString()
    });
  },
  
  memoryUsage: () => {
    const usage = process.memoryUsage();
    logger.info('Memory usage', {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
      timestamp: new Date().toISOString()
    });
  }
};

// Application event logging
const appLogger = {
  startup: (port) => {
    logger.info('Application started', {
      port,
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  },
  
  shutdown: (signal) => {
    logger.info('Application shutting down', {
      signal,
      timestamp: new Date().toISOString()
    });
  },
  
  dbConnection: (status, details = {}) => {
    logger.info('Database connection', {
      status,
      ...details,
      timestamp: new Date().toISOString()
    });
  },
  
  pdfGeneration: (success, duration, language, reportType, error = null) => {
    const level = success ? 'info' : 'error';
    logger[level]('PDF generation', {
      success,
      duration: `${duration}ms`,
      language,
      reportType,
      error: error?.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Log rotation cleanup (run daily)
const cleanupOldLogs = () => {
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  const now = Date.now();
  
  fs.readdir(logsDir, (err, files) => {
    if (err) return;
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlink(filePath, (err) => {
            if (!err) {
              logger.info('Old log file deleted', { file });
            }
          });
        }
      });
    });
  });
};

// Schedule log cleanup (run daily at 2 AM)
if (process.env.NODE_ENV === 'production') {
  setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
}

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  dbLogger,
  securityLogger,
  performanceLogger,
  appLogger
};
