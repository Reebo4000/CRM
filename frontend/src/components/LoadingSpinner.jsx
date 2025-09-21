import React from 'react';
import { cn } from '../utils/cn';

const LoadingSpinner = ({
  size = 'medium',
  className = '',
  variant = 'default',
  ...props
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const variantClasses = {
    default: 'spinner',
    primary: 'border-muted-foreground/20 border-t-primary',
    secondary: 'border-muted-foreground/20 border-t-secondary',
    success: 'border-muted-foreground/20 border-t-success',
    warning: 'border-muted-foreground/20 border-t-warning',
    destructive: 'border-muted-foreground/20 border-t-destructive',
  };

  return (
    <div className={cn('flex items-center justify-center', className)} {...props}>
      <div
        className={cn(
          'rounded-full border-2 animate-spin',
          sizeClasses[size],
          variant === 'default' ? variantClasses.default : variantClasses[variant]
        )}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
