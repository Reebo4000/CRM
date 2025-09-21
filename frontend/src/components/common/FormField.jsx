import React, { useState, useEffect } from 'react';
import { AlertCircle, Eye, EyeOff, Check } from 'lucide-react';

// Enhanced form field component with validation
const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  placeholder,
  helperText,
  className = '',
  inputClassName = '',
  labelClassName = '',
  errorClassName = '',
  children,
  validation,
  showValidation = false,
  autoComplete,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Handle validation
  useEffect(() => {
    if (validation && value !== undefined && value !== '') {
      const validationResult = validation(value);
      if (validationResult) {
        setLocalError(validationResult);
        setIsValid(false);
      } else {
        setLocalError('');
        setIsValid(true);
      }
    } else {
      setLocalError('');
      setIsValid(false);
    }
  }, [value, validation]);

  const handleBlur = (e) => {
    setTouched(true);
    if (onBlur) {
      onBlur(e);
    }
  };

  const displayError = error || (touched && localError);
  const showSuccess = showValidation && isValid && touched && !displayError;

  const getInputClasses = () => {
    const baseClasses = `
      block w-full px-3 py-2 border rounded-md shadow-sm 
      focus:outline-none focus:ring-1 transition-colors duration-200
      disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    `;

    let stateClasses = '';
    if (displayError) {
      stateClasses = 'border-red-300 focus:border-red-500 focus:ring-red-500';
    } else if (showSuccess) {
      stateClasses = 'border-green-300 focus:border-green-500 focus:ring-green-500';
    } else {
      stateClasses = 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
    }

    return `${baseClasses} ${stateClasses} ${inputClassName}`.trim();
  };

  const getLabelClasses = () => {
    const baseClasses = 'block text-sm font-medium mb-1';
    const colorClasses = displayError ? 'text-red-700' : 'text-gray-700';
    return `${baseClasses} ${colorClasses} ${labelClassName}`.trim();
  };

  const renderInput = () => {
    const inputProps = {
      id: name,
      name,
      value: value || '',
      onChange,
      onBlur: handleBlur,
      disabled,
      placeholder,
      required,
      autoComplete,
      className: getInputClasses(),
      ...props
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...inputProps}
            rows={props.rows || 3}
          />
        );

      case 'select':
        return (
          <select {...inputProps}>
            {children}
          </select>
        );

      case 'password':
        return (
          <div className="relative">
            <input
              {...inputProps}
              type={showPassword ? 'text' : 'password'}
              className={`${inputProps.className} pr-10`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              {...inputProps}
              type="checkbox"
              checked={value || false}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            {label && (
              <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {children}
          </div>
        );

      default:
        return <input {...inputProps} type={type} />;
    }
  };

  const renderValidationIcon = () => {
    if (!showValidation) return null;

    if (displayError) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }

    if (showSuccess) {
      return <Check className="h-4 w-4 text-green-500" />;
    }

    return null;
  };

  // For checkbox, render differently
  if (type === 'checkbox') {
    return (
      <div className={`${className}`}>
        {renderInput()}
        {displayError && (
          <p className={`mt-1 text-sm text-red-600 ${errorClassName}`}>
            {displayError}
          </p>
        )}
        {helperText && !displayError && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {label && type !== 'checkbox' && (
        <label htmlFor={name} className={getLabelClasses()}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {renderInput()}
        
        {showValidation && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {renderValidationIcon()}
          </div>
        )}
      </div>

      {displayError && (
        <div className="flex items-center mt-1">
          <AlertCircle className="h-4 w-4 text-red-500 mr-1 flex-shrink-0" />
          <p className={`text-sm text-red-600 ${errorClassName}`}>
            {displayError}
          </p>
        </div>
      )}

      {helperText && !displayError && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

// Radio option component
export const RadioOption = ({ value, label, name, checked, onChange, disabled }) => (
  <div className="flex items-center">
    <input
      id={`${name}-${value}`}
      name={name}
      type="radio"
      value={value}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
    />
    <label htmlFor={`${name}-${value}`} className="ml-2 block text-sm text-gray-900">
      {label}
    </label>
  </div>
);

// Form group component for better organization
export const FormGroup = ({ title, description, children, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {title && (
      <div className="border-b border-gray-200 pb-2">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
    )}
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

// Form actions component
export const FormActions = ({ 
  children, 
  className = '',
  align = 'right' // 'left', 'center', 'right', 'between'
}) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div className={`flex ${alignmentClasses[align]} space-x-3 pt-6 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

export default FormField;
