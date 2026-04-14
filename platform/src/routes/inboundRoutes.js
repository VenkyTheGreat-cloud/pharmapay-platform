const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const inboundController = require('../controllers/inboundController');
const { authenticateToken } = require('../middleware/auth');

// Audio upload config — separate from image uploads, allows MP3/M4A/WAV, 25MB limit
const audioDir = process.env.UPLOAD_PATH ? path.join(process.env.UPLOAD_PATH, 'captures') : './uploads/captures';
if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, audioDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'capture-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const audioUpload = multer({
    storage: audioStorage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB for call recordings
    fileFilter: (req, file, cb) => {
        const allowed = /mp3|mp4|m4a|mpeg|wav|ogg|aac|webm/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype) || file.mimetype.startsWith('audio/');
        if (ext || mime) cb(null, true);
        else cb(new Error('Only audio files are allowed'));
    },
});

// Inbound capture endpoints (called by store phone capture service)
// Auth is optional for now — store token validated in controller
router.post('/voice', authenticateToken, audioUpload.single('audio'), inboundController.uploadVoice);
router.post('/whatsapp', authenticateToken, inboundController.uploadWhatsApp);

// List captures for authenticated store
router.get('/captures', authenticateToken, inboundController.listCaptures);

module.exports = router;
