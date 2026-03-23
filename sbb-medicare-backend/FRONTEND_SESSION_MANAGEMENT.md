# Frontend Session Management Implementation Guide

## Requirements
- **Idle Timeout**: 30-60 minutes (no user activity)
- **Token Expiration**: 24 hours (absolute)
- **Warning**: Show warning 2-3 minutes before timeout

## Backend Configuration

The backend has been configured with:
- **Access Token Expiry**: 24 hours (`JWT_ACCESS_TOKEN_EXPIRY=24h`)
- **Refresh Token Expiry**: 30 days (unchanged)

## Frontend Implementation

### 1. Session Manager Utility

Create a session manager utility to handle idle timeout and token expiration:

```javascript
// utils/sessionManager.js

class SessionManager {
    constructor(options = {}) {
        this.idleTimeout = options.idleTimeout || 30 * 60 * 1000; // 30 minutes default
        this.tokenExpiry = options.tokenExpiry || 24 * 60 * 60 * 1000; // 24 hours
        this.warningTime = options.warningTime || 2 * 60 * 1000; // 2 minutes before timeout
        this.onWarning = options.onWarning || (() => {});
        this.onTimeout = options.onTimeout || (() => {});
        this.onTokenExpiry = options.onTokenExpiry || (() => {});
        
        this.idleTimer = null;
        this.warningTimer = null;
        this.tokenExpiryTimer = null;
        this.tokenExpiryTime = null;
        
        this.isActive = false;
    }

    // Initialize session manager
    init(tokenIssuedAt) {
        this.resetIdleTimer();
        this.setupTokenExpiry(tokenIssuedAt);
        this.setupActivityListeners();
        this.isActive = true;
    }

    // Setup token expiry timer (24 hours absolute)
    setupTokenExpiry(tokenIssuedAt) {
        // Clear existing timer
        if (this.tokenExpiryTimer) {
            clearTimeout(this.tokenExpiryTimer);
        }

        // Calculate token expiry time
        const issuedAt = tokenIssuedAt ? new Date(tokenIssuedAt * 1000) : new Date();
        this.tokenExpiryTime = new Date(issuedAt.getTime() + this.tokenExpiry);

        // Calculate time until token expires
        const timeUntilExpiry = this.tokenExpiryTime.getTime() - Date.now();

        if (timeUntilExpiry <= 0) {
            // Token already expired
            this.onTokenExpiry();
            return;
        }

        // Set timer for token expiry
        this.tokenExpiryTimer = setTimeout(() => {
            this.onTokenExpiry();
        }, timeUntilExpiry);

        // Also check for warning before token expiry (2-3 minutes before)
        const warningBeforeExpiry = Math.min(this.warningTime, timeUntilExpiry - 60000); // At least 1 minute before
        if (warningBeforeExpiry > 0) {
            setTimeout(() => {
                if (this.isActive) {
                    this.onWarning({
                        type: 'token_expiry',
                        message: 'Your session will expire soon. Please save your work.',
                        timeRemaining: warningBeforeExpiry
                    });
                }
            }, timeUntilExpiry - warningBeforeExpiry);
        }
    }

    // Reset idle timer on user activity
    resetIdleTimer() {
        // Clear existing timers
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
        }
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
        }

        if (!this.isActive) return;

        // Set warning timer (2-3 minutes before idle timeout)
        const warningTime = this.idleTimeout - this.warningTime;
        if (warningTime > 0) {
            this.warningTimer = setTimeout(() => {
                if (this.isActive) {
                    this.onWarning({
                        type: 'idle_timeout',
                        message: 'You will be logged out due to inactivity. Click anywhere to stay logged in.',
                        timeRemaining: this.warningTime
                    });
                }
            }, warningTime);
        }

        // Set idle timeout
        this.idleTimer = setTimeout(() => {
            if (this.isActive) {
                this.onTimeout();
            }
        }, this.idleTimeout);
    }

    // Setup activity listeners
    setupActivityListeners() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        const resetTimer = () => {
            this.resetIdleTimer();
        };

        events.forEach(event => {
            document.addEventListener(event, resetTimer, { passive: true });
        });

        // Store cleanup function
        this.cleanupListeners = () => {
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }

    // Extend session (when user clicks "Stay Logged In")
    extendSession() {
        this.resetIdleTimer();
    }

    // Refresh token (when user wants to continue)
    refreshToken() {
        // Call your refresh token API
        return fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('refreshToken')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('refreshToken', data.data.refreshToken);
                
                // Get token issued time from JWT
                const tokenPayload = JSON.parse(atob(data.data.token.split('.')[1]));
                this.setupTokenExpiry(tokenPayload.iat);
                
                return true;
            }
            return false;
        })
        .catch(error => {
            console.error('Token refresh failed:', error);
            return false;
        });
    }

    // Destroy session manager
    destroy() {
        this.isActive = false;
        
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
        
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
            this.warningTimer = null;
        }
        
        if (this.tokenExpiryTimer) {
            clearTimeout(this.tokenExpiryTimer);
            this.tokenExpiryTimer = null;
        }
        
        if (this.cleanupListeners) {
            this.cleanupListeners();
        }
    }

    // Get remaining time
    getRemainingTime() {
        const idleRemaining = this.idleTimer 
            ? this.idleTimer._idleStart + this.idleTimeout - Date.now()
            : this.idleTimeout;
        
        const tokenRemaining = this.tokenExpiryTime 
            ? this.tokenExpiryTime.getTime() - Date.now()
            : this.tokenExpiry;
        
        return {
            idleRemaining: Math.max(0, idleRemaining),
            tokenRemaining: Math.max(0, tokenRemaining),
            nextExpiry: Math.min(idleRemaining, tokenRemaining)
        };
    }
}

export default SessionManager;
```

