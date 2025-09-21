import React, { createContext, useContext, useEffect, useState } from 'react';

// Accessibility Context
const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// Accessibility Provider Component
export const AccessibilityProvider = ({ children }) => {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
  });

  const [announcements, setAnnouncements] = useState([]);

  // Detect user preferences
  useEffect(() => {
    const detectPreferences = () => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      // Detect screen reader (basic detection)
      const screenReader = window.navigator.userAgent.includes('NVDA') || 
                          window.navigator.userAgent.includes('JAWS') ||
                          window.speechSynthesis?.getVoices().length > 0;

      setPreferences(prev => ({
        ...prev,
        reducedMotion,
        highContrast,
        screenReader,
      }));
    };

    detectPreferences();

    // Listen for preference changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    motionQuery.addEventListener('change', detectPreferences);
    contrastQuery.addEventListener('change', detectPreferences);

    return () => {
      motionQuery.removeEventListener('change', detectPreferences);
      contrastQuery.removeEventListener('change', detectPreferences);
    };
  }, []);

  // Announce to screen readers
  const announce = (message, priority = 'polite') => {
    const id = Date.now();
    const announcement = { id, message, priority };
    
    setAnnouncements(prev => [...prev, announcement]);
    
    // Remove announcement after it's been read
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 1000);
  };

  // Focus management
  const focusElement = (selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.focus();
      return true;
    }
    return false;
  };

  const trapFocus = (containerSelector) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };

  const value = {
    preferences,
    setPreferences,
    announce,
    focusElement,
    trapFocus,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* Live region for announcements */}
      <div className="sr-only">
        {announcements.map(announcement => (
          <div
            key={announcement.id}
            aria-live={announcement.priority}
            aria-atomic="true"
          >
            {announcement.message}
          </div>
        ))}
      </div>
    </AccessibilityContext.Provider>
  );
};

// Skip Link Component
export const SkipLink = ({ href = "#main-content", children = "Skip to main content" }) => {
  return (
    <a
      href={href}
      className="skip-link"
      onFocus={(e) => e.target.scrollIntoView()}
    >
      {children}
    </a>
  );
};

// Screen Reader Only Component
export const ScreenReaderOnly = ({ children, as: Component = 'span' }) => {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
};

// Focus Trap Component
export const FocusTrap = ({ children, active = true, className = '' }) => {
  const containerRef = React.useRef(null);
  const { trapFocus } = useAccessibility();

  useEffect(() => {
    if (active && containerRef.current) {
      const cleanup = trapFocus(`[data-focus-trap="${containerRef.current.dataset.focusTrap}"]`);
      return cleanup;
    }
  }, [active, trapFocus]);

  return (
    <div
      ref={containerRef}
      data-focus-trap={Math.random().toString(36).substr(2, 9)}
      className={className}
    >
      {children}
    </div>
  );
};

// Accessible Button Component
export const AccessibleButton = ({ 
  children, 
  onClick, 
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  variant = 'default',
  ...props 
}) => {
  const { announce } = useAccessibility();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
      
      // Announce action for screen readers if needed
      if (ariaLabel && !children) {
        announce(`${ariaLabel} activated`);
      }
    }
  };

  return (
    <button
      className={`focus-ring ${className}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      {...props}
    >
      {children}
    </button>
  );
};

// Accessible Form Field Component
export const AccessibleFormField = ({
  label,
  children,
  error,
  helperText,
  required = false,
  className = '',
}) => {
  const fieldId = React.useId();
  const errorId = error ? `${fieldId}-error` : undefined;
  const helperId = helperText ? `${fieldId}-helper` : undefined;

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {React.cloneElement(children, {
        id: fieldId,
        'aria-describedby': [errorId, helperId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? 'true' : undefined,
        'aria-required': required,
      })}
      
      {helperText && (
        <p id={helperId} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
