import React from 'react';

const buttonVariants = {
  default: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  destructive: 'btn-destructive',
  success: 'btn-success',
  warning: 'btn-warning',
  link: 'text-primary underline-offset-4 hover:underline',
};

const buttonSizes = {
  default: 'btn-md',
  sm: 'btn-sm',
  lg: 'btn-lg',
  xl: 'btn-xl',
  icon: 'h-10 w-10 p-0',
};

const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const Button = React.forwardRef(({
  children,
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  const baseClasses = 'btn';
  const variantClasses = buttonVariants[variant] || buttonVariants.default;
  const sizeClasses = buttonSizes[size] || buttonSizes.default;

  return (
    <button
      ref={ref}
      className={cn(
        baseClasses,
        variantClasses,
        sizeClasses,
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="spinner h-4 w-4 mr-2" />
      )}
      {leftIcon && !loading && (
        <span className="mr-2">{leftIcon}</span>
      )}
      {children}
      {rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