### 2. Warning Modal Component

Create a warning modal component:

```javascript
// components/SessionWarningModal.jsx (React example)

import React, { useState, useEffect } from 'react';

const SessionWarningModal = ({ 
    isOpen, 
    message, 
    timeRemaining, 
    onStayLoggedIn, 
    onLogout,
    type 
}) => {
    const [countdown, setCountdown] = useState(Math.floor(timeRemaining / 1000));

    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, timeRemaining]);

    if (!isOpen) return null;

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                        <svg 
                            className="h-6 w-6 text-yellow-500" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                            />
                        </svg>
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">
                        Session Warning
                    </h3>
                </div>
                
                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">{message}</p>
                    <p className="text-sm font-semibold text-gray-800">
                        Time remaining: {minutes}:{seconds.toString().padStart(2, '0')}
                    </p>
                </div>

                <div className="flex justify-end space-x-3">
                    {type === 'idle_timeout' && (
                        <button
                            onClick={onStayLoggedIn}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Stay Logged In
                        </button>
                    )}
                    {type === 'token_expiry' && (
                        <button
                            onClick={onStayLoggedIn}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Refresh Session
                        </button>
                    )}
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionWarningModal;
```

### 3. Integration in Main App Component

```javascript
// App.jsx or main component

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionManager from './utils/sessionManager';
import SessionWarningModal from './components/SessionWarningModal';

function App() {
    const navigate = useNavigate();
    const [sessionManager, setSessionManager] = useState(null);
    const [warning, setWarning] = useState(null);

    useEffect(() => {
        // Initialize session manager after login
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Decode JWT to get issued at time
                const payload = JSON.parse(atob(token.split('.')[1]));
                
                const manager = new SessionManager({
                    idleTimeout: 45 * 60 * 1000, // 45 minutes (configurable 30-60)
                    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
                    warningTime: 2.5 * 60 * 1000, // 2.5 minutes before timeout
                    onWarning: (warningData) => {
                        setWarning(warningData);
                    },
                    onTimeout: () => {
                        // Idle timeout - logout user
                        handleLogout('You have been logged out due to inactivity.');
                    },
                    onTokenExpiry: () => {
                        // Token expired - logout user
                        handleLogout('Your session has expired. Please login again.');
                    }
                });

                manager.init(payload.iat);
                setSessionManager(manager);
            } catch (error) {
                console.error('Failed to initialize session manager:', error);
            }
        }

        return () => {
            if (sessionManager) {
                sessionManager.destroy();
            }
        };
    }, []);

    const handleLogout = (message) => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        if (sessionManager) {
            sessionManager.destroy();
        }
        navigate('/login', { state: { message } });
    };

    const handleStayLoggedIn = async () => {
        setWarning(null);
        
        if (warning?.type === 'idle_timeout') {
            // Reset idle timer
            if (sessionManager) {
                sessionManager.extendSession();
            }
        } else if (warning?.type === 'token_expiry') {
            // Try to refresh token
            const refreshed = await sessionManager.refreshToken();
            if (!refreshed) {
                handleLogout('Failed to refresh session. Please login again.');
            }
        }
    };

    const handleLogoutFromWarning = () => {
        setWarning(null);
        handleLogout('You have been logged out.');
    };

    return (
        <div>
            {/* Your app content */}
            
            {/* Session Warning Modal */}
            {warning && (
                <SessionWarningModal
                    isOpen={!!warning}
                    message={warning.message}
                    timeRemaining={warning.timeRemaining}
                    type={warning.type}
                    onStayLoggedIn={handleStayLoggedIn}
                    onLogout={handleLogoutFromWarning}
                />
            )}
        </div>
    );
}

export default App;
```

