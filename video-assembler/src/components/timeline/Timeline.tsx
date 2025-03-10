import React, { useEffect, useRef, useState } from 'react';
import TimelineService from '../../services/TimelineService';
import { TimelineState, TimelineTrack, TimelineSegment, TimelineEffect, EffectParameter, Keyframe } from '../../interfaces/Timeline.interface';
import { KeyframeEditor } from './KeyframeEditor';
import { EffectControls } from './EffectControls';
import { TrackHeader } from './TrackHeader';
import { TimelineRuler } from './TimelineRuler';
import { WaveformDisplay } from './WaveformDisplay';
import { ThumbnailStrip } from './ThumbnailStrip';

interface TimelineProps {
  onSegmentSelect?: (segment: TimelineSegment) => void;
  onPlayheadChange?: (position: number) => void;
  onEffectChange?: (effect: TimelineEffect) => void;
}

const Timeline: React.FC<TimelineProps> = ({ 
  onSegmentSelect, 
  onPlayheadChange,
  onEffectChange 
}) => {
  const [timelineState, setTimelineState] = useState<TimelineState>(TimelineService.getState());
  const [selectedEffect, setSelectedEffect] = useState<TimelineEffect | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);
  const draggedSegment = useRef<string | null>(null);
  const dragOffset = useRef<number>(0);
  const isSnapping = useRef<boolean>(false);

  // Constants for timeline display
  const PIXELS_PER_SECOND = 50; // Base scale before zoom
  const TRACK_HEIGHT = 80;
  const HEADER_WIDTH = 200;
  const MIN_SEGMENT_WIDTH = 10;

  useEffect(() => {
    const handleStateUpdate = () => {
      setTimelineState(TimelineService.getState());
    };

    // Subscribe to all timeline events
    const events = [
      'trackAdded', 'trackRemoved', 'segmentAdded', 'segmentRemoved',
      'segmentMoved', 'playheadMoved', 'zoomChanged', 'durationChanged',
      'effectAdded', 'effectRemoved', 'selectionChanged'
    ];

    events.forEach(event => {
      TimelineService.on(event, handleStateUpdate);
    });

    return () => {
      events.forEach(event => {
        TimelineService.removeListener(event, handleStateUpdate);
      });
    };
  }, []);

  const timeToPixels = (time: number): number => {
    return time * PIXELS_PER_SECOND * timelineState.zoom;
  };

  const pixelsToTime = (pixels: number): number => {
    return pixels / (PIXELS_PER_SECOND * timelineState.zoom);
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - HEADER_WIDTH;
    const newPosition = Math.max(0, pixelsToTime(x));

    TimelineService.setPlayhead(newPosition);
    onPlayheadChange?.(newPosition);
  };

  const findNearestSnapPoint = (time: number): number => {
    if (!timelineState.snapEnabled) return time;

    const snapPoints: number[] = [];
    // Add segment boundaries to snap points
    timelineState.tracks.forEach(track => {
      track.segments.forEach(segment => {
        snapPoints.push(segment.position);
        snapPoints.push(segment.position + segment.duration);
      });
    });

    // Add playhead and in/out points
    snapPoints.push(timelineState.playhead);
    if (timelineState.inPoint) snapPoints.push(timelineState.inPoint);
    if (timelineState.outPoint) snapPoints.push(timelineState.outPoint);

    // Find nearest snap point within tolerance
    const tolerance = timelineState.snapTolerance / (PIXELS_PER_SECOND * timelineState.zoom);
    let nearestPoint = time;
    let minDistance = tolerance;

    snapPoints.forEach(point => {
      const distance = Math.abs(point - time);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
        isSnapping.current = true;
      }
    });

    return nearestPoint;
  };

  const handleSegmentDragStart = (e: React.MouseEvent, segmentId: string) => {
    e.stopPropagation();
    isDragging.current = true;
    draggedSegment.current = segmentId;
    isSnapping.current = false;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    dragOffset.current = e.clientX - rect.left;
  };

  const handleSegmentDrag = (e: React.MouseEvent) => {
    if (!isDragging.current || !draggedSegment.current || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - HEADER_WIDTH - dragOffset.current;
    let newPosition = pixelsToTime(x);

    // Apply snapping if enabled
    newPosition = findNearestSnapPoint(newPosition);

    TimelineService.moveSegment(draggedSegment.current, newPosition);
  };

  const handleSegmentDragEnd = () => {
    isDragging.current = false;
    draggedSegment.current = null;
    isSnapping.current = false;
  };

  const renderTrack = (track: TimelineTrack) => {
    const trackHeight = track.height || TRACK_HEIGHT;

    return (
      <div
        key={track.id}
        className={`relative border-b border-gray-300 ${track.locked ? 'opacity-50' : ''}`}
        style={{ height: `${trackHeight}px` }}
      >
        <TrackHeader
          track={track}
          width={HEADER_WIDTH}
          onVolumeChange={(volume) => TimelineService.updateTrack(track.id, { volume })}
          onPanChange={(pan) => TimelineService.updateTrack(track.id, { pan })}
          onMuteToggle={() => TimelineService.updateTrack(track.id, { muted: !track.muted })}
          onSoloToggle={() => TimelineService.updateTrack(track.id, { solo: !track.solo })}
          onLockToggle={() => TimelineService.updateTrack(track.id, { locked: !track.locked })}
        />
        <div className="absolute left-[200px] top-0 right-0 h-full">
          {track.type === 'audio' && timelineState.waveformsEnabled && (
            <WaveformDisplay
              segments={track.segments}
              height={trackHeight}
              timeToPixels={timeToPixels}
            />
          )}
          {track.segments.map(segment => renderSegment(segment, trackHeight))}
        </div>
      </div>
    );
  };

  const renderSegment = (segment: TimelineSegment, trackHeight: number) => {
    const width = Math.max(timeToPixels(segment.duration), MIN_SEGMENT_WIDTH);
    const left = timeToPixels(segment.position);

    return (
      <div
        key={segment.id}
        className={`absolute top-1 rounded cursor-move select-none
          ${segment.selected ? 'ring-2 ring-yellow-400' : ''}
          ${segment.locked ? 'cursor-not-allowed' : ''}`}
        style={{
          left: `${left}px`,
          width: `${width}px`,
          height: `${trackHeight - 8}px`,
          backgroundColor: segment.selected ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.6)'
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!segment.locked) {
            onSegmentSelect?.(segment);
          }
        }}
        onMouseDown={(e) => !segment.locked && handleSegmentDragStart(e, segment.id)}
        onMouseUp={handleSegmentDragEnd}
      >
        {timelineState.thumbnailsEnabled && segment.thumbnailUrls && (
          <ThumbnailStrip
            thumbnails={segment.thumbnailUrls}
            duration={segment.duration}
            width={width}
          />
        )}
        <div className="absolute top-0 left-0 right-0 p-2 text-xs text-white truncate bg-black bg-opacity-30">
          {segment.metadata?.name || segment.filePath.split('/').pop()}
        </div>
        {segment.effects?.map(effect => (
          <div
            key={effect.id}
            className={`absolute bottom-0 h-1 ${effect.enabled ? 'bg-green-500' : 'bg-gray-500'}`}
            style={{
              left: timeToPixels(effect.startTime - segment.position),
              width: timeToPixels(effect.endTime - effect.startTime)
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEffect(effect);
              onEffectChange?.(effect);
            }}
          />
        ))}
      </div>
    );
  };

  const renderPlayhead = () => {
    const position = timeToPixels(timelineState.playhead);

    return (
      <div
        className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none"
        style={{ left: `${position + HEADER_WIDTH}px` }}
      >
        <div className="w-4 h-4 -ml-2 bg-red-500 transform rotate-45" />
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="h-12 flex items-center space-x-4 px-4 border-b border-gray-300 bg-white">
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => TimelineService.createTrack('video')}
        >
          Add Video Track
        </button>
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
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
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={timelineState.snapEnabled}
            onChange={(e) => TimelineService.setSnapEnabled(e.target.checked)}
          />
          <span className="text-sm">Snap</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={timelineState.thumbnailsEnabled}
            onChange={(e) => TimelineService.setThumbnailsEnabled(e.target.checked)}
          />
          <span className="text-sm">Thumbnails</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={timelineState.waveformsEnabled}
            onChange={(e) => TimelineService.setWaveformsEnabled(e.target.checked)}
          />
          <span className="text-sm">Waveforms</span>
        </label>
      </div>

      {/* Timeline */}
      <div className="flex-1 relative">
        <div
          ref={timelineRef}
          className="absolute inset-0 overflow-auto"
          onClick={handleTimelineClick}
          onMouseMove={handleSegmentDrag}
          onMouseUp={handleSegmentDragEnd}
          onMouseLeave={handleSegmentDragEnd}
        >
          <div
            className="absolute top-0 left-0"
            style={{
              width: `${timeToPixels(timelineState.duration) + HEADER_WIDTH}px`
            }}
          >
            <TimelineRuler
              duration={timelineState.duration}
              zoom={timelineState.zoom}
              timeToPixels={timeToPixels}
              headerWidth={HEADER_WIDTH}
            />
            {timelineState.tracks.map(renderTrack)}
            {renderPlayhead()}
          </div>
        </div>
      </div>

      {/* Effect Controls */}
      {selectedEffect && (
        <EffectControls
          effect={selectedEffect}
          onParameterChange={(parameterId, value) => {
            TimelineService.updateEffectParameter(selectedEffect.id, parameterId, value);
          }}
          onKeyframeAdd={(parameterId, time, value) => {
            TimelineService.addEffectKeyframe(selectedEffect.id, parameterId, time, value);
          }}
          onKeyframeRemove={(parameterId, keyframeId) => {
            TimelineService.removeEffectKeyframe(selectedEffect.id, parameterId, keyframeId);
          }}
        />
      )}
    </div>
  );
};

export default Timeline;
