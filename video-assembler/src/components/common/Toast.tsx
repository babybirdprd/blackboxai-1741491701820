import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../theme/ThemeProvider';

export interface ToastProps {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        onClose(id);
      }, 300); // Match transition duration

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, id]);

  const icons = {
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  };

  const colors = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <div
        className={`flex items-center p-4 rounded-lg shadow-lg ${
          isDark ? 'bg-surface-primary' : 'bg-white'
        }`}
      >
        <div className={`flex-shrink-0 w-8 h-8 ${colors[type]} rounded-full flex items-center justify-center text-white`}>
          {icons[type]}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm">{message}</p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 flex-shrink-0 rounded-full p-1 hover:bg-surface-secondary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  children: React.ReactNode;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'bottom-right',
  children
}) => {
  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0'
  };

  return createPortal(
    <div
      className={`fixed z-50 m-4 space-y-4 ${positionClasses[position]}`}
      style={{ maxWidth: 'calc(100% - 2rem)' }}
    >
      {children}
    </div>,
    document.body
  );
};

// Toast Manager Component
interface ToastManagerProps {
  position?: ToastContainerProps['position'];
}

export interface ToastOptions {
  type: ToastProps['type'];
  message: string;
  duration?: number;
}

const ToastManager: React.FC<ToastManagerProps> = ({ position }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...options, id, onClose: removeToast }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContainer position={position}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </ToastContainer>
  );
};

// Toast Context
const ToastContext = React.createContext<{
  showToast: (options: ToastOptions) => void;
} | null>(null);

export const ToastProvider: React.FC<{
  children: React.ReactNode;
  position?: ToastContainerProps['position'];
}> = ({ children, position }) => {
  const [manager] = useState(() => {
    const manager = document.createElement('div');
    manager.setAttribute('id', 'toast-manager');
    document.body.appendChild(manager);
    return manager;
  });

  const showToast = (options: ToastOptions) => {
    const event = new CustomEvent('show-toast', { detail: options });
    manager.dispatchEvent(event);
  };

  useEffect(() => {
    return () => {
      document.body.removeChild(manager);
    };
  }, [manager]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(<ToastManager position={position} />, manager)}
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.showToast;
};

export default Toast;