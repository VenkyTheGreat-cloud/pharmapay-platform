const logger = require('../config/logger');
const DeliveryBoy = require('../models/DeliveryBoy');
const User = require('../models/User');
const { getFirebaseAdmin } = require('../config/firebase');

/**
 * Push Notification Service
 * Handles sending push notifications to delivery boys using Firebase Cloud Messaging (FCM)
 * 
 * Setup Instructions:
 * 1. Install firebase-admin: npm install firebase-admin
 * 2. Download service account JSON from Firebase Console
 * 3. Place it at: config/firebase-service-account.json (or set FIREBASE_SERVICE_ACCOUNT_PATH env var)
 * 4. Initialize Firebase in server.js: require('./config/firebase').initializeFirebase()
 */

class PushNotificationService {
    /**
     * Send push notification to a single delivery boy
     * @param {number} deliveryBoyId - Delivery boy ID
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @param {object} data - Additional data payload (optional)
     */
    static async sendToDeliveryBoy(deliveryBoyId, title, body, data = {}) {
        try {
            const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);
            
            if (!deliveryBoy) {
                logger.warn(`Delivery boy not found: ${deliveryBoyId}`);
                return { success: false, error: 'Delivery boy not found' };
            }

            if (!deliveryBoy.device_token) {
                logger.warn(`No device token for delivery boy: ${deliveryBoyId}`);
                return { success: false, error: 'No device token registered' };
            }

            // Get Firebase Admin instance
            const admin = getFirebaseAdmin();
            
            if (!admin) {
                // Firebase not initialized - log notification only
                logger.info('Push notification logged (Firebase not configured)', {
                    deliveryBoyId,
                    deliveryBoyName: deliveryBoy.name,
                    title,
                    body,
                    data
                });
                return { success: true, message: 'Notification logged (Firebase not configured)' };
            }

            // Send FCM push notification
            try {
                const message = {
                    notification: {
                        title: title,
                        body: body
                    },
                    data: {
                        ...Object.keys(data).reduce((acc, key) => {
                            acc[key] = String(data[key]); // FCM data must be strings
                            return acc;
                        }, {})
                    },
                    token: deliveryBoy.device_token,
                    android: {
                        priority: 'high'
                    },
                    apns: {
                        headers: {
                            'apns-priority': '10'
                        }
                    }
                };

                const response = await admin.messaging().send(message);
                
                logger.info('Push notification sent successfully', {
                    deliveryBoyId,
                    deliveryBoyName: deliveryBoy.name,
                    title,
                    body,
                    messageId: response
                });

                return { success: true, message: 'Notification sent', messageId: response };
            } catch (fcmError) {
                // Handle FCM errors
                if (fcmError.code === 'messaging/invalid-registration-token' || 
                    fcmError.code === 'messaging/registration-token-not-registered') {
                    // Invalid token - clear it from database
                    logger.warn(`Invalid device token for delivery boy ${deliveryBoyId}, clearing token`);
                    await DeliveryBoy.updateDeviceToken(deliveryBoyId, null);
                    return { success: false, error: 'Invalid device token', shouldClearToken: true };
                }
                
                throw fcmError;
            }
        } catch (error) {
            logger.error('Error sending push notification', {
                deliveryBoyId,
                error: error.message,
                stack: error.stack
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Send push notification to all delivery boys under an admin
     * @param {string} adminId - Admin UUID
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     * @param {object} data - Additional data payload (optional)
     */
    static async sendToAdminDeliveryBoys(adminId, title, body, data = {}) {
        try {
            // Get all store IDs for this admin (admin + all stores)
            const storeIds = await User.getStoreIdsForAdmin(adminId);
            
            if (storeIds.length === 0) {
                logger.warn(`No stores found for admin: ${adminId}`);
                return { success: false, error: 'No stores found for admin' };
            }

            // Get all approved and active delivery boys for these stores
            const { query } = require('../config/database');
            const result = await query(
                `SELECT id, name, device_token 
                 FROM delivery_boys 
                 WHERE store_id = ANY($1::uuid[])
                   AND status = 'approved' 
                   AND is_active = true
                   AND device_token IS NOT NULL`,
                [storeIds]
            );

            const deliveryBoys = result.rows;
            
            if (deliveryBoys.length === 0) {
                logger.warn(`No delivery boys with device tokens found for admin: ${adminId}`);
                return { success: false, error: 'No delivery boys with device tokens found' };
            }

            // Send notification to each delivery boy
            const results = await Promise.allSettled(
                deliveryBoys.map(db => 
                    this.sendToDeliveryBoy(db.id, title, body, data)
                )
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const failed = results.length - successful;

            logger.info('Bulk push notification sent', {
                adminId,
                total: deliveryBoys.length,
                successful,
                failed
            });

            return {
                success: true,
                total: deliveryBoys.length,
                successful,
                failed
            };
        } catch (error) {
            logger.error('Error sending bulk push notification', {
                adminId,
                error: error.message,
                stack: error.stack
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Send order creation notification to all delivery boys under an admin
     * @param {string} adminId - Admin UUID
     * @param {object} orderData - Order data (id, order_number, customer_area, etc.)
     */
    static async notifyNewOrder(adminId, orderData) {
        const title = 'New Order Available';
        const body = `New order created for ${orderData.customer_area || 'this area'}. Please accept it.`;
        const data = {
            type: 'NEW_ORDER',
            order_id: String(orderData.id),
            order_number: orderData.order_number || '',
            customer_area: orderData.customer_area || ''
        };

        return await this.sendToAdminDeliveryBoys(adminId, title, body, data);
    }
}

module.exports = PushNotificationService;
