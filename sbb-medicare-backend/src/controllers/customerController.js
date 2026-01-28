const Customer = require('../models/Customer');
const OrderItem = require('../models/OrderItem');
const logger = require('../config/logger');

// Get all customers
exports.getAllCustomers = async (req, res, next) => {
    try {
        const { limit = 100, offset = 0, search } = req.query;

        // Get grouping info from authenticated user
        const storeId = req.user.userId;
        const userRole = req.user.role;
        const adminIdFromToken = req.user.adminId || null;

        // Build filters - admin + all its stores share customers, same for stores under that admin
        const filters = {
            limit: parseInt(limit),
            offset: parseInt(offset)
        };

        if (userRole === 'admin') {
            // Admin: anchor is their own ID
            const User = require('../models/User');
            const storeIds = await User.getStoreIdsForAdmin(storeId);
            filters.store_ids = storeIds;
        } else if (userRole === 'store_manager') {
            // Store manager: anchor is adminId from token (group admin)
            const User = require('../models/User');
            const anchorAdminId = adminIdFromToken || storeId;
            const storeIds = await User.getStoreIdsForAdmin(anchorAdminId);
            filters.store_ids = storeIds;
        }

        if (search) {
            filters.search = search;
        }

        const customers = await Customer.findAll(filters);

        res.json({ 
            success: true,
            data: {
                customers, 
                count: customers.length 
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get customer by ID with complete order history
exports.getCustomerById = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ 
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Customer not found'
                }
            });
        }

        // Get complete order history for this customer
        const orders = await Customer.getOrders(req.params.id);

        // Get order items for each order
        const ordersWithItems = await Promise.all(
            orders.map(async (order) => {
                const items = await OrderItem.findByOrderId(order.id);
                return {
                    ...order,
                    items: items || []
                };
            })
        );

        res.json({ 
            success: true,
            data: { 
                customer,
                orders: ordersWithItems,
                order_count: ordersWithItems.length
            }
        });
    } catch (error) {
        logger.error('Error getting customer by ID', {
            error: error.message,
            customerId: req.params.id,
            stack: error.stack
        });
        next(error);
    }
};

// Get customer orders only
exports.getCustomerOrders = async (req, res, next) => {
    try {
        // Verify customer exists
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ 
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Customer not found'
                }
            });
        }

        // Get complete order history for this customer
        const orders = await Customer.getOrders(req.params.id);

        // Get order items for each order
        const ordersWithItems = await Promise.all(
            orders.map(async (order) => {
                const items = await OrderItem.findByOrderId(order.id);
                return {
                    ...order,
                    items: items || []
                };
            })
        );

        res.json({ 
            success: true,
            data: { 
                orders: ordersWithItems,
                order_count: ordersWithItems.length,
                customer_id: req.params.id,
                customer_name: customer.name,
                customer_mobile: customer.mobile
            }
        });
    } catch (error) {
        logger.error('Error getting customer orders', {
            error: error.message,
            customerId: req.params.id,
            stack: error.stack
        });
        next(error);
    }
};

