import { createContext, useContext, useState, useEffect } from 'react';
import { pharmacyAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            setIsPlatformAdmin(parsed._isPlatformAdmin || false);
        }
        setLoading(false);
    }, []);

    const login = async (identifier, password) => {
        try {
            const response = await pharmacyAPI.login({
                mobileEmail: identifier,
                password,
            });

            if (!response.data?.success) {
                return {
                    success: false,
                    error: response.data?.error?.message || 'Login failed',
                };
            }

            const { token, refreshToken, user: userData } = response.data.data || {};

            localStorage.setItem('token', token);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }

            // Check if this admin has a pharmacy (owner) or is a platform admin
            let platformAdmin = false;
            try {
                await pharmacyAPI.getMyPharmacy();
            } catch {
                // No pharmacy record → this is a platform super admin
                platformAdmin = true;
            }

            const enrichedUser = { ...userData, _isPlatformAdmin: platformAdmin };
            localStorage.setItem('user', JSON.stringify(enrichedUser));
            setUser(enrichedUser);
            setIsPlatformAdmin(platformAdmin);

            return { success: true, user: enrichedUser, isPlatformAdmin: platformAdmin };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || 'Invalid credentials',
            };
        }
    };

    const signup = async (data) => {
        try {
            const response = await pharmacyAPI.signup(data);

            if (!response.data?.success) {
                return {
                    success: false,
                    error: response.data?.error?.message || 'Signup failed',
                };
            }

            const { token, refreshToken, user: userData } = response.data.data || {};

            localStorage.setItem('token', token);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || 'Signup failed. Please try again.',
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    const updateUser = (userData) => {
        const updatedUser = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const value = {
        user,
        loading,
        login,
        signup,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isPlatformAdmin,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
