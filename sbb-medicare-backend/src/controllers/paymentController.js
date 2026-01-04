const Payment = require('../models/Payment');
const Order = require('../models/Order');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Create payment
exports.createPayment = async (req, res, next) => {
    try {
        const {
            order_id,
            payment_mode,
            cash_amount,
            bank_amount,
            total_amount,
            receipt_image,
            transaction_reference
        } = req.body;

        // Verify order exists and is delivered
        const order = await Order.findById(order_id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status !== 'delivered') {
            return res.status(400).json({ error: 'Payment can only be created for delivered orders' });
        }

        // Check if payment already exists
        const existingPayment = await Payment.findByOrderId(order_id);
        if (existingPayment) {
            return res.status(409).json({ error: 'Payment already exists for this order' });
        }

        // Validate payment amounts
        if (payment_mode === 'cash' && (!cash_amount || bank_amount)) {
            return res.status(400).json({ error: 'Invalid amounts for cash payment' });
        }
        if (payment_mode === 'bank' && (!bank_amount || cash_amount)) {
            return res.status(400).json({ error: 'Invalid amounts for bank payment' });
        }
        if (payment_mode === 'split' && (!cash_amount || !bank_amount)) {
            return res.status(400).json({ error: 'Both cash and bank amounts required for split payment' });
        }

        const payment = await Payment.create({
            order_id,
            payment_mode,
            cash_amount: cash_amount || 0,
            bank_amount: bank_amount || 0,
            total_amount,
            receipt_image,
            transaction_reference,
            collected_by: req.user.id
        });

        logger.info('Payment created', {
            paymentId: payment.id,
            orderId: order_id,
            amount: total_amount,
            collectedBy: req.user.id
        });

        res.status(201).json({
            message: 'Payment recorded successfully',
            payment
        });
    } catch (error) {
        next(error);
    }
};

// Get payment by order ID
exports.getPaymentByOrderId = async (req, res, next) => {
    try {
        const payment = await Payment.findByOrderId(req.params.orderId);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found for this order' });
        }

        res.json({ payment });
    } catch (error) {
        next(error);
    }
};

// Get all payments
exports.getAllPayments = async (req, res, next) => {
    try {
        const { payment_mode, collected_by, date_from, date_to } = req.query;

        const filters = {};
        if (payment_mode) filters.payment_mode = payment_mode;
        if (collected_by) filters.collected_by = collected_by;
        if (date_from) filters.date_from = date_from;
        if (date_to) filters.date_to = date_to;

        const payments = await Payment.findAll(filters);

        res.json({ payments, count: payments.length });
    } catch (error) {
        next(error);
    }
};

// Get payment statistics
exports.getPaymentStatistics = async (req, res, next) => {
    try {
        const { date_from, date_to } = req.query;

        if (!date_from || !date_to) {
            return res.status(400).json({ error: 'date_from and date_to are required' });
        }

        const statistics = await Payment.getStatistics(date_from, date_to);

        res.json({ statistics });
    } catch (error) {
        next(error);
    }
};

// Get payments for current delivery boy
exports.getMyPayments = async (req, res, next) => {
    try {
        const { date_from, date_to } = req.query;

        const filters = { collected_by: req.user.id };
        if (date_from) filters.date_from = date_from;
        if (date_to) filters.date_to = date_to;

        const payments = await Payment.findAll(filters);

        res.json({ payments, count: payments.length });
    } catch (error) {
        next(error);
    }
};

