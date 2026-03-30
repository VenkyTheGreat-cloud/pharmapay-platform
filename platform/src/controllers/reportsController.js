const { query } = require('../config/database');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const ExcelJS = require('exceljs');

// Helper: normalize incoming date string to YYYY-MM-DD
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

// Get delivery boy performance report
exports.getDeliveryBoyReport = async (req, res, next) => {
    try {
        const { from_date, from_time, to_date, to_time } = req.query;

        // Validate required parameters
        if (!from_date || !to_date) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'from_date and to_date are required (format: YYYY-MM-DD)'));
        }

        // Normalize dates
        const normalizedFromDate = normalizeDateParam(from_date);
        const normalizedToDate = normalizeDateParam(to_date);

        if (!normalizedFromDate || !normalizedToDate) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid date format. Use YYYY-MM-DD'));
        }

        // Build timestamp filters
        let dateFrom, dateTo;

        if (from_time && to_time) {
            // Validate time format (HH:MM or HH:MM:SS)
            const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:([0-5][0-9]))?$/;
            if (!timeRegex.test(from_time) || !timeRegex.test(to_time)) {
                return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid time format. Use HH:MM or HH:MM:SS (24-hour format)'));
            }

            // Combine date with time
            dateFrom = `${normalizedFromDate} ${from_time}`;
            dateTo = `${normalizedToDate} ${to_time}`;
        } else {
            // Default to start and end of day
            dateFrom = `${normalizedFromDate} 00:00:00`;
            dateTo = `${normalizedToDate} 23:59:59`;
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
        } else if (req.user.role === 'delivery_boy') {
            // Delivery boys can only see their own report
            const DeliveryBoy = require('../models/DeliveryBoy');
            const deliveryBoy = await DeliveryBoy.findById(req.user.userId);
            if (!deliveryBoy) {
                return res.status(404).json(errorResponse('NOT_FOUND', 'Delivery boy not found'));
            }
            // Filter will be applied by delivery_boy_id
        }

        // Build query for delivery boy performance
        // Use CTE to aggregate payments per order first to avoid duplicates
        let reportQuery = `
            WITH order_payments AS (
                SELECT 
                    order_id,
                    COALESCE(SUM(cash_amount + bank_amount), 0) as total_paid
                FROM payments
                WHERE status = 'CONFIRMED'
                GROUP BY order_id
            )
            SELECT 
                db.id as delivery_boy_id,
                db.name as delivery_boy_name,
                db.mobile as delivery_boy_mobile,
                db.email as delivery_boy_email,
                u.name as store_name,
                COUNT(DISTINCT o.id) as total_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'DELIVERED') as delivered_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'ASSIGNED') as assigned_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'PICKED_UP') as picked_up_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'IN_TRANSIT') as in_transit_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'PAYMENT_COLLECTION') as payment_collection_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'CANCELLED') as cancelled_orders,
                COALESCE(SUM(o.total_amount), 0) as total_order_value,
                COALESCE(SUM(op.total_paid), 0) as total_collected_amount,
                COALESCE(SUM(o.total_amount - COALESCE(o.return_adjust_amount, 0) - COALESCE(op.total_paid, 0)), 0) as pending_amount
            FROM delivery_boys db
            LEFT JOIN orders o ON o.assigned_delivery_boy_id = db.id
                AND o.created_at >= $1::timestamp
                AND o.created_at <= $2::timestamp
            LEFT JOIN order_payments op ON op.order_id = o.id
            LEFT JOIN users u ON db.store_id = u.id
            WHERE 1=1
        `;

        const params = [dateFrom, dateTo];
        let paramCount = 3;

        // Apply store filter for admin/store_manager
        if (storeIds && storeIds.length > 0) {
            reportQuery += ` AND db.store_id = ANY($${paramCount})`;
            params.push(storeIds);
            paramCount++;
        }

        // Apply delivery boy filter for delivery_boy role
        if (req.user.role === 'delivery_boy') {
            reportQuery += ` AND db.id = $${paramCount}`;
            params.push(req.user.userId);
            paramCount++;
        }

        // Only show approved and active delivery boys
        reportQuery += ` AND db.status = 'approved' AND db.is_active = true`;

        reportQuery += `
            GROUP BY db.id, db.name, db.mobile, db.email, u.name
            ORDER BY total_orders DESC, delivered_orders DESC
        `;

        const result = await query(reportQuery, params);

        // Format response
        const deliveryBoys = result.rows.map(row => ({
            delivery_boy_id: row.delivery_boy_id,
            delivery_boy_name: row.delivery_boy_name,
            delivery_boy_mobile: row.delivery_boy_mobile,
            delivery_boy_email: row.delivery_boy_email,
            store_name: row.store_name,
            statistics: {
                total_orders: parseInt(row.total_orders || 0, 10),
                delivered_orders: parseInt(row.delivered_orders || 0, 10),
                assigned_orders: parseInt(row.assigned_orders || 0, 10),
                picked_up_orders: parseInt(row.picked_up_orders || 0, 10),
                in_transit_orders: parseInt(row.in_transit_orders || 0, 10),
                payment_collection_orders: parseInt(row.payment_collection_orders || 0, 10),
                cancelled_orders: parseInt(row.cancelled_orders || 0, 10),
                total_order_value: parseFloat(row.total_order_value || 0),
                total_collected_amount: parseFloat(row.total_collected_amount || 0),
                pending_amount: parseFloat(row.pending_amount || 0)
            }
        }));

        // Calculate summary totals
        const summary = {
            total_delivery_boys: deliveryBoys.length,
            total_orders: deliveryBoys.reduce((sum, db) => sum + db.statistics.total_orders, 0),
            total_delivered_orders: deliveryBoys.reduce((sum, db) => sum + db.statistics.delivered_orders, 0),
            total_order_value: deliveryBoys.reduce((sum, db) => sum + db.statistics.total_order_value, 0),
            total_collected_amount: deliveryBoys.reduce((sum, db) => sum + db.statistics.total_collected_amount, 0),
            total_pending_amount: deliveryBoys.reduce((sum, db) => sum + db.statistics.pending_amount, 0)
        };

        logger.info('Delivery boy report generated', {
            from_date: dateFrom,
            to_date: dateTo,
            delivery_boys_count: deliveryBoys.length,
            requested_by: req.user.userId,
            role: req.user.role
        });

        // Check if Excel export is requested
        if (req.query.format === 'excel') {
            return exportDeliveryBoyReportToExcel(res, dateFrom, dateTo, deliveryBoys, summary);
        }

        res.json(successResponse({
            date_range: {
                from_date: dateFrom,
                to_date: dateTo
            },
            summary,
            delivery_boys: deliveryBoys
        }, 'Delivery boy report retrieved successfully'));

    } catch (error) {
        logger.error('Error generating delivery boy report', {
            error: error.message,
            stack: error.stack,
            query: req.query
        });
        next(error);
    }
};

