const fs = require('fs');
const path = require('path');
const AuthService = require('../services/authService');
const Pharmacy = require('../models/Pharmacy');
const User = require('../models/User');
const logger = require('../config/logger');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const SLUG_REGEX = /^[a-z][a-z0-9-]{1,58}[a-z0-9]$/;
const RESERVED_SLUGS = ['pharmapay', 'portal', 'admin', 'api', 'www', 'mail', 'ftp', 'ns1', 'ns2'];

// Signup - register pharmacy owner and pharmacy
exports.signup = async (req, res, next) => {
    try {
        const { ownerName, email, mobile, password, pharmacyName, slug } = req.body;

        // Validate slug format
        if (!SLUG_REGEX.test(slug)) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Slug must start with a letter, end with a letter or number, contain only lowercase letters, numbers, and hyphens, and be 3-60 characters'));
        }

        // Check reserved slugs
        if (RESERVED_SLUGS.includes(slug)) {
            return res.status(409).json(errorResponse('RESERVED_SLUG', 'This slug is reserved and cannot be used'));
        }

        // Check slug uniqueness
        const slugExists = await Pharmacy.slugExists(slug);
        if (slugExists) {
            return res.status(409).json(errorResponse('DUPLICATE_SLUG', 'Slug is already taken'));
        }

        // Check email uniqueness
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            return res.status(409).json(errorResponse('DUPLICATE_EMAIL', 'Email already registered'));
        }

        // Check mobile uniqueness
        const existingMobile = await User.findByMobile(mobile);
        if (existingMobile) {
            return res.status(409).json(errorResponse('DUPLICATE_MOBILE', 'Mobile number already registered'));
        }

        // Hash password
        const password_hash = await AuthService.hashPassword(password);

        // Create user with pharmacy_owner role
        const user = await User.create({
            name: ownerName,
            email,
            mobile,
            password_hash,
            role: 'admin'
        });

        // Create pharmacy record
        const pharmacy = await Pharmacy.create({
            owner_id: user.id,
            name: pharmacyName,
            slug
        });

        // Generate tokens
        const { accessToken, refreshToken } = AuthService.generateTokens(user);

        logger.info('Pharmacy owner registered', { userId: user.id, pharmacyId: pharmacy.id, slug });

        res.status(201).json(successResponse({
            token: accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role
            },
            pharmacy
        }, 'Pharmacy registered successfully'));
    } catch (error) {
        if (error.message === 'DUPLICATE_EMAIL') {
            return res.status(409).json(errorResponse('DUPLICATE_EMAIL', 'Email already registered'));
        }
        if (error.message === 'DUPLICATE_MOBILE') {
            return res.status(409).json(errorResponse('DUPLICATE_MOBILE', 'Mobile number already registered'));
        }
        next(error);
    }
};

// Login - reuse existing auth login with dashboardType='onboarding'
exports.login = async (req, res, next) => {
    try {
        const { mobileEmail, password } = req.body;

        if (!mobileEmail || !password) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Email/mobile and password are required'));
        }

        const result = await AuthService.login(mobileEmail, password, 'onboarding');

        logger.info('Pharmacy owner logged in', {
            userId: result.user.id,
            role: result.user.role
        });

        res.json(successResponse(result));
    } catch (error) {
        if (error.message === 'INVALID_CREDENTIALS') {
            return res.status(401).json(errorResponse('INVALID_CREDENTIALS', 'Invalid email/mobile or password'));
        }
        if (error.message === 'INACTIVE_USER') {
            return res.status(403).json(errorResponse('INACTIVE_USER', 'User account is inactive'));
        }
        if (error.message === 'DASHBOARD_ACCESS_DENIED') {
            return res.status(403).json(errorResponse('DASHBOARD_ACCESS_DENIED', error.details || 'Access denied to this dashboard'));
        }
        next(error);
    }
};

// Check slug availability
exports.checkSlug = async (req, res, next) => {
    try {
        const { slug } = req.params;

        if (RESERVED_SLUGS.includes(slug)) {
            return res.json(successResponse({ available: false, reason: 'reserved' }));
        }

        const exists = await Pharmacy.slugExists(slug);

        res.json(successResponse({ available: !exists }));
    } catch (error) {
        next(error);
    }
};

// Get own pharmacy
exports.getMyPharmacy = async (req, res, next) => {
    try {
        const pharmacy = await Pharmacy.findByOwnerId(req.user.userId);

        if (!pharmacy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Pharmacy not found'));
        }

        res.json(successResponse(pharmacy));
    } catch (error) {
        next(error);
    }
};

// Update config (plan, features)
exports.updateConfig = async (req, res, next) => {
    try {
        const { plan, features } = req.body;

        const validPlans = ['starter', 'growth', 'enterprise'];
        if (plan && !validPlans.includes(plan)) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Plan must be one of: starter, growth, enterprise'));
        }

        const pharmacy = await Pharmacy.findByOwnerId(req.user.userId);
        if (!pharmacy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Pharmacy not found'));
        }

        const planLimits = {
            starter: { max_delivery_boys: 10, max_outlets: 1 },
            growth: { max_delivery_boys: 50, max_outlets: 5 },
            enterprise: { max_delivery_boys: 999, max_outlets: 999 }
        };

        const selectedPlan = plan || pharmacy.plan || 'starter';
        const limits = planLimits[selectedPlan];

        const configData = {
            plan: selectedPlan,
            features: features || pharmacy.features || {},
            max_delivery_boys: limits.max_delivery_boys,
            max_outlets: limits.max_outlets,
        };

        const updated = await Pharmacy.updateConfig(pharmacy.id, configData);

        logger.info('Pharmacy config updated', { userId: req.user.userId, plan: selectedPlan });

        res.json(successResponse(updated, 'Configuration updated'));
    } catch (error) {
        next(error);
    }
};

