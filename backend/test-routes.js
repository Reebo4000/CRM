const express = require('express');
const app = express();

// Load the auth routes
const authRoutes = require('./routes/auth');

// Mount the routes
app.use('/api/auth', authRoutes);

// List all registered routes
function listRoutes(app) {
  const routes = [];
  
  app._router.stack.forEach(function(middleware) {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach(function(handler) {
        if (handler.route) {
          const method = Object.keys(handler.route.methods)[0].toUpperCase();
          const path = middleware.regexp.source
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '')
            .replace(/\\\//g, '/')
            .replace(/\$.*/, '');
          routes.push({
            method: method,
            path: path + handler.route.path
          });
        }
      });
    }
  });
  
  return routes;
}

console.log('Registered routes:');
const routes = listRoutes(app);
routes.forEach(route => {
  console.log(`${route.method} ${route.path}`);
});

console.log('\nLooking for user-related routes:');
routes.filter(route => route.path.includes('users')).forEach(route => {
  console.log(`${route.method} ${route.path}`);
});
