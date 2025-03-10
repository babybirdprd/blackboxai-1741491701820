import { ServiceRegistry, ServiceError } from '../interfaces';

class ServiceRegistryImpl implements ServiceRegistry {
  private static instance: ServiceRegistryImpl;
  private services: Map<string, unknown>;

  private constructor() {
    this.services = new Map();
  }

  public static getInstance(): ServiceRegistryImpl {
    if (!ServiceRegistryImpl.instance) {
      ServiceRegistryImpl.instance = new ServiceRegistryImpl();
    }
    return ServiceRegistryImpl.instance;
  }

  /**
   * Register a service
   */
  public register<T>(serviceId: string, service: T): void {
    if (this.services.has(serviceId)) {
      throw new Error(`Service with ID '${serviceId}' is already registered`);
    }
    this.services.set(serviceId, service);
  }

  /**
   * Get a registered service
   */
  public get<T>(serviceId: string): T {
    const service = this.services.get(serviceId) as T;
    if (!service) {
      throw new Error(`Service with ID '${serviceId}' is not registered`);
    }
    return service;
  }

  /**
   * Check if a service is registered
   */
  public has(serviceId: string): boolean {
    return this.services.has(serviceId);
  }

  /**
   * Remove a registered service
   */
  public remove(serviceId: string): void {
    if (!this.services.has(serviceId)) {
      throw new Error(`Service with ID '${serviceId}' is not registered`);
    }
    this.services.delete(serviceId);
  }

  /**
   * Initialize all registered services
   */
  public async initializeServices(): Promise<void> {
    const errors: ServiceError[] = [];

    for (const [serviceId, service] of this.services.entries()) {
      try {
        if (typeof (service as any).initialize === 'function') {
          await (service as any).initialize();
        }
      } catch (error: unknown) {
        const serviceError: ServiceError = {
          name: 'ServiceInitializationError',
          message: `Failed to initialize service '${serviceId}'`,
          code: 'SERVICE_INIT_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
        errors.push(serviceError);
      }
    }

    if (errors.length > 0) {
      const error = new Error('Failed to initialize one or more services') as ServiceError;
      error.code = 'MULTIPLE_SERVICE_INIT_ERROR';
      error.details = errors;
      throw error;
    }
  }

  /**
   * Dispose all registered services
   */
  public async disposeServices(): Promise<void> {
    const errors: ServiceError[] = [];

    for (const [serviceId, service] of this.services.entries()) {
      try {
        if (typeof (service as any).dispose === 'function') {
          await (service as any).dispose();
        }
      } catch (error: unknown) {
        const serviceError: ServiceError = {
          name: 'ServiceDisposalError',
          message: `Failed to dispose service '${serviceId}'`,
          code: 'SERVICE_DISPOSE_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
        errors.push(serviceError);
      }
    }

    // Clear the registry even if there were errors
    this.services.clear();

    if (errors.length > 0) {
      const error = new Error('Failed to dispose one or more services') as ServiceError;
      error.code = 'MULTIPLE_SERVICE_DISPOSE_ERROR';
      error.details = errors;
      throw error;
    }
  }
}

export default ServiceRegistryImpl.getInstance();
