import { VideoSegment } from '../services/LosslessVideoService';

export interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  segments: TimelineSegment[];
  name: string;
  height: number;
  muted?: boolean;
  solo?: boolean;
  locked?: boolean;
  collapsed?: boolean;
  color?: string;
  volume?: number;
  pan?: number;
  effects?: TimelineEffect[];
}

export interface TimelineSegment extends VideoSegment {
  trackId: string;
  position: number;
  duration: number;
  selected?: boolean;
  locked?: boolean;
  effects?: TimelineEffect[];
  thumbnailUrls?: string[];
  waveformData?: number[];
  metadata?: {
    name?: string;
    description?: string;
    tags?: string[];
    customProperties?: Record<string, unknown>;
  };
  transitions?: {
    in?: TimelineEffect;
    out?: TimelineEffect;
  };
}

export interface Keyframe {
  id: string;
  time: number;
  value: number | string | boolean | Record<string, unknown>;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bezier';
  bezierPoints?: [number, number, number, number]; // [x1, y1, x2, y2] control points
}

export interface EffectParameter {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'color' | 'select' | 'vector2' | 'vector3';
  value: number | string | boolean | Record<string, unknown>;
  keyframes?: Keyframe[];
  min?: number;
  max?: number;
  options?: string[] | { label: string; value: string | number }[];
  default: number | string | boolean | Record<string, unknown>;
}

export interface TimelineEffect {
  id: string;
  type: string;
  name: string;
  startTime: number;
  endTime: number;
  category: 'transform' | 'filter' | 'transition' | 'text' | 'audio' | 'custom';
  parameters: EffectParameter[];
  enabled: boolean;
  previewUrl?: string;
}

export interface EffectTemplate {
  id: string;
  name: string;
  category: TimelineEffect['category'];
  description?: string;
  parameters: Omit<EffectParameter, 'id' | 'keyframes'>[];
  thumbnailUrl?: string;
}

export interface TimelineState {
  tracks: TimelineTrack[];
  duration: number;
  zoom: number;
  playhead: number;
  selection: string[];
  inPoint?: number;
  outPoint?: number;
  viewportStart: number;
  viewportEnd: number;
  snapEnabled: boolean;
  snapTolerance: number;
  thumbnailsEnabled: boolean;
  waveformsEnabled: boolean;
  effectTemplates: EffectTemplate[];
  history: {
    past: TimelineState[];
    future: TimelineState[];
  };
}

export interface ITimelineService {
  /**
   * Get current timeline state
   */
  getState(): TimelineState;

  /**
   * Create a new track
   */
  createTrack(type: 'video' | 'audio' | 'subtitle'): TimelineTrack;

  /**
   * Remove a track
   */
  removeTrack(trackId: string): void;

  /**
   * Add segment to track
   */
  addSegment(trackId: string, segment: VideoSegment, position: number): TimelineSegment;

  /**
   * Remove segment from track
   */
  removeSegment(trackId: string, segmentId: string): void;

  /**
   * Move segment to new position
   */
  moveSegment(segmentId: string, newPosition: number): void;

  /**
   * Add effect to segment
   */
  addEffect(segmentId: string, effect: Omit<TimelineEffect, 'id'>): TimelineEffect;

  /**
   * Remove effect from segment
   */
  removeEffect(segmentId: string, effectId: string): void;

  /**
   * Set playhead position
   */
  setPlayhead(position: number): void;

  /**
   * Set zoom level
   */
  setZoom(zoom: number): void;

  /**
   * Set in/out points
   */
  setInOutPoints(inPoint?: number, outPoint?: number): void;

  /**
   * Select segments
   */
  setSelection(segmentIds: string[]): void;

  /**
   * Get segments at time
   */
  getSegmentsAtTime(time: number): TimelineSegment[];

  /**
   * Get track by type
   */
  getTracksByType(type: 'video' | 'audio' | 'subtitle'): TimelineTrack[];

  // Event handlers
  on(event: 'trackAdded', listener: (track: TimelineTrack) => void): void;
  on(event: 'trackRemoved', listener: (track: TimelineTrack) => void): void;
  on(event: 'segmentAdded', listener: (segment: TimelineSegment) => void): void;
  on(event: 'segmentRemoved', listener: (segment: TimelineSegment) => void): void;
  on(event: 'segmentMoved', listener: (segment: TimelineSegment) => void): void;
  on(event: 'effectAdded', listener: (data: { segmentId: string; effect: TimelineEffect }) => void): void;
  on(event: 'effectRemoved', listener: (data: { segmentId: string; effect: TimelineEffect }) => void): void;
  on(event: 'playheadMoved', listener: (position: number) => void): void;
  on(event: 'zoomChanged', listener: (zoom: number) => void): void;
  on(event: 'inOutPointsChanged', listener: (points: { inPoint?: number; outPoint?: number }) => void): void;
  on(event: 'selectionChanged', listener: (segmentIds: string[]) => void): void;
  on(event: 'durationChanged', listener: (duration: number) => void): void;
}
