const { query } = require('../config/database');
const logger = require('../config/logger');

/**
 * Subscription expiry checker - runs daily
 * 1. Sends renewal reminders 7 days before expiry
 * 2. Revokes access (status → expired) on expiry date
 */
class SubscriptionService {
    static async checkExpirations() {
        try {
            logger.info('Running subscription expiry check...');

            // 1. Find pharmacies expiring in 7 days that haven't been reminded
            const reminderResult = await query(
                `UPDATE pharmacies
                 SET reminder_sent_at = NOW(), updated_at = NOW()
                 WHERE status = 'live'
                   AND subscription_end_date IS NOT NULL
                   AND subscription_end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
                   AND reminder_sent_at IS NULL
                 RETURNING id, name, slug, owner_id, subscription_end_date`
            );

            if (reminderResult.rows.length > 0) {
                logger.info(`Subscription renewal reminders sent for ${reminderResult.rows.length} pharmacies`, {
                    pharmacies: reminderResult.rows.map(p => ({ id: p.id, name: p.name, expires: p.subscription_end_date }))
                });
                // TODO: Send actual email/SMS reminders via notification service
            }

            // 2. Expire pharmacies past their subscription end date
            const expiredResult = await query(
                `UPDATE pharmacies
                 SET status = 'expired', updated_at = NOW()
                 WHERE status = 'live'
                   AND subscription_end_date IS NOT NULL
                   AND subscription_end_date < NOW()
                 RETURNING id, name, slug, owner_id, subscription_end_date`
            );

            if (expiredResult.rows.length > 0) {
                logger.info(`${expiredResult.rows.length} pharmacies expired`, {
                    pharmacies: expiredResult.rows.map(p => ({ id: p.id, name: p.name, expired: p.subscription_end_date }))
                });
            }

            logger.info('Subscription expiry check complete', {
                reminded: reminderResult.rows.length,
                expired: expiredResult.rows.length
            });

            return {
                reminded: reminderResult.rows.length,
                expired: expiredResult.rows.length
            };
        } catch (error) {
            logger.error('Subscription expiry check failed', { error: error.message, stack: error.stack });
            throw error;
        }
    }

    /**
     * Start the daily expiry check interval
     * Runs every 24 hours
     */
    static startDailyCheck() {
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        // Run immediately on startup
        setTimeout(() => {
            this.checkExpirations().catch(err =>
                logger.error('Initial subscription check failed', { error: err.message })
            );
        }, 10000); // 10s after startup

        // Then run daily
        setInterval(() => {
            this.checkExpirations().catch(err =>
                logger.error('Scheduled subscription check failed', { error: err.message })
            );
        }, TWENTY_FOUR_HOURS);

        logger.info('Subscription expiry checker started (runs every 24h)');
    }
}

module.exports = SubscriptionService;
