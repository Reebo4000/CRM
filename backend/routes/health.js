const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { logger } = require('../middleware/logging');

/**
 * Health check endpoint for monitoring
 * Returns system status and basic metrics
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  try {
    // Database connectivity check
    try {
      await sequelize.authenticate();
      healthCheck.checks.database = {
        status: 'OK',
        message: 'Database connection successful'
      };
    } catch (error) {
      healthCheck.status = 'ERROR';
      healthCheck.checks.database = {
        status: 'ERROR',
        message: 'Database connection failed',
        error: error.message
      };
    }

    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    // Memory warning if heap usage > 80% of total
    const memoryWarning = (memoryUsageMB.heapUsed / memoryUsageMB.heapTotal) > 0.8;
    
    healthCheck.checks.memory = {
      status: memoryWarning ? 'WARNING' : 'OK',
      usage: memoryUsageMB,
      message: memoryWarning ? 'High memory usage detected' : 'Memory usage normal'
    };

    // Disk space check (basic)
    const fs = require('fs');
    try {
      const stats = fs.statSync('./');
      healthCheck.checks.disk = {
        status: 'OK',
        message: 'Disk accessible'
      };
    } catch (error) {
      healthCheck.status = 'ERROR';
      healthCheck.checks.disk = {
        status: 'ERROR',
        message: 'Disk access failed',
        error: error.message
      };
    }

    // Response time check
    const responseTime = Date.now() - startTime;
    healthCheck.checks.responseTime = {
      status: responseTime > 1000 ? 'WARNING' : 'OK',
      value: `${responseTime}ms`,
      message: responseTime > 1000 ? 'Slow response time' : 'Response time normal'
    };

    // Overall status determination
    const hasErrors = Object.values(healthCheck.checks).some(check => check.status === 'ERROR');
    const hasWarnings = Object.values(healthCheck.checks).some(check => check.status === 'WARNING');
    
    if (hasErrors) {
      healthCheck.status = 'ERROR';
    } else if (hasWarnings) {
      healthCheck.status = 'WARNING';
    }

    // Log health check if there are issues
    if (healthCheck.status !== 'OK') {
      logger.warn('Health check issues detected', healthCheck);
    }

    // Return appropriate HTTP status
    const httpStatus = healthCheck.status === 'ERROR' ? 503 : 200;
    res.status(httpStatus).json(healthCheck);

  } catch (error) {
    logger.error('Health check failed', { error: error.message, stack: error.stack });
    
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * Detailed system metrics endpoint (admin only)
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        dbDialect: process.env.DB_DIALECT
      }
    };

    // Database metrics
    try {
      const dbMetrics = await sequelize.query('SELECT version();', { type: sequelize.QueryTypes.SELECT });
      metrics.database = {
        status: 'connected',
        version: dbMetrics[0].version,
        dialect: sequelize.getDialect()
      };
    } catch (error) {
      metrics.database = {
        status: 'error',
        error: error.message
      };
    }

    res.json(metrics);
  } catch (error) {
    logger.error('Metrics endpoint failed', { error: error.message });
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
});

/**
 * Readiness probe endpoint
 * Returns 200 when application is ready to serve traffic
 */
router.get('/ready', async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate();
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Liveness probe endpoint
 * Returns 200 if application is alive
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
