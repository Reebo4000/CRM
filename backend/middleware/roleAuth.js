/**
 * Role-based authorization middleware
 * Checks if the authenticated user has the required role(s)
 */
const roleAuth = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated (should be set by auth middleware)
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Check if user has required role
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({
        error: 'Authorization failed',
        message: 'Internal server error'
      });
    }
  };
};

module.exports = roleAuth;
