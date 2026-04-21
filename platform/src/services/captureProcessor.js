/**
 * Background capture processor
 * Processes pending inbound captures:
 *   - Voice: transcribe audio (Google STT) → parse transcript → extract lead data
 *   - WhatsApp: parse message text → extract lead data
 *
 * Run on a timer (every 30s) or triggered after new capture arrives.
 */

const InboundCapture = require('../models/InboundCapture');
const { transcribeAudio } = require('./speechToText');
const { parseWhatsAppMessage } = require('./captureParser');
const logger = require('../config/logger');

const BATCH_SIZE = 10;
const POLL_INTERVAL_MS = 30000; // 30 seconds

let isProcessing = false;
let pollTimer = null;

/**
 * Process a single voice capture
 */
async function processVoiceCapture(capture) {
    logger.info('Processing voice capture', { captureId: capture.id, callerNumber: capture.caller_number });

    // Step 1: Transcribe audio
    const sttResult = await transcribeAudio(capture.audio_path);

    if (!sttResult || !sttResult.transcript) {
        // No STT key configured or transcription failed — mark as completed with audio-only
        await InboundCapture.updateStatus(capture.id, 'completed', {
            transcript: null,
            extracted_data: {
                type: 'voice_call',
                caller_number: capture.caller_number,
                audio_path: capture.audio_path,
                needs_manual_review: true,
                reason: 'transcription_unavailable',
            },
        });
        return;
    }

    // Step 2: Parse the transcript like a WhatsApp message
    const parsed = parseWhatsAppMessage(
        sttResult.transcript,
        null,  // no sender name for calls
        capture.caller_number
    );

    await InboundCapture.updateStatus(capture.id, 'completed', {
        transcript: sttResult.transcript,
        extracted_data: {
            type: 'voice_call',
            ...parsed,
            stt_language: sttResult.language,
            stt_confidence: sttResult.confidence,
            audio_path: capture.audio_path,
        },
    });

    logger.info('Voice capture processed', {
        captureId: capture.id,
        language: sttResult.language,
        medicinesFound: parsed.medicine_count,
        isOrder: parsed.is_order,
    });
}

/**
 * Process a single WhatsApp capture
 */
async function processWhatsAppCapture(capture) {
    logger.info('Processing WhatsApp capture', { captureId: capture.id, sender: capture.sender_name });

    const parsed = parseWhatsAppMessage(
        capture.message_text,
        capture.sender_name,
        capture.caller_number
    );

    await InboundCapture.updateStatus(capture.id, 'completed', {
        extracted_data: {
            type: 'whatsapp_message',
            ...parsed,
        },
    });

    logger.info('WhatsApp capture processed', {
        captureId: capture.id,
        language: parsed.language,
        medicinesFound: parsed.medicine_count,
        isOrder: parsed.is_order,
        confidence: parsed.confidence,
    });
}

/**
 * Process a batch of pending captures
 */
async function processPendingCaptures() {
    if (isProcessing) return;
    isProcessing = true;

    try {
        // Get pending captures (oldest first)
        const { query } = require('../config/database');
        const result = await query(
            `SELECT * FROM inbound_captures WHERE status = 'pending'
             ORDER BY created_at ASC LIMIT $1`,
            [BATCH_SIZE]
        );

        const captures = result.rows;
        if (captures.length === 0) {
            isProcessing = false;
            return;
        }

        logger.info(`Processing ${captures.length} pending captures`);

        for (const capture of captures) {
            try {
                // Mark as processing
                await InboundCapture.updateStatus(capture.id, 'processing');

                if (capture.channel === 'voice') {
                    await processVoiceCapture(capture);
                } else if (capture.channel === 'whatsapp') {
                    await processWhatsAppCapture(capture);
                }
            } catch (error) {
                logger.error('Failed to process capture', {
                    captureId: capture.id,
                    error: error.message,
                });
                await InboundCapture.updateStatus(capture.id, 'failed', {
                    extracted_data: { error: error.message },
                });
            }
        }
    } catch (error) {
        logger.error('Capture processor batch error', { error: error.message });
    } finally {
        isProcessing = false;
    }
}

/**
 * Start the background processor polling loop
 */
function startCaptureProcessor() {
    logger.info('Starting capture processor', { pollIntervalMs: POLL_INTERVAL_MS });

    // Initial run after 5s delay (let server start up)
    setTimeout(processPendingCaptures, 5000);

    // Poll every 30s
    pollTimer = setInterval(processPendingCaptures, POLL_INTERVAL_MS);
}

/**
 * Stop the processor
 */
function stopCaptureProcessor() {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
    logger.info('Capture processor stopped');
}

module.exports = {
    startCaptureProcessor,
    stopCaptureProcessor,
    processPendingCaptures,
};
