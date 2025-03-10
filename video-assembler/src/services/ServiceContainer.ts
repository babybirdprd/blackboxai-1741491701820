import { EventEmitter } from 'events';
import { SERVICE_IDS, ServiceConfig, ServiceError } from '../interfaces';
import { AbstractBaseService } from './BaseService';

export class ServiceContainer extends EventEmitter {
  private static instance: ServiceContainer;
  private services: Map<string, AbstractBaseService>;
  private config: ServiceConfig;
  private initialized: boolean;

  private constructor(config: ServiceConfig = {}) {
    super();
    this.services = new Map();
    this.config = config;
    this.initialized = false;
  }

  public static getInstance(config?: ServiceConfig): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer(config);
    }
    return ServiceContainer.instance;
  }

  /**
   * Register a service
   */
  public register<T extends AbstractBaseService>(serviceId: string, service: T): void {
    if (this.services.has(serviceId)) {
      throw new Error(`Service '${serviceId}' is already registered`);
    }

    // Forward service events
    service.on('error', (error: ServiceError) => {
      this.emit('serviceError', { serviceId, error });
    });

    this.services.set(serviceId, service);
  }

  /**
   * Get a registered service
   */
  public get<T extends AbstractBaseService>(serviceId: string): T {
    const service = this.services.get(serviceId) as T;
    if (!service) {
      throw new Error(`Service '${serviceId}' is not registered`);
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
   * Initialize all services
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const errors: Array<{ serviceId: string; error: Error }> = [];

    // Initialize services in dependency order
    const initOrder = [
      SERVICE_IDS.FFMPEG,
      SERVICE_IDS.FILE_SYSTEM,
      SERVICE_IDS.TIMELINE,
      SERVICE_IDS.PROJECT,
    ];

    for (const serviceId of initOrder) {
      const service = this.services.get(serviceId);
      if (service) {
        try {
          await service.initialize();
        } catch (error) {
          errors.push({
            serviceId,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    }

    if (errors.length > 0) {
      const error = new Error('Failed to initialize one or more services') as ServiceError;
      error.code = 'INIT_ERROR';
      error.details = errors;
      throw error;
    }

    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Dispose all services
   */
  public async dispose(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    const errors: Array<{ serviceId: string; error: Error }> = [];

    // Dispose services in reverse dependency order
    const disposeOrder = [
      SERVICE_IDS.PROJECT,
      SERVICE_IDS.TIMELINE,
      SERVICE_IDS.FILE_SYSTEM,
      SERVICE_IDS.FFMPEG,
    ];

    for (const serviceId of disposeOrder) {
      const service = this.services.get(serviceId);
      if (service) {
        try {
          await service.dispose();
        } catch (error) {
          errors.push({
            serviceId,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    }

    this.services.clear();
    this.initialized = false;
    this.emit('disposed');

    if (errors.length > 0) {
      const error = new Error('Failed to dispose one or more services') as ServiceError;
      error.code = 'DISPOSE_ERROR';
      error.details = errors;
      throw error;
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ServiceConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    this.emit('configUpdated', this.config);
  }

  /**
   * Get current configuration
   */
  public getConfig(): ServiceConfig {
    return { ...this.config };
  }

  /**
   * Check if container is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  // Event handler type definitions
  public on(event: 'initialized', listener: () => void): this;
  public on(event: 'disposed', listener: () => void): this;
  public on(event: 'configUpdated', listener: (config: ServiceConfig) => void): this;
  public on(event: 'serviceError', listener: (error: { serviceId: string; error: ServiceError }) => void): this;
  public on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}

export default ServiceContainer.getInstance();
