import { ServiceConfig, ServiceRegistry, ServiceFactory, SERVICE_IDS } from '../interfaces';
import { AbstractBaseService } from './BaseService';
import ServiceRegistryImpl from './ServiceRegistry';
import ServiceFactoryImpl from './ServiceFactory';

export class ServiceProvider {
  private static instance: ServiceProvider;
  private registry: ServiceRegistry;
  private factory: ServiceFactory;
  private initialized = false;

  private constructor(config?: ServiceConfig) {
    this.registry = ServiceRegistryImpl;
    this.factory = ServiceFactoryImpl.getInstance(config);
  }

  public static getInstance(config?: ServiceConfig): ServiceProvider {
    if (!ServiceProvider.instance) {
      ServiceProvider.instance = new ServiceProvider(config);
    }
    return ServiceProvider.instance;
  }

  /**
   * Initialize all services
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.factory.initializeServices();
      this.initialized = true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize services: ${errorMessage}`);
    }
  }

  /**
   * Get a service by ID
   */
  public getService<T extends AbstractBaseService>(serviceId: string): T {
    if (!this.initialized) {
      throw new Error('ServiceProvider not initialized');
    }

    return this.registry.get<T>(serviceId);
  }

  /**
   * Get FFmpeg service
   */
  public getFFmpegService() {
    return this.getService(SERVICE_IDS.FFMPEG);
  }

  /**
   * Get FileSystem service
   */
  public getFileSystemService() {
    return this.getService(SERVICE_IDS.FILE_SYSTEM);
  }

  /**
   * Get Project service
   */
  public getProjectService() {
    return this.getService(SERVICE_IDS.PROJECT);
  }

  /**
   * Get Timeline service
   */
  public getTimelineService() {
    return this.getService(SERVICE_IDS.TIMELINE);
  }

  /**
   * Update service configuration
   */
  public updateConfig(config: Partial<ServiceConfig>): void {
    this.factory.updateConfig(config);
  }

  /**
   * Dispose all services
   */
  public async dispose(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      await this.factory.disposeServices();
      this.initialized = false;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to dispose services: ${errorMessage}`);
    }
  }

  /**
   * Check if provider is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if a service is registered
   */
  public hasService(serviceId: string): boolean {
    return this.registry.has(serviceId);
  }
}

// Export singleton instance
export default ServiceProvider.getInstance();

// Export service IDs for convenience
export { SERVICE_IDS };
