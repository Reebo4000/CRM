import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext({});

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: 'border-success/20 bg-success/10 text-success-foreground',
  error: 'border-destructive/20 bg-destructive/10 text-destructive-foreground',
  warning: 'border-warning/20 bg-warning/10 text-warning-foreground',
  info: 'border-info/20 bg-info/10 text-info-foreground',
  default: 'border-border bg-background text-foreground',
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { id, ...toast };
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const removeAllToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, removeAllToasts }}>
      {children}
      <ToastViewport toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast } = context;

  const toast = (props) => addToast(props);
  
  toast.success = (title, description) => addToast({ type: 'success', title, description });
  toast.error = (title, description) => addToast({ type: 'error', title, description });
  toast.warning = (title, description) => addToast({ type: 'warning', title, description });
  toast.info = (title, description) => addToast({ type: 'info', title, description });

  return { toast, ...context };
};

const ToastViewport = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={() => onRemove(toast.id)} />
      ))}
    </div>,
    document.body
  );
};

const Toast = React.forwardRef(({ 
  className,
  type = 'default',
  title,
  description,
  action,
  onRemove,
  ...props 
}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = toastIcons[type];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(onRemove, 150); // Wait for animation
  };

  return (
    <div
      ref={ref}
      className={cn(
        'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 pr-8 shadow-large transition-all',
        toastStyles[type],
        isVisible ? 'animate-in slide-in-from-top-full' : 'animate-out slide-out-to-right-full',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {Icon && <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />}
        <div className="grid gap-1">
          {title && (
            <div className="text-sm font-semibold">{title}</div>
          )}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
      </div>
      
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}

      <button
        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
        onClick={handleRemove}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
});

Toast.displayName = 'Toast';

export { Toast };
