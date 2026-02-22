import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastContext = React.createContext();

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = ({ title, description, variant = 'info', duration = 5000 }) => {
    const id = Date.now() + Math.random();
    const toast = { id, title, description, variant, duration };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto remove toast
    setTimeout(() => {
      removeToast(id);
    }, duration);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = {
    success: (title, description) => addToast({ title, description, variant: 'success' }),
    error: (title, description) => addToast({ title, description, variant: 'error' }),
    warning: (title, description) => addToast({ title, description, variant: 'warning' }),
    info: (title, description) => addToast({ title, description, variant: 'info' })
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const { id, title, description, variant } = toast;
  
  const variantStyles = {
    success: 'bg-success text-success-foreground border-success',
    error: 'bg-error text-error-foreground border-error',
    warning: 'bg-warning text-warning-foreground border-warning',
    info: 'bg-primary text-primary-foreground border-primary'
  };
  
  const variantIcons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <XCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm",
        variantStyles[variant]
      )}
    >
      <div className="flex-shrink-0 pt-0.5">
        {variantIcons[variant]}
      </div>
      
      <div className="flex-1">
        {title && (
          <h4 className="font-medium leading-none">
            {title}
          </h4>
        )}
        {description && (
          <p className="mt-1 text-sm opacity-90">
            {description}
          </p>
        )}
      </div>
      
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export default ToastProvider;