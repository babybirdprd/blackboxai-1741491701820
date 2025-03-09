import { create } from 'zustand';
import { TimelineSegment, TimelineTrack } from '../services/TimelineService';

interface TimelineState {
  tracks: TimelineTrack[];
  playhead: number;
  zoom: number;
  duration: number;
  selection: string[];
  inPoint?: number;
  outPoint?: number;
  isPlaying: boolean;
  
  // Actions
  addTrack: (type: 'video' | 'audio' | 'subtitle') => TimelineTrack;
  removeTrack: (trackId: string) => void;
  addSegment: (trackId: string, segment: Omit<TimelineSegment, 'trackId'>, position: number) => void;
  removeSegment: (trackId: string, segmentId: string) => void;
  moveSegment: (segmentId: string, newPosition: number) => void;
  setPlayhead: (position: number) => void;
  setZoom: (zoom: number) => void;
  setSelection: (segmentIds: string[]) => void;
  setInPoint: (time?: number) => void;
  setOutPoint: (time?: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  updateDuration: () => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  tracks: [],
  playhead: 0,
  zoom: 1,
  duration: 0,
  selection: [],
  isPlaying: false,

  addTrack: (type) => {
    const track: TimelineTrack = {
      id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      segments: []
    };
    set((state) => ({ tracks: [...state.tracks, track] }));
    return track;
  },

  removeTrack: (trackId) => {
    set((state) => ({
      tracks: state.tracks.filter((track) => track.id !== trackId)
    }));
    get().updateDuration();
  },

  addSegment: (trackId, segment, position) => {
    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id === trackId) {
          return {
            ...track,
            segments: [
              ...track.segments,
              {
                ...segment,
                trackId,
                position
              }
            ].sort((a, b) => a.position - b.position)
          };
        }
        return track;
      })
    }));
    get().updateDuration();
  },

  removeSegment: (trackId, segmentId) => {
    set((state) => ({
      tracks: state.tracks.map((track) => {
        if (track.id === trackId) {
          return {
            ...track,
            segments: track.segments.filter((segment) => segment.id !== segmentId)
          };
        }
        return track;
      })
    }));
    get().updateDuration();
  },

  moveSegment: (segmentId, newPosition) => {
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        segments: track.segments.map((segment) => {
          if (segment.id === segmentId) {
            return {
              ...segment,
              position: Math.max(0, newPosition)
            };
          }
          return segment;
        }).sort((a, b) => a.position - b.position)
      }))
    }));
    get().updateDuration();
  },

  setPlayhead: (position) => {
    const { duration } = get();
    set({ playhead: Math.max(0, Math.min(position, duration)) });
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.1, Math.min(zoom, 10)) });
  },

  setSelection: (segmentIds) => {
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        segments: track.segments.map((segment) => ({
          ...segment,
          selected: segmentIds.includes(segment.id)
        }))
      })),
      selection: segmentIds
    }));
  },

  setInPoint: (time) => {
    set({ inPoint: time });
  },

  setOutPoint: (time) => {
    set({ outPoint: time });
  },

  setIsPlaying: (isPlaying) => {
    set({ isPlaying });
  },

  updateDuration: () => {
    const { tracks } = get();
    let maxDuration = 0;
    
    tracks.forEach((track) => {
      track.segments.forEach((segment) => {
        const segmentEnd = segment.position + segment.duration;
        maxDuration = Math.max(maxDuration, segmentEnd);
      });
    });
    
    set({ duration: maxDuration });
  }
}));