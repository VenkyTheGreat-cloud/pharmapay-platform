const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Customer = require('../models/Customer');
const DeliveryBoy = require('../models/DeliveryBoy');
const LocationUpdate = require('../models/LocationUpdate');
const Payment = require('../models/Payment');
const logger = require('../config/logger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { query, transaction } = require('../config/database');

// Helper: normalize incoming date string to YYYY-MM-DD (for consistent filtering)
const normalizeDateParam = (rawDate) => {
    if (!rawDate) return null;

    // If it's an ISO datetime (e.g. 2025-11-26T00:00:00.000Z), take the date part
    if (/^\d{4}-\d{2}-\d{2}T/.test(rawDate)) {
        return rawDate.slice(0, 10);
    }

    // If it's already YYYY-MM-DD, use as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        return rawDate;
    }

    // Handle common UI formats: DD/MM/YYYY or DD-MM-YYYY
    const m = rawDate.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
    if (m) {
        const [, dd, mm, yyyy] = m;
        return `${yyyy}-${mm}-${dd}`;
    }

    // Fallback: let PostgreSQL cast it; return raw
    return rawDate;
};

// Get all orders with pagination
exports.getAllOrders = async (req, res, next) => {
    try {
        const { status, date: rawDate, page = 1, limit = 20 } = req.query;
        const date = normalizeDateParam(rawDate);

        const filters = {
            limit: Math.min(parseInt(limit), 50),
            offset: (parseInt(page) - 1) * Math.min(parseInt(limit), 50)
        };

        // Filter based on user role
        if (req.user.role === 'admin') {
            // Admin can see all orders, optionally filtered by store
            const storeId = req.query.storeId;
            if (storeId) filters.store_id = storeId;
        } else if (req.user.role === 'store_manager') {
            // Store managers see only their store's orders
            filters.store_id = req.user.userId;
        } else if (req.user.role === 'delivery_boy') {
            // Delivery boys see only orders assigned to them
            filters.assigned_delivery_boy_id = req.user.userId;
        }

        if (status) filters.status = status;
        if (date) filters.date = date;

        const orders = await Order.findAll(filters);
        const total = await Order.count(filters);

        // Get payment summary and items for each order
        const ordersWithDetails = await Promise.all(orders.map(async (order) => {
            try {
                const items = await OrderItem.findByOrderId(order.id);
                const paymentSummary = await Payment.getPaymentSummary(order.id);
                return {
                    ...order,
                    items: items ? items.map(item => ({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        price: parseFloat(item.price),
                        total: parseFloat(item.total)
                    })) : [],
                    payment_summary: paymentSummary || {
                        total_amount: parseFloat(order.total_amount || 0),
                        total_paid: 0,
                        remaining_amount: parseFloat(order.total_amount || 0),
                        payment_status: order.payment_status || 'PENDING',
                        is_fully_paid: false
                    }
                };
            } catch (err) {
                // If payment summary fails, return order with default payment summary
                logger.error('Error getting order details', { orderId: order.id, error: err.message });
                return {
                    ...order,
                    items: [],
                    payment_summary: {
                        total_amount: parseFloat(order.total_amount || 0),
                        total_paid: 0,
                        remaining_amount: parseFloat(order.total_amount || 0),
                        payment_status: order.payment_status || 'PENDING',
                        is_fully_paid: false
                    }
                };
            }
        }));

        const pagination = {
            total,
            page: parseInt(page),
            limit: filters.limit,
            totalPages: Math.ceil(total / filters.limit)
        };

        res.json(paginatedResponse({ orders: ordersWithDetails }, pagination));
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

        const ordersWithDetails = await Promise.all(orders.map(async (order) => {
            try {
                const items = await OrderItem.findByOrderId(order.id);
                const paymentSummary = await Payment.getPaymentSummary(order.id);
                return {
                    ...order,
                    items: items || [],
                    payment_summary: paymentSummary || {
                        total_amount: parseFloat(order.total_amount || 0),
                        total_paid: 0,
                        remaining_amount: parseFloat(order.total_amount || 0),
                        payment_status: order.payment_status || 'PENDING',
                        is_fully_paid: false
                    }
                };
            } catch (err) {
                logger.error('Error getting order details', { orderId: order.id, error: err.message });
                return {
                    ...order,
                    items: [],
                    payment_summary: {
                        total_amount: parseFloat(order.total_amount || 0),
                        total_paid: 0,
                        remaining_amount: parseFloat(order.total_amount || 0),
                        payment_status: order.payment_status || 'PENDING',
                        is_fully_paid: false
                    }
                };
            }
        }));

        const pagination = {
            total,
            page: parseInt(page),
            limit: filters.limit,
            totalPages: Math.ceil(total / filters.limit)
        };

        res.json(paginatedResponse({ orders: ordersWithDetails }, pagination));
    } catch (error) {
        next(error);
    }
};

