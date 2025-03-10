import { EventEmitter } from 'events';
import { ServiceError } from './index';

export interface ServiceEvents {
  initialized: () => void;
  disposed: () => void;
  error: (error: ServiceError) => void;
}

export interface IService {
  // Lifecycle methods
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  isInitialized(): boolean;

  // Error handling
  getLastError(): ServiceError | null;
  clearError(): void;

  // Event handling (extending EventEmitter)
  on<K extends keyof ServiceEvents>(event: K, listener: ServiceEvents[K]): this;
  off<K extends keyof ServiceEvents>(event: K, listener: ServiceEvents[K]): this;
  emit<K extends keyof ServiceEvents>(event: K, ...args: Parameters<ServiceEvents[K]>): boolean;
  once<K extends keyof ServiceEvents>(event: K, listener: ServiceEvents[K]): this;
}

/**
 * Base class for services that provides common functionality
 */
export abstract class BaseService extends EventEmitter implements IService {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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

  private handleErrors(): void {
    this.on('error', (error: ServiceError) => {
      this.lastError = error;
      console.error(`[${this.constructor.name}] ${error.message}`, error.details);
    });
  }

  protected createError(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    details?: unknown
  ): ServiceError {
    return {
      name: 'ServiceError',
      message,
      code,
      details,
    };
  }

  // Type-safe event emitter methods
  public declare emit: <K extends keyof ServiceEvents>(
    event: K,
    ...args: Parameters<ServiceEvents[K]>
  ) => boolean;

  public declare on: <K extends keyof ServiceEvents>(
    event: K,
    listener: ServiceEvents[K]
  ) => this;

  public declare off: <K extends keyof ServiceEvents>(
    event: K,
    listener: ServiceEvents[K]
  ) => this;

  public declare once: <K extends keyof ServiceEvents>(
    event: K,
    listener: ServiceEvents[K]
  ) => this;
}

/**
 * Create a singleton service instance
 */
export function createSingleton<T extends IService>(ServiceClass: new () => T): T {
  let instance: T | null = null;
  return new Proxy(ServiceClass, {
    construct(target, args) {
      if (!instance) {
        instance = new target(...args);
      }
      return instance;
    },
  }) as unknown as T;
}
