import React, { createContext, useContext, useEffect, useState } from 'react';
import { useStores, initializeStores, type ProjectMetadata, type ProjectSettings } from '../store';

interface AppContextValue {
  // Store access
  stores: ReturnType<typeof useStores>;
  
  // Application state
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Project information
  projectMetadata: ProjectMetadata;
  projectSettings: ProjectSettings;
  
  // Application actions
  initialize: () => Promise<void>;
  handleError: (error: Error) => void;
  clearError: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stores = useStores();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const initialize = async () => {
    try {
      setIsLoading(true);
      await initializeStores();
      setIsInitialized(true);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to initialize application'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error: Error) => {
    console.error('Application error:', error);
    setError(error);
    
    // You could add error reporting service integration here
    // reportError(error);
  };

  const clearError = () => {
    setError(null);
  };

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, []);

  // Subscribe to project changes
  useEffect(() => {
    const unsubscribe = stores.project.subscribe((state) => {
      // Handle project state changes
      if (state.isDirty && state.autoSaveEnabled) {
        // Implement auto-save logic
        stores.project.saveProject().catch(handleError);
      }
    });

    return () => unsubscribe();
  }, [stores.project]);

  // Handle window events
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (stores.project.getState().isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [stores.project]);

  const value: AppContextValue = {
    stores,
    isInitialized,
    isLoading,
    error,
    projectMetadata: stores.project.getState().metadata,
    projectSettings: stores.project.getState().settings,
    initialize,
    handleError,
    clearError
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-primary">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-white text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-primary">
        <div className="text-center p-8 bg-background-secondary rounded-lg shadow-lg">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <div className="text-white mb-4">{error.message}</div>
          <button
            onClick={() => {
              clearError();
              initialize();
            }}
            className="px-4 py-2 bg-primary hover:bg-primary-dark rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Custom hooks for specific store access
export const useTimeline = () => {
  const { stores } = useApp();
  return stores.timeline;
};

export const useEffects = () => {
  const { stores } = useApp();
  return stores.effects;
};

export const useProject = () => {
  const { stores } = useApp();
  return stores.project;
};

export const useUI = () => {
  const { stores } = useApp();
  return stores.ui;
};

// Custom hook for error handling
export const useErrorHandler = () => {
  const { handleError } = useApp();
  return React.useCallback(
    (error: unknown) => {
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error(String(error)));
      }
    },
    [handleError]
  );
};

// Custom hook for loading states
export const useLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const handleError = useErrorHandler();

  const withLoading = async <T,>(promise: Promise<T>): Promise<T> => {
    try {
      setIsLoading(true);
      return await promise;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, withLoading };
};