// Get ongoing orders
exports.getOngoingOrders = async (req, res, next) => {
    try {
        // For delivery boys, filter by assigned_delivery_boy_id
        if (req.user.role === 'delivery_boy') {
            const orders = await Order.getOngoingOrdersForDeliveryBoy(req.user.userId);
            const ordersWithItems = await Promise.all(orders.map(async (order) => {
                const items = await OrderItem.findByOrderId(order.id);
                return { ...order, items };
            }));
            return res.json(successResponse({ orders: ordersWithItems, count: ordersWithItems.length }));
        }

        // For admin and store managers
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
        const paymentSummary = await Payment.getPaymentSummary(order.id);
        const payments = await Payment.findByOrderId(order.id);

        // Calculate initial (pre) payment made at order creation.
        // By design, payments created during order creation have created_by = NULL
        // (store-level payments), while delivery boy collections have created_by = delivery_boys.id.
        const initialPayments = payments.filter(p => !p.created_by);
        const initialPaidAmount = initialPayments.reduce((sum, p) => {
            const cash = parseFloat(p.cash_amount || 0);
            const bank = parseFloat(p.bank_amount || 0);
            return sum + cash + bank;
        }, 0);
        const initialPaymentModes = [...new Set(initialPayments.map(p => p.payment_mode))];

        res.json(successResponse({
            ...order,
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: parseFloat(item.price),
                total: parseFloat(item.total)
            })),
            payment_summary: paymentSummary,
            payments: payments,
            initial_payment: {
                amount: initialPaidAmount,
                modes: initialPaymentModes,
                has_initial_payment: initialPaidAmount > 0
            }
        }));
    } catch (error) {
        next(error);
    }
};

