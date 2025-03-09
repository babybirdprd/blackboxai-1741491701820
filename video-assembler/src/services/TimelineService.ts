import { EventEmitter } from 'events';
import { VideoSegment } from './LosslessVideoService';

export interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  segments: TimelineSegment[];
  muted?: boolean;
  solo?: boolean;
  locked?: boolean;
}

export interface TimelineSegment extends VideoSegment {
  trackId: string;
  position: number; // Position in timeline (seconds)
  duration: number; // Duration of segment (seconds)
  selected?: boolean;
  locked?: boolean;
  effects?: TimelineEffect[];
}

export interface TimelineEffect {
  id: string;
  type: string;
  startTime: number; // Relative to segment start
  endTime: number; // Relative to segment start
  parameters: Record<string, any>;
}

export interface TimelineState {
  tracks: TimelineTrack[];
  duration: number;
  zoom: number;
  playhead: number;
  selection: string[]; // Array of selected segment IDs
  inPoint?: number;
  outPoint?: number;
}

export class TimelineService extends EventEmitter {
  private static instance: TimelineService;
  private state: TimelineState;

  private constructor() {
    super();
    this.state = {
      tracks: [],
      duration: 0,
      zoom: 1,
      playhead: 0,
      selection: []
    };
  }

  public static getInstance(): TimelineService {
    if (!TimelineService.instance) {
      TimelineService.instance = new TimelineService();
    }
    return TimelineService.instance;
  }

  /**
   * Get current timeline state
   */
  public getState(): TimelineState {
    return { ...this.state };
  }

  /**
   * Create a new track
   */
  public createTrack(type: 'video' | 'audio' | 'subtitle'): TimelineTrack {
    const track: TimelineTrack = {
      id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      segments: []
    };

    this.state.tracks.push(track);
    this.emit('trackAdded', track);
    return track;
  }

  /**
   * Remove a track
   */
  public removeTrack(trackId: string): void {
    const trackIndex = this.state.tracks.findIndex(t => t.id === trackId);
    if (trackIndex !== -1) {
      const track = this.state.tracks[trackIndex];
      this.state.tracks.splice(trackIndex, 1);
      this.emit('trackRemoved', track);
      this.updateDuration();
    }
  }

  /**
   * Add segment to track
   */
  public addSegment(trackId: string, segment: VideoSegment, position: number): TimelineSegment {
    const track = this.state.tracks.find(t => t.id === trackId);
    if (!track) throw new Error(`Track ${trackId} not found`);

    const timelineSegment: TimelineSegment = {
      ...segment,
      trackId,
      position,
      duration: segment.endTime - segment.startTime,
      effects: []
    };

    track.segments.push(timelineSegment);
    track.segments.sort((a, b) => a.position - b.position);
    
    this.emit('segmentAdded', timelineSegment);
    this.updateDuration();
    
    return timelineSegment;
  }

  /**
   * Remove segment from track
   */
  public removeSegment(trackId: string, segmentId: string): void {
    const track = this.state.tracks.find(t => t.id === trackId);
    if (!track) return;

    const segmentIndex = track.segments.findIndex(s => s.id === segmentId);
    if (segmentIndex !== -1) {
      const segment = track.segments[segmentIndex];
      track.segments.splice(segmentIndex, 1);
      this.emit('segmentRemoved', segment);
      this.updateDuration();
    }
  }

  /**
   * Move segment to new position
   */
  public moveSegment(segmentId: string, newPosition: number): void {
    for (const track of this.state.tracks) {
      const segment = track.segments.find(s => s.id === segmentId);
      if (segment) {
        segment.position = Math.max(0, newPosition);
        track.segments.sort((a, b) => a.position - b.position);
        this.emit('segmentMoved', segment);
        this.updateDuration();
        break;
      }
    }
  }

  /**
   * Add effect to segment
   */
  public addEffect(segmentId: string, effect: Omit<TimelineEffect, 'id'>): TimelineEffect {
    for (const track of this.state.tracks) {
      const segment = track.segments.find(s => s.id === segmentId);
      if (segment) {
        const timelineEffect: TimelineEffect = {
          ...effect,
          id: `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        segment.effects = segment.effects || [];
        segment.effects.push(timelineEffect);
        this.emit('effectAdded', { segmentId, effect: timelineEffect });
        return timelineEffect;
      }
    }
    throw new Error(`Segment ${segmentId} not found`);
  }

  /**
   * Remove effect from segment
   */
  public removeEffect(segmentId: string, effectId: string): void {
    for (const track of this.state.tracks) {
      const segment = track.segments.find(s => s.id === segmentId);
      if (segment && segment.effects) {
        const effectIndex = segment.effects.findIndex(e => e.id === effectId);
        if (effectIndex !== -1) {
          const effect = segment.effects[effectIndex];
          segment.effects.splice(effectIndex, 1);
          this.emit('effectRemoved', { segmentId, effect });
        }
      }
    }
  }

  /**
   * Set playhead position
   */
  public setPlayhead(position: number): void {
    this.state.playhead = Math.max(0, Math.min(position, this.state.duration));
    this.emit('playheadMoved', this.state.playhead);
  }

  /**
   * Set zoom level
   */
  public setZoom(zoom: number): void {
    this.state.zoom = Math.max(0.1, Math.min(zoom, 10));
    this.emit('zoomChanged', this.state.zoom);
  }

  /**
   * Set in/out points
   */
  public setInOutPoints(inPoint?: number, outPoint?: number): void {
    if (inPoint !== undefined) {
      this.state.inPoint = Math.max(0, Math.min(inPoint, this.state.duration));
    }
    if (outPoint !== undefined) {
      this.state.outPoint = Math.max(0, Math.min(outPoint, this.state.duration));
    }
    this.emit('inOutPointsChanged', { inPoint: this.state.inPoint, outPoint: this.state.outPoint });
  }

  /**
   * Select segments
   */
  public setSelection(segmentIds: string[]): void {
    // Clear previous selection
    for (const track of this.state.tracks) {
      for (const segment of track.segments) {
        segment.selected = false;
      }
    }

    // Set new selection
    for (const track of this.state.tracks) {
      for (const segment of track.segments) {
        if (segmentIds.includes(segment.id)) {
          segment.selected = true;
        }
      }
    }

    this.state.selection = segmentIds;
    this.emit('selectionChanged', segmentIds);
  }

  /**
   * Update timeline duration based on segments
   */
  private updateDuration(): void {
    let maxDuration = 0;
    for (const track of this.state.tracks) {
      for (const segment of track.segments) {
        const segmentEnd = segment.position + segment.duration;
        maxDuration = Math.max(maxDuration, segmentEnd);
      }
    }
    this.state.duration = maxDuration;
    this.emit('durationChanged', maxDuration);
  }

  /**
   * Get segments at time
   */
  public getSegmentsAtTime(time: number): TimelineSegment[] {
    const segments: TimelineSegment[] = [];
    for (const track of this.state.tracks) {
      for (const segment of track.segments) {
        if (time >= segment.position && time < segment.position + segment.duration) {
          segments.push(segment);
        }
      }
    }
    return segments;
  }

  /**
   * Get track by type
   */
  public getTracksByType(type: 'video' | 'audio' | 'subtitle'): TimelineTrack[] {
    return this.state.tracks.filter(track => track.type === type);
  }
}

export default TimelineService.getInstance();