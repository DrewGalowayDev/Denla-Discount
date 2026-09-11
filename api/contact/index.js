// Contact API — MySQL version
const { query, generateUUID } = require('../../backend/config/database');
const { setCorsHeaders, handleOptions } = require('../_utils/cors');
const { authenticateToken, isAdmin } = require('../_utils/auth');

module.exports = async (req, res) => {
  setCorsHeaders(res, req);
  if (handleOptions(req, res)) return;

  try {
    if (req.method === 'POST') {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      const id = generateUUID();
      await query(
        `INSERT INTO contact_messages (id, name, email, subject, message, status)
         VALUES (?, ?, ?, ?, ?, 'unread')`,
        [id, name, email, subject, message]
      );
      const row = await require('../../backend/config/database').queryOne('SELECT * FROM contact_messages WHERE id = ?', [id]);

      return res.status(201).json({ success: true, message: 'Message sent successfully', data: row });
    }

    if (req.method === 'GET') {
      const authResult = authenticateToken(req);
      if (!authResult.authenticated) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      if (!isAdmin(authResult.user)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }

      const messages = await query('SELECT * FROM contact_messages ORDER BY created_at DESC');
      return res.status(200).json({ success: true, count: messages.length, data: messages });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
