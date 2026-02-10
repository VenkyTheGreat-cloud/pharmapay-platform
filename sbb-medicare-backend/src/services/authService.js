const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DeliveryBoy = require('../models/DeliveryBoy');
const OtpVerification = require('../models/OtpVerification');
const RefreshToken = require('../models/RefreshToken');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-production-use-strong-secret-key-minimum-256-bits';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || '24h';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || '30d';

class AuthService {
    // Generate JWT tokens
    static generateTokens(user) {
        const payload = {
            iss: 'sbb-medicare',
            sub: user.id.toString(),
            userId: user.id,
            email: user.email,
            role: user.role,
            // Include admin_id in token (for grouping stores under an admin)
            adminId: user.admin_id || null
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRY
        });

        const refreshToken = jwt.sign({
            ...payload,
            type: 'refresh'
        }, JWT_SECRET, {
            expiresIn: REFRESH_TOKEN_EXPIRY
        });

        return { accessToken, refreshToken };
    }

    // Hash password
    static async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    // Compare password
    static async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    // Register delivery boy
    static async registerDeliveryBoy(data) {
        const { name, mobile, email, password, address, store_id } = data;

        // Check if mobile already exists
        const existingDeliveryBoyByMobile = await DeliveryBoy.findByMobile(mobile);
        if (existingDeliveryBoyByMobile) {
            throw new Error('DUPLICATE_MOBILE');
        }

        // Check if email already exists
        if (email) {
            const existingDeliveryBoyByEmail = await DeliveryBoy.findByEmail(email);
            if (existingDeliveryBoyByEmail) {
                throw new Error('DUPLICATE_EMAIL');
            }
        }

        // Hash password
        const password_hash = await this.hashPassword(password);

        // Create delivery boy with store_id (admin/store selection)
        const deliveryBoy = await DeliveryBoy.create({
            name,
            mobile,
            email: email || null,
            address,
            store_id: store_id || null,
            password_hash
        });

        return {
            id: deliveryBoy.id,
            name: deliveryBoy.name,
            mobile: deliveryBoy.mobile,
            email: deliveryBoy.email,
            status: deliveryBoy.status
        };
    }

    // Login user (supports both users and delivery boys)
    static async login(mobileEmail, password, dashboardType = null) {
        const logger = require('../config/logger');
        
        // First, try to find in users table (admin/store_manager)
        let user = await User.findByEmailOrMobile(mobileEmail);
        let isDeliveryBoy = false;

        // If not found in users, check delivery_boys table
        if (!user) {
            const deliveryBoy = await DeliveryBoy.findByEmailOrMobile(mobileEmail);
            if (deliveryBoy) {
                user = deliveryBoy;
                isDeliveryBoy = true;
            }
        }

        if (!user) {
            logger.warn('Login failed - user not found', { mobileEmail: mobileEmail?.substring(0, 3) + '***' });
            throw new Error('INVALID_CREDENTIALS');
        }

        // Check if user/delivery boy is active
        if (!user.is_active) {
            logger.warn('Login failed - inactive user', { 
                userId: user.id, 
                email: user.email,
                isDeliveryBoy 
            });
            throw new Error('INACTIVE_USER');
        }

        // For delivery boys, also check if they're approved
        if (isDeliveryBoy && user.status !== 'approved') {
            logger.warn('Login failed - delivery boy not approved', { 
                deliveryBoyId: user.id, 
                email: user.email,
                status: user.status
            });
            throw new Error('NOT_APPROVED');
        }

        // Check if password exists
        if (!user.password_hash) {
            logger.warn('Login failed - no password set', { 
                userId: user.id, 
                email: user.email,
                isDeliveryBoy 
            });
            throw new Error('NO_PASSWORD_SET');
        }

        // Verify password
        const isPasswordValid = await this.comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            logger.warn('Login failed - invalid password', { 
                userId: user.id, 
                email: user.email,
                isDeliveryBoy 
            });
            throw new Error('INVALID_CREDENTIALS');
        }

        // Validate dashboard access (only for admin and store_manager roles)
        if (!isDeliveryBoy && dashboardType) {
            const userRole = user.role;
            const normalizedDashboardType = dashboardType.toLowerCase();

            // Admin cannot login to store dashboard
            if (userRole === 'admin' && normalizedDashboardType === 'store') {
                logger.warn('Login failed - admin trying to access store dashboard', { 
                    userId: user.id, 
                    email: user.email,
                    role: userRole,
                    dashboardType: normalizedDashboardType
                });
                const error = new Error('DASHBOARD_ACCESS_DENIED');
                error.details = 'Admin users cannot access the store dashboard. Please use the admin dashboard.';
                throw error;
            }

            // Store manager cannot login to admin dashboard
            if (userRole === 'store_manager' && normalizedDashboardType === 'admin') {
                logger.warn('Login failed - store manager trying to access admin dashboard', { 
                    userId: user.id, 
                    email: user.email,
                    role: userRole,
                    dashboardType: normalizedDashboardType
                });
                const error = new Error('DASHBOARD_ACCESS_DENIED');
                error.details = 'Store managers cannot access the admin dashboard. Please use the store dashboard.';
                throw error;
            }
        }

        // Generate tokens (for delivery boys, use role 'delivery_boy')
        const tokenUser = {
            ...user,
            role: isDeliveryBoy ? 'delivery_boy' : user.role
        };
        const { accessToken, refreshToken } = this.generateTokens(tokenUser);

        // Store refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        
        // Only store refresh token for users (UUID), not delivery boys (BIGINT)
        // refresh_tokens.user_id expects UUID, delivery_boys.id is BIGINT
        if (!isDeliveryBoy) {
            try {
                await RefreshToken.create(user.id, refreshToken, expiresAt);
            } catch (error) {
                logger.error('Failed to store refresh token', { 
                    error: error.message,
                    userId: user.id 
                });
            }
        }

        // Return user data (without password)
        const userData = {
            id: user.id,
            name: user.name,
            storeName: isDeliveryBoy ? null : (user.store_name || null),
            mobile: user.mobile,
            email: user.email,
            address: user.address,
            role: isDeliveryBoy ? 'delivery_boy' : user.role
        };

        // Add delivery boy specific fields
        if (isDeliveryBoy) {
            userData.status = user.status;
            userData.photo_url = user.photo_url;
        }

        return {
            token: accessToken,
            refreshToken,
            user: userData
        };
    }

    // Send OTP
    static async sendOTP(mobile) {
        // Check if user exists
        const user = await User.findByMobile(mobile);
        if (!user) {
            throw new Error('NOT_FOUND');
        }

        // Create OTP
        const otpRecord = await OtpVerification.create(mobile);

        // TODO: Send SMS with OTP
        // For now, we'll return the OTP in development (remove in production)
        if (process.env.NODE_ENV === 'development') {
            console.log(`OTP for ${mobile}: ${otpRecord.otp}`);
        }

        return {
            expiresIn: 600 // 10 minutes in seconds
        };
    }

    // Verify OTP and login
    static async verifyOTP(mobile, otp, dashboardType = null) {
        const logger = require('../config/logger');
        
        // Verify OTP
        const otpRecord = await OtpVerification.verify(mobile, otp);
        if (!otpRecord) {
            throw new Error('INVALID_OTP');
        }

        // Find user
        const user = await User.findByMobile(mobile);
        if (!user) {
            throw new Error('NOT_FOUND');
        }

        // Check if user is active
        if (!user.is_active) {
            throw new Error('INACTIVE_USER');
        }

        // Validate dashboard access
        if (dashboardType) {
            const userRole = user.role;
            const normalizedDashboardType = dashboardType.toLowerCase();

            // Admin cannot login to store dashboard
            if (userRole === 'admin' && normalizedDashboardType === 'store') {
                logger.warn('OTP login failed - admin trying to access store dashboard', { 
                    userId: user.id, 
                    email: user.email,
                    role: userRole,
                    dashboardType: normalizedDashboardType
                });
                const error = new Error('DASHBOARD_ACCESS_DENIED');
                error.details = 'Admin users cannot access the store dashboard. Please use the admin dashboard.';
                throw error;
            }

            // Store manager cannot login to admin dashboard
            if (userRole === 'store_manager' && normalizedDashboardType === 'admin') {
                logger.warn('OTP login failed - store manager trying to access admin dashboard', { 
                    userId: user.id, 
                    email: user.email,
                    role: userRole,
                    dashboardType: normalizedDashboardType
                });
                const error = new Error('DASHBOARD_ACCESS_DENIED');
                error.details = 'Store managers cannot access the admin dashboard. Please use the store dashboard.';
                throw error;
            }
        }

        // Generate tokens
        const { accessToken, refreshToken } = this.generateTokens(user);

        // Store refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await RefreshToken.create(user.id, refreshToken, expiresAt);

        // Return user data
        const userData = {
            id: user.id,
            name: user.name,
            storeName: user.store_name,
            mobile: user.mobile,
            email: user.email,
            address: user.address,
            role: user.role
        };

        return {
            token: accessToken,
            refreshToken,
            user: userData
        };
    }

    // Refresh access token
    static async refreshToken(refreshTokenString) {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshTokenString, JWT_SECRET);
            if (decoded.type !== 'refresh') {
                throw new Error('INVALID_TOKEN');
            }

            // Check if token exists in database
            const tokenRecord = await RefreshToken.findByToken(refreshTokenString);
            if (!tokenRecord || tokenRecord.is_revoked) {
                throw new Error('INVALID_TOKEN');
            }

            // Get user
            const user = await User.findById(decoded.userId);
            if (!user || !user.is_active) {
                throw new Error('INACTIVE_USER');
            }

            // Generate new access token
            const payload = {
                iss: 'sbb-medicare',
                sub: user.id.toString(),
                userId: user.id,
                email: user.email,
                role: user.role
            };

            const accessToken = jwt.sign(payload, JWT_SECRET, {
                expiresIn: ACCESS_TOKEN_EXPIRY
            });

            return { token: accessToken };
        } catch (error) {
            throw new Error('INVALID_TOKEN');
        }
    }

    // Logout (revoke refresh token)
    static async logout(userId, refreshTokenString) {
        try {
            const tokenRecord = await RefreshToken.findByToken(refreshTokenString);
            if (tokenRecord) {
                await RefreshToken.revoke(tokenRecord.id);
            }
        } catch (error) {
            // Ignore errors during logout
        }
    }
}

module.exports = AuthService;

