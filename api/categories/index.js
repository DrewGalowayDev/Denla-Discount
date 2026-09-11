// Categories API — MySQL version
const { query } = require('../../backend/config/database');
const { setCorsHeaders, handleOptions } = require('../_utils/cors');

module.exports = async (req, res) => {
  setCorsHeaders(res, req);
  if (handleOptions(req, res)) return;

  try {
    if (req.method === 'GET') {
      const categories = await query('SELECT * FROM categories ORDER BY name');
      return res.status(200).json({
        success: true,
        count: categories.length,
        categories
      });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Categories API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};
