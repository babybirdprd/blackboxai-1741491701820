import { ServiceError } from '../interfaces';
import { BaseEventEmitter } from './BaseEventEmitter';

/**
 * Service decorator to handle initialization, disposal, and error handling
 */
export function Service<T extends { new (...args: any[]): BaseEventEmitter }>(constructor: T) {
  return class extends constructor {
    private initialized = false;
    private lastError: ServiceError | null = null;

    constructor(...args: any[]) {
      super(...args);
      this.handleErrors();
    }

    /**
     * Initialize the service
     */
    public async initialize(): Promise<void> {
      if (this.initialized) {
        return;
      }

      try {
        // Call original initialize if it exists
        if (super.initialize) {
          await super.initialize();
        }
        
        this.initialized = true;
        this.emit('initialized');
      } catch (error: unknown) {
        const serviceError = this.createServiceError(error, 'SERVICE_INIT_ERROR');
        this.lastError = serviceError;
        this.emit('error', serviceError);
        throw serviceError;
      }
    }

    /**
     * Dispose of service resources
     */
    public async dispose(): Promise<void> {
      if (!this.initialized) {
        return;
      }

      try {
        // Call original dispose if it exists
        if (super.dispose) {
          await super.dispose();
        }

        this.initialized = false;
        this.emit('disposed');
      } catch (error: unknown) {
        const serviceError = this.createServiceError(error, 'SERVICE_DISPOSE_ERROR');
        this.lastError = serviceError;
        this.emit('error', serviceError);
        throw serviceError;
      }
    }

    /**
     * Check if service is initialized
     */
    public isInitialized(): boolean {
      return this.initialized;
    }

    /**
     * Get last error
     */
    public getLastError(): ServiceError | null {
      return this.lastError;
    }

    /**
     * Clear last error
     */
    public clearError(): void {
      this.lastError = null;
    }

    /**
     * Handle uncaught errors
     */
    private handleErrors(): void {
      this.on('error', (error: ServiceError) => {
        this.lastError = error;
        // Log error but don't throw to prevent unhandled rejections
        console.error(`[${constructor.name}] ${error.message}`, error.details);
      });
    }

    /**
     * Create a service error
     */
    private createServiceError(error: unknown, code: string): ServiceError {
      return {
        name: 'ServiceError',
        message: error instanceof Error ? error.message : String(error),
        code,
        details: error,
      };
    }
  };
}

/**
 * Singleton decorator to ensure only one instance of a service exists
 */
export function Singleton<T extends { new (...args: any[]): any }>(constructor: T) {
  let instance: T | null = null;

  return class extends constructor {
    constructor(...args: any[]) {
      if (instance) {
        return instance;
      }
      super(...args);
      instance = this;
    }

    public static getInstance(): T {
      if (!instance) {
        instance = new constructor();
      }
      return instance;
    }
  };
}

/**
 * Method decorator to ensure service is initialized before method execution
 */
export function RequiresInit() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      if (!this.isInitialized?.()) {
        throw new Error(`Service must be initialized before calling ${propertyKey}`);
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
