export * from './FFmpeg.interface';
export * from './FileSystem.interface';
export * from './ProjectService.interface';
export * from './Timeline.interface';

// Common types used across interfaces
export interface BaseService {
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
}

// Error handling types
export interface ServiceError extends Error {
  code?: string;
  details?: unknown;
}

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<{
  success: boolean;
  data?: T;
  error?: ServiceError;
}>;

// Service factory type
export interface ServiceFactory {
  createFFmpegService(): IFFmpegService;
  createFileSystemService(): IFileSystemService;
  createProjectService(): IProjectService;
  createTimelineService(): ITimelineService;
}

// Service registry for dependency injection
export interface ServiceRegistry {
  register<T>(serviceId: string, service: T): void;
  get<T>(serviceId: string): T;
  has(serviceId: string): boolean;
  remove(serviceId: string): void;
}

// Service identifiers
export const SERVICE_IDS = {
  FFMPEG: 'ffmpeg',
  FILE_SYSTEM: 'fileSystem',
  PROJECT: 'project',
  TIMELINE: 'timeline',
} as const;

// Service configuration types
export interface ServiceConfig {
  ffmpeg?: {
    paths?: {
      ffmpeg?: string;
      ffprobe?: string;
    };
    options?: Record<string, unknown>;
  };
  fileSystem?: {
    tempDir?: string;
    watchOptions?: WatchOptions;
  };
  project?: {
    autoSaveInterval?: number;
    maxUndoSteps?: number;
  };
  timeline?: {
    defaultZoom?: number;
    thumbnailInterval?: number;
  };
}

// Service state types
export interface ServiceState {
  initialized: boolean;
  error?: ServiceError;
  config: ServiceConfig;
}
