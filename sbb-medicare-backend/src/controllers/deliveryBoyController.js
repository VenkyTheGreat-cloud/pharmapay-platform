const DeliveryBoy = require('../models/DeliveryBoy');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Get all delivery boys
exports.getAllDeliveryBoys = async (req, res, next) => {
    try {
        const { status, is_active, store_id } = req.query;
        
        const filters = {};
        if (status) filters.status = status;
        if (is_active !== undefined) filters.isActive = is_active === 'true';
        if (store_id) filters.store_id = store_id;

        const deliveryBoys = await DeliveryBoy.findAll(filters);

        res.json(successResponse({
            delivery_boys: deliveryBoys,
            count: deliveryBoys.length
        }));
    } catch (error) {
        next(error);
    }
};

// Get approved delivery boys
exports.getApprovedDeliveryBoys = async (req, res, next) => {
    try {
        const deliveryBoys = await DeliveryBoy.getApproved();

        res.json(successResponse({
            delivery_boys: deliveryBoys,
            count: deliveryBoys.length
        }));
    } catch (error) {
        next(error);
    }
};

// Get delivery boy by ID
exports.getDeliveryBoyById = async (req, res, next) => {
    try {
        const deliveryBoy = await DeliveryBoy.findById(req.params.id);

        if (!deliveryBoy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Delivery boy not found'));
        }

        res.json(successResponse(deliveryBoy));
    } catch (error) {
        next(error);
    }
};

// Create delivery boy
exports.createDeliveryBoy = async (req, res, next) => {
    try {
        const { name, mobile, email, address, photo_url, store_id } = req.body;

        if (!name || !mobile) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Name and mobile are required'));
        }

        // Check if mobile already exists
        const existing = await DeliveryBoy.findByMobile(mobile);
        if (existing) {
            return res.status(409).json(errorResponse('DUPLICATE_MOBILE', 'Mobile number already registered'));
        }

        const deliveryBoy = await DeliveryBoy.create({
            name,
            mobile,
            email,
            address,
            photo_url,
            store_id: store_id || req.user.userId || null
        });

        logger.info('Delivery boy created', { deliveryBoyId: deliveryBoy.id, createdBy: req.user?.userId });

        res.status(201).json(successResponse(deliveryBoy, 'Delivery boy created successfully'));
    } catch (error) {
        next(error);
    }
};

// Update delivery boy
exports.updateDeliveryBoy = async (req, res, next) => {
    try {
        const { name, mobile, email, address, photo_url } = req.body;

        const deliveryBoy = await DeliveryBoy.update(req.params.id, {
            name,
            mobile,
            email,
            address,
            photo_url
        });

        if (!deliveryBoy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Delivery boy not found'));
        }

        logger.info('Delivery boy updated', { deliveryBoyId: req.params.id, updatedBy: req.user?.userId });

        res.json(successResponse(deliveryBoy, 'Delivery boy updated successfully'));
    } catch (error) {
        next(error);
    }
};

// Delete delivery boy
exports.deleteDeliveryBoy = async (req, res, next) => {
    try {
        const deleted = await DeliveryBoy.delete(req.params.id);

        if (!deleted) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Delivery boy not found'));
        }

        logger.info('Delivery boy deleted', { deliveryBoyId: req.params.id, deletedBy: req.user?.userId });

        res.json(successResponse(null, 'Delivery boy deleted successfully'));
    } catch (error) {
        next(error);
    }
};

// Approve delivery boy
exports.approveDeliveryBoy = async (req, res, next) => {
    try {
        const deliveryBoy = await DeliveryBoy.approve(req.params.id);

        if (!deliveryBoy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Delivery boy not found'));
        }

        logger.info('Delivery boy approved', { deliveryBoyId: req.params.id, approvedBy: req.user?.userId });

        res.json(successResponse(deliveryBoy, 'Delivery boy approved successfully'));
    } catch (error) {
        next(error);
    }
};

// Toggle active status
exports.toggleActiveStatus = async (req, res, next) => {
    try {
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
            const deliveryBoy = await DeliveryBoy.findById(req.params.id);
            if (!deliveryBoy) {
                return res.status(404).json(errorResponse('NOT_FOUND', 'Delivery boy not found'));
            }
            is_active = !deliveryBoy.is_active;
        }

        const deliveryBoy = await DeliveryBoy.toggleActive(req.params.id, is_active);

        if (!deliveryBoy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Delivery boy not found'));
        }

        logger.info('Delivery boy active status toggled', {
            deliveryBoyId: req.params.id,
            is_active,
            updatedBy: req.user?.userId
        });

        res.json(successResponse(deliveryBoy, `Delivery boy ${is_active ? 'activated' : 'deactivated'} successfully`));
    } catch (error) {
        next(error);
    }
};

