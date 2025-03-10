import { EventEmitter } from 'events';
import { ServiceError } from '../interfaces';

export interface BaseEvents {
  initialized: () => void;
  disposed: () => void;
  error: (error: ServiceError) => void;
}

export class BaseEventEmitter extends EventEmitter {
  public on<K extends keyof BaseEvents>(event: K, listener: BaseEvents[K]): this {
    return super.on(event, listener);
  }

  public off<K extends keyof BaseEvents>(event: K, listener: BaseEvents[K]): this {
    return super.off(event, listener);
  }

  public emit<K extends keyof BaseEvents>(
    event: K,
    ...args: Parameters<BaseEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  public once<K extends keyof BaseEvents>(event: K, listener: BaseEvents[K]): this {
    return super.once(event, listener);
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

  protected emitError(error: Error | string, code?: string, details?: unknown): void {
    const serviceError: ServiceError = error instanceof Error
      ? { ...error, code, details }
      : this.createError(error, code, details);

    this.emit('error', serviceError);
  }

  protected emitInitialized(): void {
    this.emit('initialized');
  }

  protected emitDisposed(): void {
    this.emit('disposed');
  }
}

export interface ServiceEventEmitter<T extends Record<string, any>> extends BaseEventEmitter {
  on<K extends keyof T>(event: K, listener: T[K]): this;
  off<K extends keyof T>(event: K, listener: T[K]): this;
  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): boolean;
  once<K extends keyof T>(event: K, listener: T[K]): this;
}
