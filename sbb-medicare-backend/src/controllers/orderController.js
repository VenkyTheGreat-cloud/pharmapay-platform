const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const ReturnItem = require('../models/ReturnItem');
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
        const { status, date: rawDate, date_from, date_to, page = 1, limit = 20 } = req.query;
        const date = normalizeDateParam(rawDate);
        const dateFrom = normalizeDateParam(date_from);
        const dateTo = normalizeDateParam(date_to);

        const filters = {
            limit: Math.min(parseInt(limit), 500),
            offset: (parseInt(page) - 1) * Math.min(parseInt(limit), 500)
        };

        // Filter based on user role
        if (req.user.role === 'admin') {
            // Admin: see orders for all stores in their group (admin + its stores)
            const User = require('../models/User');
            const storeIds = await User.getStoreIdsForAdmin(req.user.userId);
            filters.store_ids = storeIds;
        } else if (req.user.role === 'store_manager') {
            // Store manager: use adminId from token to get group, fallback to own ID
            const User = require('../models/User');
            const anchorAdminId = req.user.adminId || req.user.userId;
            const storeIds = await User.getStoreIdsForAdmin(anchorAdminId);
            filters.store_ids = storeIds;
        } else if (req.user.role === 'delivery_boy') {
            // Delivery boys: show unassigned orders in their admin group OR orders assigned to them
            const deliveryBoy = await DeliveryBoy.findById(req.user.userId);
            if (!deliveryBoy || !deliveryBoy.store_id) {
                return res.json(paginatedResponse({ orders: [], pagination: { total: 0, page: 1, limit: filters.limit, totalPages: 0 } }));
            }

            const User = require('../models/User');
            const storeUser = await User.findById(deliveryBoy.store_id);

            let storeIds = [];
            if (storeUser) {
                const adminId = storeUser.role === 'admin' ? storeUser.id : (storeUser.admin_id || deliveryBoy.store_id);
                storeIds = await User.getStoreIdsForAdmin(adminId);
            }
            // Always include delivery boy's own store_id
            if (!storeIds || storeIds.length === 0) {
                storeIds = [deliveryBoy.store_id];
            } else if (!storeIds.includes(deliveryBoy.store_id)) {
                storeIds.push(deliveryBoy.store_id);
            }

            // Special filter: include unassigned + assigned to this delivery boy
            filters.store_ids = storeIds;
            filters.include_unassigned_for_delivery_boy = true;
            filters.delivery_boy_id = req.user.userId;
        }

        if (status) filters.status = status;
        // Support both single date and date range
        if (dateFrom && dateTo) {
            // Date range filter (uses created_at)
            filters.date_from = dateFrom;
            filters.date_to = dateTo;
        } else if (date) {
            // Single date filter (uses created_at for consistency)
            filters.date = date;
        }

        const orders = await Order.findAll(filters);
        const total = await Order.count(filters);

        // Get payment summary, items, and return items for each order
        const ordersWithDetails = await Promise.all(orders.map(async (order) => {
            try {
                const items = await OrderItem.findByOrderId(order.id);
                const returnItemsList = await ReturnItem.findByOrderId(order.id);
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
                    return_items_list: returnItemsList.map(item => ({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity
                    })),
                    payment_summary: paymentSummary || {
                        total_amount: parseFloat(order.total_amount || 0),
                        return_adjust_amount: parseFloat(order.return_adjust_amount || 0),
                        total_paid: 0,
                        remaining_amount: Math.max(0, parseFloat(order.total_amount || 0) - parseFloat(order.return_adjust_amount || 0)),
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
                    return_items_list: [],
                    payment_summary: {
                        total_amount: parseFloat(order.total_amount || 0),
                        return_adjust_amount: parseFloat(order.return_adjust_amount || 0),
                        total_paid: 0,
                        remaining_amount: Math.max(0, parseFloat(order.total_amount || 0) - parseFloat(order.return_adjust_amount || 0)),
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
            limit: Math.min(parseInt(limit), 500),
            offset: (parseInt(page) - 1) * Math.min(parseInt(limit), 500)
        };

        if (storeId) filters.store_id = storeId;

        const orders = await Order.findAll(filters);
        const total = await Order.count(filters);

        const ordersWithDetails = await Promise.all(orders.map(async (order) => {
            try {
                const items = await OrderItem.findByOrderId(order.id);
                const returnItemsList = await ReturnItem.findByOrderId(order.id);
                const paymentSummary = await Payment.getPaymentSummary(order.id);
                return {
                    ...order,
                    items: items || [],
                    return_items_list: returnItemsList.map(item => ({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity
                    })),
                    payment_summary: paymentSummary || {
                        total_amount: parseFloat(order.total_amount || 0),
                        return_adjust_amount: parseFloat(order.return_adjust_amount || 0),
                        total_paid: 0,
                        remaining_amount: Math.max(0, parseFloat(order.total_amount || 0) - parseFloat(order.return_adjust_amount || 0)),
                        payment_status: order.payment_status || 'PENDING',
                        is_fully_paid: false
                    }
                };
            } catch (err) {
                logger.error('Error getting order details', { orderId: order.id, error: err.message });
                return {
                    ...order,
                    items: [],
                    return_items_list: [],
                    payment_summary: {
                        total_amount: parseFloat(order.total_amount || 0),
                        return_adjust_amount: parseFloat(order.return_adjust_amount || 0),
                        total_paid: 0,
                        remaining_amount: Math.max(0, parseFloat(order.total_amount || 0) - parseFloat(order.return_adjust_amount || 0)),
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
        // For delivery boys, show unassigned orders for their admin group + orders assigned to them
        if (req.user.role === 'delivery_boy') {
            // Get delivery boy's store_id to find admin group
            const deliveryBoy = await DeliveryBoy.findById(req.user.userId);
            if (!deliveryBoy || !deliveryBoy.store_id) {
                return res.json(successResponse({ orders: [], count: 0 }));
            }

            // Get all store IDs for the admin group
            const User = require('../models/User');
            // Find the admin ID (could be the store_id itself if it's an admin, or find the admin via admin_id)
            const storeUser = await User.findById(deliveryBoy.store_id);
            
            let storeIds = [];
            if (storeUser) {
                const adminId = storeUser.role === 'admin' ? storeUser.id : (storeUser.admin_id || deliveryBoy.store_id);
                storeIds = await User.getStoreIdsForAdmin(adminId);
            }
            
            // Always include delivery boy's store_id to ensure they see orders from their store
            if (!storeIds || storeIds.length === 0) {
                storeIds = [deliveryBoy.store_id];
                logger.warn('No store IDs found for admin group, using delivery boy store_id only', {
                    deliveryBoyId: req.user.userId,
                    storeId: deliveryBoy.store_id
                });
            } else {
                // Ensure delivery boy's store_id is in the list (convert to string for comparison)
                const storeIdStr = String(deliveryBoy.store_id);
                const storeIdsStr = storeIds.map(id => String(id));
                if (!storeIdsStr.includes(storeIdStr)) {
                    storeIds.push(deliveryBoy.store_id);
                    logger.info('Added delivery boy store_id to storeIds list', {
                        deliveryBoyId: req.user.userId,
                        addedStoreId: deliveryBoy.store_id,
                        storeIds: storeIds
                    });
                }
            }

            logger.info('Delivery boy order query - controller', {
                deliveryBoyId: req.user.userId,
                deliveryBoyName: deliveryBoy.name,
                storeId: deliveryBoy.store_id,
                storeIds: storeIds,
                storeIdsCount: storeIds.length,
                storeUserFound: !!storeUser,
                storeUserRole: storeUser?.role,
                storeUserAdminId: storeUser?.admin_id
            });

            const orders = await Order.getOngoingOrdersForDeliveryBoy(req.user.userId, storeIds);
            
            logger.info('Delivery boy orders result', {
                deliveryBoyId: req.user.userId,
                ordersCount: orders.length,
                unassignedCount: orders.filter(o => o.assigned_delivery_boy_id === null).length,
                assignedCount: orders.filter(o => o.assigned_delivery_boy_id === req.user.userId).length
            });
            const ordersWithDetails = await Promise.all(orders.map(async (order) => {
                const items = await OrderItem.findByOrderId(order.id);
                const returnItemsList = await ReturnItem.findByOrderId(order.id);
                const paymentSummary = await Payment.getPaymentSummary(order.id);
                const isFullyPaid = paymentSummary?.is_fully_paid || false;

                return { 
                    ...order, 
                    items,
                    return_items_list: returnItemsList.map(item => ({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity
                    })),
                    payment_summary: paymentSummary,
                    // Frontend can use this flag to hide the "collect payment" option
                    can_collect_payment: !isFullyPaid,
                    // Add flag to indicate if order is unassigned (available for acceptance)
                    is_unassigned: order.assigned_delivery_boy_id === null
                };
            }));
            return res.json(successResponse({ orders: ordersWithDetails, count: ordersWithDetails.length }));
        }

        // For admin and store managers
        const storeId = req.user.role === 'admin' ? req.query.storeId : req.user.userId;
        const orders = await Order.getOngoingOrders(storeId);

        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await OrderItem.findByOrderId(order.id);
            const returnItemsList = await ReturnItem.findByOrderId(order.id);
            return { 
                ...order, 
                items,
                return_items_list: returnItemsList.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity
                }))
            };
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
        const returnItemsList = await ReturnItem.findByOrderId(order.id);
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

        // Remove payment_status and payment_mode from order object to avoid duplication
        // since payment_summary already contains this information
        const { payment_status, payment_mode, ...orderWithoutPaymentFields } = order;

        res.json(successResponse({
            ...orderWithoutPaymentFields,
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: parseFloat(item.price),
                total: parseFloat(item.total)
            })),
            return_items_list: returnItemsList.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity
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

// Update order (store manager can edit order details)
exports.updateOrder = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const {
            orderNumber,
            customerId,
            customerName,
            customerPhone,
            customerAddress,
            customerLat,
            customerLng,
            totalAmount,
            notes,
            customerComments,
            returnItems,
            returnItemsList,
            returnAdjustAmount
        } = req.body;

        // Get order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
        }

        // Check access control - store manager can only edit orders from their store
        if (req.user.role === 'store_manager' && order.store_id !== req.user.userId) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Order does not belong to your store'));
        }

        // Admin can edit orders from their group
        if (req.user.role === 'admin') {
            const User = require('../models/User');
            const storeIds = await User.getStoreIdsForAdmin(req.user.userId);
            if (!storeIds.includes(order.store_id)) {
                return res.status(403).json(errorResponse('FORBIDDEN', 'Order does not belong to your admin group'));
            }
        }

        // Don't allow editing if order is DELIVERED or CANCELLED
        if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
            return res.status(400).json(errorResponse('INVALID_STATUS', `Cannot edit order with status: ${order.status}`));
        }

        // Build update object with only provided fields
        const updates = {};

        if (orderNumber !== undefined) {
            if (!orderNumber || orderNumber.trim() === '') {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Order number cannot be empty'));
            }
            // Check if order number already exists (excluding current order)
            const existingOrder = await query(
                'SELECT id FROM orders WHERE order_number = $1 AND id != $2',
                [orderNumber.trim(), orderId]
            );
            if (existingOrder.rows.length > 0) {
                return res.status(400).json(errorResponse('DUPLICATE_ORDER_NUMBER', 'Order number already exists'));
            }
            updates.order_number = orderNumber.trim();
        }

        if (customerId !== undefined) {
            // Validate customer exists
            const customer = await Customer.findById(customerId);
            if (!customer) {
                return res.status(404).json(errorResponse('NOT_FOUND', 'Customer not found'));
            }
            updates.customer_id = customerId;
            // If customer_id changes, update customer details from customer table
            if (customerId !== order.customer_id) {
                updates.customer_name = customer.name;
                updates.customer_phone = customer.mobile;
                updates.customer_address = customer.address || customer.area || '';
                updates.customer_lat = customer.latitude || null;
                updates.customer_lng = customer.longitude || null;
            }
        }

        // Allow manual override of customer details
        if (customerName !== undefined) {
            if (!customerName || customerName.trim() === '') {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Customer name cannot be empty'));
            }
            updates.customer_name = customerName.trim();
        }

        if (customerPhone !== undefined) {
            if (!customerPhone || customerPhone.trim() === '') {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Customer phone cannot be empty'));
            }
            updates.customer_phone = customerPhone.trim();
        }

        if (customerAddress !== undefined) {
            updates.customer_address = customerAddress ? customerAddress.trim() : null;
        }

        if (customerLat !== undefined) {
            updates.customer_lat = customerLat ? parseFloat(customerLat) : null;
        }

        if (customerLng !== undefined) {
            updates.customer_lng = customerLng ? parseFloat(customerLng) : null;
        }

        if (totalAmount !== undefined) {
            const totalAmountNum = parseFloat(totalAmount);
            if (isNaN(totalAmountNum) || totalAmountNum <= 0) {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Total amount must be a positive number'));
            }
            updates.total_amount = totalAmountNum;
        }

        if (notes !== undefined) {
            updates.notes = notes ? notes.trim() : null;
        }

        if (customerComments !== undefined) {
            updates.customer_comments = customerComments ? customerComments.trim() : null;
        }

        // Handle return items: support both legacy boolean and new array format
        let returnItemsArray = [];
        let shouldUpdateReturnItems = false;
        
        if (returnItemsList !== undefined) {
            // New format: array of return items
            if (returnItemsList === null || (Array.isArray(returnItemsList) && returnItemsList.length === 0)) {
                // Clear return items
                returnItemsArray = [];
                updates.return_items = false;
                updates.return_adjust_amount = 0;
                shouldUpdateReturnItems = true;
            } else if (Array.isArray(returnItemsList) && returnItemsList.length > 0) {
                // Validate return items array
                for (const item of returnItemsList) {
                    if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
                        return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Return item name is required and must be a non-empty string'));
                    }
                    if (!item.quantity || !Number.isInteger(parseInt(item.quantity)) || parseInt(item.quantity) <= 0) {
                        return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Return item quantity is required and must be a positive integer'));
                    }
                }
                returnItemsArray = returnItemsList;
                updates.return_items = true;
                shouldUpdateReturnItems = true;
            } else {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Return items list must be an array'));
            }
        } else if (returnItems !== undefined) {
            // Legacy boolean format
            const returnItemsFlag = returnItems === true || returnItems === 'true' || returnItems === 1;
            updates.return_items = returnItemsFlag;
        }

        if (returnAdjustAmount !== undefined) {
            const returnAdjustAmountNum = parseFloat(returnAdjustAmount);
            if (isNaN(returnAdjustAmountNum) || returnAdjustAmountNum < 0) {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Return adjust amount must be a non-negative number'));
            }
            
            // Get current total_amount (either from updates or existing order)
            const currentTotalAmount = updates.total_amount !== undefined 
                ? updates.total_amount 
                : parseFloat(order.total_amount);
            
            if (returnAdjustAmountNum > currentTotalAmount) {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Return adjust amount cannot exceed total amount'));
            }
            
            // If returnItems is true (either from updates or existing order), returnAdjustAmount should be > 0
            const currentReturnItems = updates.return_items !== undefined 
                ? updates.return_items 
                : (order.return_items === true);
            
            if (currentReturnItems && returnAdjustAmountNum <= 0) {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Return adjust amount must be greater than 0 when return items is true'));
            }
            
            updates.return_adjust_amount = returnAdjustAmountNum;
        }
        
        // If returnItemsList is provided but returnAdjustAmount is not, validate
        if (shouldUpdateReturnItems && returnItemsArray.length > 0) {
            const currentReturnAdjustAmount = updates.return_adjust_amount !== undefined 
                ? updates.return_adjust_amount 
                : parseFloat(order.return_adjust_amount || 0);
            
            if (currentReturnAdjustAmount <= 0) {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Return adjust amount must be provided and greater than 0 when return items list is provided'));
            }
        }

        // If no updates provided
        if (Object.keys(updates).length === 0 && !shouldUpdateReturnItems) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'No fields to update'));
        }

        // Update order
        const updatedOrder = await Order.update(orderId, updates);
        
        // Update return items if provided
        if (shouldUpdateReturnItems) {
            // Delete existing return items
            await ReturnItem.deleteByOrderId(orderId);
            
            // Insert new return items if any
            if (returnItemsArray.length > 0) {
                await ReturnItem.createMany(orderId, returnItemsArray);
            }
        }

        logger.info('Order updated', {
            orderId,
            updatedBy: req.user.userId,
            updatedFields: Object.keys(updates)
        });

        // Get order items, return items, and payment summary for response
        const items = await OrderItem.findByOrderId(updatedOrder.id);
        const returnItemsList = await ReturnItem.findByOrderId(updatedOrder.id);
        const paymentSummary = await Payment.getPaymentSummary(updatedOrder.id);

        res.json(successResponse({
            ...updatedOrder,
            items,
            return_items_list: returnItemsList.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity
            })),
            payment_summary: paymentSummary
        }, 'Order updated successfully'));
    } catch (error) {
        if (error.message === 'No fields to update') {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'No fields to update'));
        }
        next(error);
    }
};

