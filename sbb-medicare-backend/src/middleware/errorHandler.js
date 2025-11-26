const logger = require('../config/logger');
const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
    logger.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Default error
    let statusCode = err.statusCode || 500;
    let errorCode = 'SERVER_ERROR';
    let message = err.message || 'Internal server error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        message = 'Validation error: ' + err.message;
    }

    // PostgreSQL errors
    if (err.code === '23505') { // Unique violation
        statusCode = 409;
        errorCode = 'DUPLICATE_RESOURCE';
        if (err.detail && err.detail.includes('email')) {
            errorCode = 'DUPLICATE_EMAIL';
            message = 'Email already exists';
        } else if (err.detail && err.detail.includes('mobile')) {
            errorCode = 'DUPLICATE_MOBILE';
            message = 'Mobile number already exists';
        } else {
            message = 'Resource already exists';
        }
    }

    if (err.code === '23503') { // Foreign key violation
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
        message = 'Referenced resource does not exist';
    }

    // Handle custom error codes
    if (err.message === 'NOT_FOUND') {
        statusCode = 404;
        errorCode = 'NOT_FOUND';
        message = 'Resource not found';
    }

    if (err.message === 'FORBIDDEN') {
        statusCode = 403;
        errorCode = 'FORBIDDEN';
        message = 'Insufficient permissions';
    }

    if (err.message === 'INVALID_CREDENTIALS') {
        statusCode = 401;
        errorCode = 'INVALID_CREDENTIALS';
        message = 'Invalid email/mobile or password';
    }

    if (err.message === 'INACTIVE_USER') {
        statusCode = 403;
        errorCode = 'INACTIVE_USER';
        message = 'User account is inactive';
    }

    if (err.message === 'INVALID_STATUS_TRANSITION') {
        statusCode = 400;
        errorCode = 'INVALID_STATUS_TRANSITION';
        message = 'Invalid order status transition';
    }

    if (err.message === 'CONFLICT') {
        statusCode = 409;
        errorCode = 'CONFLICT';
        message = 'Another order is already in transit for this delivery boy';
    }

    if (err.message === 'CUSTOMER_HAS_ORDERS') {
        statusCode = 400;
        errorCode = 'CUSTOMER_HAS_ORDERS';
        message = 'Cannot delete customer with existing orders';
    }

    if (err.message === 'DELIVERY_BOY_NOT_APPROVED') {
        statusCode = 400;
        errorCode = 'DELIVERY_BOY_NOT_APPROVED';
        message = 'Delivery boy is not approved';
    }

    if (err.message === 'DELIVERY_BOY_NOT_AVAILABLE') {
        statusCode = 400;
        errorCode = 'DELIVERY_BOY_NOT_AVAILABLE';
        message = 'Delivery boy is not active';
    }

    if (err.message === 'INVALID_PAYMENT_AMOUNT') {
        statusCode = 400;
        errorCode = 'INVALID_PAYMENT_AMOUNT';
        message = 'Payment amount does not match order total';
    }

    res.status(statusCode).json(errorResponse(errorCode, message));
};

// 404 handler
const notFoundHandler = (req, res) => {
    res.status(404).json(errorResponse('NOT_FOUND', 'Route not found'));
};

module.exports = {
    errorHandler,
    notFoundHandler,
};
