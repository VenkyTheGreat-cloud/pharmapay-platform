import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import IdleTimeoutWarning from '../components/IdleTimeoutWarning';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (identifier, password) => {
        try {
            // Backend expects "mobileEmail" which can be mobile or email, and "dashboardType" hardcoded to "store"
            const response = await authAPI.login({ 
                mobileEmail: identifier, 
                password,
                dashboardType: "store"
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
        // Redirect to login page
        window.location.href = '/login';
    };

    // Idle timeout configuration
    // Idle timeout: 30-60 minutes (using 30 minutes as default, can be configured)
    // Warning: 2-3 minutes before timeout (using 2 minutes)
    const IDLE_TIMEOUT_MINUTES = 30; // Can be changed to 60 if needed
    const WARNING_MINUTES = 2; // Warning 2 minutes before timeout

    const handleIdleTimeout = () => {
        // User has been idle, log them out
        logout();
    };

    const handleWarning = () => {
        // Warning is shown automatically by the hook
        // This callback can be used for additional actions if needed
    };

    // Initialize idle timeout (hook must be called unconditionally)
    // The hook will handle the enabled state internally
    const { isWarning, timeRemaining, extendSession } = useIdleTimeout({
        idleTimeoutMinutes: IDLE_TIMEOUT_MINUTES,
        warningMinutes: WARNING_MINUTES,
        onIdle: handleIdleTimeout,
        onWarning: handleWarning,
        enabled: !!user, // Only enable when user is logged in
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
            {/* Idle Timeout Warning Modal */}
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
