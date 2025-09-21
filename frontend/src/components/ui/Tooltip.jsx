import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

const TooltipContext = createContext({});

export const TooltipProvider = ({ children, delayDuration = 700 }) => {
  return (
    <TooltipContext.Provider value={{ delayDuration }}>
      {children}
    </TooltipContext.Provider>
  );
};

export const Tooltip = ({ children, open, onOpenChange, delayDuration }) => {
  const [isOpen, setIsOpen] = useState(open || false);
  const context = useContext(TooltipContext);
  const delay = delayDuration ?? context.delayDuration ?? 700;

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <TooltipContext.Provider value={{ isOpen, onOpenChange: handleOpenChange, delayDuration: delay }}>
      <div className="relative inline-block">
        {children}
      </div>
    </TooltipContext.Provider>
  );
};

export const TooltipTrigger = React.forwardRef(({ 
  children, 
  asChild,
  className,
  ...props 
}, ref) => {
  const { onOpenChange, delayDuration } = useContext(TooltipContext);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      onOpenChange(true);
    }, delayDuration);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onOpenChange(false);
  };

  const handleFocus = () => {
    onOpenChange(true);
  };

  const handleBlur = () => {
    onOpenChange(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (asChild) {
    return React.cloneElement(children, {
      ref,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      ...props,
    });
  }

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </div>
  );
});

TooltipTrigger.displayName = 'TooltipTrigger';

export const TooltipContent = React.forwardRef(({ 
  className, 
  children,
  side = 'top',
  align = 'center',
  sideOffset = 4,
  ...props 
}, ref) => {
  const { isOpen } = useContext(TooltipContext);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const contentRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      const trigger = contentRef.current.parentElement;
      if (trigger) {
        const triggerRect = trigger.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        
        let top, left;

        // Calculate position based on side
        switch (side) {
          case 'top':
            top = triggerRect.top - contentRect.height - sideOffset;
            break;
          case 'bottom':
            top = triggerRect.bottom + sideOffset;
            break;
          case 'left':
            top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
            left = triggerRect.left - contentRect.width - sideOffset;
            break;
          case 'right':
            top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
            left = triggerRect.right + sideOffset;
            break;
          default:
            top = triggerRect.top - contentRect.height - sideOffset;
        }

        // Calculate left position for top/bottom sides
        if (side === 'top' || side === 'bottom') {
          switch (align) {
            case 'start':
              left = triggerRect.left;
              break;
            case 'end':
              left = triggerRect.right - contentRect.width;
              break;
            case 'center':
            default:
              left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
          }
        }

        // Ensure tooltip stays within viewport
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };

        if (left < 0) left = 8;
        if (left + contentRect.width > viewport.width) {
          left = viewport.width - contentRect.width - 8;
        }
        if (top < 0) top = 8;
        if (top + contentRect.height > viewport.height) {
          top = viewport.height - contentRect.height - 8;
        }

        setPosition({ top, left });
      }
    }
  }, [isOpen, side, align, sideOffset]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={contentRef}
      className={cn(
        'absolute z-50 overflow-hidden rounded-lg border border-border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-large',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
      }}
      {...props}
    >
      {children}
    </div>,
    document.body
  );
});

TooltipContent.displayName = 'TooltipContent';