// Helper function to build date/time filters
const buildDateTimeFilters = (from_date, from_time, to_date, to_time) => {
    if (!from_date || !to_date) {
        return { error: 'from_date and to_date are required (format: YYYY-MM-DD)' };
    }

    const normalizedFromDate = normalizeDateParam(from_date);
    const normalizedToDate = normalizeDateParam(to_date);

    if (!normalizedFromDate || !normalizedToDate) {
        return { error: 'Invalid date format. Use YYYY-MM-DD' };
    }

    let dateFrom, dateTo;

    if (from_time && to_time) {
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:([0-5][0-9]))?$/;
        if (!timeRegex.test(from_time) || !timeRegex.test(to_time)) {
            return { error: 'Invalid time format. Use HH:MM or HH:MM:SS (24-hour format)' };
        }
        dateFrom = `${normalizedFromDate} ${from_time}`;
        dateTo = `${normalizedToDate} ${to_time}`;
    } else {
        dateFrom = `${normalizedFromDate} 00:00:00`;
        dateTo = `${normalizedToDate} 23:59:59`;
    }

    return { dateFrom, dateTo };
};

// Get customer performance report
exports.getCustomerReport = async (req, res, next) => {
    try {
        const { from_date, from_time, to_date, to_time } = req.query;

        const dateFilters = buildDateTimeFilters(from_date, from_time, to_date, to_time);
        if (dateFilters.error) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', dateFilters.error));
        }

        const { dateFrom, dateTo } = dateFilters;

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

        // Build query for customer performance
        let reportQuery = `
            WITH order_payments AS (
                SELECT 
                    order_id,
                    COALESCE(SUM(cash_amount + bank_amount), 0) as total_paid
                FROM payments
                WHERE status = 'CONFIRMED'
                GROUP BY order_id
            )
            SELECT 
                c.id as customer_id,
                c.name as customer_name,
                c.mobile as customer_mobile,
                c.area as customer_area,
                u.name as store_name,
                COUNT(DISTINCT o.id) as total_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'DELIVERED') as delivered_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'CANCELLED') as cancelled_orders,
                COALESCE(SUM(o.total_amount), 0) as total_order_value,
                COALESCE(SUM(o.return_adjust_amount), 0) as total_return_adjustment,
                COALESCE(SUM(op.total_paid), 0) as total_paid_amount,
                COALESCE(AVG(o.total_amount), 0) as average_order_value,
                COALESCE(MAX(o.created_at), NULL) as last_order_date
            FROM customers c
            LEFT JOIN orders o ON o.customer_id = c.id
                AND o.created_at >= $1::timestamp
                AND o.created_at <= $2::timestamp
            LEFT JOIN order_payments op ON op.order_id = o.id
            LEFT JOIN users u ON c.store_id = u.id
            WHERE 1=1
        `;

        const params = [dateFrom, dateTo];
        let paramCount = 3;

        // Apply store filter
        if (storeIds && storeIds.length > 0) {
            reportQuery += ` AND c.store_id = ANY($${paramCount})`;
            params.push(storeIds);
            paramCount++;
        } else if (req.user.role === 'store_manager') {
            reportQuery += ` AND c.store_id = $${paramCount}`;
            params.push(req.user.userId);
            paramCount++;
        }

        reportQuery += `
            GROUP BY c.id, c.name, c.mobile, c.area, u.name
            HAVING COUNT(DISTINCT o.id) > 0
            ORDER BY total_orders DESC, total_order_value DESC
        `;

        const result = await query(reportQuery, params);

        const customers = result.rows.map(row => ({
            customer_id: row.customer_id,
            customer_name: row.customer_name,
            customer_mobile: row.customer_mobile,
            customer_area: row.customer_area,
            store_name: row.store_name,
            statistics: {
                total_orders: parseInt(row.total_orders || 0, 10),
                delivered_orders: parseInt(row.delivered_orders || 0, 10),
                cancelled_orders: parseInt(row.cancelled_orders || 0, 10),
                total_order_value: parseFloat(row.total_order_value || 0),
                total_return_adjustment: parseFloat(row.total_return_adjustment || 0),
                total_paid_amount: parseFloat(row.total_paid_amount || 0),
                average_order_value: parseFloat(row.average_order_value || 0),
                last_order_date: row.last_order_date
            }
        }));

        const summary = {
            total_customers: customers.length,
            total_orders: customers.reduce((sum, c) => sum + c.statistics.total_orders, 0),
            total_delivered_orders: customers.reduce((sum, c) => sum + c.statistics.delivered_orders, 0),
            total_order_value: customers.reduce((sum, c) => sum + c.statistics.total_order_value, 0),
            total_return_adjustment: customers.reduce((sum, c) => sum + c.statistics.total_return_adjustment, 0),
            total_paid_amount: customers.reduce((sum, c) => sum + c.statistics.total_paid_amount, 0)
        };

        logger.info('Customer report generated', {
            from_date: dateFrom,
            to_date: dateTo,
            customers_count: customers.length,
            requested_by: req.user.userId,
            role: req.user.role
        });

        // Check if Excel export is requested
        if (req.query.format === 'excel') {
            return exportCustomerReportToExcel(res, dateFrom, dateTo, customers, summary);
        }

        res.json(successResponse({
            date_range: {
                from_date: dateFrom,
                to_date: dateTo
            },
            summary,
            customers
        }, 'Customer report retrieved successfully'));

    } catch (error) {
        logger.error('Error generating customer report', {
            error: error.message,
            stack: error.stack,
            query: req.query
        });
        next(error);
    }
};

