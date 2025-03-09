import FFmpegService from './FFmpegService';
import { EventEmitter } from 'events';

export interface VideoSegment {
  id: string;
  filePath: string;
  startTime: number;
  endTime: number;
  streamInfo?: {
    videoStreams: number[];
    audioStreams: number[];
    subtitleStreams: number[];
  };
}

export interface ProcessingOptions {
  outputPath: string;
  preserveMetadata?: boolean;
  selectedStreams?: {
    video?: number[];
    audio?: number[];
    subtitle?: number[];
  };
}

export class LosslessVideoService extends EventEmitter {
  private static instance: LosslessVideoService;
  private processingQueue: Array<{ segments: VideoSegment[], options: ProcessingOptions }> = [];
  private isProcessing = false;

  private constructor() {
    super();
  }

  public static getInstance(): LosslessVideoService {
    if (!LosslessVideoService.instance) {
      LosslessVideoService.instance = new LosslessVideoService();
    }
    return LosslessVideoService.instance;
  }

  /**
   * Get media information for a file
   */
  public async analyzeFile(filePath: string) {
    try {
      const mediaInfo = await FFmpegService.getMediaInfo(filePath);
      return {
        duration: parseFloat(mediaInfo.format.duration),
        streams: mediaInfo.streams.map(stream => ({
          index: stream.index,
          type: stream.codec_type,
          codec: stream.codec_name,
          width: stream.width,
          height: stream.height,
          sampleRate: stream.sample_rate,
          channels: stream.channels
        }))
      };
    } catch (error) {
      this.emit('error', `Failed to analyze file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a segment from a video file
   */
  public async createSegment(
    filePath: string,
    startTime: number,
    endTime: number
  ): Promise<VideoSegment> {
    const mediaInfo = await this.analyzeFile(filePath);
    
    return {
      id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filePath,
      startTime,
      endTime,
      streamInfo: {
        videoStreams: mediaInfo.streams
          .filter(s => s.type === 'video')
          .map(s => s.index),
        audioStreams: mediaInfo.streams
          .filter(s => s.type === 'audio')
          .map(s => s.index),
        subtitleStreams: mediaInfo.streams
          .filter(s => s.type === 'subtitle')
          .map(s => s.index)
      }
    };
  }

  /**
   * Process segments into a single output file
   */
  public async processSegments(segments: VideoSegment[], options: ProcessingOptions): Promise<void> {
    this.processingQueue.push({ segments, options });
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { segments, options } = this.processingQueue.shift()!;

    try {
      // If only one segment and no stream selection, we can do a simple cut
      if (segments.length === 1 && !options.selectedStreams) {
        await this.processSingleSegment(segments[0], options);
      } else {
        await this.processMultipleSegments(segments, options);
      }

      this.emit('progress', { type: 'complete', outputPath: options.outputPath });
    } catch (error) {
      this.emit('error', `Processing failed: ${error.message}`);
      throw error;
    } finally {
      // Process next item in queue
      await this.processQueue();
    }
  }

  private async processSingleSegment(
    segment: VideoSegment,
    options: ProcessingOptions
  ): Promise<void> {
    await FFmpegService.losslessCut(
      segment.filePath,
      options.outputPath,
      segment.startTime,
      segment.endTime
    );

    if (options.preserveMetadata) {
      const mediaInfo = await FFmpegService.getMediaInfo(segment.filePath);
      await FFmpegService.updateMetadata(
        options.outputPath,
        options.outputPath + '.tmp',
        mediaInfo.format.tags || {}
      );
    }
  }

  private async processMultipleSegments(
    segments: VideoSegment[],
    options: ProcessingOptions
  ): Promise<void> {
    // Create temporary directory for intermediate files
    const tempFiles: string[] = [];
    
    try {
      // Process each segment
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const tempOutput = `${options.outputPath}.part${i}`;
        tempFiles.push(tempOutput);

        await FFmpegService.losslessCut(
          segment.filePath,
          tempOutput,
          segment.startTime,
          segment.endTime
        );

        this.emit('progress', {
          type: 'segment',
          current: i + 1,
          total: segments.length
        });
      }

      // Merge all segments
      await FFmpegService.losslessMerge(tempFiles, options.outputPath);

      // Clean up temp files
      for (const tempFile of tempFiles) {
        // Delete temp file (implement file deletion through IPC)
        this.emit('cleanup', tempFile);
      }
    } catch (error) {
      // Clean up temp files on error
      for (const tempFile of tempFiles) {
        this.emit('cleanup', tempFile);
      }
      throw error;
    }
  }

  /**
   * Extract specific streams from a video file
   */
  public async extractStreams(
    filePath: string,
    streamIndices: number[],
    outputPath: string
  ): Promise<void> {
    for (const streamIndex of streamIndices) {
      const extension = await this.getStreamExtension(filePath, streamIndex);
      const streamOutput = `${outputPath}_stream${streamIndex}${extension}`;
      await FFmpegService.extractStream(filePath, streamOutput, streamIndex);
    }
  }

  private async getStreamExtension(filePath: string, streamIndex: number): Promise<string> {
    const mediaInfo = await FFmpegService.getMediaInfo(filePath);
    const stream = mediaInfo.streams[streamIndex];
    
    switch (stream.codec_type) {
      case 'video':
        return '.mp4';
      case 'audio':
        return '.aac';
      case 'subtitle':
        return '.srt';
      default:
        return '.bin';
    }
  }

  /**
   * Generate video thumbnails
   */
  public async generateThumbnails(
    filePath: string,
    outputPattern: string,
    interval: number = 1
  ): Promise<string[]> {
    return FFmpegService.generateThumbnails(filePath, outputPattern, interval);
  }

  /**
   * Detect scenes in a video
   */
  public async detectScenes(filePath: string): Promise<number[]> {
    return FFmpegService.detectScenes(filePath);
  }

  /**
   * Detect silent segments in audio
   */
  public async detectSilence(
    filePath: string,
    threshold: number = -50
  ): Promise<Array<{start: number, end: number}>> {
    return FFmpegService.detectSilence(filePath, threshold);
  }
}

export default LosslessVideoService.getInstance();