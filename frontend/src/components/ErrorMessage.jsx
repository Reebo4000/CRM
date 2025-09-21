import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

const ErrorMessage = ({ 
  message = 'An error occurred', 
  onRetry = null,
  className = '',
  showIcon = true,
  variant = 'default' // 'default', 'minimal', 'card'
}) => {
  const baseClasses = 'flex flex-col items-center justify-center text-center';
  
  const variantClasses = {
    default: 'p-8 bg-red-50 border border-red-200 rounded-lg',
    minimal: 'p-4',
    card: 'p-6 bg-white border border-gray-200 rounded-lg shadow-sm'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {showIcon && (
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Something went wrong
      </h3>
      
      <p className="text-gray-600 mb-4 max-w-md">
        {message}
      </p>
      
      {onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
};

export default ErrorMessage;