// Get return items report
exports.getReturnItemsReport = async (req, res, next) => {
    try {
        const { from_date, from_time, to_date, to_time } = req.query;

        const dateFilters = buildDateTimeFilters(from_date, from_time, to_date, to_time);
        if (dateFilters.error) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', dateFilters.error));
        }

        const { dateFrom, dateTo } = dateFilters;

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

        // Build query for return items
        let reportQuery = `
            SELECT 
                ri.id as return_item_id,
                ri.name as item_name,
                ri.quantity,
                ri.created_at as return_date,
                o.id as order_id,
                o.order_number,
                o.created_at as order_date,
                o.total_amount as order_total,
                o.return_adjust_amount,
                o.customer_name,
                o.customer_phone,
                o.status as order_status,
                u.name as store_name
            FROM return_items ri
            INNER JOIN orders o ON ri.order_id = o.id
                AND o.created_at >= $1::timestamp
                AND o.created_at <= $2::timestamp
            LEFT JOIN users u ON o.store_id = u.id
            WHERE 1=1
        `;

        const params = [dateFrom, dateTo];
        let paramCount = 3;

        // Apply store filter
        if (storeIds && storeIds.length > 0) {
            reportQuery += ` AND o.store_id = ANY($${paramCount})`;
            params.push(storeIds);
            paramCount++;
        } else if (req.user.role === 'store_manager') {
            reportQuery += ` AND o.store_id = $${paramCount}`;
            params.push(req.user.userId);
            paramCount++;
        }

        reportQuery += ` ORDER BY ri.created_at DESC, o.order_number ASC`;

        const result = await query(reportQuery, params);

        // Group by item name for summary
        const itemSummary = {};
        result.rows.forEach(row => {
            const itemName = row.item_name;
            if (!itemSummary[itemName]) {
                itemSummary[itemName] = {
                    item_name: itemName,
                    total_quantity: 0,
                    total_orders: new Set(),
                    total_adjustment: 0
                };
            }
            itemSummary[itemName].total_quantity += parseInt(row.quantity || 0, 10);
            itemSummary[itemName].total_orders.add(row.order_id);
            itemSummary[itemName].total_adjustment += parseFloat(row.return_adjust_amount || 0);
        });

        const itemSummaryArray = Object.values(itemSummary).map(item => ({
            item_name: item.item_name,
            total_quantity: item.total_quantity,
            total_orders: item.total_orders.size,
            total_adjustment: item.total_adjustment
        }));

        const returnItems = result.rows.map(row => ({
            return_item_id: row.return_item_id,
            item_name: row.item_name,
            quantity: parseInt(row.quantity || 0, 10),
            return_date: row.return_date,
            order: {
                order_id: row.order_id,
                order_number: row.order_number,
                order_date: row.order_date,
                order_total: parseFloat(row.order_total || 0),
                return_adjust_amount: parseFloat(row.return_adjust_amount || 0),
                order_status: row.order_status,
                customer_name: row.customer_name,
                customer_phone: row.customer_phone,
                store_name: row.store_name
            }
        }));

        const summary = {
            total_return_items: returnItems.length,
            unique_items: itemSummaryArray.length,
            total_orders_with_returns: new Set(result.rows.map(r => r.order_id)).size,
            total_adjustment_amount: result.rows.reduce((sum, r) => sum + parseFloat(r.return_adjust_amount || 0), 0),
            items_summary: itemSummaryArray
        };

        logger.info('Return items report generated', {
            from_date: dateFrom,
            to_date: dateTo,
            return_items_count: returnItems.length,
            requested_by: req.user.userId,
            role: req.user.role
        });

        // Check if Excel export is requested
        if (req.query.format === 'excel') {
            return exportReturnItemsReportToExcel(res, dateFrom, dateTo, returnItems, summary);
        }

        res.json(successResponse({
            date_range: {
                from_date: dateFrom,
                to_date: dateTo
            },
            summary,
            return_items: returnItems
        }, 'Return items report retrieved successfully'));

    } catch (error) {
        logger.error('Error generating return items report', {
            error: error.message,
            stack: error.stack,
            query: req.query
        });
        next(error);
    }
};

