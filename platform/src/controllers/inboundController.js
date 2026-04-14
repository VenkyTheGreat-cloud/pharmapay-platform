const InboundCapture = require('../models/InboundCapture');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../utils/apiResponse');

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
