import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import IdleTimeoutWarning from '../components/IdleTimeoutWarning';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (identifier, password) => {
        try {
            const response = await authAPI.login({
                mobileEmail: identifier,
                password,
                dashboardType: "admin"
            });

            if (!response.data?.success) {
                return {
                    success: false,
                    error: response.data?.error?.message || 'Login failed',
                };
            }

            const { token, refreshToken, user } = response.data.data || {};

            localStorage.setItem('token', token);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error?.message || 'Invalid credentials',
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/admin/login';
    };

    const IDLE_TIMEOUT_MINUTES = 30;
    const WARNING_MINUTES = 2;

    const handleIdleTimeout = () => {
        logout();
    };

    const handleWarning = () => {};

    const { isWarning, timeRemaining, extendSession } = useIdleTimeout({
        idleTimeoutMinutes: IDLE_TIMEOUT_MINUTES,
        warningMinutes: WARNING_MINUTES,
        onIdle: handleIdleTimeout,
        onWarning: handleWarning,
        enabled: !!user,
    });

    const updateUser = (userData) => {
        const updatedUser = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
            {user && (
                <IdleTimeoutWarning
                    isOpen={isWarning}
                    timeRemaining={timeRemaining}
                    onExtend={extendSession}
                    onLogout={logout}
                />
            )}
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
