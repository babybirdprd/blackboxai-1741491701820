import { ServiceFactory, ServiceConfig, SERVICE_IDS } from '../interfaces';
import { IFFmpegService, IFileSystemService, IProjectService, ITimelineService } from '../interfaces';
import FFmpegService from './FFmpegService';
import FileSystemService from './FileSystemService';
import ProjectService from './ProjectService';
import TimelineService from './TimelineService';
import ServiceRegistry from './ServiceRegistry';

class ServiceFactoryImpl implements ServiceFactory {
  private static instance: ServiceFactoryImpl;
  private config: ServiceConfig;

  private constructor(config: ServiceConfig = {}) {
    this.config = config;
  }

  public static getInstance(config?: ServiceConfig): ServiceFactoryImpl {
    if (!ServiceFactoryImpl.instance) {
      ServiceFactoryImpl.instance = new ServiceFactoryImpl(config);
    }
    return ServiceFactoryImpl.instance;
  }

  /**
   * Create FFmpeg service
   */
  public createFFmpegService(): IFFmpegService {
    if (ServiceRegistry.has(SERVICE_IDS.FFMPEG)) {
      return ServiceRegistry.get<IFFmpegService>(SERVICE_IDS.FFMPEG);
    }

    const service = FFmpegService.getInstance();
    ServiceRegistry.register(SERVICE_IDS.FFMPEG, service);
    return service;
  }

  /**
   * Create FileSystem service
   */
  public createFileSystemService(): IFileSystemService {
    if (ServiceRegistry.has(SERVICE_IDS.FILE_SYSTEM)) {
      return ServiceRegistry.get<IFileSystemService>(SERVICE_IDS.FILE_SYSTEM);
    }

    const service = FileSystemService.getInstance();
    ServiceRegistry.register(SERVICE_IDS.FILE_SYSTEM, service);
    return service;
  }

  /**
   * Create Project service
   */
  public createProjectService(): IProjectService {
    if (ServiceRegistry.has(SERVICE_IDS.PROJECT)) {
      return ServiceRegistry.get<IProjectService>(SERVICE_IDS.PROJECT);
    }

    const fileSystemService = this.createFileSystemService();
    const timelineService = this.createTimelineService();
    const service = ProjectService.getInstance();

    // Configure auto-save interval if specified
    if (this.config.project?.autoSaveInterval) {
      (service as any).setAutoSaveInterval(this.config.project.autoSaveInterval);
    }

    ServiceRegistry.register(SERVICE_IDS.PROJECT, service);
    return service;
  }

  /**
   * Create Timeline service
   */
  public createTimelineService(): ITimelineService {
    if (ServiceRegistry.has(SERVICE_IDS.TIMELINE)) {
      return ServiceRegistry.get<ITimelineService>(SERVICE_IDS.TIMELINE);
    }

    const service = TimelineService.getInstance();

    // Configure default zoom if specified
    if (this.config.timeline?.defaultZoom) {
      service.setZoom(this.config.timeline.defaultZoom);
    }

    ServiceRegistry.register(SERVICE_IDS.TIMELINE, service);
    return service;
  }

  /**
   * Initialize all services
   */
  public async initializeServices(): Promise<void> {
    // Create all services to ensure they're registered
    this.createFFmpegService();
    this.createFileSystemService();
    this.createTimelineService();
    this.createProjectService();

    // Initialize all services
    await ServiceRegistry.initializeServices();
  }

  /**
   * Dispose all services
   */
  public async disposeServices(): Promise<void> {
    await ServiceRegistry.disposeServices();
  }

  /**
   * Update service configuration
   */
  public updateConfig(config: Partial<ServiceConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}

export default ServiceFactoryImpl.getInstance();