// Get sales report
exports.getSalesReport = async (req, res, next) => {
    try {
        const { from_date, from_time, to_date, to_time } = req.query;

        const dateFilters = buildDateTimeFilters(from_date, from_time, to_date, to_time);
        if (dateFilters.error) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', dateFilters.error));
        }

        const { dateFrom, dateTo } = dateFilters;

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

        // Build query for sales report
        let reportQuery = `
            WITH order_payments AS (
                SELECT 
                    order_id,
                    COALESCE(SUM(cash_amount), 0) as cash_paid,
                    COALESCE(SUM(bank_amount), 0) as bank_paid,
                    COALESCE(SUM(cash_amount + bank_amount), 0) as total_paid
                FROM payments
                WHERE status = 'CONFIRMED'
                GROUP BY order_id
            )
            SELECT 
                COUNT(DISTINCT o.id) as total_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'DELIVERED') as delivered_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'ASSIGNED') as assigned_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'PICKED_UP') as picked_up_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'IN_TRANSIT') as in_transit_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'PAYMENT_COLLECTION') as payment_collection_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'CANCELLED') as cancelled_orders,
                COUNT(DISTINCT o.id) FILTER (WHERE o.return_items = true) as orders_with_returns,
                COUNT(DISTINCT o.customer_id) as unique_customers,
                COALESCE(SUM(o.total_amount), 0) as total_revenue,
                COALESCE(SUM(o.return_adjust_amount), 0) as total_return_adjustment,
                COALESCE(SUM(o.total_amount - COALESCE(o.return_adjust_amount, 0)), 0) as net_revenue,
                COALESCE(SUM(op.cash_paid), 0) as total_cash_collected,
                COALESCE(SUM(op.bank_paid), 0) as total_bank_collected,
                COALESCE(SUM(op.total_paid), 0) as total_collected,
                COALESCE(SUM(o.total_amount - COALESCE(o.return_adjust_amount, 0) - COALESCE(op.total_paid, 0)), 0) as pending_collection,
                COALESCE(AVG(o.total_amount), 0) as average_order_value
            FROM orders o
            LEFT JOIN order_payments op ON op.order_id = o.id
            WHERE o.created_at >= $1::timestamp
                AND o.created_at <= $2::timestamp
        `;

        const params = [dateFrom, dateTo];
        let paramCount = 3;

        // Apply store filter
        if (storeIds && storeIds.length > 0) {
            reportQuery += ` AND o.store_id = ANY($${paramCount})`;
            params.push(storeIds);
            paramCount++;
        } else if (req.user.role === 'store_manager') {
            reportQuery += ` AND o.store_id = $${paramCount}`;
            params.push(req.user.userId);
            paramCount++;
        }

        const result = await query(reportQuery, params);
        const stats = result.rows[0];

        // Get daily breakdown
        let dailyQuery = `
            WITH order_payments AS (
                SELECT 
                    order_id,
                    COALESCE(SUM(cash_amount + bank_amount), 0) as total_paid
                FROM payments
                WHERE status = 'CONFIRMED'
                GROUP BY order_id
            )
            SELECT 
                DATE(o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') as order_date,
                COUNT(DISTINCT o.id) as orders_count,
                COALESCE(SUM(o.total_amount), 0) as revenue,
                COALESCE(SUM(o.return_adjust_amount), 0) as return_adjustment,
                COALESCE(SUM(op.total_paid), 0) as collected
            FROM orders o
            LEFT JOIN order_payments op ON op.order_id = o.id
            WHERE o.created_at >= $1::timestamp
                AND o.created_at <= $2::timestamp
        `;

        const dailyParams = [dateFrom, dateTo];
        let dailyParamCount = 3;

        if (storeIds && storeIds.length > 0) {
            dailyQuery += ` AND o.store_id = ANY($${dailyParamCount})`;
            dailyParams.push(storeIds);
            dailyParamCount++;
        } else if (req.user.role === 'store_manager') {
            dailyQuery += ` AND o.store_id = $${dailyParamCount}`;
            dailyParams.push(req.user.userId);
            dailyParamCount++;
        }

        dailyQuery += ` GROUP BY DATE(o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') ORDER BY order_date ASC`;

        const dailyResult = await query(dailyQuery, dailyParams);

        const summary = {
            total_orders: parseInt(stats.total_orders || 0, 10),
            delivered_orders: parseInt(stats.delivered_orders || 0, 10),
            assigned_orders: parseInt(stats.assigned_orders || 0, 10),
            picked_up_orders: parseInt(stats.picked_up_orders || 0, 10),
            in_transit_orders: parseInt(stats.in_transit_orders || 0, 10),
            payment_collection_orders: parseInt(stats.payment_collection_orders || 0, 10),
            cancelled_orders: parseInt(stats.cancelled_orders || 0, 10),
            orders_with_returns: parseInt(stats.orders_with_returns || 0, 10),
            unique_customers: parseInt(stats.unique_customers || 0, 10),
            total_revenue: parseFloat(stats.total_revenue || 0),
            total_return_adjustment: parseFloat(stats.total_return_adjustment || 0),
            net_revenue: parseFloat(stats.net_revenue || 0),
            total_cash_collected: parseFloat(stats.total_cash_collected || 0),
            total_bank_collected: parseFloat(stats.total_bank_collected || 0),
            total_collected: parseFloat(stats.total_collected || 0),
            pending_collection: parseFloat(stats.pending_collection || 0),
            average_order_value: parseFloat(stats.average_order_value || 0)
        };

        const daily_breakdown = dailyResult.rows.map(row => ({
            date: row.order_date,
            orders_count: parseInt(row.orders_count || 0, 10),
            revenue: parseFloat(row.revenue || 0),
            return_adjustment: parseFloat(row.return_adjustment || 0),
            collected: parseFloat(row.collected || 0)
        }));

        logger.info('Sales report generated', {
            from_date: dateFrom,
            to_date: dateTo,
            total_orders: summary.total_orders,
            requested_by: req.user.userId,
            role: req.user.role
        });

        // Check if Excel export is requested
        if (req.query.format === 'excel') {
            return exportSalesReportToExcel(res, dateFrom, dateTo, summary, daily_breakdown);
        }

        res.json(successResponse({
            date_range: {
                from_date: dateFrom,
                to_date: dateTo
            },
            summary,
            daily_breakdown
        }, 'Sales report retrieved successfully'));

    } catch (error) {
        logger.error('Error generating sales report', {
            error: error.message,
            stack: error.stack,
            query: req.query
        });
        next(error);
    }
};

