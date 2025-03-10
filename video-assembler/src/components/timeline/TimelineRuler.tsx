import React from 'react';

interface TimelineRulerProps {
  duration: number,
  zoom: number,
  timeToPixels: (time: number) => number,
  headerWidth: number,
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  duration,
  zoom,
  timeToPixels,
  headerWidth,
}) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30); // Assuming 30fps

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    if (zoom > 2) {
      return `${minutes}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getIntervalSize = (zoom: number): number => {
    if (zoom >= 5) return 1; // 1 second intervals
    if (zoom >= 2) return 5; // 5 second intervals
    if (zoom >= 1) return 10; // 10 second intervals
    if (zoom >= 0.5) return 30; // 30 second intervals
    return 60; // 1 minute intervals
  };

  const renderMarkers = () => {
    const markers = [];
    const intervalSize = getIntervalSize(zoom);
    const subIntervals = zoom >= 2 ? 4 : 2; // Number of sub-intervals between main markers

    for (let time = 0; time <= duration; time += intervalSize / subIntervals) {
      const isMainMarker = time % intervalSize === 0;
      const position = timeToPixels(time);

      markers.push(
        <div
          key={time}
          className={`absolute border-l ${isMainMarker ? 'border-gray-400 h-full' : 'border-gray-300 h-2'}`}
          style={{
            left: `${position}px`,
            top: isMainMarker ? '16px' : '24px',
          }}
        >
          {isMainMarker && (
            <div className="absolute -left-4 -top-4 w-8 text-center">
              <span className="text-xs text-gray-600">{formatTime(time)}</span>
            </div>
          )}
        </div>
      );
    }

    return markers;
  };

  return (
    <div
      className="relative h-8 bg-white border-b border-gray-300 select-none"
      style={{ paddingLeft: `${headerWidth}px` }}
    >
      <div className="absolute left-0 top-0 bottom-0 bg-gray-100 border-r border-gray-300" style={{ width: `${headerWidth}px` }}>
        <div className="p-2 text-xs font-medium text-gray-600">Time</div>
      </div>
      <div className="relative h-full">
        {renderMarkers()}
      </div>
    </div>
  );
};
