import { ServiceConfig, ServiceError } from '../interfaces';
import FFmpegService from './FFmpegService';
import FileSystemService from './FileSystemService';
import ProjectService from './ProjectService';
import TimelineService from './TimelineService';
import { ServiceBase } from './ServiceBase';

export class ServiceInitializer {
  private static instance: ServiceInitializer;
  private config: ServiceConfig;
  private initialized = false;

  private constructor(config?: ServiceConfig) {
    this.config = config || {};
  }

  public static getInstance(config?: ServiceConfig): ServiceInitializer {
    if (!ServiceInitializer.instance) {
      ServiceInitializer.instance = new ServiceInitializer(config);
    }
    return ServiceInitializer.instance;
  }

  public async initializeServices(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const services: ServiceBase[] = [
      FFmpegService.getInstance(),
      FileSystemService.getInstance(),
      TimelineService.getInstance(),
      ProjectService.getInstance(),
    ];

    const errors: ServiceError[] = [];

    for (const service of services) {
      try {
        await service.initialize();
      } catch (error) {
        const serviceError: ServiceError = {
          name: 'ServiceInitializationError',
          message: `Failed to initialize ${service.constructor.name}`,
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

    this.initialized = true;
  }

  public async disposeServices(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    const services: ServiceBase[] = [
      ProjectService.getInstance(),
      TimelineService.getInstance(),
      FileSystemService.getInstance(),
      FFmpegService.getInstance(),
    ];

    const errors: ServiceError[] = [];

    for (const service of services) {
      try {
        await service.dispose();
      } catch (error) {
        const serviceError: ServiceError = {
          name: 'ServiceDisposalError',
          message: `Failed to dispose ${service.constructor.name}`,
          code: 'SERVICE_DISPOSE_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
        };
        errors.push(serviceError);
      }
    }

    this.initialized = false;

    if (errors.length > 0) {
      const error = new Error('Failed to dispose one or more services') as ServiceError;
      error.code = 'MULTIPLE_SERVICE_DISPOSE_ERROR';
      error.details = errors;
      throw error;
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public updateConfig(config: Partial<ServiceConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  public getConfig(): ServiceConfig {
    return { ...this.config };
  }
}

export default ServiceInitializer.getInstance();
