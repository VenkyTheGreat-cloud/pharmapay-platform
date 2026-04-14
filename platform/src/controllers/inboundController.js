const InboundCapture = require('../models/InboundCapture');
const Customer = require('../models/Customer');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { query, transaction } = require('../config/database');

// POST /api/inbound/voice — multipart/form-data: channel, caller_number, audio (MP3)
exports.uploadVoice = async (req, res, next) => {
    try {
        const { channel, caller_number } = req.body;

        if (!req.file) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Audio file is required'));
        }

        const capture = await InboundCapture.create({
            store_id: req.user?.userId || null,
            channel: channel || 'voice',
            caller_number: caller_number || null,
            sender_name: null,
            message_text: null,
            audio_path: req.file.path,
        });

        logger.info('Voice capture received', {
            captureId: capture.id,
            callerNumber: caller_number,
            audioFile: req.file.filename,
            fileSize: req.file.size,
        });

        // Trigger background processing (non-blocking)
        const { processPendingCaptures } = require('../services/captureProcessor');
        setImmediate(processPendingCaptures);

        res.status(201).json(successResponse({ id: capture.id }, 'Voice capture uploaded successfully'));
    } catch (error) {
        logger.error('Voice capture error', { error: error.message });
        next(error);
    }
};

// POST /api/inbound/whatsapp — JSON: { channel, message, sender_name, caller_number }
exports.uploadWhatsApp = async (req, res, next) => {
    try {
        const { channel, message, sender_name, caller_number } = req.body;

        if (!message || message.trim().length < 3) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Message text is required'));
        }

        const capture = await InboundCapture.create({
            store_id: req.user?.userId || null,
            channel: channel || 'whatsapp',
            caller_number: caller_number || null,
            sender_name: sender_name || null,
            message_text: message.trim(),
            audio_path: null,
        });

        logger.info('WhatsApp capture received', {
            captureId: capture.id,
            senderName: sender_name,
            callerNumber: caller_number,
            messageLength: message.length,
        });

        // Trigger background processing (non-blocking)
        const { processPendingCaptures } = require('../services/captureProcessor');
        setImmediate(processPendingCaptures);

        res.status(201).json(successResponse({ id: capture.id }, 'WhatsApp capture uploaded successfully'));
    } catch (error) {
        logger.error('WhatsApp capture error', { error: error.message });
        next(error);
    }
};

// GET /api/inbound/captures — list captures for the authenticated store
exports.listCaptures = async (req, res, next) => {
    try {
        const { limit = 50, offset = 0, status } = req.query;

        const captures = await InboundCapture.findByStore(req.user.userId, {
            limit: parseInt(limit),
            offset: parseInt(offset),
            status,
        });

        const pendingCount = await InboundCapture.countByStore(req.user.userId, 'pending');

        res.json(successResponse({
            captures,
            pending_count: pendingCount,
            count: captures.length,
        }));
    } catch (error) {
        next(error);
    }
};

// GET /api/inbound/captures/convertible — captures ready for order conversion
exports.listConvertibleCaptures = async (req, res, next) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const storeId = req.user.userId;

        const captures = await InboundCapture.findConvertibleByStore(storeId, {
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        const convertibleCount = await InboundCapture.countConvertibleByStore(storeId);

        res.json(successResponse({
            captures,
            convertible_count: convertibleCount,
            count: captures.length,
        }));
    } catch (error) {
        next(error);
    }
};

