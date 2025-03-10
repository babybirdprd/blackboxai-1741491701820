import { BaseService, ServiceEvents } from '../interfaces/Service.interface';
import { 
  EffectParameter,
  ITimelineService, 
  Keyframe,
  TimelineEffect,
  TimelineSegment,
  TimelineState,
  TimelineTrack,
} from '../interfaces/Timeline.interface';
import { VideoSegment } from '../interfaces/Video.interface';

interface TimelineEvents extends ServiceEvents {
  trackAdded: (track: TimelineTrack) => void;
  trackRemoved: (track: TimelineTrack) => void;
  trackUpdated: (track: TimelineTrack) => void;
  segmentAdded: (segment: TimelineSegment) => void;
  segmentRemoved: (segment: TimelineSegment) => void;
  segmentMoved: (segment: TimelineSegment) => void;
  effectAdded: (data: { segmentId: string; effect: TimelineEffect }) => void;
  effectRemoved: (data: { segmentId: string; effect: TimelineEffect }) => void;
  effectUpdated: (data: { segmentId: string; effect: TimelineEffect }) => void;
  playheadMoved: (position: number) => void;
  zoomChanged: (zoom: number) => void;
  inOutPointsChanged: (points: { inPoint?: number; outPoint?: number }) => void;
  selectionChanged: (segmentIds: string[]) => void;
  durationChanged: (duration: number) => void;
  viewportChanged: (viewport: { start: number; end: number }) => void;
  snapSettingsChanged: (settings: { enabled: boolean; tolerance: number }) => void;
  visualSettingsChanged: (settings: { thumbnails: boolean; waveforms: boolean }) => void;
}

export class TimelineService extends BaseService {
  private static instance: TimelineService;
  private state: TimelineState;

  private constructor() {
    super();
    this.state = {
      tracks: [],
      duration: 0,
      zoom: 1,
      playhead: 0,
      selection: [],
      viewportStart: 0,
      viewportEnd: 0,
      snapEnabled: true,
      snapTolerance: 5,
      thumbnailsEnabled: true,
      waveformsEnabled: true,
      effectTemplates: [],
      history: {
        past: [],
        future: [],
      },
    };
  }

  public static getInstance(): TimelineService {
    if (!TimelineService.instance) {
      TimelineService.instance = new TimelineService();
    }
    return TimelineService.instance;
  }

  protected async initializeImpl(): Promise<void> {
    // No initialization needed
  }

  protected async disposeImpl(): Promise<void> {
    this.state = {
      tracks: [],
      duration: 0,
      zoom: 1,
      playhead: 0,
      selection: [],
      viewportStart: 0,
      viewportEnd: 0,
      snapEnabled: true,
      snapTolerance: 5,
      thumbnailsEnabled: true,
      waveformsEnabled: true,
      effectTemplates: [],
      history: {
        past: [],
        future: [],
      },
    };
  }

  public getState(): TimelineState {
    return { ...this.state };
  }

  public createTrack(type: 'video' | 'audio' | 'subtitle'): TimelineTrack {
    const track: TimelineTrack = {
      id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Track`,
      height: 80,
      segments: [],
      effects: [],
    };

    this.state.tracks.push(track);
    this.emit('trackAdded', track);
    return track;
  }

  public updateTrack(trackId: string, updates: Partial<TimelineTrack>): void {
    const track = this.findTrack(trackId);
    if (track) {
      Object.assign(track, updates);
      this.emit('trackUpdated', track);
    }
  }

  public removeTrack(trackId: string): void {
    const track = this.findTrack(trackId);
    if (track) {
      this.state.tracks = this.state.tracks.filter((t) => t.id !== trackId);
      this.emit('trackRemoved', track);
      this.updateDuration();
    }
  }

  public addSegment(trackId: string, segment: VideoSegment, position: number): TimelineSegment {
    const track = this.findTrack(trackId);
    if (!track) {
      throw this.createError(`Track ${trackId} not found`, 'TRACK_NOT_FOUND');
    }

    const timelineSegment: TimelineSegment = {
      ...segment,
      trackId,
      position,
      duration: segment.duration || 0,
      effects: [],
      metadata: {
        name: segment.filePath.split('/').pop(),
        tags: [],
      },
    };

    track.segments.push(timelineSegment);
    track.segments.sort((a, b) => a.position - b.position);
    
    this.emit('segmentAdded', timelineSegment);
    this.updateDuration();
    
    return timelineSegment;
  }

  public removeSegment(trackId: string, segmentId: string): void {
    const track = this.findTrack(trackId);
    if (track) {
      const segment = track.segments.find((s) => s.id === segmentId);
      if (segment) {
        track.segments = track.segments.filter((s) => s.id !== segmentId);
        this.emit('segmentRemoved', segment);
        this.updateDuration();
      }
    }
  }

  public moveSegment(segmentId: string, newPosition: number): void {
    for (const track of this.state.tracks) {
      const segment = track.segments.find((s) => s.id === segmentId);
      if (segment) {
        segment.position = newPosition;
        track.segments.sort((a, b) => a.position - b.position);
        this.emit('segmentMoved', segment);
        this.updateDuration();
        break;
      }
    }
  }

  public addEffect(segmentId: string, effect: Omit<TimelineEffect, 'id'>): TimelineEffect {
    const segment = this.findSegment(segmentId);
    if (!segment) {
      throw this.createError(`Segment ${segmentId} not found`, 'SEGMENT_NOT_FOUND');
    }

    const timelineEffect: TimelineEffect = {
      ...effect,
      id: `effect-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };

    segment.effects = segment.effects || [];
    segment.effects.push(timelineEffect);
    
    this.emit('effectAdded', { segmentId, effect: timelineEffect });
    return timelineEffect;
  }