// Create order (simplified - no items list, only total amount)
exports.createOrder = async (req, res, next) => {
    try {
        const { 
            orderNumber, 
            customerId, 
            deliveryBoyId, 
            totalAmount, 
            paidAmount,           // Optional: Amount already paid
            paymentMode,          // Optional: Payment mode (CASH, CARD, UPI, BANK_TRANSFER)
            transactionReference, // Optional: Transaction reference
            customerComments 
        } = req.body;
        const storeId = req.user.userId;

        // Validate order number
        if (!orderNumber || orderNumber.trim() === '') {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Order number is required'));
        }

        // Validate total amount
        if (!totalAmount || parseFloat(totalAmount) <= 0) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Total amount is required and must be greater than 0'));
        }

        const totalAmountNum = parseFloat(totalAmount);
        const paidAmountNum = paidAmount ? parseFloat(paidAmount) : 0;

        // Validate paid amount
        if (paidAmountNum < 0) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Paid amount cannot be negative'));
        }

        if (paidAmountNum > totalAmountNum) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Paid amount cannot exceed total amount'));
        }

        // Validate payment mode if paid amount is provided
        if (paidAmountNum > 0) {
            if (!paymentMode) {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Payment mode is required when paid amount is provided'));
            }
            const validPaymentModes = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER'];
            const normalizedMode = paymentMode.toUpperCase();
            if (!validPaymentModes.includes(normalizedMode)) {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Payment mode must be CASH, CARD, UPI, or BANK_TRANSFER'));
            }
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

        // Determine payment status based on paid amount
        let initialPaymentStatus = 'PENDING';
        if (paidAmountNum >= totalAmountNum) {
            initialPaymentStatus = 'PAID';
        } else if (paidAmountNum > 0) {
            initialPaymentStatus = 'PARTIAL';
        }

        // Normalize payment mode
        const normalizedPaymentMode = paidAmountNum > 0 ? paymentMode.toUpperCase() : null;

        // Create order (no items)
        const order = await transaction(async (client) => {
            // Check if order number already exists
            const existingOrder = await client.query(
                'SELECT id FROM orders WHERE order_number = $1',
                [orderNumber.trim()]
            );
            if (existingOrder.rowCount > 0) {
                throw new Error('DUPLICATE_ORDER_NUMBER');
            }

            // Create order with provided order number
            const orderResult = await client.query(
                `INSERT INTO orders (order_number, customer_id, assigned_delivery_boy_id, store_id,
                                    customer_name, customer_phone, customer_address, customer_lat, customer_lng,
                                    total_amount, status, payment_status, payment_mode, customer_comments, assigned_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ASSIGNED', $11, $12, $13, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [orderNumber.trim(), customerId, deliveryBoyId, storeId,
                 customer.name, customer.mobile, customer.address, customer.customer_lat, customer.customer_lng,
                 totalAmountNum, initialPaymentStatus, normalizedPaymentMode, customerComments]
            );

            const order = orderResult.rows[0];

            // Create initial payment if paid amount > 0
            if (paidAmountNum > 0) {
                let cashAmount = 0;
                let bankAmount = 0;

                // Set amounts based on payment mode
                if (normalizedPaymentMode === 'CASH') {
                    cashAmount = paidAmountNum;
                } else if (['CARD', 'UPI', 'BANK_TRANSFER'].includes(normalizedPaymentMode)) {
                    bankAmount = paidAmountNum;
                }

                // Create payment record
                // Note: created_by is BIGINT (delivery_boys.id), but storeId is UUID
                // For store-created payments, set created_by to NULL and add store info in notes
                await client.query(
                    `INSERT INTO payments (order_id, payment_mode, cash_amount, bank_amount,
                                          transaction_reference, status, created_by)
                     VALUES ($1, $2, $3, $4, $5, 'CONFIRMED', NULL)`,
                    [order.id, normalizedPaymentMode, cashAmount, bankAmount, transactionReference || null]
                );

                // If fully paid, mark order as DELIVERED
                if (initialPaymentStatus === 'PAID') {
                    await client.query(
                        `UPDATE orders 
                         SET status = 'DELIVERED', delivered_at = CURRENT_TIMESTAMP
                         WHERE id = $1`,
                        [order.id]
                    );
                }
            }

            // Create status history
            const statusNotes = paidAmountNum > 0 
                ? `Order created and assigned. Initial payment of ${paidAmountNum} received via ${normalizedPaymentMode}.`
                : 'Order created and assigned';
            
            await client.query(
                `INSERT INTO order_status_history (order_id, status, changed_by, notes)
                 VALUES ($1, $2, $3, $4)`,
                [order.id, 'ASSIGNED', storeId, statusNotes]
            );

            return order;
        });

        // Calculate payment summary
        const paymentSummary = await Payment.getPaymentSummary(order.id);

        logger.info('Order created', { orderId: order.id, orderNumber: order.order_number, createdBy: storeId, totalAmount });

        res.status(201).json(successResponse({
            ...order,
            payment_summary: paymentSummary
        }, 'Order created successfully'));
    } catch (error) {
        if (error.message === 'DUPLICATE_ORDER_NUMBER') {
            return res.status(409).json(errorResponse('DUPLICATE_ORDER_NUMBER', 'Order number already exists. Please use a different order number.'));
        }
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

        // Allow assignment if order is ASSIGNED or REJECTED
        if (order.status !== 'ASSIGNED' && order.status !== 'REJECTED') {
            return res.status(400).json(errorResponse('INVALID_STATUS', `Cannot assign order with status: ${order.status}. Order must be ASSIGNED or REJECTED.`));
        }

        // Get delivery boy
        const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);
        if (!deliveryBoy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Delivery boy not found'));
        }

        if (deliveryBoy.status !== 'approved') {
            return res.status(400).json(errorResponse('DELIVERY_BOY_NOT_APPROVED', 'Delivery boy is not approved'));
        }

        // Assign order (handles both new assignment and reassignment of rejected orders)
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

// Accept order (delivery boy accepts assigned order)
exports.acceptOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { notes } = req.body;

        // Get order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
        }

        // Only delivery boys can accept orders
        if (req.user.role !== 'delivery_boy') {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Only delivery boys can accept orders'));
        }

        // Verify order is assigned to this delivery boy
        if (order.assigned_delivery_boy_id !== req.user.userId) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Order not assigned to you'));
        }

        // Accept order
        const updatedOrder = await Order.accept(orderId, req.user.userId, notes);

        logger.info('Order accepted', { orderId, deliveryBoyId: req.user.userId });

        const items = await OrderItem.findByOrderId(updatedOrder.id);

        res.json(successResponse({
            ...updatedOrder,
            items
        }, 'Order accepted successfully'));
    } catch (error) {
        if (error.message === 'INVALID_STATUS_TRANSITION') {
            return res.status(400).json(errorResponse('INVALID_STATUS_TRANSITION', 'Order must be in ASSIGNED status to accept'));
        }
        next(error);
    }
};

// Reject order (delivery boy rejects assigned order)
exports.rejectOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { reason } = req.body;

        // Get order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
        }

        // Only delivery boys can reject orders
        if (req.user.role !== 'delivery_boy') {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Only delivery boys can reject orders'));
        }

        // Verify order is assigned to this delivery boy
        if (order.assigned_delivery_boy_id !== req.user.userId) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Order not assigned to you'));
        }

        // Check current order status before rejecting
        if (order.status !== 'ASSIGNED' && order.status !== 'ACCEPTED') {
            return res.status(400).json(errorResponse('INVALID_STATUS_TRANSITION', `Cannot reject order. Current status is: ${order.status}. Only orders with status ASSIGNED or ACCEPTED can be rejected.`));
        }

        // Reject order
        const updatedOrder = await Order.reject(orderId, req.user.userId, reason);

        logger.info('Order rejected', { orderId, deliveryBoyId: req.user.userId, reason });

        res.json(successResponse({
            ...updatedOrder
        }, 'Order rejected. Store manager can reassign to another delivery boy.'));
    } catch (error) {
        if (error.message === 'INVALID_STATUS_TRANSITION') {
            return res.status(400).json(errorResponse('INVALID_STATUS_TRANSITION', 'Order must be in ASSIGNED status to reject'));
        }
        next(error);
    }
};

// Upload delivery/payment proof photo
exports.uploadDeliveryPhoto = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        
        if (!req.file) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Photo file is required'));
        }

        // Get order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
        }

        // Check access
        if (req.user.role === 'delivery_boy' && order.assigned_delivery_boy_id !== req.user.userId) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Order not assigned to you'));
        }
        if (req.user.role === 'store_manager' && order.store_id !== req.user.userId) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Order does not belong to your store'));
        }

        // Update order with delivery photo URL
        const photoUrl = `/uploads/${req.file.filename}`;
        const result = await query(
            `UPDATE orders SET delivery_photo_url = $1 WHERE id = $2 RETURNING *`,
            [photoUrl, orderId]
        );

        logger.info('Delivery photo uploaded', { orderId, uploadedBy: req.user.userId });

        res.json(successResponse({
            ...result.rows[0]
        }, 'Delivery photo uploaded successfully'));
    } catch (error) {
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

// Dashboard statistics for date range
exports.getDashboardStats = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        if (!from) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'from date is required'));
        }

        const fromDate = normalizeDateParam(from);
        const toDate = normalizeDateParam(to || from);
        const storeId = req.user.role === 'admin' ? req.query.storeId : req.user.userId;

        // Stats per status for the range (based on assigned_at)
        const stats = await Order.getDashboardStats({
            storeId,
            fromDate,
            toDate,
        });

        // Total collected amount for this range
        const collectedAmount = await Payment.getCollectedAmountByDateRange(fromDate, toDate, storeId);

        // Orders list in range, excluding ongoing (only DELIVERED / CANCELLED)
        const orders = await Order.getCompletedByDateRange({
            storeId,
            fromDate,
            toDate,
        });

        // Attach items to each order
        const ordersWithItems = await Promise.all(
            orders.map(async (order) => {
                const items = await OrderItem.findByOrderId(order.id);
                return {
                    ...order,
                    items: items.map((item) => ({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        price: parseFloat(item.price),
                        total: parseFloat(item.total),
                    })),
                };
            })
        );

        return res.json(
            successResponse({
                stats: {
                    totalOrders: parseInt(stats.total_orders || 0, 10),
                    deliveredOrders: parseInt(stats.delivered_orders || 0, 10),
                    assignedOrders: parseInt(stats.assigned_orders || 0, 10),
                    pickedUpOrders: parseInt(stats.picked_up_orders || 0, 10),
                    paymentCollectionOrders: parseInt(stats.payment_collection_orders || 0, 10),
                    collectedAmount,
                },
                orders: ordersWithItems,
            })
        );
    } catch (error) {
        next(error);
    }
};
