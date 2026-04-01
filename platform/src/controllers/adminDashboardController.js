const { query } = require('../config/database');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Plan pricing map (monthly fees in INR)
const PLAN_FEES = {
    starter: 999,
    growth: 2499,
    enterprise: 5999
};

// GET /api/admin-dashboard/revenue/summary
exports.revenueSummary = async (req, res, next) => {
    try {
        // Total and active pharmacy counts + total setup fees collected
        const countsResult = await query(`
            SELECT
                COUNT(*) AS total_pharmacies,
                COUNT(*) FILTER (WHERE status = 'live') AS active_pharmacies,
                COALESCE(SUM(payment_amount) FILTER (WHERE payment_status = 'paid'), 0) AS total_setup_fees_collected
            FROM pharmacies
        `);

        const { total_pharmacies, active_pharmacies, total_setup_fees_collected } = countsResult.rows[0];

        // Plan distribution for active pharmacies
        const planDistResult = await query(`
            SELECT plan, COUNT(*) AS count
            FROM pharmacies
            WHERE status = 'live'
            GROUP BY plan
            ORDER BY count DESC
        `);

        // Calculate MRR from plan distribution
        let monthly_recurring_revenue = 0;
        const plan_distribution = planDistResult.rows.map(row => {
            const fee = PLAN_FEES[row.plan] || 0;
            monthly_recurring_revenue += row.count * fee;
            return {
                plan: row.plan,
                count: parseInt(row.count),
                monthly_fee: fee,
                subtotal: row.count * fee
            };
        });

        return res.json(successResponse({
            total_pharmacies: parseInt(total_pharmacies),
            active_pharmacies: parseInt(active_pharmacies),
            total_setup_fees_collected: parseFloat(total_setup_fees_collected),
            monthly_recurring_revenue,
            plan_distribution
        }));
    } catch (error) {
        logger.error('Error fetching revenue summary:', error);
        next(error);
    }
};

// GET /api/admin-dashboard/revenue/transactions
exports.revenueTransactions = async (req, res, next) => {
    try {
        const result = await query(`
            SELECT name, slug, plan, payment_amount, payment_status, payment_date, created_at
            FROM pharmacies
            WHERE payment_amount IS NOT NULL
            ORDER BY payment_date DESC
        `);

        return res.json(successResponse({
            transactions: result.rows,
            total: result.rowCount
        }));
    } catch (error) {
        logger.error('Error fetching revenue transactions:', error);
        next(error);
    }
};

// GET /api/admin-dashboard/analytics/pharmacies
exports.pharmacyAnalytics = async (req, res, next) => {
    try {
        // Status breakdown
        const statusResult = await query(`
            SELECT status, COUNT(*) AS count
            FROM pharmacies
            GROUP BY status
            ORDER BY count DESC
        `);

        // Plan breakdown
        const planResult = await query(`
            SELECT plan, COUNT(*) AS count
            FROM pharmacies
            GROUP BY plan
            ORDER BY count DESC
        `);

        // Recent signups (last 10)
        const recentResult = await query(`
            SELECT name, slug, plan, status, created_at
            FROM pharmacies
            ORDER BY created_at DESC
            LIMIT 10
        `);

        // Monthly signups (last 6 months)
        const monthlyResult = await query(`
            SELECT
                TO_CHAR(created_at, 'YYYY-MM') AS month,
                COUNT(*) AS count
            FROM pharmacies
            WHERE created_at >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(created_at, 'YYYY-MM')
            ORDER BY month ASC
        `);

        return res.json(successResponse({
            status_breakdown: statusResult.rows,
            plan_breakdown: planResult.rows,
            recent_signups: recentResult.rows,
            monthly_signups: monthlyResult.rows
        }));
    } catch (error) {
        logger.error('Error fetching pharmacy analytics:', error);
        next(error);
    }
};

// GET /api/admin-dashboard/analytics/onboarding-funnel
exports.onboardingFunnel = async (req, res, next) => {
    try {
        const result = await query(`
            SELECT
                COUNT(*) AS signed_up,
                COUNT(*) FILTER (WHERE features IS NOT NULL) AS configured,
                COUNT(*) FILTER (WHERE primary_color IS NOT NULL OR logo_url IS NOT NULL) AS branded,
                COUNT(*) FILTER (WHERE payment_status = 'paid') AS paid,
                COUNT(*) FILTER (WHERE status = 'live') AS live
            FROM pharmacies
        `);

        const funnel = result.rows[0];

        return res.json(successResponse({
            funnel: [
                { stage: 'signed_up', count: parseInt(funnel.signed_up) },
                { stage: 'configured', count: parseInt(funnel.configured) },
                { stage: 'branded', count: parseInt(funnel.branded) },
                { stage: 'paid', count: parseInt(funnel.paid) },
                { stage: 'live', count: parseInt(funnel.live) }
            ]
        }));
    } catch (error) {
        logger.error('Error fetching onboarding funnel:', error);
        next(error);
    }
};

