import React from 'react';
import { cn } from '../../utils/cn';

const badgeVariants = {
  default: 'badge-default',
  secondary: 'badge-secondary',
  destructive: 'badge-destructive',
  outline: 'badge-outline',
  success: 'badge-success',
  warning: 'badge-warning',
};

export const Badge = React.forwardRef(({ 
  className, 
  variant = 'default',
  children,
  ...props 
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'badge',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Badge.displayName = 'Badge';

export default Badge;
