import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({ 
  className, 
  type = 'text',
  error,
  leftIcon,
  rightIcon,
  ...props 
}, ref) => {
  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          {leftIcon}
        </div>
      )}
      <input
        type={type}
        className={cn(
          'form-input',
          error && 'form-input-error',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          className
        )}
        ref={ref}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          {rightIcon}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('form-label', className)}
    {...props}
  />
));

Label.displayName = 'Label';

export const Textarea = React.forwardRef(({ className, error, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'form-textarea',
        error && 'border-destructive focus-visible:ring-destructive',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(({ className, children, error, ...props }, ref) => {
  return (
    <select
      className={cn(
        'form-select',
        error && 'border-destructive focus:ring-destructive',
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';

export const FormField = ({ label, error, children, required, className, ...props }) => {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {label && (
        <Label className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive [dir='rtl']_&:after:mr-0.5 [dir='rtl']_&:after:ml-0" : ''}>
          {label}
        </Label>
      )}
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export const FormGroup = ({ children, className, ...props }) => {
  return (
    <div className={cn('space-y-6', className)} {...props}>
      {children}
    </div>
  );
};
