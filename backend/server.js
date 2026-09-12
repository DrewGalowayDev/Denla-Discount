const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables from .env file in backend directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const salesRoutes = require('./routes/salesRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const mpesaRoutes = require('./mpesa/mpesa.routes');
const contactRoutes = require('./routes/contactRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware with relaxed CSP for frontend functionality
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Allow inline scripts
                "https://ajax.googleapis.com",
                "https://cdn.jsdelivr.net",
                "https://accounts.google.com",
                "https://www.gstatic.com"
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'", // Allow inline styles
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com",
                "data:"
            ],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https://accounts.google.com"],
            frameSrc: ["'self'", "https://accounts.google.com"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow localhost and local file system (including Live Server ports)
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5000',
            'http://127.0.0.1:5500',  // Live Server
            'http://localhost:5500',   // Live Server alternative
            'null'
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin === 'null') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// ─── Tiered Rate Limiting ────────────────────────────────────────────────────
// 1. Auth limiter — strict to prevent brute-force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 30,
    standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts. Please wait 15 minutes before trying again.',
        retryAfter: 15 * 60
    }
});

// 2. Public read limiter — generous for product browsing (read-only)
const publicReadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX) || 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please slow down.',
        retryAfter: 60
    }
});

// 3. General API limiter — moderate fallback for other endpoints
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again in a few minutes.',
        retryAfter: 60
    },
    // Skip rate limiting for requests that pass an authenticated token
    // (logged-in users get a bit more breathing room)
    skip: (req) => {
        const auth = req.headers.authorization;
        return !!(auth && auth.startsWith('Bearer '));
    }
});

// Apply limiters to specific routes before the route handlers are registered
app.use('/api/auth', authLimiter);          // Strict for auth
app.use('/api/products', publicReadLimiter); // Generous for product browsing
app.use('/api/categories', publicReadLimiter); // Generous for categories
app.use('/api/', generalLimiter);           // Moderate for everything else

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// ─── Static Assets with Cache Headers ────────────────────────────────────────
// Icon fonts & library assets: very long cache (1 year) — these never change
const IMMUTABLE_CACHE = { maxAge: '1y', immutable: true };
const SHORT_CACHE     = { maxAge: '1d' };

// Serve icon fonts and libraries with long-lived cache
app.use('/lib/fontawesome', express.static(path.join(__dirname, '../public/lib/fontawesome'), IMMUTABLE_CACHE));
app.use('/lib/bootstrap-icons', express.static(path.join(__dirname, '../public/lib/bootstrap-icons'), IMMUTABLE_CACHE));

// Other libraries with standard cache
app.use('/lib', express.static(path.join(__dirname, '../public/lib'), SHORT_CACHE));

// CSS and JS with 1-day cache
app.use('/css', express.static(path.join(__dirname, '../public/css'), SHORT_CACHE));
app.use('/js', express.static(path.join(__dirname, '../public/js'), SHORT_CACHE));

// Images with moderate cache
app.use('/img', express.static(path.join(__dirname, '../public/img'), { maxAge: '7d' }));

// Serve everything else (HTML pages — no cache so updates are always seen)
app.use(express.static(path.join(__dirname, '../public'), { maxAge: 0 }));


// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/contact', contactRoutes);

// Root endpoint - Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Denla Discount POS API',
        version: '2.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            products: '/api/products',
            categories: '/api/categories',
            sales: '/api/sales',
            users: '/api/users',
            payments: '/api/payments'
        }
    });
});

// Catch-all route - serve index.html for client-side routing
app.get('*', (req, res, next) => {
    // Skip if it's an API route or asset
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/img/') || 
        req.path.startsWith('/css/') || 
        req.path.startsWith('/js/') || 
        req.path.startsWith('/lib/') ||
        req.path.includes('.')) {
        return next();
    }
    // Serve index.html for all other routes
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📍 Frontend URL: http://localhost:${PORT}`);
    console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`\n✨ Opening browser...`);
    
    // Auto-open browser in development mode
    if (process.env.NODE_ENV === 'development') {
        setTimeout(async () => {
            try {
                const openModule = await import('open');
                await openModule.default(`http://localhost:${PORT}`);
            } catch (err) {
                console.log('Could not open browser automatically. Please open http://localhost:' + PORT + ' manually.');
            }
        }, 1000);
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

module.exports = app;
