import React from 'react';
import { TimelineTrack } from '../../interfaces/Timeline.interface';

interface TrackHeaderProps {
  track: TimelineTrack,
  width: number,
  onVolumeChange: (volume: number) => void,
  onPanChange: (pan: number) => void,
  onMuteToggle: () => void,
  onSoloToggle: () => void,
  onLockToggle: () => void,
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({
  track,
  width,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onLockToggle,
}) => {
  return (
    <div
      className="absolute left-0 top-0 bottom-0 bg-gray-100 border-r border-gray-300 flex flex-col"
      style={{ width: `${width}px` }}
    >
      <div className="p-2 flex items-center justify-between border-b border-gray-300">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium truncate flex-1">
            {track.name || `${track.type} Track`}
          </span>
          <button
            className={`w-6 h-6 rounded ${track.muted ? 'bg-red-500' : 'bg-gray-300'} text-white text-xs`}
            onClick={onMuteToggle}
            title="Mute"
          >
            M
          </button>
          <button
            className={`w-6 h-6 rounded ${track.solo ? 'bg-yellow-500' : 'bg-gray-300'} text-white text-xs`}
            onClick={onSoloToggle}
            title="Solo"
          >
            S
          </button>
          <button
            className={`w-6 h-6 rounded ${track.locked ? 'bg-blue-500' : 'bg-gray-300'} text-white text-xs`}
            onClick={onLockToggle}
            title="Lock"
          >
            L
          </button>
        </div>
      </div>

      {track.type === 'audio' && (
        <div className="p-2 space-y-2">
          <div>
            <label className="block text-xs mb-1">Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={track.volume ?? 1}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Pan</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={track.pan ?? 0}
              onChange={(e) => onPanChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}

      {track.type === 'video' && (
        <div className="p-2">
          <label className="block text-xs mb-1">Opacity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={track.volume ?? 1} // Reusing volume for opacity
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};
