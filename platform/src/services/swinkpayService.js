const crypto = require('crypto');
const logger = require('../config/logger');

// SwinkPay configuration with env var defaults (UAT sandbox)
const config = {
    baseUrl: process.env.SWINKPAY_BASE_URL || 'https://sandbox.swinkpay-fintech.com/',
    authToken: process.env.SWINKPAY_AUTH_TOKEN || 'FREFA45D$B2#18842765#992',
    channel: process.env.SWINKPAY_CHANNEL || '14',
    terminalId: process.env.SWINKPAY_TERMINAL_ID || 'S2DKMQ',
    secretKey: process.env.SWINKPAY_SECRET_KEY || 'hytidnowjidjw29282827373dbbdasakkaojhmsmsiqj'
};

/**
 * Generate SHA512 hash for SwinkPay payment request
 * Hash format: invoiceNumber#amount#terminalID#dateAndTime#returnURL#hdnRefNumber#onlyCardBins(0 or 1)#secretKey
 */
function generatePaymentHash(invoiceNumber, amount, terminalID, dateAndTime, returnURL, hdnRefNumber, onlyCardBins, secretKey) {
    const cardBinsValue = onlyCardBins ? '1' : '0';
    const hashString = `${invoiceNumber}#${amount}#${terminalID}#${dateAndTime}#${returnURL}#${hdnRefNumber}#${cardBinsValue}#${secretKey}`;
    return crypto.createHash('sha512').update(hashString).digest('hex');
}

/**
 * Format current date/time as "YYYY-MM-DD HH:mm:ss"
 */
function formatDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Generate unique invoice number for a pharmacy payment
 * Format: PP{pharmacyId}{timestamp}
 */
function generateInvoiceNumber(pharmacyId) {
    const timestamp = Date.now();
    return `PP${pharmacyId}${timestamp}`;
}

/**
 * Initiate a payment via SwinkPay API
 * @param {number} amount - Payment amount in Rs
 * @param {number} pharmacyId - Pharmacy ID for invoice generation
 * @param {string} returnURL - URL SwinkPay redirects to after payment
 * @returns {Object} { referenceNo, paymentUrl, invoiceNumber }
 */
async function initiatePayment(amount, pharmacyId, returnURL) {
    const invoiceNumber = generateInvoiceNumber(pharmacyId);
    const dateAndTime = formatDateTime();
    const hdnRefNumber = '';
    const onlyCardBins = false;

    const hash = generatePaymentHash(
        invoiceNumber,
        amount,
        config.terminalId,
        dateAndTime,
        returnURL,
        hdnRefNumber,
        onlyCardBins,
        config.secretKey
    );

    const requestBody = {
        invoiceNumber,
        amount,
        terminalID: config.terminalId,
        dateAndTime,
        returnURL,
        hdnRefNumber,
        onlyCardBins,
        hash
    };

    logger.info('Initiating SwinkPay payment', { invoiceNumber, amount, pharmacyId });

    const response = await fetch(`${config.baseUrl}api/v2/plugin/pay`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'auth_token': config.authToken,
            'channel': config.channel
        },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.status !== 0) {
        logger.error('SwinkPay payment initiation failed', { response: data });
        throw new Error(`SwinkPay error: ${data.message || 'Payment initiation failed'}`);
    }

    logger.info('SwinkPay payment link generated', {
        invoiceNumber,
        referenceNo: data.data.referenceNo
    });

    return {
        referenceNo: data.data.referenceNo,
        paymentUrl: data.data.url,
        invoiceNumber
    };
}

module.exports = {
    generatePaymentHash,
    formatDateTime,
    generateInvoiceNumber,
    initiatePayment
};
