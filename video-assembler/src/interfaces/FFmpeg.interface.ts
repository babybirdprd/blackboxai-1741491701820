export interface FFmpegProgress {
  frame: number;
  fps: number;
  q: number;
  size: string;
  time: string;
  bitrate: string;
  speed: string;
}

export interface MediaStream {
  index: number;
  codec_type: string;
  codec_name: string;
  width?: number;
  height?: number;
  sample_rate?: string;
  channels?: number;
}

export interface MediaFormat {
  filename: string;
  duration: string;
  size: string;
  bit_rate: string;
  tags?: Record<string, string>;
}

export interface MediaInfo {
  format: MediaFormat;
  streams: MediaStream[];
}

export interface IFFmpegService {
  /**
   * Get media file information
   */
  getMediaInfo(filePath: string): Promise<MediaInfo>;

  /**
   * Perform lossless cut of a video file
   */
  losslessCut(input: string, output: string, startTime: number, endTime: number): Promise<void>;

  /**
   * Merge multiple video files with compatible codecs
   */
  losslessMerge(inputs: string[], output: string): Promise<void>;

  /**
   * Extract specific stream from media file
   */
  extractStream(input: string, output: string, streamIndex: number): Promise<void>;

  /**
   * Generate thumbnails for video
   */
  generateThumbnails(input: string, outputPattern: string, interval: number): Promise<string[]>;

  /**
   * Extract audio waveform data
   */
  extractWaveform(input: string): Promise<number[]>;

  /**
   * Detect scene changes in video
   */
  detectScenes(input: string): Promise<number[]>;

  /**
   * Detect silent segments in audio
   */
  detectSilence(input: string, threshold?: number): Promise<Array<{start: number, end: number}>>;

  /**
   * Remux video to different container format
   */
  remux(input: string, output: string): Promise<void>;

  /**
   * Update video metadata
   */
  updateMetadata(input: string, output: string, metadata: Record<string, string>): Promise<void>;

  /**
   * Get FFmpeg version information
   */
  getVersionInfo(): Promise<{ ffmpeg: string; ffprobe: string }>;

  // Event handlers
  on(event: 'progress', listener: (progress: FFmpegProgress) => void): void;
  on(event: 'error', listener: (error: string) => void): void;
}

export interface FFmpegConfig {
  /**
   * Initialize FFmpeg configuration
   */
  initialize(): Promise<void>;

  /**
   * Get configured FFmpeg paths
   */
  getPaths(): { ffmpeg: string; ffprobe: string };

  /**
   * Get FFmpeg version information
   */
  getVersionInfo(): Promise<{ ffmpeg: string; ffprobe: string }>;
}
