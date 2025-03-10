export interface VideoSegment {
  id: string;
  filePath: string;
  startTime: number;
  endTime: number;
  duration: number;
  streamInfo?: {
    videoStreams: number[];
    audioStreams: number[];
    subtitleStreams: number[];
  };
}

export interface VideoMetadata {
  width: number;
  height: number;
  frameRate: number;
  codec: string;
  bitrate: number;
  duration: number;
  hasAudio: boolean;
  hasVideo: boolean;
}

export interface VideoProcessingOptions {
  outputPath: string;
  preserveMetadata?: boolean;
  selectedStreams?: {
    video?: number[];
    audio?: number[];
    subtitle?: number[];
  };
}

export interface VideoProcessingProgress {
  type: 'progress' | 'complete' | 'error';
  percentage?: number;
  currentFrame?: number;
  totalFrames?: number;
  timeRemaining?: number;
  error?: string;
}
