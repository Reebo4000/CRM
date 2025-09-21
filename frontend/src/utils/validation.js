// Validation utility functions for the frontend

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  // Check if it's a valid length (10-15 digits)
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
    checks: {
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    },
    score: [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    ].filter(Boolean).length
  };
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateMinLength = (value, minLength, fieldName) => {
  if (value && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
};

export const validateMaxLength = (value, maxLength, fieldName) => {
  if (value && value.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`;
  }
  return null;
};

export const validateNumber = (value, fieldName, options = {}) => {
  const { min, max, integer = false } = options;
  
  if (value === '' || value === null || value === undefined) {
    return null; // Let required validation handle empty values
  }
  
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    return `${fieldName} must be a valid number`;
  }
  
  if (integer && !Number.isInteger(numValue)) {
    return `${fieldName} must be a whole number`;
  }
  
  if (min !== undefined && numValue < min) {
    return `${fieldName} must be at least ${min}`;
  }
  
  if (max !== undefined && numValue > max) {
    return `${fieldName} must not exceed ${max}`;
  }
  
  return null;
};

export const validateDate = (value, fieldName, options = {}) => {
  const { minDate, maxDate, futureAllowed = true, pastAllowed = true } = options;
  
  if (!value) {
    return null; // Let required validation handle empty values
  }
  
  const date = new Date(value);
  
  if (isNaN(date.getTime())) {
    return `${fieldName} must be a valid date`;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!futureAllowed && date > today) {
    return `${fieldName} cannot be in the future`;
  }
  
  if (!pastAllowed && date < today) {
    return `${fieldName} cannot be in the past`;
  }
  
  if (minDate && date < new Date(minDate)) {
    return `${fieldName} must be after ${new Date(minDate).toLocaleDateString()}`;
  }
  
  if (maxDate && date > new Date(maxDate)) {
    return `${fieldName} must be before ${new Date(maxDate).toLocaleDateString()}`;
  }
  
  return null;
};

export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = data[field];
    
    // Check each rule for the field
    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Common validation rule builders
export const required = (fieldName) => (value) => validateRequired(value, fieldName);
export const minLength = (min, fieldName) => (value) => validateMinLength(value, min, fieldName);
export const maxLength = (max, fieldName) => (value) => validateMaxLength(value, max, fieldName);
export const email = (fieldName = 'Email') => (value) => {
  if (!value) return null;
  return validateEmail(value) ? null : `${fieldName} must be a valid email address`;
};
export const phone = (fieldName = 'Phone') => (value) => {
  if (!value) return null;
  return validatePhone(value) ? null : `${fieldName} must be a valid phone number`;
};
export const number = (fieldName, options) => (value) => validateNumber(value, fieldName, options);
export const date = (fieldName, options) => (value) => validateDate(value, fieldName, options);

// Specific validation rules for CRM entities
export const customerValidationRules = {
  firstName: [
    required('First name'),
    minLength(2, 'First name'),
    maxLength(50, 'First name')
  ],
  lastName: [
    required('Last name'),
    minLength(2, 'Last name'),
    maxLength(50, 'Last name')
  ],
  email: [
    email('Email')
  ],
  phone: [
    required('Phone number'),
    phone('Phone number')
  ],
  address: [
    maxLength(500, 'Address')
  ],
  city: [
    maxLength(50, 'City')
  ],
  postalCode: [
    maxLength(10, 'Postal code')
  ],
  dateOfBirth: [
    date('Date of birth', { futureAllowed: false })
  ]
};

export const productValidationRules = {
  name: [
    required('Product name'),
    minLength(2, 'Product name'),
    maxLength(100, 'Product name')
  ],
  description: [
    maxLength(1000, 'Description')
  ],
  price: [
    required('Price'),
    number('Price', { min: 0.01, max: 99999.99 })
  ],
  stockQuantity: [
    required('Stock quantity'),
    number('Stock quantity', { min: 0, integer: true })
  ],
  category: [
    required('Category'),
    minLength(2, 'Category'),
    maxLength(50, 'Category')
  ],
  brand: [
    maxLength(50, 'Brand')
  ],
  color: [
    maxLength(30, 'Color')
  ],
  material: [
    maxLength(50, 'Material')
  ]
};

export const orderValidationRules = {
  customerId: [
    required('Customer'),
    number('Customer', { min: 1, integer: true })
  ],
  notes: [
    maxLength(500, 'Notes')
  ]
};

export const userValidationRules = {
  firstName: [
    required('First name'),
    minLength(2, 'First name'),
    maxLength(50, 'First name')
  ],
  lastName: [
    required('Last name'),
    minLength(2, 'Last name'),
    maxLength(50, 'Last name')
  ],
  email: [
    required('Email'),
    email('Email')
  ],
  password: [
    required('Password'),
    (value) => {
      if (!value) return null;
      const validation = validatePassword(value);
      return validation.isValid ? null : 'Password must be at least 8 characters with uppercase, lowercase, and numbers';
    }
  ],
  role: [
    required('Role'),
    (value) => {
      if (!value) return null;
      return ['admin', 'staff'].includes(value) ? null : 'Role must be either admin or staff';
    }
  ]
};
