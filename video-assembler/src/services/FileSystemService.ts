import { ipcRenderer } from 'electron';
import { EventEmitter } from 'events';
import {
  FileOperationResult,
  FileStats,
  IFileSystemService,
  ServiceError,
  WatchEvent,
  WatchOptions,
} from '../interfaces';

interface FileSystemEvents {
  watch: (event: WatchEvent) => void;
  error: (error: ServiceError) => void;
  initialized: () => void;
  disposed: () => void;
  cleanup: (path: string) => void;
}

export class FileSystemService extends EventEmitter implements IFileSystemService {
  private static instance: FileSystemService;
  private initialized = false;
  private tempFiles: Set<string>;

  private constructor() {
    super();
    this.tempFiles = new Set();
    this.setupIpcListeners();
  }

  public static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  private setupIpcListeners(): void {
    ipcRenderer.on('fs:watch-event', (_, event: WatchEvent) => {
      this.emit('watch', event);
    });
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Ensure temp directory exists
      await this.ensureDir(await this.getTempDir());
      this.initialized = true;
      this.emit('initialized');
    } catch (error) {
      const serviceError = this.createError(
        'Failed to initialize FileSystem service',
        'FS_INIT_ERROR',
        error
      );
      this.emit('error', serviceError);
      throw serviceError;
    }
  }

  public async dispose(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      await this.cleanupAllTemp();
      this.initialized = false;
      this.emit('disposed');
    } catch (error) {
      const serviceError = this.createError(
        'Failed to dispose FileSystem service',
        'FS_DISPOSE_ERROR',
        error
      );
      this.emit('error', serviceError);
      throw serviceError;
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async createTempPath(extension: string): Promise<string> {
    this.checkInitialized();
    const path = await ipcRenderer.invoke('fs:create-temp-path', extension);
    this.tempFiles.add(path);
    return path;
  }

  public async cleanupTemp(filePath: string): Promise<void> {
    this.checkInitialized();
    const result = await ipcRenderer.invoke('fs:cleanup', filePath);
    if (result.success) {
      this.tempFiles.delete(filePath);
      this.emit('cleanup', filePath);
    } else {
      throw this.createError(result.error || 'Failed to cleanup temp file', 'FS_CLEANUP_ERROR');
    }
  }

  public async cleanupAllTemp(): Promise<void> {
    this.checkInitialized();
    const errors: Error[] = [];

    for (const path of this.tempFiles) {
      try {
        await this.cleanupTemp(path);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    if (errors.length > 0) {
      throw this.createError(
        'Failed to cleanup all temp files',
        'FS_CLEANUP_ALL_ERROR',
        errors
      );
    }
  }

  public async saveProject(projectPath: string, data: unknown): Promise<void> {
    this.checkInitialized();
    const result = await ipcRenderer.invoke('fs:save-project', {
      path: projectPath,
      data: JSON.stringify(data, null, 2),
    });

    if (!result.success) {
      throw this.createError(result.error || 'Failed to save project', 'FS_SAVE_ERROR');
    }
  }

  public async loadProject(projectPath: string): Promise<unknown> {
    this.checkInitialized();
    try {
      const data = await ipcRenderer.invoke('fs:load-project', projectPath);
      return JSON.parse(data);
    } catch (error) {
      throw this.createError(
        'Failed to load project',
        'FS_LOAD_ERROR',
        error
      );
    }
  }

  public async fileExists(filePath: string): Promise<boolean> {
    this.checkInitialized();
    return ipcRenderer.invoke('fs:exists', filePath);
  }

  public async getFileStats(filePath: string): Promise<FileStats> {
    this.checkInitialized();
    return ipcRenderer.invoke('fs:stats', filePath);
  }

  public async ensureDir(dirPath: string): Promise<void> {
    this.checkInitialized();
    const result = await ipcRenderer.invoke('fs:ensure-dir', dirPath);
    if (!result.success) {
      throw this.createError(result.error || 'Failed to create directory', 'FS_MKDIR_ERROR');
    }
  }

  public getPlatformPath(filePath: string): string {
    return filePath.replace(/\//g, process.platform === 'win32' ? '\\' : '/');
  }

  public async watchPath(path: string, options?: WatchOptions): Promise<void> {
    this.checkInitialized();
    const result = await ipcRenderer.invoke('fs:watch', { path, options });
    if (!result.success) {
      throw this.createError(result.error || 'Failed to watch path', 'FS_WATCH_ERROR');
    }
  }

  public async unwatchPath(path: string): Promise<void> {
    this.checkInitialized();
    const result = await ipcRenderer.invoke('fs:unwatch', path);
    if (!result.success) {
      throw this.createError(result.error || 'Failed to unwatch path', 'FS_UNWATCH_ERROR');
    }
  }

  private async getTempDir(): Promise<string> {
    return ipcRenderer.invoke('fs:get-temp-dir');
  }

  private checkInitialized(): void {
    if (!this.initialized) {
      throw this.createError('FileSystem service not initialized', 'SERVICE_NOT_INITIALIZED');
    }
  }

  private createError(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    details?: unknown
  ): ServiceError {
    return {
      name: 'FileSystemError',
      message,
      code,
      details,
    };
  }

  // Type-safe event emitter methods
  public override on<K extends keyof FileSystemEvents>(
    event: K,
    listener: FileSystemEvents[K]
  ): this {
    return super.on(event, listener);
  }

  public override off<K extends keyof FileSystemEvents>(
    event: K,
    listener: FileSystemEvents[K]
  ): this {
    return super.off(event, listener);
  }

  public override emit<K extends keyof FileSystemEvents>(
    event: K,
    ...args: Parameters<FileSystemEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  public override once<K extends keyof FileSystemEvents>(
    event: K,
    listener: FileSystemEvents[K]
  ): this {
    return super.once(event, listener);
  }
}

export default FileSystemService.getInstance();
