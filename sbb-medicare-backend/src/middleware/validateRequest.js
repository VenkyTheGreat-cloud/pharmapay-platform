const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg;
        return res.status(400).json(errorResponse('VALIDATION_ERROR', firstError, { errors: errors.array() }));
    }
    next();
};

module.exports = validateRequest;
