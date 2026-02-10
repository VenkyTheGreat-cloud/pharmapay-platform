import { useEffect, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

export default function IdleTimeoutWarning({ 
    isOpen, 
    timeRemaining, 
    onExtend, 
    onLogout 
}) {
    const [countdown, setCountdown] = useState(null);

    useEffect(() => {
        if (!isOpen || timeRemaining === null) {
            setCountdown(null);
            return;
        }

        // Calculate minutes and seconds
        const minutes = Math.floor(timeRemaining);
        const seconds = Math.floor((timeRemaining - minutes) * 60);
        setCountdown({ minutes, seconds });

        // Update countdown every second
        const interval = setInterval(() => {
            if (timeRemaining > 0) {
                const newTimeRemaining = timeRemaining - (1 / 60); // Subtract 1 second
                const newMinutes = Math.floor(newTimeRemaining);
                const newSeconds = Math.floor((newTimeRemaining - newMinutes) * 60);
                setCountdown({ minutes: newMinutes, seconds: newSeconds });
            } else {
                setCountdown({ minutes: 0, seconds: 0 });
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, timeRemaining]);

    if (!isOpen) return null;

    const formatTime = () => {
        if (!countdown) return '2:00';
        return `${countdown.minutes}:${String(countdown.seconds).padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border-2 border-yellow-400">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-yellow-100 p-2 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Session Timeout Warning</h3>
                        <p className="text-xs text-gray-600">You've been inactive for a while</p>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-700">Time remaining:</span>
                    </div>
                    <div className="text-center">
                        <span className="text-3xl font-bold text-yellow-600">{formatTime()}</span>
                    </div>
                    <p className="text-xs text-center text-gray-600 mt-2">
                        Your session will expire due to inactivity. Click "Stay Logged In" to continue.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onExtend}
                        className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2.5 text-sm font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all shadow-md"
                    >
                        Stay Logged In
                    </button>
                    <button
                        onClick={onLogout}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-300 transition-all"
                    >
                        Logout Now
                    </button>
                </div>
            </div>
        </div>
    );
}
