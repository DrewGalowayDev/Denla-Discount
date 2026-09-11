// Health check endpoint — MySQL version
const { query } = require('../backend/config/database');
const { setCorsHeaders, handleOptions } = require('./_utils/cors');

module.exports = async (req, res) => {
  setCorsHeaders(res, req);
  if (handleOptions(req, res)) return;

  const status = {
    timestamp: new Date().toISOString(),
    environment: {
      hasDbHost: !!process.env.DB_HOST,
      hasDbUser: !!process.env.DB_USER,
      hasDbName: !!process.env.DB_NAME,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV || 'not set'
    },
    database: { connected: false, productCount: null, error: null },
    api: { status: 'ok', method: req.method }
  };

  try {
    const rows = await query('SELECT COUNT(*) AS cnt FROM products');
    status.database.connected = true;
    status.database.productCount = rows[0]?.cnt ?? 0;
  } catch (err) {
    status.database.connected = false;
    status.database.error = err.message;
  }

  res.status(200).json(status);
};