### 4. Vue.js Alternative Implementation

```javascript
// composables/useSessionManager.js (Vue 3)

import { ref, onMounted, onUnmounted } from 'vue';
import SessionManager from '@/utils/sessionManager';

export function useSessionManager() {
    const sessionManager = ref(null);
    const warning = ref(null);

    const handleLogout = (message) => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        if (sessionManager.value) {
            sessionManager.value.destroy();
        }
        // Navigate to login
        router.push({ 
            path: '/login', 
            query: { message } 
        });
    };

    const initSessionManager = () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            const manager = new SessionManager({
                idleTimeout: 45 * 60 * 1000,
                tokenExpiry: 24 * 60 * 60 * 1000,
                warningTime: 2.5 * 60 * 1000,
                onWarning: (warningData) => {
                    warning.value = warningData;
                },
                onTimeout: () => {
                    handleLogout('You have been logged out due to inactivity.');
                },
                onTokenExpiry: () => {
                    handleLogout('Your session has expired. Please login again.');
                }
            });

            manager.init(payload.iat);
            sessionManager.value = manager;
        } catch (error) {
            console.error('Failed to initialize session manager:', error);
        }
    };

    const handleStayLoggedIn = async () => {
        warning.value = null;
        
        if (warning.value?.type === 'idle_timeout') {
            sessionManager.value?.extendSession();
        } else if (warning.value?.type === 'token_expiry') {
            const refreshed = await sessionManager.value?.refreshToken();
            if (!refreshed) {
                handleLogout('Failed to refresh session. Please login again.');
            }
        }
    };

    onMounted(() => {
        initSessionManager();
    });

    onUnmounted(() => {
        if (sessionManager.value) {
            sessionManager.value.destroy();
        }
    });

    return {
        warning,
        handleStayLoggedIn,
        handleLogout
    };
}
```

### 5. Configuration Options

You can configure the timeouts when initializing SessionManager:

```javascript
const manager = new SessionManager({
    idleTimeout: 30 * 60 * 1000,      // 30 minutes (minimum)
    // OR
    idleTimeout: 60 * 60 * 1000,      // 60 minutes (maximum)
    
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours (fixed)
    
    warningTime: 2 * 60 * 1000,       // 2 minutes before timeout
    // OR
    warningTime: 3 * 60 * 1000,      // 3 minutes before timeout
});
```

### 6. API Integration

Make sure your refresh token endpoint is working:

```javascript
// POST /api/auth/refresh
// Headers: Authorization: Bearer <refreshToken>
// Response: { success: true, data: { token, refreshToken } }
```

## Testing

1. **Test Idle Timeout:**
   - Login to the app
   - Wait without any activity
   - Warning should appear 2-3 minutes before timeout
   - After timeout, user should be logged out

2. **Test Token Expiry:**
   - Login to the app
   - Wait 24 hours (or modify token expiry for testing)
   - Warning should appear before expiry
   - User should be logged out after expiry

3. **Test Stay Logged In:**
   - Trigger idle warning
   - Click "Stay Logged In"
   - Timer should reset
   - User should remain logged in

## Notes

- The idle timeout resets on any user activity (mouse, keyboard, touch, scroll)
- Token expiry is absolute (24 hours from login) and cannot be extended beyond that
- Warning appears 2-3 minutes before either timeout
- User can choose to stay logged in (resets idle timer) or logout
- For token expiry warning, clicking "Refresh Session" will attempt to get a new token
