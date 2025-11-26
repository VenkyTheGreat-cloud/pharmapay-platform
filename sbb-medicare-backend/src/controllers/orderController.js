const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Customer = require('../models/Customer');
const DeliveryBoy = require('../models/DeliveryBoy');
const LocationUpdate = require('../models/LocationUpdate');
const logger = require('../config/logger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { query, transaction } = require('../config/database');

// Get all orders with pagination
exports.getAllOrders = async (req, res, next) => {
    try {
        const { status, date, page = 1, limit = 20 } = req.query;
        const storeId = req.user.role === 'admin' ? req.query.storeId : req.user.userId;

        const filters = {
            limit: Math.min(parseInt(limit), 50),
            offset: (parseInt(page) - 1) * Math.min(parseInt(limit), 50)
        };

        if (status) filters.status = status;
        if (date) filters.date = date;
        if (storeId) filters.store_id = storeId;

        const orders = await Order.findAll(filters);
        const total = await Order.count(filters);

        // Get order items for each order
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await OrderItem.findByOrderId(order.id);
            return {
                ...order,
                items: items.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: parseFloat(item.price),
                    total: parseFloat(item.total)
                }))
            };
        }));

        const pagination = {
            total,
            page: parseInt(page),
            limit: filters.limit,
            totalPages: Math.ceil(total / filters.limit)
        };

        res.json(paginatedResponse({ orders: ordersWithItems }, pagination));
    } catch (error) {
        next(error);
    }
};

// Get today's orders
exports.getTodayOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const storeId = req.user.role === 'admin' ? req.query.storeId : req.user.userId;

        const filters = {
            date: new Date().toISOString().split('T')[0],
            limit: Math.min(parseInt(limit), 50),
            offset: (parseInt(page) - 1) * Math.min(parseInt(limit), 50)
        };

        if (storeId) filters.store_id = storeId;

        const orders = await Order.findAll(filters);
        const total = await Order.count(filters);

        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await OrderItem.findByOrderId(order.id);
            return { ...order, items };
        }));

        const pagination = {
            total,
            page: parseInt(page),
            limit: filters.limit,
            totalPages: Math.ceil(total / filters.limit)
        };

        res.json(paginatedResponse({ orders: ordersWithItems }, pagination));
    } catch (error) {
        next(error);
    }
};

// Get ongoing orders
exports.getOngoingOrders = async (req, res, next) => {
    try {
        const storeId = req.user.role === 'admin' ? req.query.storeId : req.user.userId;
        const orders = await Order.getOngoingOrders(storeId);

        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await OrderItem.findByOrderId(order.id);
            return { ...order, items };
        }));

        res.json(successResponse({ orders: ordersWithItems, count: ordersWithItems.length }));
    } catch (error) {
        next(error);
    }
};

// Get order by ID
exports.getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
        }

        // Check access control
        if (req.user.role === 'store_manager' && order.store_id !== req.user.userId) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Order does not belong to your store'));
        }

        const items = await OrderItem.findByOrderId(order.id);

        res.json(successResponse({
            ...order,
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: parseFloat(item.price),
                total: parseFloat(item.total)
            }))
        }));
    } catch (error) {
        next(error);
    }
};