// Create customer (simplified - only name, mobile, and date)
exports.createCustomerSimple = async (req, res, next) => {
    try {
        const { name, mobile, date } = req.body;

        // Validation
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Name is required'
                }
            });
        }

        if (!mobile || !mobile.trim()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Mobile number is required'
                }
            });
        }

        if (!date) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Date is required'
                }
            });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Date must be in YYYY-MM-DD format'
                }
            });
        }

        // Get store_id from authenticated user
        const storeId = req.user.userId;

        // Check if customer with mobile already exists for this store
        const existingCustomer = await Customer.findByMobileAndStore(mobile.trim(), storeId);
        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_MOBILE',
                    message: 'Customer with this mobile number already exists'
                },
                data: { customer: existingCustomer }
            });
        }

        // Create customer with minimal fields
        const customer = await Customer.create({
            name: name.trim(),
            mobile: mobile.trim(),
            address: null,
            area: null, // Optional for simplified creation
            landmark: null,
            customer_lat: null,
            customer_lng: null,
            store_id: storeId,
            customer_date: date // Store the provided date
        });

        logger.info('Customer created (simplified)', { 
            customerId: customer.id, 
            createdBy: req.user.userId,
            storeId: storeId,
            date: date
        });

        res.status(201).json({
            success: true,
            data: {
                customer: {
                    id: customer.id,
                    name: customer.name,
                    mobile: customer.mobile,
                    customer_date: customer.customer_date,
                    created_at: customer.created_at
                },
                message: 'Customer created successfully'
            }
        });
    } catch (error) {
        logger.error('Error creating customer (simplified)', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
};

// Create customer
exports.createCustomer = async (req, res, next) => {
    try {
        // Support both field name formats: name/full_name, mobile/mobile_number
        const name = req.body.name || req.body.full_name;
        const mobile = req.body.mobile || req.body.mobile_number;
        const { address, area, landmark, customerLat, customerLng, latitude, longitude, customer_lat, customer_lng } = req.body;

        // Validation - Area is mandatory, Address is optional for new customers
        if (!name || !mobile) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Name and mobile are required'
                }
            });
        }

        if (!area) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Area is required'
                }
            });
        }

        // Get store_id from authenticated user
        const storeId = req.user.userId; // Store manager's user ID is their store ID

        // Use coordinates from any of the possible field names
        const lat = customerLat || latitude || customer_lat || null;
        const lng = customerLng || longitude || customer_lng || null;

        // Check if customer with mobile already exists for this store
        const existingCustomer = await Customer.findByMobileAndStore(mobile, storeId);
        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_MOBILE',
                    message: 'Customer with this mobile number already exists'
                },
                data: { customer: existingCustomer }
            });
        }

        const customer = await Customer.create({
            name: name.trim(),
            mobile: mobile.trim(),
            address: address ? address.trim() : null, // Address is optional
            area: area.trim(), // Area is mandatory
            landmark: landmark ? landmark.trim() : null,
            customer_lat: lat,
            customer_lng: lng,
            store_id: storeId
        });

        logger.info('Customer created', { 
            customerId: customer.id, 
            createdBy: req.user.userId,
            storeId: storeId 
        });

        res.status(201).json({
            success: true,
            data: {
                customer,
                message: 'Customer created successfully'
            }
        });
    } catch (error) {
        logger.error('Error creating customer', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
};

// Update customer
exports.updateCustomer = async (req, res, next) => {
    try {
        // Support both field name formats
        const name = req.body.name || req.body.full_name;
        const mobile = req.body.mobile || req.body.mobile_number;
        const { address, area, landmark, customerLat, customerLng, latitude, longitude, customer_lat, customer_lng } = req.body;

        const updates = {};
        if (name) updates.name = name.trim();
        if (mobile) updates.mobile = mobile.trim();
        if (address !== undefined) updates.address = address ? address.trim() : null; // Address can be set to null
        if (area !== undefined) updates.area = area ? area.trim() : null; // Area can be updated
        if (landmark !== undefined) updates.landmark = landmark ? landmark.trim() : null;
        
        // Handle coordinates from any field name
        const lat = customerLat || latitude || customer_lat;
        const lng = customerLng || longitude || customer_lng;
        if (lat !== undefined) updates.customer_lat = lat;
        if (lng !== undefined) updates.customer_lng = lng;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'No fields to update'
                }
            });
        }

        const customer = await Customer.update(req.params.id, updates);

        if (!customer) {
            return res.status(404).json({ 
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Customer not found'
                }
            });
        }

        logger.info('Customer updated', { customerId: req.params.id, updatedBy: req.user.userId });

        res.json({
            success: true,
            data: {
                customer,
                message: 'Customer updated successfully'
            }
        });
    } catch (error) {
        next(error);
    }
};

