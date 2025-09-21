import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { Check, ChevronRight } from 'lucide-react';

const DropdownMenuContext = createContext({});

export const DropdownMenu = ({ children, open, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(open || false);

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
    <DropdownMenuContext.Provider value={{ isOpen, onOpenChange: handleOpenChange }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

export const DropdownMenuTrigger = React.forwardRef(({ 
  children, 
  asChild, 
  className,
  ...props 
}, ref) => {
  const { onOpenChange, isOpen } = useContext(DropdownMenuContext);

  if (asChild) {
    return React.cloneElement(children, {
      ref,
      onClick: () => onOpenChange(!isOpen),
      'aria-expanded': isOpen,
      'aria-haspopup': true,
      ...props,
    });
  }

  return (
    <button
      ref={ref}
      onClick={() => onOpenChange(!isOpen)}
      aria-expanded={isOpen}
      aria-haspopup={true}
      className={cn('focus:outline-none', className)}
      {...props}
    >
      {children}
    </button>
  );
});

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export const DropdownMenuContent = React.forwardRef(({ 
  className, 
  children, 
  align = 'start',
  side = 'bottom',
  sideOffset = 4,
  ...props 
}, ref) => {
  const { isOpen, onOpenChange } = useContext(DropdownMenuContext);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        onOpenChange(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onOpenChange]);

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-large',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        align === 'end' ? 'right-0' : 'left-0',
        side === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = React.forwardRef(({ 
  className, 
  children,
  disabled,
  onClick,
  ...props 
}, ref) => {
  const { onOpenChange } = useContext(DropdownMenuContext);

  const handleClick = (event) => {
    if (disabled) return;
    onClick?.(event);
    onOpenChange(false);
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
});

DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuCheckboxItem = React.forwardRef(({ 
  className, 
  children,
  checked,
  onCheckedChange,
  ...props 
}, ref) => {
  const { onOpenChange } = useContext(DropdownMenuContext);

  const handleClick = () => {
    onCheckedChange?.(!checked);
  };

  return (
    <DropdownMenuItem
      ref={ref}
      className={cn('pl-8', className)}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <Check className="h-4 w-4" />}
      </span>
      {children}
    </DropdownMenuItem>
  );
});

DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

export const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
));

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export const DropdownMenuLabel = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('px-2 py-1.5 text-sm font-semibold text-foreground', className)}
    {...props}
  />
));

DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuShortcut = ({ className, ...props }) => {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}
      {...props}
    />
  );
};

DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';
