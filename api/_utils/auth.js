const jwt = require('jsonwebtoken');
const { queryOne } = require('./database');

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Extract token from request
function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Middleware to protect routes
async function authenticateToken(req) {
  const token = getTokenFromRequest(req);
  
  if (!token) {
    return { authenticated: false, error: 'No token provided' };
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return { authenticated: false, error: 'Invalid or expired token' };
  }

  // Get user from database
  try {
    const user = await queryOne(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!user) {
      return { authenticated: false, error: 'User not found' };
    }

    if (!user.is_active) {
      return { authenticated: false, error: 'User account is deactivated' };
    }

    return { authenticated: true, user };
  } catch (error) {
    console.error('Auth error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
}

// Check if user is admin
function isAdmin(user) {
  return user && user.role === 'admin';
}

module.exports = {
  verifyToken,
  getTokenFromRequest,
  authenticateToken,
  isAdmin
};
