import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to handle idle timeout
 * @param {number} idleTimeoutMinutes - Minutes of inactivity before logout (default: 30)
 * @param {number} warningMinutes - Minutes before timeout to show warning (default: 2)
 * @param {function} onIdle - Callback when user becomes idle (logout)
 * @param {function} onWarning - Callback when warning should be shown
 * @param {boolean} enabled - Whether idle timeout is enabled
 */
export const useIdleTimeout = ({
    idleTimeoutMinutes = 30,
    warningMinutes = 2,
    onIdle,
    onWarning,
    enabled = true,
}) => {
    const [isIdle, setIsIdle] = useState(false);
    const [isWarning, setIsWarning] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(null);
    
    const timeoutRef = useRef(null);
    const warningTimeoutRef = useRef(null);
    const intervalRef = useRef(null);
    const lastActivityRef = useRef(Date.now());

    // Calculate timeouts in milliseconds
    const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;
    const warningTimeoutMs = (idleTimeoutMinutes - warningMinutes) * 60 * 1000;

    // Reset the idle timer
    const resetTimer = useCallback(() => {
        if (!enabled) return;

        const now = Date.now();
        lastActivityRef.current = now;
        setIsIdle(false);
        setIsWarning(false);
        setTimeRemaining(null);

        // Clear existing timeouts
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current);
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Set warning timeout (fires before idle timeout)
        warningTimeoutRef.current = setTimeout(() => {
            setIsWarning(true);
            const remaining = idleTimeoutMinutes - warningMinutes;
            setTimeRemaining(remaining);
            
            // Start countdown interval
            let countdown = remaining * 60; // seconds
            intervalRef.current = setInterval(() => {
                countdown -= 1;
                if (countdown <= 0) {
                    clearInterval(intervalRef.current);
                    setTimeRemaining(0);
                } else {
                    const minutes = Math.floor(countdown / 60);
                    const seconds = countdown % 60;
                    setTimeRemaining(minutes + seconds / 60);
                }
            }, 1000);

            if (onWarning) {
                onWarning();
            }
        }, warningTimeoutMs);

        // Set idle timeout (fires when user should be logged out)
        timeoutRef.current = setTimeout(() => {
            setIsIdle(true);
            setIsWarning(false);
            setTimeRemaining(null);
            if (onIdle) {
                onIdle();
            }
        }, idleTimeoutMs);
    }, [enabled, idleTimeoutMinutes, warningMinutes, idleTimeoutMs, warningTimeoutMs, onIdle, onWarning]);

    // Extend session (called when user clicks "Stay Logged In")
    const extendSession = useCallback(() => {
        resetTimer();
    }, [resetTimer]);

    // Track user activity
    useEffect(() => {
        if (!enabled) return;

        const activityEvents = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click',
            'keydown',
        ];

        const handleActivity = () => {
            // Only reset if user is not already idle
            if (!isIdle) {
                resetTimer();
            }
        };

        // Add event listeners
        activityEvents.forEach((event) => {
            document.addEventListener(event, handleActivity, true);
        });

        // Initialize timer
        resetTimer();

        // Cleanup
        return () => {
            activityEvents.forEach((event) => {
                document.removeEventListener(event, handleActivity, true);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (warningTimeoutRef.current) {
                clearTimeout(warningTimeoutRef.current);
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, isIdle, resetTimer]);

    return {
        isIdle,
        isWarning,
        timeRemaining,
        extendSession,
        resetTimer,
    };
};
