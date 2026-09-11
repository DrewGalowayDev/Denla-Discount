// Allowed origins for CORS (add your production domains)
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'https://awesome-technologies.vercel.app',
  'https://awesometechnologies.co.ke',
  'https://www.awesometechnologies.co.ke'
];

// CORS headers helper with origin validation
function setCorsHeaders(res, req) {
  const origin = req?.headers?.origin;
  
  // Check if origin is allowed or if in development
  if (origin && (ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV === 'development')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // For same-origin requests or when origin header is absent
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
}

// Handle OPTIONS requests
function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, req);
    res.status(200).end();
    return true;
  }
  return false;
}

module.exports = {
  setCorsHeaders,
  handleOptions,
  ALLOWED_ORIGINS
};
