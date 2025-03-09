import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../theme/ThemeProvider';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
  footer?: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventScroll = true,
  footer
}) => {
  const { isDark } = useTheme();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnEscape]);

  // Handle scroll lock
  useEffect(() => {
    if (!preventScroll) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen, preventScroll]);

  // Handle click outside
  useEffect(() => {
    if (!closeOnOverlayClick) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, closeOnOverlayClick]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full m-4'
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Dialog position wrapper */}
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Dialog content */}
        <div
          ref={dialogRef}
          className={`relative ${sizeClasses[size]} w-full bg-surface-primary shadow-xl rounded-lg`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 id="dialog-title" className="text-lg font-semibold">
              {title}
            </h2>
            {showClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-secondary transition-colors"
                aria-label="Close dialog"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end px-6 py-4 border-t border-border space-x-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// Predefined dialog buttons
export const DialogButton: React.FC<{
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, variant = 'secondary', disabled = false, children }) => {
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-dark text-white',
    secondary: 'bg-surface-secondary hover:bg-surface-tertiary',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg transition-colors ${variantClasses[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </button>
  );
};

// Dialog with confirmation buttons
export const ConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <DialogButton onClick={onClose}>{cancelText}</DialogButton>
          <DialogButton
            onClick={onConfirm}
            variant={isDangerous ? 'danger' : 'primary'}
          >
            {confirmText}
          </DialogButton>
        </>
      }
    >
      {children}
    </Dialog>
  );
};

export default Dialog;