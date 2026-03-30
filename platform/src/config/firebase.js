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
        return;
    }

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

        let serviceAccount;
        let filePath;

        if (serviceAccountJson) {
            // Parse JSON from environment variable (useful for cloud deployments)
            try {
                serviceAccount = JSON.parse(serviceAccountJson);
                logger.info('Firebase initialized from environment variable');
            } catch (parseError) {
                logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON', { error: parseError.message });
                throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON format');
            }
        } else {
            // Try to load from file - check multiple locations
            if (serviceAccountPath) {
                // Use explicit path from environment variable
                filePath = serviceAccountPath;
            } else {
                // Try each possible path
                filePath = possiblePaths.find(p => fs.existsSync(p));
            }
            
            if (!filePath || !fs.existsSync(filePath)) {
                logger.warn(`Firebase service account file not found. Checked locations:`);
                possiblePaths.forEach(p => logger.warn(`  - ${p}`));
                if (serviceAccountPath) {
                    logger.warn(`  - ${serviceAccountPath} (from FIREBASE_SERVICE_ACCOUNT_PATH)`);
                }
                logger.warn('Push notifications will be logged only. To enable FCM, provide Firebase credentials.');
                return false;
            }

            serviceAccount = require(filePath);
            logger.info(`Firebase initialized from file: ${filePath}`);
        }

        // Initialize Firebase Admin SDK
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        firebaseInitialized = true;
        logger.info('Firebase Admin SDK initialized successfully');
        return true;
    } catch (error) {
        logger.error('Failed to initialize Firebase Admin SDK', {
            error: error.message,
            stack: error.stack
        });
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
