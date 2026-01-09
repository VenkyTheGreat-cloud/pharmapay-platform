const { Pool } = require('pg');
const logger = require('./logger');

// Database connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased to 10 seconds for cloud databases
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

// Connection event handler
pool.on('connect', () => {
    logger.info('Database connection established');
});

pool.on('error', (err) => {
    logger.error('Unexpected database error', err);
    process.exit(-1);
});

// Query helper function with timeout protection
const query = async (text, params, timeout = 30000) => {
    const start = Date.now();
    let timeoutId;
    let queryCancelled = false;
    
    try {

        // Create a promise that rejects after timeout
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                queryCancelled = true;
                reject(new Error(`Query timeout after ${timeout}ms. Query: ${text.substring(0, 100)}`));
            }, timeout);
        });

        // Race between query and timeout
        const queryPromise = pool.query(text, params).then((res) => {
            if (timeoutId) clearTimeout(timeoutId);
            return res;
        }).catch((error) => {
            if (timeoutId) clearTimeout(timeoutId);
            throw error;
        });
        
        const res = await Promise.race([queryPromise, timeoutPromise]);
        const duration = Date.now() - start;
        
        if (duration > 1000) {
            logger.warn('Slow query detected', { 
                duration, 
                text: text.substring(0, 100),
                rows: res.rowCount
            });
        } else {
            logger.debug('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
        }
        
        return res;
    } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        const duration = Date.now() - start;
        
        // Enhanced error logging
        logger.error('Query error', { 
            text: text.substring(0, 200),
            params: params ? params.map((p, i) => ({ index: i, type: typeof p, value: String(p).substring(0, 50) })) : null,
            error: error.message,
            code: error.code,
            constraint: error.constraint,
            detail: error.detail,
            hint: error.hint,
            duration,
            timedOut: queryCancelled,
            stack: error.stack
        });
        throw error;
    }
};

// Transaction helper with timeout protection
const transaction = async (callback, timeout = 60000) => {
    const client = await pool.connect();
    let transactionTimeout;
    
    try {
        // Set statement timeout for this connection
        await client.query(`SET statement_timeout = ${timeout}`);
        
        const timeoutPromise = new Promise((_, reject) => {
            transactionTimeout = setTimeout(() => {
                reject(new Error(`Transaction timeout after ${timeout}ms`));
            }, timeout);
        });

        const transactionPromise = (async () => {
            await client.query('BEGIN');
            try {
                const result = await callback(client);
                await client.query('COMMIT');
                return result;
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        })();

        const result = await Promise.race([transactionPromise, timeoutPromise]);
        if (transactionTimeout) clearTimeout(transactionTimeout);
        return result;
    } catch (error) {
        if (transactionTimeout) clearTimeout(transactionTimeout);
        try {
            await client.query('ROLLBACK').catch(() => {
                // Ignore rollback errors if transaction not started
            });
        } catch (rollbackError) {
            logger.error('Rollback failed', { error: rollbackError.message });
        }
        throw error;
    } finally {
        // Reset statement timeout
        try {
            await client.query('RESET statement_timeout').catch(() => {
                // Ignore reset errors
            });
        } catch (e) {
            // Ignore reset errors
        }
        client.release();
    }
};

module.exports = {
    pool,
    query,
    transaction,
};
