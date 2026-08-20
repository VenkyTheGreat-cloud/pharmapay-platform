import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_TYPES = {
    success: {
        icon: CheckCircle,
        bg: 'bg-green-50 border-green-400',
        iconColor: 'text-green-500',
        textColor: 'text-green-800',
    },
    error: {
        icon: XCircle,
        bg: 'bg-red-50 border-red-400',
        iconColor: 'text-red-500',
        textColor: 'text-red-800',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-amber-50 border-amber-400',
        iconColor: 'text-amber-500',
        textColor: 'text-amber-800',
    },
    info: {
        icon: Info,
        bg: 'bg-blue-50 border-blue-400',
        iconColor: 'text-blue-500',
        textColor: 'text-blue-800',
    },
};

function ToastItem({ toast, onDismiss }) {
    const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
    const Icon = config.icon;

    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, 3000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div
            className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm w-full pointer-events-auto ${config.bg}`}
            role="alert"
        >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
            <p className={`text-sm flex-1 ${config.textColor}`}>{toast.message}</p>
            <button
                onClick={() => onDismiss(toast.id)}
                className={`flex-shrink-0 ${config.textColor} hover:opacity-70`}
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        warning: (msg) => addToast(msg, 'warning'),
        info: (msg) => addToast(msg, 'info'),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
