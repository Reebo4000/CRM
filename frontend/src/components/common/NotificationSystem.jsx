import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';

// Notification Context
const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      ...options
    });
  }, [addNotification]);

  const error = useCallback((message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      duration: 8000, // Errors stay longer
      ...options
    });
  }, [addNotification]);

  const warning = useCallback((message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      duration: 6000,
      ...options
    });
  }, [addNotification]);

  const info = useCallback((message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      ...options
    });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Notification Container
const NotificationContainer = () => {
  const { notifications } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map(notification => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

// Individual Notification Item
const NotificationItem = ({ notification }) => {
  const { removeNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  React.useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "relative flex items-start p-4 rounded-lg shadow-lg border transition-all duration-300 transform";
    
    const typeStyles = {
      success: "bg-green-50 border-green-200",
      error: "bg-red-50 border-red-200",
      warning: "bg-yellow-50 border-yellow-200",
      info: "bg-blue-50 border-blue-200"
    };

    const animationStyles = isLeaving 
      ? "translate-x-full opacity-0" 
      : isVisible 
        ? "translate-x-0 opacity-100" 
        : "translate-x-full opacity-0";

    return `${baseStyles} ${typeStyles[notification.type]} ${animationStyles}`;
  };

  return (
    <div className={getStyles()}>
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      
      <div className="ml-3 flex-1">
        {notification.title && (
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            {notification.title}
          </h4>
        )}
        <p className="text-sm text-gray-700">
          {notification.message}
        </p>
        
        {notification.action && (
          <div className="mt-2">
            <button
              onClick={notification.action.onClick}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {notification.action.label}
            </button>
          </div>
        )}
      </div>
      
      <div className="ml-4 flex-shrink-0">
        <button
          onClick={handleClose}
          className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Hook for handling API errors with notifications
export const useErrorHandler = () => {
  const { error } = useNotifications();

  const handleError = useCallback((err, context = {}) => {
    const errorMessage = err?.response?.data?.message || err?.message || 'An unexpected error occurred';
    
    error(errorMessage, {
      title: context.title || 'Error',
      action: context.retry ? {
        label: 'Retry',
        onClick: context.retry
      } : undefined
    });

    // Log error for debugging
    console.error('Error handled:', err, context);
  }, [error]);

  return { handleError };
};

// Hook for handling form validation errors
export const useFormErrorHandler = () => {
  const { error, warning } = useNotifications();

  const handleValidationErrors = useCallback((errors) => {
    if (typeof errors === 'object' && errors !== null) {
      // Handle field-specific errors
      const errorMessages = Object.entries(errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ');
      
      warning(`Please fix the following errors: ${errorMessages}`, {
        title: 'Validation Error',
        duration: 8000
      });
    } else {
      error(errors || 'Please check your input and try again', {
        title: 'Validation Error'
      });
    }
  }, [error, warning]);

  return { handleValidationErrors };
};

// Hook for success notifications
export const useSuccessHandler = () => {
  const { success } = useNotifications();

  const handleSuccess = useCallback((message, options = {}) => {
    success(message, {
      title: 'Success',
      ...options
    });
  }, [success]);

  return { handleSuccess };
};

export default NotificationProvider;