// Create order
exports.createOrder = async (req, res, next) => {
    try {
        const { customerId, deliveryBoyId, items, customerComments } = req.body;
        const storeId = req.user.userId;

        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'At least one item is required'));
        }

        // Get customer
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Customer not found'));
        }

        // Check if customer belongs to store
        if (customer.store_id !== storeId) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Customer does not belong to your store'));
        }

        // Get delivery boy
        const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);
        if (!deliveryBoy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Delivery boy not found'));
        }

        if (deliveryBoy.status !== 'approved') {
            return res.status(400).json(errorResponse('DELIVERY_BOY_NOT_APPROVED', 'Delivery boy is not approved'));
        }

        if (!deliveryBoy.is_active) {
            return res.status(400).json(errorResponse('DELIVERY_BOY_NOT_AVAILABLE', 'Delivery boy is not active'));
        }

        // Calculate total amount
        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        // Create order with items
        const order = await transaction(async (client) => {
            // Generate order number
            const orderNumberResult = await client.query(
                'SELECT generate_order_number($1) as order_number',
                [storeId]
            );
            const orderNumber = orderNumberResult.rows[0].order_number;

            // Create order
            const orderResult = await client.query(
                `INSERT INTO orders (order_number, customer_id, assigned_delivery_boy_id, store_id,
                                    customer_name, customer_phone, customer_address, customer_lat, customer_lng,
                                    total_amount, status, customer_comments, assigned_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ASSIGNED', $11, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [orderNumber, customerId, deliveryBoyId, storeId,
                 customer.name, customer.mobile, customer.address, customer.customer_lat, customer.customer_lng,
                 totalAmount, customerComments]
            );

            const order = orderResult.rows[0];

            // Create order items
            const itemValues = [];
            const itemPlaceholders = [];
            let paramCount = 1;

            items.forEach((item) => {
                const { name, quantity, price } = item;
                const total = quantity * price;
                itemPlaceholders.push(`($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4})`);
                itemValues.push(order.id, name, quantity, price, total);
                paramCount += 5;
            });

            await client.query(
                `INSERT INTO order_items (order_id, name, quantity, price, total)
                 VALUES ${itemPlaceholders.join(', ')}`,
                itemValues
            );

            // Create status history
            await client.query(
                `INSERT INTO order_status_history (order_id, status, changed_by, notes)
                 VALUES ($1, $2, $3, $4)`,
                [order.id, 'ASSIGNED', storeId, 'Order created and assigned']
            );

            return order;
        });

        const orderItems = await OrderItem.findByOrderId(order.id);

        logger.info('Order created', { orderId: order.id, createdBy: storeId });

        res.status(201).json(successResponse({
            ...order,
            items: orderItems
        }, 'Order created successfully'));
    } catch (error) {
        next(error);
    }
};

// Assign order to delivery boy
exports.assignOrder = async (req, res, next) => {
    try {
        const { deliveryBoyId } = req.body;
        const orderId = req.params.id;

        // Get order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
        }

        // Check access
        if (req.user.role === 'store_manager' && order.store_id !== req.user.userId) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Order does not belong to your store'));
        }

        // Get delivery boy
        const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);
        if (!deliveryBoy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Delivery boy not found'));
        }

        if (deliveryBoy.status !== 'approved') {
            return res.status(400).json(errorResponse('DELIVERY_BOY_NOT_APPROVED', 'Delivery boy is not approved'));
        }

        // Assign order
        const updatedOrder = await Order.assign(orderId, deliveryBoyId, req.user.userId);

        logger.info('Order assigned', { orderId, deliveryBoyId, assignedBy: req.user.userId });

        res.json(successResponse({
            assignedBy: req.user.userId,
            assignedByName: req.user.name || 'User',
            assignedTime: updatedOrder.assigned_at
        }, 'Order assigned successfully'));
    } catch (error) {
        next(error);
    }
};

// Update order status
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status, notes } = req.body;
        const orderId = req.params.id;

        // Get order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
        }

        // Check access for delivery boy
        if (req.user.role === 'delivery_boy' && order.assigned_delivery_boy_id !== req.user.userId) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Order not assigned to you'));
        }

        // Update status
        const updatedOrder = await Order.updateStatus(orderId, status, req.user.userId, notes);

        logger.info('Order status updated', { orderId, status, updatedBy: req.user.userId });

        const items = await OrderItem.findByOrderId(updatedOrder.id);

        res.json(successResponse({
            ...updatedOrder,
            items
        }));
    } catch (error) {
        if (error.message === 'INVALID_STATUS_TRANSITION') {
            return res.status(400).json(errorResponse('INVALID_STATUS_TRANSITION', 'Invalid order status transition'));
        }
        if (error.message === 'CONFLICT') {
            return res.status(409).json(errorResponse('CONFLICT', 'Another order is already in transit for this delivery boy'));
        }
        next(error);
    }
};

// Update order location
exports.updateLocation = async (req, res, next) => {
    try {
        const { latitude, longitude, source } = req.body;
        const orderId = req.params.id;

        // Get order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
        }

        // Check if delivery boy is assigned
        if (req.user.role === 'delivery_boy' && order.assigned_delivery_boy_id !== req.user.userId) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Order not assigned to you'));
        }

        // Create location update
        await LocationUpdate.create({
            order_id: orderId,
            latitude,
            longitude,
            recorded_by: req.user.userId,
            source: source || 'MANUAL'
        });

        logger.info('Location updated', { orderId, latitude, longitude });

        res.json(successResponse(null, 'Location updated successfully'));
    } catch (error) {
        next(error);
    }
};

// Get orders by customer mobile
exports.getOrdersByCustomerMobile = async (req, res, next) => {
    try {
        const { mobile } = req.params;
        const storeId = req.user.role === 'admin' ? req.query.storeId : req.user.userId;

        const orders = await Order.getByCustomerMobile(mobile, storeId);

        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await OrderItem.findByOrderId(order.id);
            return { ...order, items };
        }));

        res.json(successResponse(ordersWithItems));
    } catch (error) {
        next(error);
    }
};
