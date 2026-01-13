const admin = require('firebase-admin');
const logger = require('./logger');
const path = require('path');
const fs = require('fs');

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * This should be called once at application startup
 */
function initializeFirebase() {
    if (firebaseInitialized) {
        logger.info('Firebase already initialized');
        console.log('[FIREBASE] Already initialized');
        return;
    }

    logger.info('=== FIREBASE INITIALIZATION STARTED ===');
    console.log('[FIREBASE] Starting initialization...');

    try {
        // Option 1: Use service account JSON file path from environment variable
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        
        // Option 2: Try multiple default paths
        const possiblePaths = [
            path.join(__dirname, '../../config/firebase-service-account.json'), // Project root config/
            path.join(__dirname, 'firebase-service-account.json'), // src/config/
            path.join(__dirname, '../../firebase-service-account.json') // Project root
        ];
        
        // Option 3: Use service account JSON content from environment variable (for cloud deployments)
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        logger.info('Firebase initialization check', {
            hasServiceAccountPath: !!serviceAccountPath,
            hasServiceAccountJson: !!serviceAccountJson,
            serviceAccountPath: serviceAccountPath || 'not set',
            nodeEnv: process.env.NODE_ENV,
            cwd: process.cwd(),
            __dirname: __dirname
        });
        console.log('[FIREBASE] Environment check:', {
            hasServiceAccountPath: !!serviceAccountPath,
            hasServiceAccountJson: !!serviceAccountJson,
            nodeEnv: process.env.NODE_ENV
        });

        let serviceAccount;
        let filePath;

        if (serviceAccountJson) {
            // Parse JSON from environment variable (useful for cloud deployments)
            try {
                serviceAccount = JSON.parse(serviceAccountJson);
                logger.info('Firebase initialized from environment variable (FIREBASE_SERVICE_ACCOUNT_JSON)');
                console.log('[FIREBASE] ✅ Initialized from FIREBASE_SERVICE_ACCOUNT_JSON env var');
            } catch (parseError) {
                logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON', { error: parseError.message });
                console.error('[FIREBASE] ❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', parseError.message);
                throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON format');
            }
        } else {
            // Try to load from file - check multiple locations
            if (serviceAccountPath) {
                // Use explicit path from environment variable
                filePath = serviceAccountPath;
                logger.info(`Checking explicit path from env: ${filePath}`);
                console.log('[FIREBASE] Checking explicit path:', filePath);
            } else {
                // Try each possible path
                logger.info('Checking default paths for Firebase service account file');
                console.log('[FIREBASE] Checking default paths...');
                for (const p of possiblePaths) {
                    const exists = fs.existsSync(p);
                    logger.info(`  - ${p}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
                    console.log(`[FIREBASE]   - ${p}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);
                    if (exists) {
                        filePath = p;
                        break;
                    }
                }
            }
            
            if (!filePath || !fs.existsSync(filePath)) {
                logger.warn(`Firebase service account file not found. Checked locations:`);
                possiblePaths.forEach(p => logger.warn(`  - ${p}`));
                if (serviceAccountPath) {
                    logger.warn(`  - ${serviceAccountPath} (from FIREBASE_SERVICE_ACCOUNT_PATH)`);
                }
                logger.warn('Push notifications will be logged only. To enable FCM, provide Firebase credentials.');
                console.warn('[FIREBASE] ⚠️ Service account file not found. Push notifications disabled.');
                console.warn('[FIREBASE] To enable: Set FIREBASE_SERVICE_ACCOUNT_JSON env var with full JSON content');
                return false;
            }

            serviceAccount = require(filePath);
            logger.info(`Firebase initialized from file: ${filePath}`);
            console.log('[FIREBASE] ✅ Initialized from file:', filePath);
        }

        // Initialize Firebase Admin SDK
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        firebaseInitialized = true;
        logger.info('Firebase Admin SDK initialized successfully');
        console.log('[FIREBASE] ✅ Firebase Admin SDK initialized successfully');
        return true;
    } catch (error) {
        logger.error('Failed to initialize Firebase Admin SDK', {
            error: error.message,
            stack: error.stack
        });
        console.error('[FIREBASE] ❌ Failed to initialize:', error.message);
        console.error('[FIREBASE] Stack:', error.stack);
        firebaseInitialized = false;
        return false;
    }
}

/**
 * Get Firebase Admin instance
 * @returns {admin.app.App|null} Firebase Admin app instance or null if not initialized
 */
function getFirebaseAdmin() {
    if (!firebaseInitialized) {
        logger.warn('Firebase not initialized. Call initializeFirebase() first.');
        return null;
    }
    return admin;
}

module.exports = {
    initializeFirebase,
    getFirebaseAdmin,
    admin: firebaseInitialized ? admin : null
};
