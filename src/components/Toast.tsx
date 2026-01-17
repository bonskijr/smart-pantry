import React, { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    type?: 'success' | 'error' | 'info';
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, type = 'success' }) => {
    const [isShowing, setIsShowing] = useState(false);

    useEffect(() => {
        if (isVisible) {
            // Small delay to allow mounting in hidden state first for transition
            const showTimer = setTimeout(() => setIsShowing(true), 50);
            
            const timer = setTimeout(() => {
                setIsShowing(false);
                setTimeout(onClose, 300); // Wait for fade out animation
            }, 3000);
            return () => {
                clearTimeout(showTimer);
                clearTimeout(timer);
            };
        } else {
            setIsShowing(false);
        }
    }, [isVisible, onClose]);

    if (!isVisible && !isShowing) return null;

    const colors = {
        success: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
        error: 'text-red-400 border-red-500/20 bg-red-500/10',
        info: 'text-primary border-primary/20 bg-primary/10',
    }[type];

    return (
        <div
            className={`fixed top-8 right-8 glass-panel border ${colors} px-6 py-4 rounded-2xl shadow-2xl z-[100] flex items-center gap-4 transition-all duration-500 ${isShowing ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
                } max-w-sm ring-1 ring-white/10`}
        >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${type === 'success' ? 'bg-emerald-500/20' :
                    type === 'error' ? 'bg-red-500/20' : 'bg-primary/20'
                }`}>
                {type === 'success' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                {type === 'error' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
                {type === 'info' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>}
            </div>
            <span className="font-semibold text-sm tracking-tight">{message}</span>
        </div>
    );
};

export default Toast;