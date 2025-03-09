import { ipcRenderer } from 'electron';
import { EventEmitter } from 'events';

export interface FFmpegProgress {
  frame: number;
  fps: number;
  q: number;
  size: string;
  time: string;
  bitrate: string;
  speed: string;
}

export interface MediaInfo {
  format: {
    filename: string;
    duration: string;
    size: string;
    bit_rate: string;
  };
  streams: Array<{
    index: number;
    codec_type: string;
    codec_name: string;
    width?: number;
    height?: number;
    sample_rate?: string;
    channels?: number;
  }>;
}

export class FFmpegService extends EventEmitter {
  private static instance: FFmpegService;

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

    ipcRenderer.on('ffmpeg:error', (_, error: string) => {
      this.emit('error', error);
    });
  }

  /**
   * Get media file information
   */
  public async getMediaInfo(filePath: string): Promise<MediaInfo> {
    return ipcRenderer.invoke('ffmpeg:probe', filePath);
  }

  /**
   * Perform lossless cut of a video file
   */
  public async losslessCut(input: string, output: string, startTime: number, endTime: number): Promise<void> {
    return ipcRenderer.invoke('ffmpeg:cut', {
      input,
      output,
      startTime,
      endTime
    });
  }

  /**
   * Merge multiple video files with compatible codecs
   */
  public async losslessMerge(inputs: string[], output: string): Promise<void> {
    return ipcRenderer.invoke('ffmpeg:merge', {
      inputs,
      output
    });
  }

  /**
   * Extract specific stream from media file
   */
  public async extractStream(input: string, output: string, streamIndex: number): Promise<void> {
    return ipcRenderer.invoke('ffmpeg:extract-stream', {
      input,
      output,
      streamIndex
    });
  }

  /**
   * Generate thumbnails for video
   */
  public async generateThumbnails(input: string, outputPattern: string, interval: number): Promise<string[]> {
    return ipcRenderer.invoke('ffmpeg:thumbnails', {
      input,
      outputPattern,
      interval
    });
  }

  /**
   * Extract audio waveform data
   */
  public async extractWaveform(input: string): Promise<number[]> {
    return ipcRenderer.invoke('ffmpeg:waveform', {
      input
    });
  }

  /**
   * Detect scene changes in video
   */
  public async detectScenes(input: string): Promise<number[]> {
    return ipcRenderer.invoke('ffmpeg:scene-detect', {
      input
    });
  }

  /**
   * Detect silent segments in audio
   */
  public async detectSilence(input: string, threshold: number = -50): Promise<Array<{start: number, end: number}>> {
    return ipcRenderer.invoke('ffmpeg:silence-detect', {
      input,
      threshold
    });
  }

  /**
   * Remux video to different container format
   */
  public async remux(input: string, output: string): Promise<void> {
    return ipcRenderer.invoke('ffmpeg:remux', {
      input,
      output
    });
  }

  /**
   * Update video metadata
   */
  public async updateMetadata(input: string, output: string, metadata: Record<string, string>): Promise<void> {
    return ipcRenderer.invoke('ffmpeg:metadata', {
      input,
      output,
      metadata
    });
  }
}

export default FFmpegService.getInstance();