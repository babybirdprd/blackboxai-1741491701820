import React, { useEffect, useRef, useState } from 'react';
import TimelineService, { TimelineState, TimelineTrack, TimelineSegment } from '../../services/TimelineService';
import LosslessVideoService from '../../services/LosslessVideoService';

interface TimelineProps {
  onSegmentSelect?: (segment: TimelineSegment) => void;
  onPlayheadChange?: (position: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ onSegmentSelect, onPlayheadChange }) => {
  const [timelineState, setTimelineState] = useState<TimelineState>(TimelineService.getState());
  const timelineRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);
  const draggedSegment = useRef<string | null>(null);
  const dragOffset = useRef<number>(0);

  // Constants for timeline display
  const PIXELS_PER_SECOND = 50; // Base scale before zoom
  const TRACK_HEIGHT = 80;
  const TIMELINE_HEIGHT = 600;

  useEffect(() => {
    // Subscribe to timeline service events
    const handleStateUpdate = () => {
      setTimelineState(TimelineService.getState());
    };

    TimelineService.on('trackAdded', handleStateUpdate);
    TimelineService.on('trackRemoved', handleStateUpdate);
    TimelineService.on('segmentAdded', handleStateUpdate);
    TimelineService.on('segmentRemoved', handleStateUpdate);
    TimelineService.on('segmentMoved', handleStateUpdate);
    TimelineService.on('playheadMoved', handleStateUpdate);
    TimelineService.on('zoomChanged', handleStateUpdate);
    TimelineService.on('durationChanged', handleStateUpdate);

    return () => {
      TimelineService.removeListener('trackAdded', handleStateUpdate);
      TimelineService.removeListener('trackRemoved', handleStateUpdate);
      TimelineService.removeListener('segmentAdded', handleStateUpdate);
      TimelineService.removeListener('segmentRemoved', handleStateUpdate);
      TimelineService.removeListener('segmentMoved', handleStateUpdate);
      TimelineService.removeListener('playheadMoved', handleStateUpdate);
      TimelineService.removeListener('zoomChanged', handleStateUpdate);
      TimelineService.removeListener('durationChanged', handleStateUpdate);
    };
  }, []);

  // Convert time to pixels
  const timeToPixels = (time: number): number => {
    return time * PIXELS_PER_SECOND * timelineState.zoom;
  };

  // Convert pixels to time
  const pixelsToTime = (pixels: number): number => {
    return pixels / (PIXELS_PER_SECOND * timelineState.zoom);
  };

  // Handle timeline click for playhead positioning
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPosition = pixelsToTime(x);

    TimelineService.setPlayhead(newPosition);
    onPlayheadChange?.(newPosition);
  };

  // Handle segment drag start
  const handleSegmentDragStart = (e: React.MouseEvent, segmentId: string) => {
    e.stopPropagation();
    isDragging.current = true;
    draggedSegment.current = segmentId;

    // Calculate drag offset
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    dragOffset.current = e.clientX - rect.left;
  };

  // Handle segment drag
  const handleSegmentDrag = (e: React.MouseEvent) => {
    if (!isDragging.current || !draggedSegment.current || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.current;
    const newPosition = pixelsToTime(x);

    TimelineService.moveSegment(draggedSegment.current, newPosition);
  };

  // Handle segment drag end
  const handleSegmentDragEnd = () => {
    isDragging.current = false;
    draggedSegment.current = null;
  };

  // Render timeline ruler
  const renderRuler = () => {
    const duration = timelineState.duration;
    const width = timeToPixels(duration);
    const intervals = [];
    const intervalSize = 1; // 1 second intervals

    for (let time = 0; time <= duration; time += intervalSize) {
      const position = timeToPixels(time);
      intervals.push(
        <div
          key={time}
          className="absolute h-4 border-l border-gray-400"
          style={{ left: `${position}px` }}
        >
          <span className="text-xs text-gray-600">{formatTime(time)}</span>
        </div>
      );
    }

    return (
      <div className="h-8 relative border-b border-gray-300">
        {intervals}
      </div>
    );
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Render track
  const renderTrack = (track: TimelineTrack) => {
    return (
      <div
        key={track.id}
        className="relative h-20 border-b border-gray-300"
        style={{ height: `${TRACK_HEIGHT}px` }}
      >
        <div className="absolute left-0 top-0 w-20 h-full bg-gray-100 border-r border-gray-300 flex items-center justify-center">
          <span className="text-sm font-medium">{track.type}</span>
        </div>
        <div className="absolute left-20 top-0 right-0 h-full">
          {track.segments.map(segment => renderSegment(segment))}
        </div>
      </div>
    );
  };

  // Render segment
  const renderSegment = (segment: TimelineSegment) => {
    const width = timeToPixels(segment.duration);
    const left = timeToPixels(segment.position);

    return (
      <div
        key={segment.id}
        className={`absolute top-2 h-16 bg-blue-500 rounded cursor-move ${
          segment.selected ? 'ring-2 ring-yellow-400' : ''
        }`}
        style={{
          left: `${left}px`,
          width: `${width}px`
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSegmentSelect?.(segment);
        }}
        onMouseDown={(e) => handleSegmentDragStart(e, segment.id)}
        onMouseUp={handleSegmentDragEnd}
      >
        <div className="p-2 text-xs text-white truncate">
          {segment.filePath.split('/').pop()}
        </div>
      </div>
    );
  };

  // Render playhead
  const renderPlayhead = () => {
    const position = timeToPixels(timelineState.playhead);

    return (
      <div
        className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
        style={{ left: `${position}px` }}
      >
        <div className="w-4 h-4 -ml-2 bg-red-500 transform rotate-45" />
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-12 flex items-center space-x-4 px-4 border-b border-gray-300">
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded"
          onClick={() => TimelineService.createTrack('video')}
        >
          Add Video Track
        </button>
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded"
          onClick={() => TimelineService.createTrack('audio')}
        >
          Add Audio Track
        </button>
        <div className="flex items-center space-x-2">
          <label className="text-sm">Zoom:</label>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={timelineState.zoom}
            onChange={(e) => TimelineService.setZoom(parseFloat(e.target.value))}
            className="w-32"
          />
        </div>
      </div>

      {/* Timeline */}
      <div
        ref={timelineRef}
        className="flex-1 relative overflow-auto"
        onClick={handleTimelineClick}
        onMouseMove={handleSegmentDrag}
        onMouseUp={handleSegmentDragEnd}
        onMouseLeave={handleSegmentDragEnd}
      >
        <div
          className="absolute top-0 left-0"
          style={{
            width: `${timeToPixels(timelineState.duration)}px`,
            height: `${TIMELINE_HEIGHT}px`
          }}
        >
          {renderRuler()}
          {timelineState.tracks.map(renderTrack)}
          {renderPlayhead()}
        </div>
      </div>
    </div>
  );
};

export default Timeline;