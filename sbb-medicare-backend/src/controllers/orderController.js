const Order = require('../models/Order');
const Customer = require('../models/Customer');
const logger = require('../config/logger');

// Get all orders
exports.getAllOrders = async (req, res, next) => {
    try {
        const { status, delivery_boy_id, date_from, date_to, limit } = req.query;

        const filters = {};
        if (status) filters.status = status;
        if (delivery_boy_id) filters.delivery_boy_id = delivery_boy_id;
        if (date_from) filters.date_from = date_from;
        if (date_to) filters.date_to = date_to;
        if (limit) filters.limit = parseInt(limit);

        const orders = await Order.findAll(filters);

        res.json({ orders, count: orders.length });
    } catch (error) {
        next(error);
    }
};

// Get orders for current delivery boy
exports.getMyOrders = async (req, res, next) => {
    try {
        const { status } = req.query;

        const filters = { delivery_boy_id: req.user.id };
        if (status) filters.status = status;

        const orders = await Order.findAll(filters);

        res.json({ orders, count: orders.length });
    } catch (error) {
        next(error);
    }
};

// Get order by ID
exports.getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ order });
    } catch (error) {
        next(error);
    }
};

// Create order
exports.createOrder = async (req, res, next) => {
    try {
        const { customer_id, items, total_amount, notes } = req.body;

        // Verify customer exists
        const customer = await Customer.findById(customer_id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const order = await Order.create({
            customer_id,
            items,
            total_amount,
            created_by: req.user.id,
            notes
        });

        logger.info('Order created', { orderId: order.id, createdBy: req.user.id });

        res.status(201).json({
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        next(error);
    }
};

// Assign order to delivery boy
exports.assignOrder = async (req, res, next) => {
    try {
        const { delivery_boy_id } = req.body;

        const order = await Order.assign(req.params.id, delivery_boy_id, req.user.id);

        logger.info('Order assigned', {
            orderId: req.params.id,
            deliveryBoyId: delivery_boy_id,
            assignedBy: req.user.id
        });

        res.json({
            message: 'Order assigned successfully',
            order
        });
    } catch (error) {
        next(error);
    }
};

// Update order status
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status, notes, latitude, longitude } = req.body;

        const validStatuses = ['new', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const location = latitude && longitude ? { latitude, longitude } : null;

        const order = await Order.updateStatus(req.params.id, status, req.user.id, notes, location);

        logger.info('Order status updated', {
            orderId: req.params.id,
            status,
            updatedBy: req.user.id
        });

        res.json({
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        next(error);
    }
};

// Get order history
exports.getOrderHistory = async (req, res, next) => {
    try {
        const history = await Order.getHistory(req.params.id);

        res.json({ history, count: history.length });
    } catch (error) {
        next(error);
    }
};

// Get orders by date range with statistics
exports.getOrdersByDateRange = async (req, res, next) => {
    try {
        const { date_from, date_to } = req.query;

        if (!date_from || !date_to) {
            return res.status(400).json({ error: 'date_from and date_to are required' });
        }

        const statistics = await Order.getOrdersByDateRange(date_from, date_to);

        res.json({ statistics });
    } catch (error) {
        next(error);
    }
};

// Delete order (only if status is 'new')
exports.deleteOrder = async (req, res, next) => {
    try {
        const deleted = await Order.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                error: 'Order not found or cannot be deleted (only new orders can be deleted)'
            });
        }

        logger.info('Order deleted', { orderId: req.params.id, deletedBy: req.user.id });

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        next(error);
    }
};