  public removeEffect(segmentId: string, effectId: string): void {
    const segment = this.findSegment(segmentId);
    if (segment && segment.effects) {
      const effect = segment.effects.find((e) => e.id === effectId);
      if (effect) {
        segment.effects = segment.effects.filter((e) => e.id !== effectId);
        this.emit('effectRemoved', { segmentId, effect });
      }
    }
  }

  public updateEffectParameter(effectId: string, parameterId: string, value: unknown): void {
    for (const track of this.state.tracks) {
      for (const segment of track.segments) {
        const effect = segment.effects?.find((e) => e.id === effectId);
        if (effect) {
          const parameter = effect.parameters.find((p) => p.id === parameterId);
          if (parameter) {
            parameter.value = value;
            this.emit('effectUpdated', { segmentId: segment.id, effect });
          }
          return;
        }
      }
    }
  }

  public addEffectKeyframe(effectId: string, parameterId: string, time: number, value: unknown): void {
    for (const track of this.state.tracks) {
      for (const segment of track.segments) {
        const effect = segment.effects?.find((e) => e.id === effectId);
        if (effect) {
          const parameter = effect.parameters.find((p) => p.id === parameterId);
          if (parameter) {
            const keyframe: Keyframe = {
              id: `keyframe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              time,
              value: value as any,
              easing: 'linear',
            };
            parameter.keyframes = parameter.keyframes || [];
            parameter.keyframes.push(keyframe);
            parameter.keyframes.sort((a, b) => a.time - b.time);
            this.emit('effectUpdated', { segmentId: segment.id, effect });
          }
          return;
        }
      }
    }
  }

  public removeEffectKeyframe(effectId: string, parameterId: string, keyframeId: string): void {
    for (const track of this.state.tracks) {
      for (const segment of track.segments) {
        const effect = segment.effects?.find((e) => e.id === effectId);
        if (effect) {
          const parameter = effect.parameters.find((p) => p.id === parameterId);
          if (parameter && parameter.keyframes) {
            parameter.keyframes = parameter.keyframes.filter((k) => k.id !== keyframeId);
            this.emit('effectUpdated', { segmentId: segment.id, effect });
          }
          return;
        }
      }
    }
  }

  public setPlayhead(position: number): void {
    this.state.playhead = Math.max(0, Math.min(position, this.state.duration));
    this.emit('playheadMoved', this.state.playhead);
  }

  public setZoom(zoom: number): void {
    this.state.zoom = Math.max(0.1, Math.min(zoom, 10));
    this.emit('zoomChanged', this.state.zoom);
  }

  public setInOutPoints(inPoint?: number, outPoint?: number): void {
    this.state.inPoint = inPoint;
    this.state.outPoint = outPoint;
    this.emit('inOutPointsChanged', { inPoint, outPoint });
  }

  public setSelection(segmentIds: string[]): void {
    this.state.selection = segmentIds;
    this.emit('selectionChanged', segmentIds);
  }

  public setSnapEnabled(enabled: boolean): void {
    this.state.snapEnabled = enabled;
    this.emit('snapSettingsChanged', {
      enabled,
      tolerance: this.state.snapTolerance,
    });
  }

  public setThumbnailsEnabled(enabled: boolean): void {
    this.state.thumbnailsEnabled = enabled;
    this.emit('visualSettingsChanged', {
      thumbnails: enabled,
      waveforms: this.state.waveformsEnabled,
    });
  }

  public setWaveformsEnabled(enabled: boolean): void {
    this.state.waveformsEnabled = enabled;
    this.emit('visualSettingsChanged', {
      thumbnails: this.state.thumbnailsEnabled,
      waveforms: enabled,
    });
  }

  public getSegmentsAtTime(time: number): TimelineSegment[] {
    return this.state.tracks.flatMap((track) =>
      track.segments.filter((segment) =>
        time >= segment.position && time < segment.position + segment.duration
      )
    );
  }

  public getTracksByType(type: 'video' | 'audio' | 'subtitle'): TimelineTrack[] {
    return this.state.tracks.filter((track) => track.type === type);
  }

  private findTrack(trackId: string): TimelineTrack | undefined {
    return this.state.tracks.find((track) => track.id === trackId);
  }

  private findSegment(segmentId: string): TimelineSegment | undefined {
    for (const track of this.state.tracks) {
      const segment = track.segments.find((s) => s.id === segmentId);
      if (segment) return segment;
    }
    return undefined;
  }

  private updateDuration(): void {
    const newDuration = Math.max(
      0,
      ...this.state.tracks.flatMap((track) =>
        track.segments.map((segment) => segment.position + segment.duration)
      )
    );

    if (newDuration !== this.state.duration) {
      this.state.duration = newDuration;
      this.emit('durationChanged', newDuration);
    }
  }

  // Override event emitter methods to support TimelineEvents
  public override emit<K extends keyof TimelineEvents>(
    event: K,
    ...args: Parameters<TimelineEvents[K]>
  ): boolean {
    return super.emit(event as any, ...args);
  }

  public override on<K extends keyof TimelineEvents>(
    event: K,
    listener: TimelineEvents[K]
  ): this {
    return super.on(event as any, listener);
  }

  public override off<K extends keyof TimelineEvents>(
    event: K,
    listener: TimelineEvents[K]
  ): this {
    return super.off(event as any, listener);
  }

  public override once<K extends keyof TimelineEvents>(
    event: K,
    listener: TimelineEvents[K]
  ): this {
    return super.once(event as any, listener);
  }
}

export default TimelineService.getInstance();
