import { join } from 'path';
import { existsSync } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface FFmpegPaths {
  ffmpeg: string;
  ffprobe: string;
}

export class FFmpegConfig {
  private static instance: FFmpegConfig;
  private paths: FFmpegPaths | null = null;

  private constructor() {}

  public static getInstance(): FFmpegConfig {
    if (!FFmpegConfig.instance) {
      FFmpegConfig.instance = new FFmpegConfig();
    }
    return FFmpegConfig.instance;
  }

  /**
   * Initialize FFmpeg configuration
   */
  public async initialize(): Promise<void> {
    try {
      this.paths = await this.detectFFmpegPaths();
      await this.validateFFmpegBinaries();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize FFmpeg: ${errorMessage}`);
    }
  }

  /**
   * Get configured FFmpeg paths
   */
  public getPaths(): FFmpegPaths {
    if (!this.paths) {
      throw new Error('FFmpeg paths not initialized');
    }
    return this.paths;
  }

  /**
   * Detect FFmpeg binary paths based on platform
   */
  private async detectFFmpegPaths(): Promise<FFmpegPaths> {
    const platform = process.platform;
    const resourcePath = process.env.NODE_ENV === 'development'
      ? join(process.cwd(), 'resources')
      : join(process.resourcesPath, 'app.asar.unpacked', 'resources');

    let ffmpegPath: string;
    let ffprobePath: string;

    switch (platform) {
      case 'win32':
        ffmpegPath = join(resourcePath, 'ffmpeg', 'win', 'ffmpeg.exe');
        ffprobePath = join(resourcePath, 'ffmpeg', 'win', 'ffprobe.exe');
        break;
      case 'darwin':
        ffmpegPath = join(resourcePath, 'ffmpeg', 'mac', 'ffmpeg');
        ffprobePath = join(resourcePath, 'ffmpeg', 'mac', 'ffprobe');
        break;
      case 'linux':
        ffmpegPath = join(resourcePath, 'ffmpeg', 'linux', 'ffmpeg');
        ffprobePath = join(resourcePath, 'ffmpeg', 'linux', 'ffprobe');
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Check if binaries exist in resources
    if (!existsSync(ffmpegPath) || !existsSync(ffprobePath)) {
      // Fall back to system PATH
      ffmpegPath = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
      ffprobePath = platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
    }

    return { ffmpeg: ffmpegPath, ffprobe: ffprobePath };
  }

  /**
   * Validate FFmpeg binaries
   */
  private async validateFFmpegBinaries(): Promise<void> {
    if (!this.paths) {
      throw new Error('FFmpeg paths not initialized');
    }

    try {
      // Test FFmpeg
      const { stderr: ffmpegVersion } = await execFileAsync(this.paths.ffmpeg, ['-version']);
      if (!ffmpegVersion.includes('ffmpeg version')) {
        throw new Error('Invalid FFmpeg binary');
      }

      // Test FFprobe
      const { stderr: ffprobeVersion } = await execFileAsync(this.paths.ffprobe, ['-version']);
      if (!ffprobeVersion.includes('ffprobe version')) {
        throw new Error('Invalid FFprobe binary');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`FFmpeg validation failed: ${errorMessage}`);
    }
  }

  /**
   * Get FFmpeg version information
   */
  public async getVersionInfo(): Promise<{ ffmpeg: string; ffprobe: string }> {
    if (!this.paths) {
      throw new Error('FFmpeg paths not initialized');
    }

    const { stderr: ffmpegVersion } = await execFileAsync(this.paths.ffmpeg, ['-version']);
    const { stderr: ffprobeVersion } = await execFileAsync(this.paths.ffprobe, ['-version']);

    return {
      ffmpeg: ffmpegVersion.split('\n')[0],
      ffprobe: ffprobeVersion.split('\n')[0],
    };
  }
}

export default FFmpegConfig.getInstance();
