import { EventEmitter } from 'events';
import { ServiceError } from '../interfaces';

export interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  segments: TimelineSegment[];
  muted?: boolean;
  solo?: boolean;
  locked?: boolean;
}

export interface TimelineSegment {
  id: string;
  trackId: string;
  position: number;
  duration: number;
  selected?: boolean;
  locked?: boolean;
  effects?: TimelineEffect[];
  // Media properties
  path: string;
  startTime: number;
  endTime: number;
  type: 'video' | 'audio' | 'subtitle';
}

export interface TimelineEffect {
  id: string;
  type: string;
  startTime: number;
  endTime: number;
  parameters: Record<string, unknown>;
}

export interface TimelineState {
  tracks: TimelineTrack[];
  duration: number;
  zoom: number;
  playhead: number;
  selection: string[];
  inPoint?: number;
  outPoint?: number;
}

export interface TimelineEvents {
  // Service lifecycle events
  initialized: () => void;
  disposed: () => void;
  error: (error: ServiceError) => void;

  // Timeline specific events
  trackAdded: (track: TimelineTrack) => void;
  trackRemoved: (track: TimelineTrack) => void;
  segmentAdded: (segment: TimelineSegment) => void;
  segmentRemoved: (segment: TimelineSegment) => void;
  segmentMoved: (segment: TimelineSegment) => void;
  effectAdded: (data: { segmentId: string; effect: TimelineEffect }) => void;
  effectRemoved: (data: { segmentId: string; effect: TimelineEffect }) => void;
  playheadMoved: (position: number) => void;
  zoomChanged: (zoom: number) => void;
  inOutPointsChanged: (points: { inPoint?: number; outPoint?: number }) => void;
  selectionChanged: (segmentIds: string[]) => void;
  durationChanged: (duration: number) => void;
}

export class TimelineEventEmitter extends EventEmitter {
  public on<K extends keyof TimelineEvents>(event: K, listener: TimelineEvents[K]): this {
    return super.on(event, listener);
  }

  public off<K extends keyof TimelineEvents>(event: K, listener: TimelineEvents[K]): this {
    return super.off(event, listener);
  }

  public emit<K extends keyof TimelineEvents>(
    event: K,
    ...args: Parameters<TimelineEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  public once<K extends keyof TimelineEvents>(event: K, listener: TimelineEvents[K]): this {
    return super.once(event, listener);
  }

  protected emitError(error: Error | string, code?: string, details?: unknown): void {
    const serviceError: ServiceError = error instanceof Error
      ? { ...error, code, details }
      : {
          name: 'TimelineError',
          message: error,
          code: code || 'TIMELINE_ERROR',
          details,
        };

    this.emit('error', serviceError);
  }

  protected emitInitialized(): void {
    this.emit('initialized');
  }

  protected emitDisposed(): void {
    this.emit('disposed');
  }

  protected createError(
    message: string,
    code: string = 'TIMELINE_ERROR',
    details?: unknown
  ): ServiceError {
    return {
      name: 'TimelineError',
      message,
      code,
      details,
    };
  }
}