// Create order (simplified - no items list, only total amount)
exports.createOrder = async (req, res, next) => {
    try {
        // Log at the very start to verify function is called
        logger.info('=== ORDER CREATION STARTED ===', {
            orderNumber: req.body.orderNumber,
            customerId: req.body.customerId,
            userId: req.user.userId,
            userRole: req.user.role,
            timestamp: new Date().toISOString()
        });
        console.log('[ORDER CREATE] Function called', {
            orderNumber: req.body.orderNumber,
            customerId: req.body.customerId,
            userId: req.user.userId,
            userRole: req.user.role
        });

        const { 
            orderNumber, 
            customerId, 
            totalAmount, 
            paidAmount,           // Optional: Amount already paid
            paymentMode,          // Optional: Payment mode (CASH, CARD, UPI, BANK_TRANSFER)
            transactionReference, // Optional: Transaction reference
            customerComments,
            returnItems,          // Optional: Boolean indicating if there are return items (legacy) OR array of return items
            returnItemsList,      // Optional: Array of return items [{name, quantity}]
            returnAdjustAmount    // Optional: Amount to be deducted from total due to return items
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
        
        // Handle return items: support both legacy boolean and new array format
        let returnItemsArray = [];
        let returnItemsFlag = false;
        
        // If returnItemsList is provided (new format), use it
        if (returnItemsList && Array.isArray(returnItemsList) && returnItemsList.length > 0) {
            returnItemsArray = returnItemsList;
            returnItemsFlag = true;
            
            // Validate return items array
            for (const item of returnItemsArray) {
                if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
                    return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Return item name is required and must be a non-empty string'));
                }
                if (!item.quantity || !Number.isInteger(parseInt(item.quantity)) || parseInt(item.quantity) <= 0) {
                    return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Return item quantity is required and must be a positive integer'));
                }
            }
        } else if (returnItems === true || returnItems === 'true' || returnItems === 1) {
            // Legacy boolean format
            returnItemsFlag = true;
        }
        
        const returnAdjustAmountNum = returnAdjustAmount ? parseFloat(returnAdjustAmount) : 0;

        // Validate return adjust amount
        if (returnAdjustAmountNum < 0) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Return adjust amount cannot be negative'));
        }

        if (returnAdjustAmountNum > totalAmountNum) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Return adjust amount cannot exceed total amount'));
        }

        // If returnItems is true (either from array or boolean), returnAdjustAmount should be > 0
        if (returnItemsFlag && returnAdjustAmountNum <= 0) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Return adjust amount must be greater than 0 when return items are present'));
        }
        
        // If returnItemsList is provided, returnAdjustAmount should also be provided
        if (returnItemsArray.length > 0 && returnAdjustAmountNum <= 0) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Return adjust amount must be provided when return items list is provided'));
        }

        // Calculate adjusted total (total_amount - return_adjust_amount)
        const adjustedTotal = totalAmountNum - returnAdjustAmountNum;

        // Validate paid amount against adjusted total
        if (paidAmountNum < 0) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Paid amount cannot be negative'));
        }

        if (paidAmountNum > adjustedTotal) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', `Paid amount cannot exceed adjusted total amount (${adjustedTotal.toFixed(2)})`));
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

        // Determine admin ID for push notifications
        // If user is admin, use their ID; if store_manager, use their adminId
        const User = require('../models/User');
        const adminId = req.user.role === 'admin' ? req.user.userId : (req.user.adminId || req.user.userId);
        
        logger.info('Admin ID determined for push notification', {
            adminId,
            userRole: req.user.role,
            userId: req.user.userId,
            userAdminId: req.user.adminId
        });
        console.log('[ORDER CREATE] Admin ID:', adminId, 'Role:', req.user.role);

        // Determine payment status based on paid amount vs adjusted total
        // adjusted_total = total_amount - return_adjust_amount
        let initialPaymentStatus = 'PENDING';
        if (paidAmountNum >= adjustedTotal) {
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

            // Use customer address if available, otherwise use area as fallback
            const customerAddress = customer.address || customer.area || '';

            // Create order with provided order number
            // Note: assigned_delivery_boy_id is NULL - order is available to all delivery boys under admin
            const orderResult = await client.query(
                `INSERT INTO orders (order_number, customer_id, assigned_delivery_boy_id, store_id,
                                    customer_name, customer_phone, customer_address, customer_lat, customer_lng,
                                    total_amount, status, payment_status, payment_mode, customer_comments, 
                                    return_items, return_adjust_amount, assigned_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ASSIGNED', $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [orderNumber.trim(), customerId, null, storeId,
                 customer.name, customer.mobile, customerAddress || null, customer.customer_lat, customer.customer_lng,
                 totalAmountNum, initialPaymentStatus, normalizedPaymentMode, customerComments,
                 returnItemsFlag, returnAdjustAmountNum]
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

            // Create return items if provided
            if (returnItemsArray.length > 0) {
                const returnItemsValues = [];
                const returnItemsPlaceholders = [];
                let returnItemsParamCount = 1;

                returnItemsArray.forEach((item) => {
                    returnItemsPlaceholders.push(`($${returnItemsParamCount}, $${returnItemsParamCount + 1}, $${returnItemsParamCount + 2})`);
                    returnItemsValues.push(order.id, item.name.trim(), parseInt(item.quantity));
                    returnItemsParamCount += 3;
                });

                await client.query(
                    `INSERT INTO return_items (order_id, name, quantity)
                     VALUES ${returnItemsPlaceholders.join(', ')}`,
                    returnItemsValues
                );
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
        
        // Get return items
        const returnItemsList = await ReturnItem.findByOrderId(order.id);

        // Send push notification to all delivery boys under admin
        logger.info('About to send push notification for new order', {
            orderId: order.id,
            orderNumber: order.order_number,
            adminId: adminId,
            customerArea: customer.area || ''
        });
        console.log('[PUSH NOTIFICATION] About to send', {
            orderId: order.id,
            orderNumber: order.order_number,
            adminId: adminId
        });

        try {
            const PushNotificationService = require('../services/pushNotificationService');
            console.log('[PUSH NOTIFICATION] Calling notifyNewOrder...');
            const notificationResult = await PushNotificationService.notifyNewOrder(adminId, {
                id: order.id,
                order_number: order.order_number,
                customer_area: customer.area || ''
            });
            
            logger.info('Push notification result', {
                orderId: order.id,
                adminId: adminId,
                result: notificationResult
            });
            console.log('[PUSH NOTIFICATION] Result:', JSON.stringify(notificationResult));
        } catch (notificationError) {
            // Log error but don't fail order creation
            logger.error('Failed to send push notification', {
                orderId: order.id,
                adminId,
                error: notificationError.message,
                stack: notificationError.stack
            });
            console.error('[PUSH NOTIFICATION] ERROR:', notificationError.message);
            console.error('[PUSH NOTIFICATION] Stack:', notificationError.stack);
        }

        logger.info('Order created', { orderId: order.id, orderNumber: order.order_number, createdBy: storeId, totalAmount });

        res.status(201).json(successResponse({
            ...order,
            return_items_list: returnItemsList.map(item => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity
            })),
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

        // Verify order is unassigned or assigned to this delivery boy
        // Also check if order belongs to delivery boy's admin group
        if (order.assigned_delivery_boy_id !== null && order.assigned_delivery_boy_id !== req.user.userId) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Order not available for you'));
        }

        // Check if order belongs to delivery boy's admin group
        const deliveryBoy = await DeliveryBoy.findById(req.user.userId);
        if (!deliveryBoy || !deliveryBoy.store_id) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Delivery boy not found or not linked to a store'));
        }

        const User = require('../models/User');
        const storeUser = await User.findById(deliveryBoy.store_id);
        const adminId = storeUser?.role === 'admin' ? storeUser.id : storeUser?.admin_id || deliveryBoy.store_id;
        const storeIds = await User.getStoreIdsForAdmin(adminId);

        if (!storeIds.includes(order.store_id)) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Order does not belong to your admin group'));
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
        }, 'Order rejected. Order is now available for all delivery boys to accept.'));
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

        // Validation
        if (!latitude || !longitude) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Latitude and longitude are required'));
        }

        // Get order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Order not found'));
        }

        // Check if delivery boy is assigned
        if (req.user.role === 'delivery_boy' && order.assigned_delivery_boy_id !== req.user.userId) {
            return res.status(403).json(errorResponse('FORBIDDEN', 'Order not assigned to you'));
        }

        // Only update tracking link if order is IN_TRANSIT
        if (order.status === 'IN_TRANSIT') {
            // Generate Google Maps link
            const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
            
            // Update current order with tracking link
            await Order.update(orderId, {
                tracking_link: googleMapsLink
            });

            // Update customer_address in ALL orders for this customer
            if (order.customer_id) {
                const { query } = require('../config/database');
                await query(
                    `UPDATE orders 
                     SET customer_address = $1 
                     WHERE customer_id = $2`,
                    [googleMapsLink, order.customer_id]
                );

                // Also update customer's address field with Google Maps link
                const Customer = require('../models/Customer');
                await Customer.update(order.customer_id, {
                    address: googleMapsLink
                });
            }

            logger.info('Tracking link updated for IN_TRANSIT order and all customer orders', { 
                orderId, 
                customerId: order.customer_id,
                latitude, 
                longitude, 
                trackingLink: googleMapsLink 
            });
        }

        // Create location update (always store location history)
        await LocationUpdate.create({
            order_id: orderId,
            latitude,
            longitude,
            recorded_by: req.user.userId,
            source: source || 'MANUAL'
        });

        logger.info('Location updated', { orderId, latitude, longitude, status: order.status });

        res.json(successResponse({
            tracking_link: order.status === 'IN_TRANSIT' ? `https://www.google.com/maps?q=${latitude},${longitude}` : null
        }, 'Location updated successfully'));
    } catch (error) {
        next(error);
    }
};

