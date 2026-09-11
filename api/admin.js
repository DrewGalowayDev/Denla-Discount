// Admin API — MySQL version
const { query, generateUUID } = require('../backend/config/database');
const { setCorsHeaders, handleOptions } = require('./_utils/cors');
const { verifyToken } = require('./_utils/auth');

module.exports = async (req, res) => {
  setCorsHeaders(res, req);
  if (handleOptions(req, res)) return;

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const adminIndex = pathname.indexOf('/admin/');
    const path = adminIndex !== -1 ? pathname.substring(adminIndex + 7) : '';

    const authResult = verifyToken(req);
    if (!authResult.success) {
      return res.status(401).json({ success: false, error: authResult.error });
    }
    if (authResult.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    if (path === 'users' || path === 'users/') return handleUsers(req, res);
    if (path === 'activity' || path === 'activity/') return handleActivity(req, res);
    if (path === 'wishlist' || path === 'wishlist/') return handleWishlist(req, res);

    return res.status(404).json({ error: 'Admin endpoint not found', path, available: ['users', 'activity', 'wishlist'] });
  } catch (error) {
    console.error('Admin routing error:', error);
    return res.status(500).json({ success: false, error: 'Server error', message: error.message });
  }
};

async function handleUsers(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    const users = await query('SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC');
    return res.status(200).json({ success: true, users: users || [] });
  } catch (error) {
    console.error('Users error:', error);
    return res.status(500).json({ success: false, error: 'Server error', message: error.message });
  }
}

async function handleActivity(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
  return res.status(200).json({ success: true, activity: [], onlineUsers: [] });
}

async function handleWishlist(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
  try {
    const wishlist = await query('SELECT id, user_id, product_id, created_at FROM wishlist ORDER BY created_at DESC');
    return res.status(200).json({ success: true, wishlists: wishlist || [] });
  } catch (error) {
    console.error('Wishlist error:', error);
    return res.status(500).json({ success: false, error: 'Server error', message: error.message });
  }
}
