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
        const ext = path.extname(file).toLowerCase();
        let encoding = 'MP3';
        if (ext === '.wav') encoding = 'LINEAR16';
        else if (ext === '.m4a' || ext === '.mp4') encoding = 'MP3'; // Google handles M4A as MP3
        else if (ext === '.ogg') encoding = 'OGG_OPUS';

        const response = await axios.post(
            `${GOOGLE_STT_URL}?key=${GOOGLE_STT_API_KEY}`,
            {
                config: {
                    encoding,
                    sampleRateHertz: 16000,
                    // Enable auto language detection with Indian languages
                    languageCode: options.language || 'te-IN',
                    alternativeLanguageCodes: ['ta-IN', 'en-IN', 'hi-IN', 'te-IN'],
                    // Boost accuracy for pharmacy context
                    model: 'default',
                    useEnhanced: true,
                    enableAutomaticPunctuation: true,
                    // Hint pharmacy-related words
                    speechContexts: [{
                        phrases: [
                            'tablet', 'capsule', 'syrup', 'medicine', 'pharmacy',
                            'paracetamol', 'dolo', 'crocin', 'metformin', 'azithromycin',
                            'delivery', 'order', 'strips', 'bottles',
                        ],
                        boost: 10,
                    }],
                },
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
