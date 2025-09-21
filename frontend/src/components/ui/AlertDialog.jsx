import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './Dialog';
import { Button } from './button';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

const alertIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const alertColors = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-destructive',
};

export const AlertDialog = ({
  open,
  onOpenChange,
  title,
  description,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = false,
  confirmVariant = 'default',
  children,
  ...props
}) => {
  const Icon = alertIcons[type];
  const iconColor = alertColors[type];

  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange?.(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" {...props}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {Icon && <Icon className={`h-6 w-6 ${iconColor}`} />}
            <DialogTitle>{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {children && (
          <div className="py-4">
            {children}
          </div>
        )}

        <DialogFooter>
          {showCancel && (
            <Button variant="outline" onClick={handleCancel}>
              {cancelText}
            </Button>
          )}
          <Button 
            variant={confirmVariant} 
            onClick={handleConfirm}
            className={type === 'error' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Convenience components for different alert types
export const ConfirmDialog = (props) => (
  <AlertDialog
    type="warning"
    showCancel={true}
    confirmText="Confirm"
    confirmVariant="destructive"
    {...props}
  />
);

export const InfoDialog = (props) => (
  <AlertDialog
    type="info"
    confirmText="OK"
    {...props}
  />
);

export const SuccessDialog = (props) => (
  <AlertDialog
    type="success"
    confirmText="Great!"
    {...props}
  />
);

export const ErrorDialog = (props) => (
  <AlertDialog
    type="error"
    confirmText="OK"
    {...props}
  />
);

export default AlertDialog;