// Collect payment (simplified endpoint)
exports.collectPayment = async (req, res, next) => {
    try {
        // Support both field names: amount/total_amount
        const amount = req.body.amount || req.body.total_amount;
        const order_id = req.body.order_id;
        let payment_mode = (req.body.payment_mode || 'CASH').toUpperCase();
        const transaction_reference = req.body.transaction_reference;
        
        // Normalize payment_mode to match database enum (CASH, CARD, UPI, BANK_TRANSFER, SPLIT)
        if (payment_mode === 'CASH') {
            payment_mode = 'CASH';
        } else if (payment_mode === 'CARD') {
            payment_mode = 'CARD';
        } else if (payment_mode === 'UPI') {
            payment_mode = 'UPI';
        } else if (payment_mode === 'BANK' || payment_mode === 'BANK_TRANSFER') {
            payment_mode = 'BANK_TRANSFER';
        } else if (payment_mode === 'SPLIT') {
            payment_mode = 'SPLIT';
        }

        // Validation
        if (!order_id) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Order ID is required'));
        }
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Valid amount is required'));
        }
        if (!['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'SPLIT'].includes(payment_mode)) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Payment mode must be CASH, CARD, UPI, BANK_TRANSFER, or SPLIT'));
        }

        // Verify order exists
        const order = await Order.findById(order_id);
        if (!order) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
        }

        // Check if order is assigned to this delivery boy (if user is delivery boy)
        if (req.user.role === 'delivery_boy' && order.assigned_delivery_boy_id !== req.user.userId) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Order not assigned to you'));
        }

        // Get payment summary to check remaining amount
        const paymentSummary = await Payment.getPaymentSummary(order_id);
        if (!paymentSummary) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
        }

        // Check if payment amount exceeds remaining amount
        const totalAmount = parseFloat(amount);
        if (totalAmount > paymentSummary.remaining_amount) {
            return res.status(400).json(errorResponse('INVALID_AMOUNT', `Payment amount (${totalAmount}) exceeds remaining amount (${paymentSummary.remaining_amount})`));
        }

        // Handle receipt photo from file upload or base64
        let receipt_photo_url = null;
        if (req.file) {
            receipt_photo_url = `/uploads/${req.file.filename}`;
        } else if (req.body.receipt_image) {
            receipt_photo_url = req.body.receipt_image;
        }

        // Prepare payment data
        let cash_amount = 0;
        let bank_amount = 0;

        if (payment_mode === 'CASH') {
            cash_amount = totalAmount;
        } else if (payment_mode === 'CARD' || payment_mode === 'UPI' || payment_mode === 'BANK_TRANSFER') {
            bank_amount = totalAmount;
        } else if (payment_mode === 'SPLIT') {
            // For split, expect cash_amount and bank_amount in request
            cash_amount = parseFloat(req.body.cash_amount || 0);
            bank_amount = parseFloat(req.body.bank_amount || 0);
            if (!cash_amount || !bank_amount || (cash_amount + bank_amount) !== totalAmount) {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'For split payment, both cash_amount and bank_amount are required and must equal the total amount'));
            }
        }

        // Create payment
        const payment = await Payment.create({
            order_id,
            payment_mode,
            cash_amount,
            bank_amount,
            transaction_reference: transaction_reference || null,
            receipt_photo_url,
            created_by: req.user.userId // Delivery boy ID (BIGINT)
        });

        // Get updated payment summary
        const updatedSummary = await Payment.getPaymentSummary(order_id);

        logger.info('Payment collected', {
            paymentId: payment.id,
            orderId: order_id,
            amount: totalAmount,
            paymentMode: payment_mode,
            collectedBy: req.user.userId,
            role: req.user.role,
            remainingAmount: updatedSummary.remaining_amount
        });

        res.status(201).json(successResponse({
            payment,
            payment_summary: updatedSummary
        }, updatedSummary.is_fully_paid ? 'Payment collected successfully. Order is now fully paid.' : 'Payment collected successfully. Remaining amount: ' + updatedSummary.remaining_amount));
    } catch (error) {
        logger.error('Error collecting payment', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
};

// Split payment
exports.splitPayment = async (req, res, next) => {
    try {
        // This is similar to collectPayment but specifically for split payments
        const amount = req.body.amount || req.body.total_amount;
        const order_id = req.body.order_id;
        const cash_amount = parseFloat(req.body.cash_amount || 0);
        const bank_amount = parseFloat(req.body.bank_amount || 0);
        const transaction_reference = req.body.transaction_reference;

        // Validation
        if (!order_id) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Order ID is required'));
        }
        if (!cash_amount || !bank_amount) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Both cash_amount and bank_amount are required for split payment'));
        }
        if (cash_amount <= 0 || bank_amount <= 0) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Cash and bank amounts must be greater than 0'));
        }

        const totalAmount = cash_amount + bank_amount;
        if (amount && Math.abs(parseFloat(amount) - totalAmount) > 0.01) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Total amount must equal cash_amount + bank_amount'));
        }

        // Verify order exists
        const order = await Order.findById(order_id);
        if (!order) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
        }

        // Check if order is assigned to this delivery boy
        if (req.user.role === 'delivery_boy' && order.assigned_delivery_boy_id !== req.user.userId) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Order not assigned to you'));
        }

        // Get payment summary to check remaining amount
        const paymentSummary = await Payment.getPaymentSummary(order_id);
        if (!paymentSummary) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
        }

        // Check if payment amount exceeds remaining amount (totalAmount already declared above)
        if (totalAmount > paymentSummary.remaining_amount) {
            return res.status(400).json(errorResponse('INVALID_AMOUNT', `Payment amount (${totalAmount}) exceeds remaining amount (${paymentSummary.remaining_amount})`));
        }

        // Handle receipt photo
        let receipt_photo_url = null;
        if (req.file) {
            receipt_photo_url = `/uploads/${req.file.filename}`;
        } else if (req.body.receipt_image) {
            receipt_photo_url = req.body.receipt_image;
        }

        // Create split payment
        const payment = await Payment.create({
            order_id,
            payment_mode: 'SPLIT',
            cash_amount,
            bank_amount,
            transaction_reference: transaction_reference || null,
            receipt_photo_url,
            created_by: req.user.userId
        });

        // Get updated payment summary
        const updatedSummary = await Payment.getPaymentSummary(order_id);

        logger.info('Split payment collected', {
            paymentId: payment.id,
            orderId: order_id,
            cashAmount: cash_amount,
            bankAmount: bank_amount,
            totalAmount: totalAmount,
            collectedBy: req.user.userId,
            remainingAmount: updatedSummary.remaining_amount
        });

        res.status(201).json(successResponse({
            payment,
            payment_summary: updatedSummary
        }, updatedSummary.is_fully_paid ? 'Split payment collected successfully. Order is now fully paid.' : 'Split payment collected successfully. Remaining amount: ' + updatedSummary.remaining_amount));
    } catch (error) {
        logger.error('Error collecting split payment', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
};
