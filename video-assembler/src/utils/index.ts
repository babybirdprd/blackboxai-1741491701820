import { TimelineSegment } from '../services/TimelineService';

// Time formatting utilities
export const formatTime = (seconds: number, includeMilliseconds = false): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const parts = [
    hours > 0 ? hours.toString().padStart(2, '0') : null,
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].filter(Boolean);

  return includeMilliseconds
    ? `${parts.join(':')}.${ms.toString().padStart(3, '0')}`
    : parts.join(':');
};

export const parseTime = (timeString: string): number => {
  const parts = timeString.split(':');
  const seconds = parts.reduce((acc, part) => acc * 60 + parseFloat(part), 0);
  return seconds;
};

// File utilities
export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

export const isVideoFile = (filename: string): boolean => {
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'];
  return videoExtensions.includes(getFileExtension(filename).toLowerCase());
};

export const isAudioFile = (filename: string): boolean => {
  const audioExtensions = ['mp3', 'wav', 'aac', 'flac', 'm4a'];
  return audioExtensions.includes(getFileExtension(filename).toLowerCase());
};

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  return imageExtensions.includes(getFileExtension(filename).toLowerCase());
};

// Timeline utilities
export const getSegmentDuration = (segment: TimelineSegment): number => {
  return segment.endTime - segment.startTime;
};

export const getSegmentEnd = (segment: TimelineSegment): number => {
  return segment.position + getSegmentDuration(segment);
};

export const detectOverlap = (
  segment: TimelineSegment,
  otherSegment: TimelineSegment
): boolean => {
  return (
    segment.position < getSegmentEnd(otherSegment) &&
    getSegmentEnd(segment) > otherSegment.position
  );
};

export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

// Color utilities
export const hexToRgba = (hex: string, alpha = 1): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const generateContrastingColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Error handling utilities
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

// Validation utilities
export const validateTimelineSegment = (segment: TimelineSegment): boolean => {
  return (
    segment.startTime >= 0 &&
    segment.endTime > segment.startTime &&
    segment.position >= 0 &&
    segment.duration > 0
  );
};

// Math utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const lerp = (start: number, end: number, t: number): number => {
  return start * (1 - t) + end * t;
};

// Array utilities
export const moveItem = <T>(array: T[], fromIndex: number, toIndex: number): T[] => {
  const item = array[fromIndex];
  const newArray = array.filter((_, index) => index !== fromIndex);
  newArray.splice(toIndex, 0, item);
  return newArray;
};

// Object utilities
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepClone) as unknown as T;
  }

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, deepClone(value)])
  ) as T;
};

// Event utilities
export type EventCallback = (...args: any[]) => void;

export class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(callback => callback(...args));
  }

  clear(): void {
    this.listeners.clear();
  }
}

// Export all utilities
export const utils = {
  time: {
    format: formatTime,
    parse: parseTime
  },
  file: {
    getExtension: getFileExtension,
    isVideo: isVideoFile,
    isAudio: isAudioFile,
    isImage: isImageFile
  },
  timeline: {
    getSegmentDuration,
    getSegmentEnd,
    detectOverlap,
    snapToGrid
  },
  color: {
    hexToRgba,
    generateContrastingColor
  },
  async: {
    debounce,
    throttle
  },
  error: {
    AppError,
    isAppError
  },
  validation: {
    validateTimelineSegment
  },
  math: {
    clamp,
    lerp
  },
  array: {
    moveItem
  },
  object: {
    deepClone
  },
  events: {
    EventEmitter
  }
};