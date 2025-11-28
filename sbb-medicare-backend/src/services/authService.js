const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DeliveryBoy = require('../models/DeliveryBoy');
const OtpVerification = require('../models/OtpVerification');
const RefreshToken = require('../models/RefreshToken');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-production-use-strong-secret-key-minimum-256-bits';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d';

class AuthService {
    // Generate JWT tokens
    static generateTokens(user) {
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
        const { name, mobile, email, address } = data;

        // Check if mobile already exists
        const existingDeliveryBoy = await DeliveryBoy.findByMobile(mobile);
        if (existingDeliveryBoy) {
            throw new Error('DUPLICATE_MOBILE');
        }

        // Create delivery boy (no store_id for public registration)
        const deliveryBoy = await DeliveryBoy.create({
            name,
            mobile,
            email,
            address,
            store_id: null
        });

        return {
            id: deliveryBoy.id,
            name: deliveryBoy.name,
            mobile: deliveryBoy.mobile,
            status: deliveryBoy.status
        };
    }

    // Login user
    static async login(mobileEmail, password) {
        const logger = require('../config/logger');
        
        // Find user by email or mobile
        const user = await User.findByEmailOrMobile(mobileEmail);
        if (!user) {
            logger.warn('Login failed - user not found', { mobileEmail: mobileEmail?.substring(0, 3) + '***' });
            throw new Error('INVALID_CREDENTIALS');
        }

        // Check if user is active
        if (!user.is_active) {
            logger.warn('Login failed - inactive user', { userId: user.id, email: user.email });
            throw new Error('INACTIVE_USER');
        }

        // Verify password
        const isPasswordValid = await this.comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            logger.warn('Login failed - invalid password', { userId: user.id, email: user.email });
            throw new Error('INVALID_CREDENTIALS');
        }

        // Generate tokens
        const { accessToken, refreshToken } = this.generateTokens(user);

        // Store refresh token
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
        await RefreshToken.create(user.id, refreshToken, expiresAt);

        // Return user data (without password)
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
    static async verifyOTP(mobile, otp) {
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

