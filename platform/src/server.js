require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const logger = require('./config/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Initialize Firebase Admin SDK (for push notifications)
const { initializeFirebase } = require('./config/firebase');
initializeFirebase();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const deliveryBoyRoutes = require('./routes/deliveryBoyRoutes');
const accessControlRoutes = require('./routes/accessControlRoutes');
const customerRegistryRoutes = require('./routes/customerRegistryRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }

        // Check if origin is in allowed list (supports wildcard patterns like https://*.domain.com)
        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed.includes('*')) {
                const pattern = allowed.replace(/\*/g, '[^.]+').replace(/\./g, '\\.');
                return new RegExp(`^${pattern}$`).test(origin);
            }
            return allowed === origin;
        });

        if (isAllowed) {
            return callback(null, true);
        }

        // In development, be more permissive
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        // Reject in production
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    }));
}

// Static files (for uploaded receipts)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customer', customerRoutes); // Alias for singular form
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/delivery-boys', deliveryBoyRoutes);
app.use('/api/access-control', accessControlRoutes);
app.use('/api/customer-registry', customerRegistryRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/config', require('./routes/configRoutes'));
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/admin-dashboard', adminDashboardRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`PharmaPay API server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

module.exports = app;
