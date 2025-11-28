const Customer = require('../models/Customer');
const logger = require('../config/logger');

// Get all customers
exports.getAllCustomers = async (req, res, next) => {
    try {
        const { limit = 100, offset = 0, search } = req.query;

        // Get store_id from authenticated user (store managers see only their store's customers)
        const storeId = req.user.userId;
        const userRole = req.user.role;

        // Build filters - admin sees all stores, store managers see only their store
        const filters = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            store_id: userRole === 'admin' ? null : storeId
        };

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

// Get customer by ID
exports.getCustomerById = async (req, res, next) => {
    try {
        const customer = await Customer.getWithOrderCount(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ customer });
    } catch (error) {
        next(error);
    }
};

// Create customer
exports.createCustomer = async (req, res, next) => {
    try {
        // Support both field name formats: name/full_name, mobile/mobile_number
        const name = req.body.name || req.body.full_name;
        const mobile = req.body.mobile || req.body.mobile_number;
        const { address, landmark, customerLat, customerLng, latitude, longitude, customer_lat, customer_lng } = req.body;

        // Validation
        if (!name || !mobile || !address) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Name, mobile, and address are required'
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
            address: address.trim(),
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
        const { address, landmark, customerLat, customerLng, latitude, longitude, customer_lat, customer_lng } = req.body;

        const updates = {};
        if (name) updates.name = name.trim();
        if (mobile) updates.mobile = mobile.trim();
        if (address) updates.address = address.trim();
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
            return res.status(404).json({ error: 'Customer not found' });
        }

        logger.info('Customer deleted', { customerId: req.params.id, deletedBy: req.user.id });

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
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
