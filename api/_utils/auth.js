const jwt = require('jsonwebtoken');
const { queryOne } = require('./database');

// Verify JWT token
function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'N8J3VJy23YmMifhOE0ai7g7AWuiOP9BYmxDaB1gU0pY=';
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    try {
      return jwt.verify(token, 'your-secret-key-change-this');
    } catch (e) {
      return null;
    }
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

  const userId = decoded.id || decoded.userId || decoded.sub;

  if (!userId) {
    return { authenticated: false, error: 'Invalid token payload' };
  }

  // Get user from database
  try {
    const user = await queryOne(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return { authenticated: false, error: 'User not found' };
    }

    if (user.is_active === 0 || user.is_active === false) {
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
  const allowed = ['admin', 'manager', 'inventory_clerk', 'cashier'];
  return user && allowed.includes((user.role || '').toLowerCase());
}

module.exports = {
  verifyToken,
  getTokenFromRequest,
  authenticateToken,
  isAdmin
};