// Excel export helper functions
const exportDeliveryBoyReportToExcel = async (res, dateFrom, dateTo, deliveryBoys, summary) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Delivery Boy Report');

        worksheet.columns = [
            { header: 'Delivery Boy ID', key: 'delivery_boy_id', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Mobile', key: 'mobile', width: 15 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Store Name', key: 'store_name', width: 25 },
            { header: 'Total Orders', key: 'total_orders', width: 15 },
            { header: 'Delivered Orders', key: 'delivered_orders', width: 18 },
            { header: 'Assigned Orders', key: 'assigned_orders', width: 18 },
            { header: 'Picked Up Orders', key: 'picked_up_orders', width: 18 },
            { header: 'In Transit Orders', key: 'in_transit_orders', width: 18 },
            { header: 'Payment Collection', key: 'payment_collection', width: 20 },
            { header: 'Cancelled Orders', key: 'cancelled_orders', width: 18 },
            { header: 'Total Order Value', key: 'total_order_value', width: 18 },
            { header: 'Total Collected', key: 'total_collected', width: 18 },
            { header: 'Pending Amount', key: 'pending_amount', width: 18 }
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        deliveryBoys.forEach(db => {
            worksheet.addRow({
                delivery_boy_id: db.delivery_boy_id,
                name: db.delivery_boy_name || '',
                mobile: db.delivery_boy_mobile || '',
                email: db.delivery_boy_email || '',
                store_name: db.store_name || '',
                total_orders: db.statistics.total_orders,
                delivered_orders: db.statistics.delivered_orders,
                assigned_orders: db.statistics.assigned_orders,
                picked_up_orders: db.statistics.picked_up_orders,
                in_transit_orders: db.statistics.in_transit_orders,
                payment_collection: db.statistics.payment_collection_orders,
                cancelled_orders: db.statistics.cancelled_orders,
                total_order_value: parseFloat(db.statistics.total_order_value || 0).toFixed(2),
                total_collected: parseFloat(db.statistics.total_collected_amount || 0).toFixed(2),
                pending_amount: parseFloat(db.statistics.pending_amount || 0).toFixed(2)
            });
        });

        worksheet.addRow({});
        worksheet.addRow({
            delivery_boy_id: 'SUMMARY',
            name: '',
            mobile: '',
            email: '',
            store_name: '',
            total_orders: summary.total_orders,
            delivered_orders: summary.total_delivered_orders,
            assigned_orders: '',
            picked_up_orders: '',
            in_transit_orders: '',
            payment_collection: '',
            cancelled_orders: '',
            total_order_value: parseFloat(summary.total_order_value || 0).toFixed(2),
            total_collected: parseFloat(summary.total_collected_amount || 0).toFixed(2),
            pending_amount: parseFloat(summary.total_pending_amount || 0).toFixed(2)
        });
        worksheet.getRow(worksheet.rowCount).font = { bold: true };

        const numberColumns = ['total_order_value', 'total_collected', 'pending_amount'];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1 && rowNumber < worksheet.rowCount) {
                numberColumns.forEach(col => {
                    const cell = row.getCell(col);
                    if (cell.value) {
                        cell.numFmt = '#,##0.00';
                    }
                });
            }
        });

        const filename = `delivery_boy_report_${dateFrom.replace(/[:\s]/g, '_')}_to_${dateTo.replace(/[:\s]/g, '_')}_${new Date().getTime()}.xlsx`;

        // Write workbook to buffer first to ensure file is complete
        let buffer;
        try {
            buffer = await workbook.xlsx.writeBuffer();
            
            // Validate buffer
            if (!buffer || !Buffer.isBuffer(buffer)) {
                logger.error('Invalid buffer generated for Excel export');
                return res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to generate Excel file'));
            }
            
            if (buffer.length === 0) {
                logger.error('Empty buffer generated for Excel export');
                return res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to generate Excel file'));
            }
        } catch (writeError) {
            logger.error('Error writing Excel buffer', { 
                error: writeError.message,
                stack: writeError.stack 
            });
            if (!res.headersSent) {
                return res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to generate Excel file'));
            }
            return;
        }

        // Check if response headers were already sent
        if (res.headersSent) {
            logger.error('Headers already sent before Excel export');
            return;
        }

        // Log before sending response
        logger.info('Delivery boy report exported to Excel', {
            dateFrom,
            dateTo,
            delivery_boys_count: deliveryBoys.length,
            fileSize: buffer.length
        });

        // Set response headers AFTER buffer is created
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Send the buffer and end the response explicitly
        res.end(buffer);
    } catch (error) {
        logger.error('Error exporting delivery boy report to Excel', {
            error: error.message,
            stack: error.stack
        });
        if (!res.headersSent) {
            res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to export report to Excel'));
        }
    }
};

