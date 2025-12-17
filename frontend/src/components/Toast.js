import React, { useEffect } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';

const Toast = ({ message, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px', // Site that appears usually bottom-center or right. "In the site that appears" implies standardized toast.
            // User said "in the site that appears". Maybe they meant "in the side"? "in the site"?
            // Let's assume standard bottom-center or bottom-right.
            // Requested "Red".
            backgroundColor: '#ff6253', // Requested Red
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
            animation: 'slideInToast 0.3s ease',
            fontWeight: 500,
            fontSize: '0.95rem'
        }}>
            <FaExclamationCircle size={18} />
            <span>{message}</span>
            <style>{`
                @keyframes slideInToast {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Toast;
