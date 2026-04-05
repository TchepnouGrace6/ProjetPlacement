import React, { useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import '../styles/toast.css';

// Store global pour les toasts
let toastCount = 0;
const listeners = [];

export const showToast = (message, type = 'info', duration = 3000) => {
  const id = ++toastCount;
  const toast = { id, message, type };

  // Notifier tous les listeners (composants Toast actifs)
  listeners.forEach(listener => listener(toast));

  // Auto-remove après duration
  if (duration > 0) {
    setTimeout(() => {
      listeners.forEach(listener => listener({ id, remove: true }));
    }, duration);
  }

  return id;
};

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  React.useEffect(() => {
    const handleNewToast = (toast) => {
      if (toast.remove) {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      } else {
        setToasts(prev => [...prev, toast]);
      }
    };

    listeners.push(handleNewToast);

    return () => {
      const index = listeners.indexOf(handleNewToast);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <div className="toast-icon">
            {toast.type === 'success' && <CheckCircle size={20} />}
            {toast.type === 'error' && <XCircle size={20} />}
            {toast.type === 'warning' && <AlertCircle size={20} />}
            {toast.type === 'info' && <Info size={20} />}
          </div>
          <div className="toast-message">{toast.message}</div>
          <button
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
