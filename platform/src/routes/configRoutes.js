const express = require('express');
const router = express.Router();

// Get config (public endpoint)
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: {
            appName: 'PharmaPay Backend',
            version: '1.0.0'
        }
    });
});

module.exports = router;

