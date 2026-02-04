const CustomerRegistry = require('../models/CustomerRegistry');
const logger = require('../config/logger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

// Helper: normalize incoming date/datetime string to ISO format
const normalizeDateTimeParam = (rawDateTime) => {
    if (!rawDateTime) return null;

    // If it's already an ISO datetime string (e.g. 2025-11-26T10:30:00.000Z or 2025-11-26T10:30:00)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(rawDateTime)) {
        // Ensure it has timezone info, if not add Z
        if (!rawDateTime.includes('Z') && !rawDateTime.includes('+') && !rawDateTime.includes('-', 10)) {
            return rawDateTime + 'Z';
        }
        return rawDateTime;
    }

    // If it's just a date (YYYY-MM-DD), convert to datetime with current time
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDateTime)) {
        return new Date(rawDateTime).toISOString();
    }

    // Handle common UI formats: DD/MM/YYYY HH:MM or DD-MM-YYYY HH:MM
    const m = rawDateTime.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (m) {
        const [, dd, mm, yyyy, hh = '00', min = '00', sec = '00'] = m;
        return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}`).toISOString();
    }

    // Try to parse as Date object
    const parsed = new Date(rawDateTime);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
    }

    // Fallback: return raw
    return rawDateTime;
};

// Create a new customer registry entry
exports.createCustomerRegistry = async (req, res, next) => {
    try {
        const { mobile, name, registry_date } = req.body;

        // Validation - Only mobile is mandatory
        if (!mobile || mobile.trim() === '') {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Mobile number is required'));
        }

        // Validate mobile format (basic validation - 10 digits)
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobile.trim())) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Mobile number must be 10 digits'));
        }

        // Normalize datetime (accepts both date and datetime)
        const normalizedDateTime = registry_date ? normalizeDateTimeParam(registry_date) : new Date().toISOString();

        // Create registry entry - name is optional
        const registry = await CustomerRegistry.create({
            mobile: mobile.trim(),
            name: name ? name.trim() : null,
            registry_date: normalizedDateTime
        });

        logger.info('Customer registry entry created', { id: registry.id, mobile: registry.mobile, name: registry.name });

        res.status(201).json(successResponse(registry, 'Customer registry entry created successfully'));
    } catch (error) {
        next(error);
    }
};

// Get all customer registry entries with pagination
exports.getAllCustomerRegistry = async (req, res, next) => {
    try {
        const { mobile, date, date_from, date_to, search, page = 1, limit = 20 } = req.query;

        const filters = {
            limit: Math.min(parseInt(limit), 100),
            offset: (parseInt(page) - 1) * Math.min(parseInt(limit), 100)
        };

        if (mobile) {
            filters.mobile = mobile.trim();
        }

        // Support both single date and date range (for filtering, we only need date part)
        const normalizeDateForFilter = (rawDate) => {
            if (!rawDate) return null;
            // Extract date part from datetime if needed
            if (/^\d{4}-\d{2}-\d{2}T/.test(rawDate)) {
                return rawDate.slice(0, 10);
            }
            if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
                return rawDate;
            }
            // Handle DD/MM/YYYY or DD-MM-YYYY
            const m = rawDate.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/);
            if (m) {
                const [, dd, mm, yyyy] = m;
                return `${yyyy}-${mm}-${dd}`;
            }
            return rawDate;
        };

        const dateFrom = normalizeDateForFilter(date_from);
        const dateTo = normalizeDateForFilter(date_to);
        const singleDate = normalizeDateForFilter(date);

        if (dateFrom && dateTo) {
            filters.date_from = dateFrom;
            filters.date_to = dateTo;
        } else if (singleDate) {
            filters.date = singleDate;
        }

        if (search) {
            filters.search = search.trim();
        }

        const entries = await CustomerRegistry.findAll(filters);
        const total = await CustomerRegistry.count(filters);

        const pagination = {
            total,
            page: parseInt(page),
            limit: filters.limit,
            totalPages: Math.ceil(total / filters.limit)
        };

        res.json(paginatedResponse({ entries }, pagination));
    } catch (error) {
        next(error);
    }
};

// Get customer registry entry by ID
exports.getCustomerRegistryById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const registry = await CustomerRegistry.findById(id);
        if (!registry) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Customer registry entry not found'));
        }

        res.json(successResponse(registry, 'Customer registry entry retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

// Update customer registry entry
exports.updateCustomerRegistry = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { mobile, name, registry_date } = req.body;

        // Check if entry exists
        const existing = await CustomerRegistry.findById(id);
        if (!existing) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Customer registry entry not found'));
        }

        const updates = {};

        if (mobile !== undefined) {
            if (!mobile || mobile.trim() === '') {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Mobile number cannot be empty'));
            }
            const mobileRegex = /^[0-9]{10}$/;
            if (!mobileRegex.test(mobile.trim())) {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Mobile number must be 10 digits'));
            }
            updates.mobile = mobile.trim();
        }

        if (name !== undefined) {
            // Name is optional - can be null or empty string
            updates.name = name ? name.trim() : null;
        }

        if (registry_date !== undefined) {
            const normalizedDateTime = normalizeDateTimeParam(registry_date);
            if (!normalizedDateTime) {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid date/time format'));
            }
            updates.registry_date = normalizedDateTime;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'No fields to update'));
        }

        const updated = await CustomerRegistry.update(id, updates);

        logger.info('Customer registry entry updated', { id, updates });

        res.json(successResponse(updated, 'Customer registry entry updated successfully'));
    } catch (error) {
        next(error);
    }
};

// Delete customer registry entry
exports.deleteCustomerRegistry = async (req, res, next) => {
    try {
        const { id } = req.params;

        const registry = await CustomerRegistry.findById(id);
        if (!registry) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Customer registry entry not found'));
        }

        await CustomerRegistry.delete(id);

        logger.info('Customer registry entry deleted', { id });

        res.json(successResponse(null, 'Customer registry entry deleted successfully'));
    } catch (error) {
        next(error);
    }
};

// Get registered customers with order status for a specific date
exports.getRegisteredCustomersWithOrders = async (req, res, next) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Date parameter is required (format: YYYY-MM-DD)'));
        }

        // Normalize date
        const normalizeDateForFilter = (rawDate) => {
            if (!rawDate) return null;
            // Extract date part from datetime if needed
            if (/^\d{4}-\d{2}-\d{2}T/.test(rawDate)) {
                return rawDate.slice(0, 10);
            }
            if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
                return rawDate;
            }
            // Handle DD/MM/YYYY or DD-MM-YYYY
            const m = rawDate.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/);
            if (m) {
                const [, dd, mm, yyyy] = m;
                return `${yyyy}-${mm}-${dd}`;
            }
            return rawDate;
        };

        const normalizedDate = normalizeDateForFilter(date);
        if (!normalizedDate || !/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid date format. Use YYYY-MM-DD'));
        }

        // Determine store IDs based on user role
        let storeIds = null;
        if (req.user.role === 'admin') {
            const User = require('../models/User');
            storeIds = await User.getStoreIdsForAdmin(req.user.userId);
        } else if (req.user.role === 'store_manager') {
            const User = require('../models/User');
            const anchorAdminId = req.user.adminId || req.user.userId;
            storeIds = await User.getStoreIdsForAdmin(anchorAdminId);
        }

        // Get registered customers with order status
        const results = await CustomerRegistry.getRegisteredCustomersWithOrders(normalizedDate, storeIds);

        // Format response
        const formattedResults = results.map(row => ({
            registry_id: row.registry_id,
            customer_name: row.customer_name,
            customer_mobile: row.customer_mobile,
            registry_date: row.registry_date,
            registry_date_time: row.registry_date, // Full timestamp
            has_order: row.has_order,
            order: row.has_order ? {
                order_id: row.order_id,
                order_number: row.order_number,
                order_created_at: row.order_created_at,
                order_created_date_time: row.order_created_at, // Full timestamp
                total_amount: parseFloat(row.total_amount || 0),
                order_status: row.order_status
            } : null
        }));

        logger.info('Fetched registered customers with orders', { date: normalizedDate, count: formattedResults.length });

        res.json(successResponse({
            date: normalizedDate,
            customers: formattedResults,
            total_registered: formattedResults.length,
            total_with_orders: formattedResults.filter(r => r.has_order).length,
            total_without_orders: formattedResults.filter(r => !r.has_order).length
        }, 'Registered customers with order status retrieved successfully'));
    } catch (error) {
        next(error);
    }
};
