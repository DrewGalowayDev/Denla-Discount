// Products API — MySQL version
const { query, queryOne, generateUUID } = require('../backend/config/database');
const { setCorsHeaders, handleOptions } = require('./_utils/cors');
const jwt = require('jsonwebtoken');

function verifyAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret);
    return decoded.role === 'admin' ? decoded : null;
  } catch (e) {
    return null;
  }
}

module.exports = async (req, res) => {
  setCorsHeaders(res, req);
  if (handleOptions(req, res)) return;

  const method = req.method;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const productId = pathParts[pathParts.indexOf('products') + 1];

  try {
    // GET - Fetch products
    if (method === 'GET') {
      if (productId) {
        const product = await queryOne(
          `SELECT p.*, c.name AS category_name FROM products p
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE p.id = ?`,
          [productId]
        );
        if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
        return res.status(200).json({ success: true, product });
      }

      const limit = parseInt(url.searchParams.get('limit')) || 100;
      const products = await query(
        `SELECT p.*, c.name AS category_name FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_active = 1
         ORDER BY p.created_at DESC
         LIMIT ?`,
        [limit]
      );
      return res.status(200).json({ success: true, count: products.length, products });
    }

    // POST - Create product (Admin only)
    if (method === 'POST') {
      const admin = verifyAdmin(req);
      if (!admin) return res.status(403).json({ success: false, error: 'Admin access required' });

      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);

      if (!body.name || !body.price) {
        return res.status(400).json({ success: false, error: 'Name and price required' });
      }

      const id = generateUUID();
      const slug = String(body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const images = body.images && Array.isArray(body.images) ? JSON.stringify(body.images) : JSON.stringify(['img/product-1.png']);

      await query(
        `INSERT INTO products (id, name, slug, price, old_price, stock, category_id, \`condition\`,
         description, brand, is_featured, is_new_arrival, is_deal, images, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          id,
          String(body.name).trim(),
          slug,
          parseFloat(body.price),
          body.old_price ? parseFloat(body.old_price) : null,
          body.stock ? parseInt(body.stock) : 0,
          body.category_id || null,
          body.condition || null,
          body.description || null,
          body.brand || null,
          body.is_featured ? 1 : 0,
          body.is_new_arrival ? 1 : 0,
          body.is_deal ? 1 : 0,
          images
        ]
      );

      const product = await queryOne('SELECT * FROM products WHERE id = ?', [id]);
      return res.status(201).json({ success: true, message: 'Product created', product });
    }

    // PUT - Update product
    if (method === 'PUT' && productId) {
      const admin = verifyAdmin(req);
      if (!admin) return res.status(403).json({ success: false, error: 'Admin access required' });

      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);
      delete body.id;
      delete body.created_at;

      const fields = [];
      const values = [];
      for (const [key, val] of Object.entries(body)) {
        fields.push(`\`${key}\` = ?`);
        values.push(key === 'images' && Array.isArray(val) ? JSON.stringify(val) : val);
      }
      if (fields.length === 0) return res.status(400).json({ success: false, error: 'Nothing to update' });

      values.push(productId);
      await query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
      const product = await queryOne('SELECT * FROM products WHERE id = ?', [productId]);
      return res.status(200).json({ success: true, product });
    }

    // DELETE - Soft delete product
    if (method === 'DELETE' && productId) {
      const admin = verifyAdmin(req);
      if (!admin) return res.status(403).json({ success: false, error: 'Admin access required' });

      await query('UPDATE products SET is_active = 0 WHERE id = ?', [productId]);
      return res.status(200).json({ success: true, message: 'Product deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Products API Error:', error);
    return res.status(500).json({ success: false, error: 'Server error', message: error.message });
  }
};