const exportCustomerReportToExcel = async (res, dateFrom, dateTo, customers, summary) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Customer Report');

        worksheet.columns = [
            { header: 'Customer ID', key: 'customer_id', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Mobile', key: 'mobile', width: 15 },
            { header: 'Area', key: 'area', width: 20 },
            { header: 'Store Name', key: 'store_name', width: 25 },
            { header: 'Total Orders', key: 'total_orders', width: 15 },
            { header: 'Delivered Orders', key: 'delivered_orders', width: 18 },
            { header: 'Cancelled Orders', key: 'cancelled_orders', width: 18 },
            { header: 'Total Order Value', key: 'total_order_value', width: 18 },
            { header: 'Return Adjustment', key: 'return_adjustment', width: 18 },
            { header: 'Total Paid', key: 'total_paid', width: 18 },
            { header: 'Average Order Value', key: 'average_order_value', width: 20 },
            { header: 'Last Order Date', key: 'last_order_date', width: 20 }
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        const formatDate = (date) => {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        };

        customers.forEach(c => {
            worksheet.addRow({
                customer_id: c.customer_id,
                name: c.customer_name || '',
                mobile: c.customer_mobile || '',
                area: c.customer_area || '',
                store_name: c.store_name || '',
                total_orders: c.statistics.total_orders,
                delivered_orders: c.statistics.delivered_orders,
                cancelled_orders: c.statistics.cancelled_orders,
                total_order_value: parseFloat(c.statistics.total_order_value || 0).toFixed(2),
                return_adjustment: parseFloat(c.statistics.total_return_adjustment || 0).toFixed(2),
                total_paid: parseFloat(c.statistics.total_paid_amount || 0).toFixed(2),
                average_order_value: parseFloat(c.statistics.average_order_value || 0).toFixed(2),
                last_order_date: formatDate(c.statistics.last_order_date)
            });
        });

        worksheet.addRow({});
        worksheet.addRow({
            customer_id: 'SUMMARY',
            name: '',
            mobile: '',
            area: '',
            store_name: '',
            total_orders: summary.total_orders,
            delivered_orders: summary.total_delivered_orders,
            cancelled_orders: '',
            total_order_value: parseFloat(summary.total_order_value || 0).toFixed(2),
            return_adjustment: parseFloat(summary.total_return_adjustment || 0).toFixed(2),
            total_paid: parseFloat(summary.total_paid_amount || 0).toFixed(2),
            average_order_value: '',
            last_order_date: ''
        });
        worksheet.getRow(worksheet.rowCount).font = { bold: true };

        const numberColumns = ['total_order_value', 'return_adjustment', 'total_paid', 'average_order_value'];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1 && rowNumber < worksheet.rowCount) {
                numberColumns.forEach(col => {
                    const cell = row.getCell(col);
                    if (cell.value) {
                        cell.numFmt = '#,##0.00';
                    }
                });
            }
        });

        const filename = `customer_report_${dateFrom.replace(/[:\s]/g, '_')}_to_${dateTo.replace(/[:\s]/g, '_')}_${new Date().getTime()}.xlsx`;

        // Write workbook to buffer first to ensure file is complete
        let buffer;
        try {
            buffer = await workbook.xlsx.writeBuffer();
            
            // Validate buffer
            if (!buffer || !Buffer.isBuffer(buffer)) {
                logger.error('Invalid buffer generated for Excel export');
                return res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to generate Excel file'));
            }
            
            if (buffer.length === 0) {
                logger.error('Empty buffer generated for Excel export');
                return res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to generate Excel file'));
            }
        } catch (writeError) {
            logger.error('Error writing Excel buffer', { 
                error: writeError.message,
                stack: writeError.stack 
            });
            if (!res.headersSent) {
                return res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to generate Excel file'));
            }
            return;
        }

        // Check if response headers were already sent
        if (res.headersSent) {
            logger.error('Headers already sent before Excel export');
            return;
        }

        // Log before sending response
        logger.info('Customer report exported to Excel', {
            dateFrom,
            dateTo,
            customers_count: customers.length,
            fileSize: buffer.length
        });

        // Set response headers AFTER buffer is created
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Send the buffer and end the response explicitly
        res.end(buffer);
    } catch (error) {
        logger.error('Error exporting customer report to Excel', {
            error: error.message,
            stack: error.stack
        });
        if (!res.headersSent) {
            res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to export report to Excel'));
        }
    }
};

