const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create transporter - uses environment variables for configuration
// Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS in .env
// Falls back to a no-op logger if not configured
let transporter = null;

const isConfigured = () => {
    return !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
};

const getTransporter = () => {
    if (transporter) return transporter;

    if (!isConfigured()) {
        logger.warn('Email service not configured (EMAIL_HOST, EMAIL_USER, EMAIL_PASS missing). Emails will be logged only.');
        return null;
    }

    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    return transporter;
};

const FROM_ADDRESS = () => process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@pharmagig.swinkpay-fintech.com';

/**
 * Send email notification to platform admin(s) when a new pharmacy registers.
 */
const sendNewPharmacyNotification = async ({ pharmacyName, ownerName, ownerEmail, ownerMobile, slug }) => {
    const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS || process.env.EMAIL_USER;

    if (!adminEmails) {
        logger.info('No admin notification emails configured. Skipping pharmacy registration notification.', { pharmacyName, slug });
        return;
    }

    const subject = `New Pharmacy Registration: ${pharmacyName}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #139900; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">PharmaGig</h1>
                <p style="color: #e0f0e0; margin: 4px 0 0;">New Pharmacy Registration</p>
            </div>
            <div style="padding: 24px; background: #f8f9fa; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 8px 8px;">
                <p style="color: #333; font-size: 16px;">A new pharmacy has registered on the platform:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <tr>
                        <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #e2e8f0;">Pharmacy Name</td>
                        <td style="padding: 8px 12px; color: #333; border-bottom: 1px solid #e2e8f0;">${pharmacyName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #e2e8f0;">Owner Name</td>
                        <td style="padding: 8px 12px; color: #333; border-bottom: 1px solid #e2e8f0;">${ownerName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #e2e8f0;">Owner Email</td>
                        <td style="padding: 8px 12px; color: #333; border-bottom: 1px solid #e2e8f0;">${ownerEmail}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-weight: bold; color: #555; border-bottom: 1px solid #e2e8f0;">Owner Mobile</td>
                        <td style="padding: 8px 12px; color: #333; border-bottom: 1px solid #e2e8f0;">${ownerMobile}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 12px; font-weight: bold; color: #555;">Slug (URL)</td>
                        <td style="padding: 8px 12px; color: #333;">${slug}.pharmagig.swinkpay-fintech.com</td>
                    </tr>
                </table>
                <p style="color: #666; font-size: 14px; margin-top: 16px;">
                    The pharmacy owner will complete onboarding and payment. You will be able to review and approve from the admin panel.
                </p>
            </div>
        </div>
    `;

    const transport = getTransporter();

    if (!transport) {
        logger.info('Email service not configured. Notification logged:', { subject, to: adminEmails, pharmacyName, ownerName, ownerEmail, slug });
        return;
    }

    try {
        await transport.sendMail({
            from: FROM_ADDRESS(),
            to: adminEmails,
            subject,
            html,
        });
        logger.info('Pharmacy registration notification email sent', { to: adminEmails, pharmacyName, slug });
    } catch (error) {
        logger.error('Failed to send pharmacy registration notification email', { error: error.message, pharmacyName, slug });
    }
};

/**
 * Send welcome email to new pharmacy owner.
 */
const sendWelcomeEmail = async ({ ownerName, ownerEmail, pharmacyName, slug }) => {
    const subject = `Welcome to PharmaGig, ${ownerName}!`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #139900; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">PharmaGig</h1>
            </div>
            <div style="padding: 24px; background: #f8f9fa; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 8px 8px;">
                <h2 style="color: #333; margin: 0 0 16px;">Welcome, ${ownerName}!</h2>
                <p style="color: #555; font-size: 15px; line-height: 1.6;">
                    Thank you for registering <strong>${pharmacyName}</strong> on PharmaGig. Your pharmacy URL will be:
                </p>
                <p style="text-align: center; margin: 16px 0;">
                    <span style="background: #e8f5e9; padding: 8px 16px; border-radius: 6px; font-weight: bold; color: #139900;">
                        ${slug}.pharmagig.swinkpay-fintech.com
                    </span>
                </p>
                <p style="color: #555; font-size: 15px; line-height: 1.6;">
                    Complete the onboarding steps and payment to get your pharmacy live. Our team will review and approve your registration.
                </p>
                <p style="color: #888; font-size: 13px; margin-top: 24px;">
                    If you didn't register, please ignore this email.
                </p>
            </div>
        </div>
    `;

    const transport = getTransporter();

    if (!transport) {
        logger.info('Email service not configured. Welcome email logged:', { to: ownerEmail, pharmacyName, slug });
        return;
    }

    try {
        await transport.sendMail({
            from: FROM_ADDRESS(),
            to: ownerEmail,
            subject,
            html,
        });
        logger.info('Welcome email sent', { to: ownerEmail, pharmacyName, slug });
    } catch (error) {
        logger.error('Failed to send welcome email', { error: error.message, ownerEmail, slug });
    }
};

module.exports = {
    sendNewPharmacyNotification,
    sendWelcomeEmail,
    isConfigured,
};