// Update branding (primary_color)
exports.updateBranding = async (req, res, next) => {
    try {
        const { primary_color } = req.body;

        // Validate hex color format
        if (primary_color && !/^#[0-9A-Fa-f]{6}$/.test(primary_color)) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'primary_color must be a valid hex color (e.g. #185FA5)'));
        }

        const pharmacy = await Pharmacy.findByOwnerId(req.user.userId);
        if (!pharmacy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Pharmacy not found'));
        }

        const brandingData = {};
        if (primary_color) {
            brandingData.primary_color = primary_color;
        }

        const updated = await Pharmacy.updateBranding(pharmacy.id, brandingData);

        logger.info('Pharmacy branding updated', { userId: req.user.userId });

        res.json(successResponse(updated, 'Branding updated'));
    } catch (error) {
        next(error);
    }
};

// Upload logo
exports.uploadLogo = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Logo file is required'));
        }

        const pharmacy = await Pharmacy.findByOwnerId(req.user.userId);
        if (!pharmacy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Pharmacy not found'));
        }

        const logo_url = '/uploads/' + req.file.filename;

        const updated = await Pharmacy.updateBranding(pharmacy.id, { logo_url });

        logger.info('Pharmacy logo uploaded', { userId: req.user.userId, logo_url });

        res.json(successResponse(updated, 'Logo uploaded'));
    } catch (error) {
        next(error);
    }
};

// Submit for approval
exports.submitForApproval = async (req, res, next) => {
    try {
        const pharmacy = await Pharmacy.findByOwnerId(req.user.userId);

        if (!pharmacy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Pharmacy not found'));
        }

        const updated = await Pharmacy.updateStatus(pharmacy.id, 'submitted', {
            submitted_at: new Date()
        });

        logger.info('Pharmacy submitted for approval', { pharmacyId: pharmacy.id, userId: req.user.userId });

        res.json(successResponse(updated, 'Pharmacy submitted for approval'));
    } catch (error) {
        next(error);
    }
};

// Get build status
exports.getBuildStatus = async (req, res, next) => {
    try {
        const pharmacy = await Pharmacy.findByOwnerId(req.user.userId);

        if (!pharmacy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Pharmacy not found'));
        }

        res.json(successResponse({
            build_status: pharmacy.build_status,
            build_url: pharmacy.build_url
        }));
    } catch (error) {
        next(error);
    }
};

// List all pharmacies (admin)
exports.listPharmacies = async (req, res, next) => {
    try {
        const { status } = req.query;

        const pharmacies = await Pharmacy.findAll(status);

        res.json(successResponse({ pharmacies, count: pharmacies.length }));
    } catch (error) {
        next(error);
    }
};

// Get single pharmacy (admin)
exports.getPharmacy = async (req, res, next) => {
    try {
        const pharmacy = await Pharmacy.findById(req.params.id);

        if (!pharmacy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Pharmacy not found'));
        }

        res.json(successResponse(pharmacy));
    } catch (error) {
        next(error);
    }
};

// Approve pharmacy (admin)
exports.approvePharmacy = async (req, res, next) => {
    try {
        const pharmacy = await Pharmacy.findById(req.params.id);

        if (!pharmacy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Pharmacy not found'));
        }

        // Update status to approved
        const updated = await Pharmacy.updateStatus(pharmacy.id, 'approved', {
            approved_at: new Date()
        });

        // Generate tenant config JSON
        const slug = pharmacy.slug;
        const tenantConfig = {
            client_code: `${slug.toUpperCase()}-01`,
            app_name: pharmacy.name,
            brand: {
                primary_color: pharmacy.primary_color || '#185FA5',
                logo_url: pharmacy.logo_url || ''
            },
            api_base_url: `https://${slug}.pharmapay.swinkpay-fintech.com/api`,
            admin_url: `https://${slug}.pharmapay.swinkpay-fintech.com/admin`,
            store_url: `https://${slug}.pharmapay.swinkpay-fintech.com`,
            features: pharmacy.features || {},
            plan: pharmacy.plan || 'starter',
            max_delivery_boys: pharmacy.max_delivery_boys || 10,
            max_outlets: pharmacy.max_outlets || 1
        };

        // Write tenant config file
        const configDir = '/app/tenant-configs';
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        fs.writeFileSync(
            path.join(configDir, `${slug}.json`),
            JSON.stringify(tenantConfig, null, 2)
        );

        // Store config_json in database
        await Pharmacy.updateConfig(pharmacy.owner_id, { config_json: tenantConfig });

        logger.info('Pharmacy approved', { pharmacyId: pharmacy.id, slug });

        res.json(successResponse(updated, 'Pharmacy approved'));
    } catch (error) {
        next(error);
    }
};

// Reject pharmacy (admin)
exports.rejectPharmacy = async (req, res, next) => {
    try {
        const { rejection_reason } = req.body;

        if (!rejection_reason) {
            return res.status(400).json(errorResponse('VALIDATION_ERROR', 'Rejection reason is required'));
        }

        const pharmacy = await Pharmacy.findById(req.params.id);

        if (!pharmacy) {
            return res.status(404).json(errorResponse('NOT_FOUND', 'Pharmacy not found'));
        }

        const updated = await Pharmacy.updateStatus(pharmacy.id, 'rejected', {
            rejection_reason
        });

        logger.info('Pharmacy rejected', { pharmacyId: pharmacy.id, reason: rejection_reason });

        res.json(successResponse(updated, 'Pharmacy rejected'));
    } catch (error) {
        next(error);
    }
};