const exportReturnItemsReportToExcel = async (res, dateFrom, dateTo, returnItems, summary) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Return Items Report');

        worksheet.columns = [
            { header: 'Return Item ID', key: 'return_item_id', width: 15 },
            { header: 'Item Name', key: 'item_name', width: 30 },
            { header: 'Quantity', key: 'quantity', width: 12 },
            { header: 'Return Date', key: 'return_date', width: 20 },
            { header: 'Order ID', key: 'order_id', width: 12 },
            { header: 'Order Number', key: 'order_number', width: 20 },
            { header: 'Order Date', key: 'order_date', width: 20 },
            { header: 'Order Total', key: 'order_total', width: 15 },
            { header: 'Return Adjust Amount', key: 'return_adjust_amount', width: 20 },
            { header: 'Order Status', key: 'order_status', width: 18 },
            { header: 'Customer Name', key: 'customer_name', width: 25 },
            { header: 'Customer Phone', key: 'customer_phone', width: 15 },
            { header: 'Store Name', key: 'store_name', width: 25 }
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        const formatDate = (date) => {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        };

        returnItems.forEach(ri => {
            worksheet.addRow({
                return_item_id: ri.return_item_id,
                item_name: ri.item_name || '',
                quantity: ri.quantity,
                return_date: formatDate(ri.return_date),
                order_id: ri.order.order_id,
                order_number: ri.order.order_number || '',
                order_date: formatDate(ri.order.order_date),
                order_total: parseFloat(ri.order.order_total || 0).toFixed(2),
                return_adjust_amount: parseFloat(ri.order.return_adjust_amount || 0).toFixed(2),
                order_status: ri.order.order_status || '',
                customer_name: ri.order.customer_name || '',
                customer_phone: ri.order.customer_phone || '',
                store_name: ri.order.store_name || ''
            });
        });

        worksheet.addRow({});
        worksheet.addRow({
            return_item_id: 'SUMMARY',
            item_name: '',
            quantity: summary.total_return_items,
            return_date: '',
            order_id: summary.total_orders_with_returns,
            order_number: '',
            order_date: '',
            order_total: parseFloat(summary.total_adjustment_amount || 0).toFixed(2),
            return_adjust_amount: '',
            order_status: '',
            customer_name: '',
            customer_phone: '',
            store_name: ''
        });
        worksheet.getRow(worksheet.rowCount).font = { bold: true };

        const numberColumns = ['order_total', 'return_adjust_amount'];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1 && rowNumber < worksheet.rowCount) {
                numberColumns.forEach(col => {
                    const cell = row.getCell(col);
                    if (cell.value) {
                        cell.numFmt = '#,##0.00';
                    }
                });
            }
        });

        const filename = `return_items_report_${dateFrom.replace(/[:\s]/g, '_')}_to_${dateTo.replace(/[:\s]/g, '_')}_${new Date().getTime()}.xlsx`;

        // Write workbook to buffer first to ensure file is complete
        let buffer;
        try {
            buffer = await workbook.xlsx.writeBuffer();
            
            // Validate buffer
            if (!buffer || !Buffer.isBuffer(buffer)) {
                logger.error('Invalid buffer generated for Excel export');
                return res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to generate Excel file'));
            }
            
            if (buffer.length === 0) {
                logger.error('Empty buffer generated for Excel export');
                return res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to generate Excel file'));
            }
        } catch (writeError) {
            logger.error('Error writing Excel buffer', { 
                error: writeError.message,
                stack: writeError.stack 
            });
            if (!res.headersSent) {
                return res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to generate Excel file'));
            }
            return;
        }

        // Check if response headers were already sent
        if (res.headersSent) {
            logger.error('Headers already sent before Excel export');
            return;
        }

        // Log before sending response
        logger.info('Return items report exported to Excel', {
            dateFrom,
            dateTo,
            return_items_count: returnItems.length,
            fileSize: buffer.length
        });

        // Set response headers AFTER buffer is created
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Send the buffer and end the response explicitly
        res.end(buffer);
    } catch (error) {
        logger.error('Error exporting return items report to Excel', {
            error: error.message,
            stack: error.stack
        });
        if (!res.headersSent) {
            res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to export report to Excel'));
        }
    }
};

