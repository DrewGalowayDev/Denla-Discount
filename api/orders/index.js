// Orders API — MySQL version
const { query, queryOne, generateUUID } = require('../../backend/config/database');
const { setCorsHeaders, handleOptions } = require('../_utils/cors');
const { authenticateToken, isAdmin } = require('../_utils/auth');

module.exports = async (req, res) => {
  setCorsHeaders(res, req);
  if (handleOptions(req, res)) return;

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname.includes('/admin/all')) {
      return getAdminOrders(req, res);
    }

    if (req.method === 'GET') {
      const authResult = authenticateToken(req);
      if (!authResult.authenticated) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      let sql, params;
      if (isAdmin(authResult.user)) {
        sql = `SELECT o.*, u.email, u.name FROM orders o
               LEFT JOIN users u ON o.user_id = u.id
               ORDER BY o.created_at DESC`;
        params = [];
      } else {
        sql = `SELECT o.*, u.email, u.name FROM orders o
               LEFT JOIN users u ON o.user_id = u.id
               WHERE o.user_id = ?
               ORDER BY o.created_at DESC`;
        params = [authResult.user.id];
      }

      const orders = await query(sql, params);

      // Fetch order items for each order
      for (const order of orders) {
        order.order_items = await query(
          `SELECT oi.*, p.name AS product_name, p.images FROM order_items oi
           LEFT JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [order.id]
        );
      }

      return res.status(200).json({ success: true, count: orders.length, data: orders });
    }

    if (req.method === 'POST') {
      const authResult = authenticateToken(req);
      if (!authResult.authenticated) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { items, total, shippingAddress, paymentMethod } = req.body;

      const orderId = generateUUID();
      await query(
        `INSERT INTO orders (id, user_id, total_amount, shipping_address, payment_method, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [orderId, authResult.user.id, total, JSON.stringify(shippingAddress), paymentMethod]
      );

      if (items && items.length > 0) {
        for (const item of items) {
          const itemId = generateUUID();
          await query(
            'INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
            [itemId, orderId, item.product_id, item.quantity, item.price]
          );
        }
      }

      const order = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
      return res.status(201).json({ success: true, data: order });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Orders API error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

async function getAdminOrders(req, res) {
  try {
    const orders = await query(
      `SELECT id, user_id, total_amount, status, shipping_address, payment_method, created_at, updated_at
       FROM orders ORDER BY created_at DESC`
    );
    res.status(200).json(orders || []);
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ success: false, error: 'Server error', message: error.message });
  }
}
