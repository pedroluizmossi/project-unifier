import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastMessage {
    id: string;
    text: string;
    type: 'success' | 'info' | 'error';
}

interface ToastContainerProps {
    toasts: ToastMessage[];
    onDismiss: (id: string) => void;
}

const toastStyles = {
    success: 'bg-emerald-600 border-emerald-500 text-white',
    info: 'bg-indigo-600 border-indigo-500 text-white',
    error: 'bg-red-600 border-red-500 text-white',
};

const toastIcons = {
    success: '✓',
    info: 'ℹ',
    error: '✕',
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 3000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border shadow-lg text-sm font-medium ${toastStyles[toast.type]}`}
        >
            <span className="text-base">{toastIcons[toast.type]}</span>
            <span>{toast.text}</span>
        </motion.div>
    );
};

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem toast={toast} onDismiss={onDismiss} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;
