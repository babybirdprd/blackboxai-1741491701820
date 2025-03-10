import { EventEmitter } from 'events';
import { ServiceError } from '../interfaces';

export interface ServiceEvents {
  initialized: () => void;
  disposed: () => void;
  error: (error: ServiceError) => void;
}

export abstract class ServiceBase extends EventEmitter {
  protected initialized = false;
  protected lastError: ServiceError | null = null;

  constructor() {
    super();
    this.handleErrors();
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.initializeImpl();
      this.initialized = true;
      this.emit('initialized');
    } catch (error) {
      const serviceError = this.createError(
        'Failed to initialize service',
        'SERVICE_INIT_ERROR',
        error
      );
      this.lastError = serviceError;
      this.emit('error', serviceError);
      throw serviceError;
    }
  }

  public async dispose(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      await this.disposeImpl();
      this.initialized = false;
      this.emit('disposed');
    } catch (error) {
      const serviceError = this.createError(
        'Failed to dispose service',
        'SERVICE_DISPOSE_ERROR',
        error
      );
      this.lastError = serviceError;
      this.emit('error', serviceError);
      throw serviceError;
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getLastError(): ServiceError | null {
    return this.lastError;
  }

  public clearError(): void {
    this.lastError = null;
  }

  protected abstract initializeImpl(): Promise<void>;
  protected abstract disposeImpl(): Promise<void>;

  protected checkInitialized(): void {
    if (!this.initialized) {
      throw this.createError('Service not initialized', 'SERVICE_NOT_INITIALIZED');
    }
  }

  protected createError(
    message: string,
    code: string = 'SERVICE_ERROR',
    details?: unknown
  ): ServiceError {
    return {
      name: this.constructor.name + 'Error',
      message,
      code,
      details,
    };
  }

  private handleErrors(): void {
    this.on('error', (error: ServiceError) => {
      this.lastError = error;
      console.error(`[${this.constructor.name}] ${error.message}`, error.details);
    });
  }

  // Type-safe event emitter methods
  public override on<K extends keyof ServiceEvents>(
    event: K,
    listener: ServiceEvents[K]
  ): this {
    return super.on(event, listener);
  }

  public override off<K extends keyof ServiceEvents>(
    event: K,
    listener: ServiceEvents[K]
  ): this {
    return super.off(event, listener);
  }

  public override emit<K extends keyof ServiceEvents>(
    event: K,
    ...args: Parameters<ServiceEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  public override once<K extends keyof ServiceEvents>(
    event: K,
    listener: ServiceEvents[K]
  ): this {
    return super.once(event, listener);
  }
}

/**
 * Create a singleton service instance
 */
export function createSingleton<T extends ServiceBase>(
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
