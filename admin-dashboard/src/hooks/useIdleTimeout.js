import { useState, useEffect, useRef, useCallback } from 'react';

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

    const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;
    const warningTimeoutMs = (idleTimeoutMinutes - warningMinutes) * 60 * 1000;

    const resetTimer = useCallback(() => {
        if (!enabled) return;

        lastActivityRef.current = Date.now();
        setIsIdle(false);
        setIsWarning(false);
        setTimeRemaining(null);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);

        warningTimeoutRef.current = setTimeout(() => {
            setIsWarning(true);
            const remaining = idleTimeoutMinutes - warningMinutes;
            setTimeRemaining(remaining);

            let countdown = remaining * 60;
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

            if (onWarning) onWarning();
        }, warningTimeoutMs);

        timeoutRef.current = setTimeout(() => {
            setIsIdle(true);
            setIsWarning(false);
            setTimeRemaining(null);
            if (onIdle) onIdle();
        }, idleTimeoutMs);
    }, [enabled, idleTimeoutMinutes, warningMinutes, idleTimeoutMs, warningTimeoutMs, onIdle, onWarning]);

    const extendSession = useCallback(() => {
        resetTimer();
    }, [resetTimer]);

    useEffect(() => {
        if (!enabled) return;

        const activityEvents = [
            'mousedown', 'mousemove', 'keypress', 'scroll',
            'touchstart', 'click', 'keydown',
        ];

        const handleActivity = () => {
            if (!isIdle) resetTimer();
        };

        activityEvents.forEach((event) => {
            document.addEventListener(event, handleActivity, true);
        });

        resetTimer();

        return () => {
            activityEvents.forEach((event) => {
                document.removeEventListener(event, handleActivity, true);
            });
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [enabled, isIdle, resetTimer]);

    return { isIdle, isWarning, timeRemaining, extendSession, resetTimer };
};
