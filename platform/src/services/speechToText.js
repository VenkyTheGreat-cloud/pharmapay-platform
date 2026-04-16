/**
 * Speech-to-Text service using Google Cloud STT API
 * Free tier: 60 minutes/month
 *
 * Supports: Telugu (te-IN), Tamil (ta-IN), English (en-IN), Hindi (hi-IN)
 * Auto-detects language using alternative language codes
 *
 * Requires: GOOGLE_STT_API_KEY in .env
 * Get free key: https://console.cloud.google.com/apis/credentials
 * Enable: Cloud Speech-to-Text API
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

const GOOGLE_STT_API_KEY = process.env.GOOGLE_STT_API_KEY;
const GOOGLE_STT_URL = 'https://speech.googleapis.com/v1/speech:recognize';

/**
 * Transcribe an audio file to text using Google Cloud Speech-to-Text
 *
 * @param {string} audioFilePath - path to MP3/M4A/WAV file
 * @param {object} options
 * @param {string} options.language - primary language hint: 'te-IN', 'ta-IN', 'en-IN', 'hi-IN'
 * @returns {{ transcript: string, language: string, confidence: number } | null}
 */
async function transcribeAudio(audioFilePath, options = {}) {
    if (!GOOGLE_STT_API_KEY) {
        logger.warn('Google STT API key not configured — skipping transcription');
        return null;
    }

    const file = path.resolve(audioFilePath);
    if (!fs.existsSync(file)) {
        logger.error('Audio file not found for transcription', { path: audioFilePath });
        return null;
    }

    try {
        // Read audio file and convert to base64
        const audioBytes = fs.readFileSync(file);
        const audioContent = audioBytes.toString('base64');

        // File size check — Google STT sync API limit is ~10MB / 1 min audio
        const fileSizeMB = audioBytes.length / (1024 * 1024);
        if (fileSizeMB > 10) {
            logger.warn('Audio file too large for sync STT, skipping', { sizeMB: fileSizeMB });
            return null;
        }

        // Determine encoding from file extension
        // For M4A/MP4 (AAC), omit encoding and sampleRateHertz to let Google auto-detect
        const ext = path.extname(file).toLowerCase();
        const isAac = ['.m4a', '.mp4', '.aac'].includes(ext);

        const config = {
            // Enable auto language detection with Indian languages
            languageCode: options.language || 'en-IN',
            alternativeLanguageCodes: ['te-IN', 'ta-IN', 'hi-IN', 'en-IN'],
            model: 'default',
            useEnhanced: true,
            enableAutomaticPunctuation: true,
            speechContexts: [{
                phrases: [
                    'tablet', 'capsule', 'syrup', 'medicine', 'pharmacy',
                    'paracetamol', 'dolo', 'crocin', 'metformin', 'azithromycin',
                    'amoxicillin', 'omeprazole', 'cetirizine', 'pan d', 'shelcal',
                    'delivery', 'order', 'strips', 'bottles', 'send', 'need',
                    'nagar', 'colony', 'road', 'street', 'area',
                ],
                boost: 15,
            }],
        };

        if (isAac) {
            // Let Google auto-detect AAC encoding from the content
            logger.info('Using auto-detect for AAC/M4A file', { file: path.basename(audioFilePath) });
        } else if (ext === '.wav') {
            config.encoding = 'LINEAR16';
            config.sampleRateHertz = 16000;
        } else if (ext === '.ogg') {
            config.encoding = 'OGG_OPUS';
            config.sampleRateHertz = 16000;
        } else {
            config.encoding = 'MP3';
            config.sampleRateHertz = 16000;
        }

        const response = await axios.post(
            `${GOOGLE_STT_URL}?key=${GOOGLE_STT_API_KEY}`,
            {
                config,
                audio: {
                    content: audioContent,
                },
            },
            { timeout: 30000 }
        );

        const results = response.data?.results;
        if (!results || results.length === 0) {
            logger.info('STT returned no results', { file: audioFilePath });
            return { transcript: '', language: 'unknown', confidence: 0 };
        }

        // Combine all transcript segments
        const transcript = results
            .map(r => r.alternatives?.[0]?.transcript || '')
            .join(' ')
            .trim();

        const confidence = results[0]?.alternatives?.[0]?.confidence || 0;
        const detectedLang = results[0]?.languageCode || options.language || 'unknown';

        logger.info('Audio transcribed successfully', {
            file: path.basename(audioFilePath),
            language: detectedLang,
            confidence: confidence.toFixed(2),
            transcriptLength: transcript.length,
        });

        return {
            transcript,
            language: detectedLang,
            confidence,
        };
    } catch (error) {
        logger.error('STT transcription failed', {
            error: error.response?.data?.error?.message || error.message,
            file: audioFilePath,
        });
        return null;
    }
}

module.exports = { transcribeAudio };
