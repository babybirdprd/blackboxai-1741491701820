import { ipcRenderer } from 'electron';
import { BaseEventEmitter } from './BaseEventEmitter';
import {
  FFmpegProgress,
  IFFmpegService,
  MediaInfo,
  ServiceError,
} from '../interfaces';

interface FFmpegEvents {
  progress: (progress: FFmpegProgress) => void;
  error: (error: ServiceError) => void;
  initialized: () => void;
  disposed: () => void;
}

export class FFmpegService extends BaseEventEmitter implements IFFmpegService {
  private static instance: FFmpegService;
  private initialized = false;

  private constructor() {
    super();
    this.initializeIpcListeners();
  }

  public static getInstance(): FFmpegService {
    if (!FFmpegService.instance) {
      FFmpegService.instance = new FFmpegService();
    }
    return FFmpegService.instance;
  }

  private initializeIpcListeners(): void {
    ipcRenderer.on('ffmpeg:progress', (_, progress: FFmpegProgress) => {
      this.emit('progress', progress);
    });

    ipcRenderer.on('ffmpeg:error', (_, errorMessage: string) => {
      const error = this.createError(errorMessage, 'FFMPEG_ERROR');
      this.emit('error', error);
    });
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Verify FFmpeg is available
      await this.getVersionInfo();
      this.initialized = true;
      this.emit('initialized');
    } catch (error) {
      const serviceError = this.createError(
        'Failed to initialize FFmpeg',
        'FFMPEG_INIT_ERROR',
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

    this.initialized = false;
    this.emit('disposed');
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async getMediaInfo(filePath: string): Promise<MediaInfo> {
    if (!this.initialized) {
      throw this.createError('FFmpeg service not initialized', 'SERVICE_NOT_INITIALIZED');
    }
    return ipcRenderer.invoke('ffmpeg:probe', filePath);
  }

  public async losslessCut(
    input: string,
    output: string,
    startTime: number,
    endTime: number
  ): Promise<void> {
    if (!this.initialized) {
      throw this.createError('FFmpeg service not initialized', 'SERVICE_NOT_INITIALIZED');
    }
    return ipcRenderer.invoke('ffmpeg:cut', { input, output, startTime, endTime });
  }

  public async losslessMerge(inputs: string[], output: string): Promise<void> {
    if (!this.initialized) {
      throw this.createError('FFmpeg service not initialized', 'SERVICE_NOT_INITIALIZED');
    }
    return ipcRenderer.invoke('ffmpeg:merge', { inputs, output });
  }

  public async extractStream(
    input: string,
    output: string,
    streamIndex: number
  ): Promise<void> {
    if (!this.initialized) {
      throw this.createError('FFmpeg service not initialized', 'SERVICE_NOT_INITIALIZED');
    }
    return ipcRenderer.invoke('ffmpeg:extract-stream', { input, output, streamIndex });
  }

  public async generateThumbnails(
    input: string,
    outputPattern: string,
    interval: number
  ): Promise<string[]> {
    if (!this.initialized) {
      throw this.createError('FFmpeg service not initialized', 'SERVICE_NOT_INITIALIZED');
    }
    return ipcRenderer.invoke('ffmpeg:thumbnails', { input, outputPattern, interval });
  }

  public async extractWaveform(input: string): Promise<number[]> {
    if (!this.initialized) {
      throw this.createError('FFmpeg service not initialized', 'SERVICE_NOT_INITIALIZED');
    }
    return ipcRenderer.invoke('ffmpeg:waveform', { input });
  }

  public async detectScenes(input: string): Promise<number[]> {
    if (!this.initialized) {
      throw this.createError('FFmpeg service not initialized', 'SERVICE_NOT_INITIALIZED');
    }
    return ipcRenderer.invoke('ffmpeg:scene-detect', { input });
  }

  public async detectSilence(
    input: string,
    threshold: number = -50
  ): Promise<Array<{ start: number; end: number }>> {
    if (!this.initialized) {
      throw this.createError('FFmpeg service not initialized', 'SERVICE_NOT_INITIALIZED');
    }
    return ipcRenderer.invoke('ffmpeg:silence-detect', { input, threshold });
  }

  public async remux(input: string, output: string): Promise<void> {
    if (!this.initialized) {
      throw this.createError('FFmpeg service not initialized', 'SERVICE_NOT_INITIALIZED');
    }
    return ipcRenderer.invoke('ffmpeg:remux', { input, output });
  }

  public async updateMetadata(
    input: string,
    output: string,
    metadata: Record<string, string>
  ): Promise<void> {
    if (!this.initialized) {
      throw this.createError('FFmpeg service not initialized', 'SERVICE_NOT_INITIALIZED');
    }
    return ipcRenderer.invoke('ffmpeg:metadata', { input, output, metadata });
  }

  public async getVersionInfo(): Promise<{ ffmpeg: string; ffprobe: string }> {
    return ipcRenderer.invoke('ffmpeg:version');
  }

  // Type-safe event emitter methods
  public override on<K extends keyof FFmpegEvents>(
    event: K,
    listener: FFmpegEvents[K]
  ): this {
    return super.on(event, listener);
  }

  public override off<K extends keyof FFmpegEvents>(
    event: K,
    listener: FFmpegEvents[K]
  ): this {
    return super.off(event, listener);
  }

  public override emit<K extends keyof FFmpegEvents>(
    event: K,
    ...args: Parameters<FFmpegEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}

export default FFmpegService.getInstance();
