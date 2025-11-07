const Customer = require('../models/Customer');
const logger = require('../config/logger');

// Get all customers
exports.getAllCustomers = async (req, res, next) => {
    try {
        const { limit = 100, offset = 0, search } = req.query;

        let customers;
        if (search) {
            customers = await Customer.search(search);
        } else {
            customers = await Customer.findAll(parseInt(limit), parseInt(offset));
        }

        res.json({ customers, count: customers.length });
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
        const { full_name, mobile_number, address, latitude, longitude, landmark } = req.body;

        // Check if customer with mobile already exists
        const existingCustomer = await Customer.findByMobile(mobile_number);
        if (existingCustomer) {
            return res.status(409).json({
                error: 'Customer with this mobile number already exists',
                customer: existingCustomer
            });
        }

        const customer = await Customer.create({
            full_name,
            mobile_number,
            address,
            latitude,
            longitude,
            landmark,
            created_by: req.user.id
        });

        logger.info('Customer created', { customerId: customer.id, createdBy: req.user.id });

        res.status(201).json({
            message: 'Customer created successfully',
            customer
        });
    } catch (error) {
        next(error);
    }
};

// Update customer
exports.updateCustomer = async (req, res, next) => {
    try {
        const { full_name, mobile_number, address, latitude, longitude, landmark } = req.body;

        const customer = await Customer.update(req.params.id, {
            full_name,
            mobile_number,
            address,
            latitude,
            longitude,
            landmark
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        logger.info('Customer updated', { customerId: req.params.id, updatedBy: req.user.id });

        res.json({
            message: 'Customer updated successfully',
            customer
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
        const { query } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        const customers = await Customer.search(query);

        res.json({ customers, count: customers.length });
    } catch (error) {
        next(error);
    }
};
