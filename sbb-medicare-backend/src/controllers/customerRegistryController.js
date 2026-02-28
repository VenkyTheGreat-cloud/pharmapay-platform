const CustomerRegistry = require('../models/CustomerRegistry');
const logger = require('../config/logger');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const ExcelJS = require('exceljs');

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

        // Get store_id from authenticated user
        // For admin, use their primary store; for store_manager, use their store
        let storeId = null;
        if (req.user.role === 'admin' || req.user.role === 'store_manager') {
            const User = require('../models/User');
            const userStores = await User.getStoreIdsForAdmin(
                req.user.role === 'admin' ? req.user.userId : req.user.adminId
            );
            // Use the first store if multiple stores exist
            storeId = userStores && userStores.length > 0 ? userStores[0] : null;
        }

        // Create registry entry - name is optional
        const registry = await CustomerRegistry.create({
            mobile: mobile.trim(),
            name: name ? name.trim() : null,
            registry_date: normalizedDateTime,
            store_id: storeId
        });

        logger.info('Customer registry entry created', { id: registry.id, mobile: registry.mobile, name: registry.name, store_id: storeId });

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

// Export customer registry to Excel
exports.exportCustomerRegistryExcel = async (req, res, next) => {
    try {
        const { mobile, date, date_from, date_to, search } = req.query;

        // Same filter logic as getAllCustomerRegistry but without pagination
        const filters = {};

        if (mobile) {
            filters.mobile = mobile.trim();
        }

        const normalizeDateForFilter = (rawDate) => {
            if (!rawDate) return null;
            if (/^\d{4}-\d{2}-\d{2}T/.test(rawDate)) {
                return rawDate.slice(0, 10);
            }
            if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
                return rawDate;
            }
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

        // Get all entries matching filters
        const entries = await CustomerRegistry.findAll(filters);

        // Generate Excel
        return await generateCustomerRegistryExcel(res, entries, filters);
    } catch (error) {
        logger.error('Error exporting customer registry to Excel', {
            error: error.message,
            stack: error.stack,
            query: req.query
        });
        next(error);
    }
};

// Helper: Generate Excel for Customer Registry
const generateCustomerRegistryExcel = async (res, entries, filters) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Customer Registry');

        // Define columns
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Mobile', key: 'mobile', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Registry Date & Time', key: 'registry_date', width: 25 },
            { header: 'Created At', key: 'created_at', width: 25 },
            { header: 'Store ID', key: 'store_id', width: 10 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Add rows
        entries.forEach(entry => {
            const formatDateTime = (dt) => {
                if (!dt) return '';
                return new Date(dt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            };

            worksheet.addRow({
                id: entry.id,
                mobile: entry.mobile,
                name: entry.name || '',
                registry_date: formatDateTime(entry.registry_date),
                created_at: formatDateTime(entry.created_at),
                store_id: entry.store_id || ''
            });
        });

        // Generate filename
        const timestamp = new Date().getTime();
        let datePart = 'all';
        if (filters.date) {
            datePart = filters.date.replace(/-/g, '');
        } else if (filters.date_from && filters.date_to) {
            datePart = `${filters.date_from.replace(/-/g, '')}_to_${filters.date_to.replace(/-/g, '')}`;
        }
        const filename = `customer_registry_${datePart}_${timestamp}.xlsx`;

        // Write to buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Send response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.end(buffer);

        logger.info('Customer registry exported to Excel', {
            count: entries.length,
            filename
        });
    } catch (error) {
        throw error;
    }
};