const exportSalesReportToExcel = async (res, dateFrom, dateTo, summary, daily_breakdown) => {
    try {
        const workbook = new ExcelJS.Workbook();
        
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 20 }
        ];

        summarySheet.getRow(1).font = { bold: true };
        summarySheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        const summaryData = [
            { metric: 'Total Orders', value: summary.total_orders },
            { metric: 'Delivered Orders', value: summary.delivered_orders },
            { metric: 'Assigned Orders', value: summary.assigned_orders },
            { metric: 'Picked Up Orders', value: summary.picked_up_orders },
            { metric: 'In Transit Orders', value: summary.in_transit_orders },
            { metric: 'Payment Collection Orders', value: summary.payment_collection_orders },
            { metric: 'Cancelled Orders', value: summary.cancelled_orders },
            { metric: 'Orders with Returns', value: summary.orders_with_returns },
            { metric: 'Unique Customers', value: summary.unique_customers },
            { metric: 'Total Revenue', value: parseFloat(summary.total_revenue || 0).toFixed(2) },
            { metric: 'Total Return Adjustment', value: parseFloat(summary.total_return_adjustment || 0).toFixed(2) },
            { metric: 'Net Revenue', value: parseFloat(summary.net_revenue || 0).toFixed(2) },
            { metric: 'Total Cash Collected', value: parseFloat(summary.total_cash_collected || 0).toFixed(2) },
            { metric: 'Total Bank Collected', value: parseFloat(summary.total_bank_collected || 0).toFixed(2) },
            { metric: 'Total Collected', value: parseFloat(summary.total_collected || 0).toFixed(2) },
            { metric: 'Pending Collection', value: parseFloat(summary.pending_collection || 0).toFixed(2) },
            { metric: 'Average Order Value', value: parseFloat(summary.average_order_value || 0).toFixed(2) }
        ];

        summaryData.forEach(row => {
            summarySheet.addRow(row);
        });

        const dailySheet = workbook.addWorksheet('Daily Breakdown');
        dailySheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Orders Count', key: 'orders_count', width: 15 },
            { header: 'Revenue', key: 'revenue', width: 15 },
            { header: 'Return Adjustment', key: 'return_adjustment', width: 20 },
            { header: 'Collected', key: 'collected', width: 15 }
        ];

        dailySheet.getRow(1).font = { bold: true };
        dailySheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        daily_breakdown.forEach(day => {
            dailySheet.addRow({
                date: day.date,
                orders_count: day.orders_count,
                revenue: parseFloat(day.revenue || 0).toFixed(2),
                return_adjustment: parseFloat(day.return_adjustment || 0).toFixed(2),
                collected: parseFloat(day.collected || 0).toFixed(2)
            });
        });

        const numberColumns = ['revenue', 'return_adjustment', 'collected'];
        dailySheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                numberColumns.forEach(col => {
                    const cell = row.getCell(col);
                    if (cell.value) {
                        cell.numFmt = '#,##0.00';
                    }
                });
            }
        });

        const filename = `sales_report_${dateFrom.replace(/[:\s]/g, '_')}_to_${dateTo.replace(/[:\s]/g, '_')}_${new Date().getTime()}.xlsx`;

        // Write workbook to buffer first to ensure file is complete
        let buffer;
        try {
            buffer = await workbook.xlsx.writeBuffer();
            
            // Validate buffer
            if (!buffer || !Buffer.isBuffer(buffer)) {
                logger.error('Invalid buffer generated for Excel export');
                return res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to generate Excel file'));
            }
            
            if (buffer.length === 0) {
                logger.error('Empty buffer generated for Excel export');
                return res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to generate Excel file'));
            }
        } catch (writeError) {
            logger.error('Error writing Excel buffer', { 
                error: writeError.message,
                stack: writeError.stack 
            });
            if (!res.headersSent) {
                return res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to generate Excel file'));
            }
            return;
        }

        // Check if response headers were already sent
        if (res.headersSent) {
            logger.error('Headers already sent before Excel export');
            return;
        }

        // Log before sending response
        logger.info('Sales report exported to Excel', {
            dateFrom,
            dateTo,
            fileSize: buffer.length
        });

        // Set response headers AFTER buffer is created
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Send the buffer and end the response explicitly
        res.end(buffer);
    } catch (error) {
        logger.error('Error exporting sales report to Excel', {
            error: error.message,
            stack: error.stack
        });
        if (!res.headersSent) {
            res.status(500).json(errorResponse('EXPORT_ERROR', 'Failed to export report to Excel'));
        }
    }
};
