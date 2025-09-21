import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../utils/cn';

const TabsContext = createContext();

export const Tabs = React.forwardRef(({
  children,
  defaultValue,
  value,
  onValueChange,
  orientation = 'horizontal',
  className,
  ...props
}, ref) => {
  const [activeTab, setActiveTab] = useState(value || defaultValue);

  const handleValueChange = (newValue) => {
    if (value === undefined) {
      setActiveTab(newValue);
    }
    onValueChange?.(newValue);
  };

  const currentValue = value !== undefined ? value : activeTab;

  return (
    <TabsContext.Provider value={{
      activeTab: currentValue,
      setActiveTab: handleValueChange,
      orientation
    }}>
      <div
        ref={ref}
        className={cn('w-full', className)}
        data-orientation={orientation}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
});

Tabs.displayName = 'Tabs';

export const TabsList = React.forwardRef(({ children, className, ...props }, ref) => {
  const { orientation } = useContext(TabsContext);

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl bg-muted p-1 text-muted-foreground',
        orientation === 'vertical' ? 'flex-col h-auto' : 'h-10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef(({
  children,
  value,
  disabled,
  className,
  ...props
}, ref) => {
  const { activeTab, setActiveTab, orientation } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ring-offset-background transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-background text-foreground shadow-soft'
          : 'hover:bg-background/50 hover:text-foreground',
        orientation === 'vertical' && 'w-full justify-start',
        className
      )}
      onClick={() => setActiveTab(value)}
      disabled={disabled}
      data-state={isActive ? 'active' : 'inactive'}
      {...props}
    >
      {children}
    </button>
  );
});

TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = React.forwardRef(({
  children,
  value,
  className,
  ...props
}, ref) => {
  const { activeTab } = useContext(TabsContext);

  if (activeTab !== value) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      data-state={activeTab === value ? 'active' : 'inactive'}
      {...props}
    >
      {children}
    </div>
  );
});

TabsContent.displayName = 'TabsContent';