// Delete customer
exports.deleteCustomer = async (req, res, next) => {
    try {
        const deleted = await Customer.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ 
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Customer not found'
                }
            });
        }

        logger.info('Customer deleted', { customerId: req.params.id, deletedBy: req.user.userId });

        res.json({ 
            success: true,
            data: { message: 'Customer deleted successfully' }
        });
    } catch (error) {
        if (error.message === 'CUSTOMER_HAS_ORDERS') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'CUSTOMER_HAS_ORDERS',
                    message: 'Cannot delete customer with existing orders'
                }
            });
        }
        next(error);
    }
};

// Search customers
exports.searchCustomers = async (req, res, next) => {
    try {
        const { query: searchQuery } = req.query;

        if (!searchQuery || searchQuery.trim().length < 2) {
            return res.status(400).json({ 
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Search query must be at least 2 characters'
                }
            });
        }

        // Get store_id from authenticated user
        const storeId = req.user.userId;
        const userRole = req.user.role;

        const customers = await Customer.findAll({
            search: searchQuery.trim(),
            store_id: userRole === 'admin' ? null : storeId
        });

        res.json({ 
            success: true,
            data: {
                customers, 
                count: customers.length 
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get customers with order registration status for a specific date
exports.getCustomersWithOrderStatusByDate = async (req, res, next) => {
    try {
        const { date } = req.query || req.body;

        if (!date) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Date is required (format: YYYY-MM-DD)'
                }
            });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Date must be in YYYY-MM-DD format'
                }
            });
        }

        // Get store IDs based on user role
        let storeIds = null;
        const userRole = req.user.role;
        const storeId = req.user.userId;

        if (userRole === 'admin') {
            // Admin: get all stores in their group
            const User = require('../models/User');
            storeIds = await User.getStoreIdsForAdmin(storeId);
        } else if (userRole === 'store_manager') {
            // Store manager: get all stores in their admin group
            const User = require('../models/User');
            const adminId = req.user.adminId || storeId;
            storeIds = await User.getStoreIdsForAdmin(adminId);
        } else {
            // For other roles, use single store_id
            storeIds = [storeId];
        }

        // Get customers with order status for the date
        const customers = await Customer.getCustomersWithOrderStatusByDate(date, storeIds);

        // Group by customer (since one customer might have multiple orders on the same date)
        // We'll show the first order's details
        const customerMap = new Map();
        
        customers.forEach(row => {
            const key = `${row.mobile}-${row.id}`;
            if (!customerMap.has(key)) {
                customerMap.set(key, {
                    customer_id: row.id,
                    name: row.name,
                    mobile: row.mobile,
                    registered: row.registered,
                    order_created_at: row.order_created_at ? new Date(row.order_created_at).toISOString() : null,
                    order_number: row.order_number || null,
                    order_id: row.order_id || null
                });
            } else {
                // If customer has multiple orders, update with the latest order
                const existing = customerMap.get(key);
                if (row.registered && row.order_created_at) {
                    const existingDate = existing.order_created_at ? new Date(existing.order_created_at) : null;
                    const newDate = new Date(row.order_created_at);
                    if (!existingDate || newDate > existingDate) {
                        existing.order_created_at = newDate.toISOString();
                        existing.order_number = row.order_number;
                        existing.order_id = row.order_id;
                    }
                }
            }
        });

        const result = Array.from(customerMap.values());

        logger.info('Customers with order status fetched', {
            date,
            count: result.length,
            registeredCount: result.filter(c => c.registered).length,
            requestedBy: req.user.userId
        });

        res.json({
            success: true,
            data: {
                date,
                customers: result,
                total_customers: result.length,
                registered_customers: result.filter(c => c.registered).length,
                unregistered_customers: result.filter(c => !c.registered).length
            }
        });
    } catch (error) {
        logger.error('Error getting customers with order status by date', {
            error: error.message,
            stack: error.stack,
            date: req.query?.date || req.body?.date
        });
        next(error);
    }
};
