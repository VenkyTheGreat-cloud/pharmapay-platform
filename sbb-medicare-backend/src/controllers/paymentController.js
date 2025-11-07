const Payment = require('../models/Payment');
const Order = require('../models/Order');
const logger = require('../config/logger');

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
