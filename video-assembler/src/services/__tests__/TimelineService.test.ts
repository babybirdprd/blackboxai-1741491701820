import TimelineService, { TimelineTrack, TimelineSegment } from '../TimelineService';

describe('TimelineService', () => {
  let timelineService: TimelineService;

  beforeEach(() => {
    timelineService = TimelineService.getInstance();
    // Reset the timeline state
    const tracks = timelineService.getState().tracks;
    tracks.forEach(track => {
      timelineService.removeTrack(track.id);
    });
  });

  describe('Track Management', () => {
    it('should create a new track', () => {
      const track = timelineService.createTrack('video');
      
      expect(track).toBeDefined();
      expect(track.type).toBe('video');
      expect(track.segments).toHaveLength(0);
      expect(timelineService.getState().tracks).toContain(track);
    });

    it('should remove a track', () => {
      const track = timelineService.createTrack('audio');
      const trackId = track.id;
      
      timelineService.removeTrack(trackId);
      
      expect(timelineService.getState().tracks).not.toContain(track);
    });

    it('should get tracks by type', () => {
      const videoTrack = timelineService.createTrack('video');
      const audioTrack = timelineService.createTrack('audio');
      
      const videoTracks = timelineService.getTracksByType('video');
      const audioTracks = timelineService.getTracksByType('audio');
      
      expect(videoTracks).toContain(videoTrack);
      expect(audioTracks).toContain(audioTrack);
      expect(videoTracks).not.toContain(audioTrack);
    });
  });

  describe('Segment Management', () => {
    let track: TimelineTrack;
    let segment: TimelineSegment;

    beforeEach(() => {
      track = timelineService.createTrack('video');
      segment = {
        id: 'test-segment',
        trackId: track.id,
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 10,
        position: 0,
        duration: 10
      };
    });

    it('should add a segment to a track', () => {
      const addedSegment = timelineService.addSegment(track.id, segment, 0);
      
      expect(addedSegment).toBeDefined();
      expect(track.segments).toContain(addedSegment);
      expect(addedSegment.position).toBe(0);
    });

    it('should remove a segment from a track', () => {
      const addedSegment = timelineService.addSegment(track.id, segment, 0);
      
      timelineService.removeSegment(track.id, addedSegment.id);
      
      expect(track.segments).not.toContain(addedSegment);
    });

    it('should move a segment to a new position', () => {
      const addedSegment = timelineService.addSegment(track.id, segment, 0);
      const newPosition = 5;
      
      timelineService.moveSegment(addedSegment.id, newPosition);
      
      const updatedSegment = track.segments.find(s => s.id === addedSegment.id);
      expect(updatedSegment?.position).toBe(newPosition);
    });

    it('should update duration when segments change', () => {
      const segment1 = timelineService.addSegment(track.id, {
        ...segment,
        position: 0,
        duration: 10
      }, 0);

      const segment2 = timelineService.addSegment(track.id, {
        ...segment,
        id: 'test-segment-2',
        position: 10,
        duration: 15
      }, 10);

      expect(timelineService.getState().duration).toBe(25);

      timelineService.removeSegment(track.id, segment2.id);
      expect(timelineService.getState().duration).toBe(10);
    });
  });

  describe('Effect Management', () => {
    let track: TimelineTrack;
    let segment: TimelineSegment;

    beforeEach(() => {
      track = timelineService.createTrack('video');
      segment = timelineService.addSegment(track.id, {
        id: 'test-segment',
        trackId: track.id,
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 10,
        position: 0,
        duration: 10
      }, 0);
    });

    it('should add an effect to a segment', () => {
      const effect = timelineService.addEffect(segment.id, {
        type: 'blur',
        startTime: 0,
        endTime: 5,
        parameters: { radius: 10 }
      });

      const updatedSegment = track.segments.find(s => s.id === segment.id);
      expect(updatedSegment?.effects).toContain(effect);
    });

    it('should remove an effect from a segment', () => {
      const effect = timelineService.addEffect(segment.id, {
        type: 'blur',
        startTime: 0,
        endTime: 5,
        parameters: { radius: 10 }
      });

      timelineService.removeEffect(segment.id, effect.id);

      const updatedSegment = track.segments.find(s => s.id === segment.id);
      expect(updatedSegment?.effects).not.toContain(effect);
    });
  });

  describe('Playhead and Zoom Management', () => {
    it('should set and get playhead position', () => {
      const position = 5;
      
      timelineService.setPlayhead(position);
      
      expect(timelineService.getState().playhead).toBe(position);
    });

    it('should clamp playhead position to timeline duration', () => {
      const track = timelineService.createTrack('video');
      timelineService.addSegment(track.id, {
        id: 'test-segment',
        trackId: track.id,
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 10,
        position: 0,
        duration: 10
      }, 0);

      timelineService.setPlayhead(15);
      expect(timelineService.getState().playhead).toBe(10);

      timelineService.setPlayhead(-5);
      expect(timelineService.getState().playhead).toBe(0);
    });

    it('should set and get zoom level', () => {
      const zoom = 2;
      
      timelineService.setZoom(zoom);
      
      expect(timelineService.getState().zoom).toBe(zoom);
    });

    it('should clamp zoom level to valid range', () => {
      timelineService.setZoom(0);
      expect(timelineService.getState().zoom).toBe(0.1);

      timelineService.setZoom(11);
      expect(timelineService.getState().zoom).toBe(10);
    });
  });

  describe('Selection Management', () => {
    it('should set and get selection', () => {
      const track = timelineService.createTrack('video');
      const segment = timelineService.addSegment(track.id, {
        id: 'test-segment',
        trackId: track.id,
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 10,
        position: 0,
        duration: 10
      }, 0);

      timelineService.setSelection([segment.id]);
      
      expect(timelineService.getState().selection).toContain(segment.id);
      expect(segment.selected).toBe(true);
    });

    it('should clear selection when empty array is provided', () => {
      const track = timelineService.createTrack('video');
      const segment = timelineService.addSegment(track.id, {
        id: 'test-segment',
        trackId: track.id,
        filePath: 'test.mp4',
        startTime: 0,
        endTime: 10,
        position: 0,
        duration: 10
      }, 0);

      timelineService.setSelection([segment.id]);
      timelineService.setSelection([]);
      
      expect(timelineService.getState().selection).toHaveLength(0);
      expect(segment.selected).toBe(false);
    });
  });
});