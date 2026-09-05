/**
 * Authentication and Authorization Middleware
 * 
 * Concepts Demonstrated:
 * 1. Bearer Token Authentication: Extracting JWT from HTTP `Authorization` headers.
 * 2. Express Middleware Pipeline: Halting requests with 401/403 status codes before they hit protected controller handlers.
 * 3. Role-Based Access Control (RBAC): Higher-order middleware function `authorize(...roles)` that enforces user permissions.
 */

const jwt = require('jsonwebtoken');

// Middleware to verify JWT Access Token
const authenticate = (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    return next(new Error('Access denied. No authentication token provided.'));
  }

  try {
    // Verify token using JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach decoded user info ({ id, role, email }) to request object
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401);
    return next(new Error('Invalid or expired authentication token.'));
  }
};

// Middleware factory for Role-Based Access Control (RBAC)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`Access forbidden. Role '${req.user.role}' is not authorized to access this resource.`)
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
