import React from 'react';
import { TimelineSegment } from '../../interfaces/Timeline.interface';

interface WaveformDisplayProps {
  segments: TimelineSegment[];
  height: number;
  timeToPixels: (time: number) => number
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  segments,
  height,
  timeToPixels
}) => {
  const generateWaveformPath = (
    waveformData: number[],
    width: number,
    waveformHeight: number
  ): string => {
    const middleY = waveformHeight / 2;
    const maxAmplitude = Math.max(...waveformData);
    const scale = (waveformHeight / 2) / maxAmplitude;
    const scaledData = waveformData.map((amp) => amp * scale);

    const pointsPerPixel = Math.max(1, Math.floor(scaledData.length / width));
    const points: number[] = [];

    for (let i = 0; i < width; i++) {
      const startIdx = i * pointsPerPixel;
      const endIdx = startIdx + pointsPerPixel;
      const slice = scaledData.slice(startIdx, endIdx);
      
      if (slice.length > 0) {
        const maxAmp = Math.max(...slice);
        const minAmp = Math.min(...slice);
        points.push(maxAmp, minAmp);
      }
    }

    return points.map((amp, i) => {
      const x = i / 2;
      const y = middleY + (i % 2 === 0 ? -amp : amp);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const renderWaveform = (segment: TimelineSegment) => {
    if (!segment.waveformData || segment.waveformData.length === 0) {
      return null;
    }

    const width = timeToPixels(segment.duration);
    const left = timeToPixels(segment.position);
    const waveformHeight = height - 8; // Account for padding

    const path = generateWaveformPath(segment.waveformData, width, waveformHeight);

    return (
      <div
        key={segment.id}
        className="absolute top-1 pointer-events-none"
        style={{
          left: `${left}px`,
          height: `${waveformHeight}px`,
          width: `${width}px`
        }}
      >
        <svg
          width={width}
          height={waveformHeight}
          className="opacity-50"
        >
          <path
            d={path}
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="absolute inset-0">
      {segments.map((segment) => renderWaveform(segment))}
    </div>
  );
};