// POST /api/inbound/captures/:id/convert — convert a capture into an order
exports.convertCaptureToOrder = async (req, res, next) => {
    try {
        const captureId = req.params.id;
        const storeId = req.user.userId;
        const { totalAmount, orderNumber, customerId, newCustomer, customerComments } = req.body;

        if (!totalAmount || parseFloat(totalAmount) <= 0) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Total amount is required and must be greater than 0'));
        }
        if (!orderNumber || !orderNumber.trim()) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Order number is required'));
        }
        if (!customerId && !newCustomer) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Either customerId or newCustomer is required'));
        }

        const order = await transaction(async (client) => {
            // Lock and validate the capture
            const captureResult = await client.query(
                'SELECT * FROM inbound_captures WHERE id = $1 AND store_id = $2 FOR UPDATE',
                [captureId, storeId]
            );
            const capture = captureResult.rows[0];

            if (!capture) {
                throw new Error('CAPTURE_NOT_FOUND');
            }
            if (capture.status !== 'completed') {
                throw new Error('CAPTURE_NOT_CONVERTIBLE');
            }

            // Check duplicate order number
            const existingOrder = await client.query(
                'SELECT id FROM orders WHERE order_number = $1',
                [orderNumber.trim()]
            );
            if (existingOrder.rowCount > 0) {
                throw new Error('DUPLICATE_ORDER_NUMBER');
            }

            // Resolve customer
            let customer;
            if (customerId) {
                const customerResult = await client.query(
                    'SELECT * FROM customers WHERE id = $1 AND store_id = $2',
                    [customerId, storeId]
                );
                customer = customerResult.rows[0];
                if (!customer) {
                    throw new Error('CUSTOMER_NOT_FOUND');
                }
            } else {
                // Create new customer from capture data
                customer = await Customer.create({
                    name: newCustomer.name || capture.sender_name || 'Unknown',
                    mobile: newCustomer.mobile || capture.caller_number,
                    address: newCustomer.address || null,
                    area: newCustomer.area || (capture.extracted_data && capture.extracted_data.area) || null,
                    landmark: null,
                    customer_lat: null,
                    customer_lng: null,
                    store_id: storeId,
                });
            }

            // Build comments from extracted medicines if not provided
            const extractedData = capture.extracted_data || {};
            let commentsVal = customerComments;
            if (!commentsVal && extractedData.medicines && extractedData.medicines.length > 0) {
                commentsVal = extractedData.medicines.map(m => {
                    let desc = m.name;
                    if (m.strength) desc += ` ${m.strength}`;
                    if (m.form) desc += ` ${m.form}`;
                    if (m.quantity) desc += ` x${m.quantity}`;
                    return desc;
                }).join(', ');
            }

            const customerAddress = customer.address || customer.area || '';
            const totalAmountNum = parseFloat(totalAmount);

            // Create order with source_capture_id
            const orderResult = await client.query(
                `INSERT INTO orders (order_number, customer_id, assigned_delivery_boy_id, store_id,
                                    customer_name, customer_phone, customer_address, customer_lat, customer_lng,
                                    total_amount, status, payment_status, payment_mode, customer_comments,
                                    return_items, return_adjust_amount, source_capture_id, assigned_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ASSIGNED', 'PENDING', NULL, $11,
                         false, 0, $12, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [orderNumber.trim(), customer.id, null, storeId,
                 customer.name, customer.mobile, customerAddress || null, customer.customer_lat, customer.customer_lng,
                 totalAmountNum, commentsVal || null, captureId]
            );

            const order = orderResult.rows[0];

            // Populate order_items from extracted medicines
            if (extractedData.medicines && extractedData.medicines.length > 0) {
                const itemValues = [];
                const itemPlaceholders = [];
                let paramCount = 1;

                extractedData.medicines.forEach((med) => {
                    itemPlaceholders.push(`($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, $${paramCount + 4})`);
                    itemValues.push(
                        order.id,
                        med.name,
                        parseInt(med.quantity) || 1,
                        0,  // price unknown
                        0   // total unknown
                    );
                    paramCount += 5;
                });

                await client.query(
                    `INSERT INTO order_items (order_id, name, quantity, price, total)
                     VALUES ${itemPlaceholders.join(', ')}`,
                    itemValues
                );
            }

            // Mark capture as converted
            await client.query(
                `UPDATE inbound_captures SET status = 'converted', processed_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [captureId]
            );

            // Create status history
            const sourceLabel = capture.channel === 'voice' ? 'voice call' : 'WhatsApp message';
            await client.query(
                `INSERT INTO order_status_history (order_id, status, changed_by, notes)
                 VALUES ($1, $2, $3, $4)`,
                [order.id, 'ASSIGNED', storeId, `Order created from ${sourceLabel} capture`]
            );

            return order;
        });

        // Send push notification (non-blocking, outside transaction)
        try {
            const User = require('../models/User');
            const PushNotificationService = require('../services/pushNotificationService');
            const adminId = req.user.role === 'admin' ? req.user.userId : (req.user.adminId || req.user.userId);
            await PushNotificationService.notifyNewOrder(adminId, {
                id: order.id,
                order_number: order.order_number,
                customer_area: order.customer_address || ''
            });
        } catch (notificationError) {
            logger.error('Failed to send push notification for capture-converted order', {
                orderId: order.id,
                error: notificationError.message,
            });
        }

        logger.info('Capture converted to order', {
            captureId,
            orderId: order.id,
            orderNumber: order.order_number,
        });

        res.status(201).json(successResponse(order, 'Capture converted to order successfully'));
    } catch (error) {
        if (error.message === 'CAPTURE_NOT_FOUND') {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Capture not found'));
        }
        if (error.message === 'CAPTURE_NOT_CONVERTIBLE') {
            return res.status(400).json(errorResponse('INVALID_STATUS', 'Capture is not in a convertible state'));
        }
        if (error.message === 'DUPLICATE_ORDER_NUMBER') {
            return res.status(409).json(errorResponse('DUPLICATE_ORDER_NUMBER', 'Order number already exists'));
        }
        if (error.message === 'CUSTOMER_NOT_FOUND') {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Customer not found'));
        }
        next(error);
    }
};

// POST /api/inbound/captures/:id/dismiss — dismiss a capture from the queue
exports.dismissCapture = async (req, res, next) => {
    try {
        const captureId = req.params.id;
        const storeId = req.user.userId;

        const capture = await InboundCapture.findById(captureId);
        if (!capture || capture.store_id !== storeId) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Capture not found'));
        }
        if (capture.status !== 'completed') {
            return res.status(400).json(errorResponse('INVALID_STATUS', 'Only completed captures can be dismissed'));
        }

        await InboundCapture.updateStatus(captureId, 'dismissed');

        res.json(successResponse(null, 'Capture dismissed'));
    } catch (error) {
        next(error);
    }
};
