const crypto = require('crypto');
const axios = require('axios');
const logger = require('../config/logger');

// SwinkPay configuration — reads env vars with UAT sandbox defaults
const getConfig = () => ({
    baseUrl: process.env.SWINKPAY_BASE_URL || 'https://sandbox.swinkpay-fintech.com/',
    authToken: process.env.SWINKPAY_AUTH_TOKEN || 'FREFA45D$B2#18842765#992',
    channel: parseInt(process.env.SWINKPAY_CHANNEL) || 14,
    terminalId: process.env.SWINKPAY_TERMINAL_ID || 'S2DKMQ',
    secretKey: process.env.SWINKPAY_SECRET_KEY || 'hytidnowjidjw29282827373dbbdasakkaojhmsmsiqj',
});

/**
 * Generate HMAC-SHA512 hash for SwinkPay
 * Copied exactly from FarmerSuperApp/server/routes/swinkpay.js
 * Format: invoiceNumber#amount#terminalID#dateAndTime#returnURL#hdnRefNumber#onlyCardBins#backURL#secretKey
 */
const generatePaymentHash = (invoiceNumber, amount, terminalID, dateAndTime, returnURL, hdnRefNumber, onlyCardBins, secretKey, backURL = '') => {
    const onlyCardBinsValue = onlyCardBins ? '1' : '0';

    let dataToHash;
    if (backURL) {
        dataToHash = `${invoiceNumber}#${amount}#${terminalID}#${dateAndTime}#${returnURL}#${hdnRefNumber}#${onlyCardBinsValue}#${backURL}#${secretKey}`;
    } else {
        dataToHash = `${invoiceNumber}#${amount}#${terminalID}#${dateAndTime}#${returnURL}#${hdnRefNumber}#${onlyCardBinsValue}#${secretKey}`;
    }

    logger.info('SwinkPay hash input', { dataToHash, backURL: backURL || 'NOT PROVIDED' });

    const hash = crypto.createHash('sha512').update(dataToHash).digest('hex');
    return hash;
};

/**
 * Format date for SwinkPay: YYYY-MM-DD HH:mm:ss
 * Copied exactly from FarmerSuperApp
 */
const formatDateTime = () => {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
};

/**
 * Generate unique invoice number
 * Prefix: PP for PharmaPay platform payments
 */
const generateInvoiceNumber = (pharmacyId) => {
    const timestamp = Date.now();
    // Use short ID to keep invoice number reasonable length
    const shortId = String(pharmacyId).substring(0, 8);
    return `PP${shortId}${timestamp}`;
};

/**
 * Initiate a payment via SwinkPay API
 * Follows exact same pattern as FarmerSuperApp/server/routes/swinkpay.js
 */
async function initiatePayment(amount, pharmacyId, callbackUrl) {
    const config = getConfig();

    if (!config.authToken || !config.terminalId) {
        throw new Error('SwinkPay credentials not configured');
    }

    const invoiceNumber = generateInvoiceNumber(pharmacyId);
    const dateAndTime = formatDateTime();
    const hdnRefNumber = `PP${String(pharmacyId).substring(0, 8)}${Date.now()}`;
    const amountStr = parseFloat(amount).toFixed(2);
    const onlyCardBins = false;
    const backURL = 'https://pharmapay.swinkpay-fintech.com/payment';

    // Generate hash — matching exact FarmerSuperApp pattern including backURL
    const hash = generatePaymentHash(
        invoiceNumber,
        amountStr,
        config.terminalId,
        dateAndTime,
        callbackUrl,
        hdnRefNumber,
        onlyCardBins,
        config.secretKey,
        backURL
    );

    // Build payload — exact same structure as FarmerSuperApp
    const swinkPayPayload = {
        invoiceNumber,
        amount: amountStr,
        terminalID: config.terminalId,
        dateAndTime,
        hdnRefNumber,
        onlyCardBins,
        hash,
        returnURL: callbackUrl,
        backURL,
    };

    // Headers — exact same as FarmerSuperApp
    const apiUrl = `${config.baseUrl}api/v2/plugin/pay`;
    const headers = {
        'channel': config.channel.toString(),
        'auth_token': config.authToken,
        'Content-Type': 'application/json',
    };

    logger.info('SwinkPay API call', {
        url: apiUrl,
        terminalId: config.terminalId,
        invoiceNumber,
        amount: amountStr,
        callbackUrl,
        backURL,
    });

    try {
        const axiosResponse = await axios.post(apiUrl, swinkPayPayload, { headers });
        const swinkPayResponse = axiosResponse.data;

        logger.info('SwinkPay response', { response: JSON.stringify(swinkPayResponse) });

        if (swinkPayResponse.status === 0 && swinkPayResponse.data) {
            return {
                referenceNo: swinkPayResponse.data.referenceNo,
                paymentUrl: swinkPayResponse.data.url,
                invoiceNumber,
            };
        } else {
            logger.error('SwinkPay error response', { response: swinkPayResponse });
            throw new Error(`SwinkPay error: ${swinkPayResponse.error?.errorMessage || swinkPayResponse.message || 'Payment initiation failed'}`);
        }
    } catch (error) {
        if (error.response) {
            logger.error('SwinkPay axios error', {
                status: error.response.status,
                data: JSON.stringify(error.response.data),
            });
            const errData = error.response.data;
            throw new Error(`SwinkPay error: ${errData?.error?.errorMessage || errData?.message || `HTTP ${error.response.status}`}`);
        }
        throw error;
    }
}

module.exports = {
    generatePaymentHash,
    formatDateTime,
    generateInvoiceNumber,
    initiatePayment,
};
