export interface FileOperationResult {
  success: boolean;
  error?: string;
}

export interface FileStats {
  size: number;
  created: Date;
  modified: Date;
  isDirectory: boolean;
  isFile: boolean;
}

export interface WatchOptions {
  recursive?: boolean;
}

export interface WatchEvent {
  path: string;
  type: string;
  filename: string | null;
}

export interface IFileSystemService {
  /**
   * Create a temporary file path
   */
  createTempPath(extension: string): Promise<string>;

  /**
   * Clean up a temporary file
   */
  cleanupTemp(filePath: string): Promise<void>;

  /**
   * Clean up all registered temporary files
   */
  cleanupAllTemp(): Promise<void>;

  /**
   * Save project file
   */
  saveProject(projectPath: string, data: unknown): Promise<void>;

  /**
   * Load project file
   */
  loadProject(projectPath: string): Promise<unknown>;

  /**
   * Check if file exists
   */
  fileExists(filePath: string): Promise<boolean>;

  /**
   * Get file stats
   */
  getFileStats(filePath: string): Promise<FileStats>;

  /**
   * Ensure directory exists
   */
  ensureDir(dirPath: string): Promise<void>;

  /**
   * Get platform-specific path
   */
  getPlatformPath(filePath: string): string;

  /**
   * Watch file or directory for changes
   */
  watchPath(path: string, options?: WatchOptions): Promise<void>;

  /**
   * Stop watching a path
   */
  unwatchPath(path: string): Promise<void>;

  // Event handlers
  on(event: 'watch', listener: (event: WatchEvent) => void): void;
  on(event: 'error', listener: (message: string) => void): void;
  on(event: 'cleanup', listener: (path: string) => void): void;
}