// Get pending orders created till yesterday (status != DELIVERED)
exports.getPendingOrdersTillYesterday = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const filters = {
            limit: Math.min(parseInt(limit), 500),
            offset: (parseInt(page) - 1) * Math.min(parseInt(limit), 500)
        };

        // Filter based on user role
        if (req.user.role === 'admin') {
            // Admin: see orders for all stores in their group (admin + its stores)
            const User = require('../models/User');
            const storeIds = await User.getStoreIdsForAdmin(req.user.userId);
            filters.store_ids = storeIds;
        } else if (req.user.role === 'store_manager') {
            // Store manager: use adminId from token to get group, fallback to own ID
            const User = require('../models/User');
            const anchorAdminId = req.user.adminId || req.user.userId;
            const storeIds = await User.getStoreIdsForAdmin(anchorAdminId);
            filters.store_ids = storeIds;
        } else if (req.user.role === 'delivery_boy') {
            // Delivery boys: show unassigned orders in their admin group OR orders assigned to them
            const deliveryBoy = await DeliveryBoy.findById(req.user.userId);
            if (!deliveryBoy || !deliveryBoy.store_id) {
                return res.json(paginatedResponse({ orders: [], pagination: { total: 0, page: 1, limit: filters.limit, totalPages: 0 } }));
            }

            const User = require('../models/User');
            const storeUser = await User.findById(deliveryBoy.store_id);

            let storeIds = [];
            if (storeUser) {
                const adminId = storeUser.role === 'admin' ? storeUser.id : (storeUser.admin_id || deliveryBoy.store_id);
                storeIds = await User.getStoreIdsForAdmin(adminId);
            }
            // Always include delivery boy's own store_id
            if (!storeIds || storeIds.length === 0) {
                storeIds = [deliveryBoy.store_id];
            } else if (!storeIds.includes(deliveryBoy.store_id)) {
                storeIds.push(deliveryBoy.store_id);
            }

            // Special filter: include unassigned + assigned to this delivery boy
            filters.store_ids = storeIds;
            filters.include_unassigned_for_delivery_boy = true;
            filters.delivery_boy_id = req.user.userId;
        }

        const orders = await Order.getPendingOrdersTillYesterday(filters);
        const total = await Order.countPendingOrdersTillYesterday(filters);

        // Get payment summary, items, and return items for each order (same format as getAllOrders)
        const ordersWithDetails = await Promise.all(orders.map(async (order) => {
            try {
                const items = await OrderItem.findByOrderId(order.id);
                const returnItemsList = await ReturnItem.findByOrderId(order.id);
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
                    return_items_list: returnItemsList.map(item => ({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity
                    })),
                    payment_summary: paymentSummary || {
                        total_amount: parseFloat(order.total_amount || 0),
                        return_adjust_amount: parseFloat(order.return_adjust_amount || 0),
                        total_paid: 0,
                        remaining_amount: Math.max(0, parseFloat(order.total_amount || 0) - parseFloat(order.return_adjust_amount || 0)),
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
                    return_items_list: [],
                    payment_summary: {
                        total_amount: parseFloat(order.total_amount || 0),
                        return_adjust_amount: parseFloat(order.return_adjust_amount || 0),
                        total_paid: 0,
                        remaining_amount: Math.max(0, parseFloat(order.total_amount || 0) - parseFloat(order.return_adjust_amount || 0)),
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

// Get orders by customer mobile
exports.getOrdersByCustomerMobile = async (req, res, next) => {
    try {
        const { mobile } = req.params;
        const storeId = req.user.role === 'admin' ? req.query.storeId : req.user.userId;

        const orders = await Order.getByCustomerMobile(mobile, storeId);

        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await OrderItem.findByOrderId(order.id);
            const returnItemsList = await ReturnItem.findByOrderId(order.id);
            return { 
                ...order, 
                items,
                return_items_list: returnItemsList.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity
                }))
            };
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
