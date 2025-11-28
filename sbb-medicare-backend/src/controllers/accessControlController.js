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
    let userData = null; // Declare outside try for error logging
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
        // Use exact string literal for role to match database constraint
        userData = {
            name: name.trim(),
            store_name: store_name ? store_name.trim() : null,
            mobile: mobile.trim(),
            email: email.trim().toLowerCase(),
            password_hash,
            address: address ? address.trim() : null,
            role: 'store_manager', // Exact string - matches CHECK (role IN ('admin', 'store_manager'))
            is_active: true
        };
        
        // Double-check role value before sending to database
        if (userData.role !== 'store_manager' && userData.role !== 'admin') {
            logger.error('Invalid role value detected', { role: userData.role });
            userData.role = 'store_manager'; // Force to valid value
        }

        logger.info('Creating store manager', { 
            email: userData.email,
            role: userData.role,
            createdBy: req.user?.userId 
        });

        const storeManager = await User.create(userData);

        logger.info('Store manager created', { 
            storeManagerId: storeManager.id, 
            createdBy: req.user?.userId 
        });

        // Don't return password hash
        delete storeManager.password_hash;

        res.status(201).json(successResponse(storeManager, 'Store manager created successfully'));
    } catch (error) {
        // Log detailed error for debugging
        const requestEmail = req.body?.email || 'unknown';
        // Log COMPLETE error details
        logger.error('Error creating store manager - FULL DETAILS', {
            errorMessage: error.message,
            errorCode: error.code,
            constraint: error.constraint,
            detail: error.detail,
            hint: error.hint,
            table: error.table,
            column: error.column,
            where: error.where,
            stack: error.stack,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            requestBody: {
                email: requestEmail,
                name: req.body?.name,
                role: 'store_manager'
            },
            userDataRole: userData?.role
        });
        
        // Check if it's a role constraint error
        if (error.message && error.message.includes('users_role_check')) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid role value. Role must be "admin" or "store_manager".'));
        }
        
        if (error.code === '23514') { // PostgreSQL check constraint violation
            // Return more details in development
            const errorMsg = process.env.NODE_ENV === 'production' 
                ? 'Database constraint violation. Please check role value.'
                : `Database constraint violation: ${error.constraint || 'unknown'}. Detail: ${error.detail || error.message}`;
            return res.status(400).json(errorResponse('VALIDATION_ERROR', errorMsg));
        }
        
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

        // Support both isActive (camelCase) and is_active (snake_case)
        const value = req.body.is_active !== undefined ? req.body.is_active : req.body.isActive;

        // If value is provided in body, use it (support boolean or string)
        if (value !== undefined) {
            // Handle string booleans
            if (typeof value === 'string') {
                if (value.toLowerCase() === 'true' || value === '1') {
                    is_active = true;
                } else if (value.toLowerCase() === 'false' || value === '0') {
                    is_active = false;
                } else {
                    return res.status(400).json(errorResponse('VALIDATION_ERROR', 'is_active/isActive must be a boolean or "true"/"false" string'));
                }
            } else if (typeof value === 'boolean') {
                is_active = value;
            } else if (typeof value === 'number') {
                // Handle numeric: 1 = true, 0 = false
                is_active = value === 1;
            } else {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'is_active/isActive must be a boolean or "true"/"false" string'));
            }
        } else {
            // If no body provided, toggle the current status
            is_active = !storeManager.is_active;
        }

        // Use toggleActive method which properly syncs status
        const updatedManager = await User.toggleActive(req.params.id, is_active);

        if (!updatedManager) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Store manager not found'));
        }
        
        logger.info('Store manager active status toggled', {
            storeManagerId: req.params.id,
            is_active,
            status: updatedManager.status,
            updatedBy: req.user?.userId
        });

        // Don't return password hash
        delete updatedManager.password_hash;

        const statusMessage = is_active 
            ? 'activated and status set to active' 
            : 'deactivated and status set to inactive';

        res.json(successResponse(
            updatedManager, 
            `Store manager ${statusMessage} successfully`
        ));
    } catch (error) {
        // Log detailed error for debugging
        logger.error('Error toggling store manager active status', {
            error: error.message,
            errorCode: error.code,
            stack: error.stack,
            storeManagerId: req.params.id,
            requestBody: req.body
        });
        next(error);
    }
};

