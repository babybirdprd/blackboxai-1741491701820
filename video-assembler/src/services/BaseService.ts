import { EventEmitter } from 'events';
import { BaseService, ServiceError } from '../interfaces';

export abstract class AbstractBaseService extends EventEmitter implements BaseService {
  protected initialized = false;
  protected error: ServiceError | null = null;

  constructor() {
    super();
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
      await this.initializeImpl();
      this.initialized = true;
      this.emit('initialized');
    } catch (error: unknown) {
      const serviceError: ServiceError = {
        name: 'ServiceInitializationError',
        message: 'Failed to initialize service',
        code: 'SERVICE_INIT_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
      this.error = serviceError;
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
      await this.disposeImpl();
      this.initialized = false;
      this.emit('disposed');
    } catch (error: unknown) {
      const serviceError: ServiceError = {
        name: 'ServiceDisposalError',
        message: 'Failed to dispose service',
        code: 'SERVICE_DISPOSE_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      };
      this.error = serviceError;
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
    return this.error;
  }

  /**
   * Clear last error
   */
  public clearError(): void {
    this.error = null;
  }

  /**
   * Handle uncaught errors
   */
  private handleErrors(): void {
    this.on('error', (error: ServiceError) => {
      this.error = error;
      // Log error but don't throw to prevent unhandled rejections
      console.error(`[${this.constructor.name}] ${error.message}`, error.details);
    });
  }

  /**
   * Implementation specific initialization
   * Must be implemented by derived classes
   */
  protected abstract initializeImpl(): Promise<void>;

  /**
   * Implementation specific disposal
   * Must be implemented by derived classes
   */
  protected abstract disposeImpl(): Promise<void>;

  // Event handler type definitions
  public on(event: 'initialized', listener: () => void): this;
  public on(event: 'disposed', listener: () => void): this;
  public on(event: 'error', listener: (error: ServiceError) => void): this;
  public on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  public off(event: 'initialized', listener: () => void): this;
  public off(event: 'disposed', listener: () => void): this;
  public off(event: 'error', listener: (error: ServiceError) => void): this;
  public off(event: string, listener: (...args: any[]) => void): this {
    return super.off(event, listener);
  }

  public emit(event: 'initialized'): boolean;
  public emit(event: 'disposed'): boolean;
  public emit(event: 'error', error: ServiceError): boolean;
  public emit(event: string, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }
}

/**
 * Create a singleton service
 */
export function createSingletonService<T extends AbstractBaseService>(
  ServiceClass: new () => T
): () => T {
  let instance: T | null = null;

  return () => {
    if (!instance) {
      instance = new ServiceClass();
    }
    return instance;
  };
}
