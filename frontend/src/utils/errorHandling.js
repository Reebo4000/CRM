// Error handling utilities for the frontend

export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network connection failed') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 'CONFLICT_ERROR', 409);
    this.name = 'ConflictError';
  }
}

export class ServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 'SERVER_ERROR', 500);
    this.name = 'ServerError';
  }
}

// Error parsing and handling functions
export const parseApiError = (error) => {
  // Handle network errors
  if (!error.response) {
    return new NetworkError('Unable to connect to server. Please check your internet connection.');
  }

  const { status, data } = error.response;
  const message = data?.message || data?.error || 'An unexpected error occurred';

  switch (status) {
    case 400:
      if (data?.errors) {
        // Handle validation errors with field-specific messages
        return new ValidationError(message, data.errors);
      }
      return new ValidationError(message);
    
    case 401:
      return new AuthenticationError(message);
    
    case 403:
      return new AuthorizationError(message);
    
    case 404:
      return new NotFoundError(message);
    
    case 409:
      return new ConflictError(message);
    
    case 422:
      return new ValidationError(message);
    
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message);
    
    default:
      return new AppError(message, 'UNKNOWN_ERROR', status);
  }
};

export const getErrorMessage = (error) => {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export const getErrorType = (error) => {
  if (error instanceof AppError) {
    return error.name;
  }
  
  if (error?.response?.status) {
    const status = error.response.status;
    if (status >= 400 && status < 500) {
      return 'ClientError';
    }
    if (status >= 500) {
      return 'ServerError';
    }
  }
  
  return 'UnknownError';
};

export const isRetryableError = (error) => {
  if (error instanceof NetworkError) {
    return true;
  }
  
  if (error instanceof ServerError) {
    return true;
  }
  
  if (error?.response?.status >= 500) {
    return true;
  }
  
  return false;
};

export const getErrorSeverity = (error) => {
  if (error instanceof ValidationError) {
    return 'warning';
  }
  
  if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
    return 'error';
  }
  
  if (error instanceof NotFoundError) {
    return 'info';
  }
  
  if (error instanceof ServerError || error instanceof NetworkError) {
    return 'error';
  }
  
  return 'error';
};

export const formatErrorForUser = (error) => {
  const parsedError = parseApiError(error);
  
  const userFriendlyMessages = {
    NetworkError: 'Connection problem. Please check your internet and try again.',
    AuthenticationError: 'Please log in to continue.',
    AuthorizationError: 'You don\'t have permission to perform this action.',
    NotFoundError: 'The requested item could not be found.',
    ValidationError: parsedError.message,
    ConflictError: 'This action conflicts with existing data.',
    ServerError: 'Server is temporarily unavailable. Please try again later.',
  };
  
  return {
    message: userFriendlyMessages[parsedError.name] || parsedError.message,
    type: getErrorType(parsedError),
    severity: getErrorSeverity(parsedError),
    retryable: isRetryableError(parsedError),
    code: parsedError.code
  };
};

// Error logging utility
export const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorInfo);
  }

  // In production, you might want to send to an error tracking service
  // Example: Sentry, LogRocket, etc.

  // Generate a simple error ID string instead of returning the full object
  const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return errorId;
};

// Retry utility for failed requests
export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

// Form error handling utilities
export const extractFieldErrors = (error) => {
  if (error instanceof ValidationError && error.field) {
    return error.field;
  }
  
  if (error?.response?.data?.errors) {
    return error.response.data.errors;
  }
  
  return {};
};

export const hasFieldError = (errors, fieldName) => {
  return errors && errors[fieldName];
};

export const getFieldError = (errors, fieldName) => {
  if (!errors || !errors[fieldName]) {
    return null;
  }
  
  const error = errors[fieldName];
  return Array.isArray(error) ? error[0] : error;
};

// Global error boundary helper - returns a simple error message
export const createErrorBoundaryFallback = (componentName) => {
  return ({ error, resetErrorBoundary }) => {
    // Return a simple object that can be used by React error boundaries
    return {
      componentName,
      error,
      resetErrorBoundary,
      message: `An error occurred in the ${componentName} component. This has been logged and will be investigated.`
    };
  };
};