// GET /api/admin-dashboard/analytics/delivery-boys
exports.deliveryBoyOverview = async (req, res, next) => {
    try {
        // Delivery boy counts
        const dbCountsResult = await query(`
            SELECT
                COUNT(*) AS total_delivery_boys,
                COUNT(*) FILTER (WHERE is_active = true) AS active_delivery_boys
            FROM delivery_boys
        `);

        // Engagement counts from delivery_boy_pharmacies
        const engagementResult = await query(`
            SELECT
                COUNT(*) FILTER (WHERE status = 'pending') AS pending_applications,
                COUNT(*) FILTER (WHERE status = 'approved') AS approved_engagements
            FROM delivery_boy_pharmacies
        `);

        // Delivery boys per pharmacy (approved only)
        const perPharmacyResult = await query(`
            SELECT
                p.name AS pharmacy_name,
                p.slug AS pharmacy_slug,
                COUNT(dbp.delivery_boy_id) AS delivery_boy_count
            FROM pharmacies p
            LEFT JOIN delivery_boy_pharmacies dbp ON dbp.pharmacy_id = p.id AND dbp.status = 'approved'
            GROUP BY p.id, p.name, p.slug
            ORDER BY delivery_boy_count DESC
        `);

        return res.json(successResponse({
            total_delivery_boys: parseInt(dbCountsResult.rows[0].total_delivery_boys),
            active_delivery_boys: parseInt(dbCountsResult.rows[0].active_delivery_boys),
            pending_applications: parseInt(engagementResult.rows[0].pending_applications),
            approved_engagements: parseInt(engagementResult.rows[0].approved_engagements),
            delivery_boys_per_pharmacy: perPharmacyResult.rows
        }));
    } catch (error) {
        logger.error('Error fetching delivery boy overview:', error);
        next(error);
    }
};

// GET /api/admin-dashboard/payments/history
exports.paymentHistory = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const params = [];
        const conditions = ['p.payment_date IS NOT NULL'];

        if (from) {
            params.push(from);
            conditions.push(`p.payment_date >= $${params.length}`);
        }
        if (to) {
            params.push(to);
            conditions.push(`p.payment_date <= $${params.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await query(`
            SELECT
                p.name, p.slug, p.plan, p.payment_amount,
                p.payment_status, p.payment_reference, p.payment_date
            FROM pharmacies p
            ${whereClause}
            ORDER BY p.payment_date DESC
        `, params);

        return res.json(successResponse({
            payments: result.rows,
            total: result.rowCount
        }));
    } catch (error) {
        logger.error('Error fetching payment history:', error);
        next(error);
    }
};

// GET /api/admin-dashboard/payments/summary
exports.paymentSummary = async (req, res, next) => {
    try {
        // Overall totals
        const totalsResult = await query(`
            SELECT
                COALESCE(SUM(payment_amount) FILTER (WHERE payment_status = 'paid'), 0) AS total_collected,
                COALESCE(SUM(payment_amount) FILTER (WHERE payment_status = 'pending'), 0) AS total_pending,
                COUNT(*) FILTER (WHERE payment_status = 'failed') AS total_failed
            FROM pharmacies
        `);

        // Breakdown by plan
        const byPlanResult = await query(`
            SELECT
                plan,
                COALESCE(SUM(payment_amount) FILTER (WHERE payment_status = 'paid'), 0) AS collected,
                COALESCE(SUM(payment_amount) FILTER (WHERE payment_status = 'pending'), 0) AS pending,
                COUNT(*) FILTER (WHERE payment_status = 'paid') AS paid_count,
                COUNT(*) FILTER (WHERE payment_status = 'pending') AS pending_count
            FROM pharmacies
            WHERE payment_amount IS NOT NULL
            GROUP BY plan
            ORDER BY collected DESC
        `);

        const totals = totalsResult.rows[0];

        return res.json(successResponse({
            total_collected: parseFloat(totals.total_collected),
            total_pending: parseFloat(totals.total_pending),
            total_failed: parseInt(totals.total_failed),
            by_plan: byPlanResult.rows
        }));
    } catch (error) {
        logger.error('Error fetching payment summary:', error);
        next(error);
    }
};
