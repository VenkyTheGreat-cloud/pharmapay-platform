const User = require('../models/User');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Get all store managers (admin only)
exports.getAllStoreManagers = async (req, res, next) => {
    try {
        const storeManagers = await User.findByRole('store_manager');

        res.json(successResponse({
            store_managers: storeManagers,
            count: storeManagers.length
        }));
    } catch (error) {
        next(error);
    }
};

// Get store manager by ID
exports.getStoreManagerById = async (req, res, next) => {
    try {
        const storeManager = await User.findById(req.params.id);

        if (!storeManager) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Store manager not found'));
        }

        // Verify it's a store manager
        if (storeManager.role !== 'store_manager') {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Store manager not found'));
        }

        res.json(successResponse(storeManager));
    } catch (error) {
        next(error);
    }
};

// Create store manager (admin only)
exports.createStoreManager = async (req, res, next) => {
    try {
        const { name, store_name, mobile, email, password, address } = req.body;

        // Validation
        if (!name || !mobile || !email || !password) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Name, mobile, email, and password are required'));
        }

        // Check if email already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json(errorResponse('DUPLICATE_EMAIL', 'Email already registered'));
        }

        // Check if mobile already exists
        const existingMobile = await User.findByMobile(mobile);
        if (existingMobile) {
            return res.status(409).json(errorResponse('DUPLICATE_MOBILE', 'Mobile number already registered'));
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create store manager
        const storeManager = await User.create({
            name,
            store_name,
            mobile,
            email,
            password_hash,
            address,
            role: 'store_manager',
            is_active: true
        });

        logger.info('Store manager created', { 
            storeManagerId: storeManager.id, 
            createdBy: req.user?.userId 
        });

        // Don't return password hash
        delete storeManager.password_hash;

        res.status(201).json(successResponse(storeManager, 'Store manager created successfully'));
    } catch (error) {
        next(error);
    }
};

// Update store manager (admin only)
exports.updateStoreManager = async (req, res, next) => {
    try {
        const { name, store_name, mobile, email, address } = req.body;

        // Get the store manager first
        const storeManager = await User.findById(req.params.id);
        if (!storeManager || storeManager.role !== 'store_manager') {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Store manager not found'));
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== storeManager.email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json(errorResponse('DUPLICATE_EMAIL', 'Email already registered'));
            }
        }

        // Check if mobile is being changed and if it's already taken
        if (mobile && mobile !== storeManager.mobile) {
            const existingMobile = await User.findByMobile(mobile);
            if (existingMobile) {
                return res.status(409).json(errorResponse('DUPLICATE_MOBILE', 'Mobile number already registered'));
            }
        }

        // Update store manager
        const updates = {};
        if (name) updates.name = name;
        if (store_name !== undefined) updates.store_name = store_name;
        if (mobile) updates.mobile = mobile;
        if (email) updates.email = email;
        if (address !== undefined) updates.address = address;

        const updatedStoreManager = await User.update(req.params.id, updates);

        if (!updatedStoreManager) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Store manager not found'));
        }

        logger.info('Store manager updated', { 
            storeManagerId: req.params.id, 
            updatedBy: req.user?.userId 
        });

        // Don't return password hash
        delete updatedStoreManager.password_hash;

        res.json(successResponse(updatedStoreManager, 'Store manager updated successfully'));
    } catch (error) {
        next(error);
    }
};

// Delete store manager (admin only)
exports.deleteStoreManager = async (req, res, next) => {
    try {
        // Get the store manager first
        const storeManager = await User.findById(req.params.id);
        if (!storeManager || storeManager.role !== 'store_manager') {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Store manager not found'));
        }

        const deleted = await User.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Store manager not found'));
        }

        logger.info('Store manager deleted', { 
            storeManagerId: req.params.id, 
            deletedBy: req.user?.userId 
        });

        res.json(successResponse(null, 'Store manager deleted successfully'));
    } catch (error) {
        next(error);
    }
};

// Toggle active status (admin only)
exports.toggleActiveStatus = async (req, res, next) => {
    try {
        // Get the store manager first
        const storeManager = await User.findById(req.params.id);
        
        // Verify store manager exists
        if (!storeManager || storeManager.role !== 'store_manager') {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Store manager not found'));
        }
        
        let is_active;

        // If is_active is provided in body, use it (support boolean or string)
        if (req.body.hasOwnProperty('is_active')) {
            const value = req.body.is_active;
            
            // Handle string booleans
            if (typeof value === 'string') {
                if (value.toLowerCase() === 'true' || value === '1') {
                    is_active = true;
                } else if (value.toLowerCase() === 'false' || value === '0') {
                    is_active = false;
                } else {
                    return res.status(400).json(errorResponse('VALIDATION_ERROR', 'is_active must be a boolean or "true"/"false" string'));
                }
            } else if (typeof value === 'boolean') {
                is_active = value;
            } else {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'is_active must be a boolean or "true"/"false" string'));
            }
        } else {
            // If no body provided, toggle the current status
            is_active = !storeManager.is_active;
        }

        const updatedStoreManager = await User.update(req.params.id, { is_active });

        if (!updatedStoreManager) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Store manager not found'));
        }

        logger.info('Store manager active status toggled', {
            storeManagerId: req.params.id,
            is_active,
            updatedBy: req.user?.userId
        });

        // Don't return password hash
        delete updatedStoreManager.password_hash;

        res.json(successResponse(
            updatedStoreManager, 
            `Store manager ${is_active ? 'activated' : 'deactivated'} successfully`
        ));
    } catch (error) {
        next(error);
    }
};

