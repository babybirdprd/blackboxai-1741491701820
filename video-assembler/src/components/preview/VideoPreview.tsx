import React, { useEffect, useRef, useState } from 'react';
import TimelineService from '../../services/TimelineService';
import LosslessVideoService from '../../services/LosslessVideoService';

interface VideoPreviewProps {
  onTimeUpdate?: (currentTime: number) => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ onTimeUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  // Subscribe to timeline events
  useEffect(() => {
    const handlePlayheadMove = (position: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = position;
      }
    };

    TimelineService.on('playheadMoved', handlePlayheadMove);

    return () => {
      TimelineService.removeListener('playheadMoved', handlePlayheadMove);
    };
  }, []);

  // Handle time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      TimelineService.setPlayhead(time);
      onTimeUpdate?.(time);
    }
  };

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Play/Pause toggle
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          if (videoRef.current) {
            videoRef.current.currentTime -= 1;
          }
          break;
        case 'arrowright':
          if (videoRef.current) {
            videoRef.current.currentTime += 1;
          }
          break;
        case 'j':
          setPlaybackRate(rate => Math.max(0.25, rate - 0.25));
          break;
        case 'k':
          togglePlay();
          break;
        case 'l':
          setPlaybackRate(rate => Math.min(2, rate + 0.25));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  // Handle frame stepping
  const stepFrame = (forward: boolean) => {
    if (videoRef.current) {
      // Assuming 30fps
      const frameTime = 1/30;
      videoRef.current.currentTime += forward ? frameTime : -frameTime;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Video Container */}
      <div className="relative flex-1 bg-black">
        <video
          ref={videoRef}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          playbackRate={playbackRate}
        />
      </div>

      {/* Controls */}
      <div className="h-24 bg-gray-800 p-4">
        {/* Timeline scrubber */}
        <div className="relative h-2 bg-gray-600 rounded cursor-pointer mb-4">
          <div
            className="absolute h-full bg-blue-500 rounded"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              if (videoRef.current) {
                videoRef.current.currentTime = time;
              }
            }}
            className="absolute w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Control buttons */}
        <div className="flex items-center space-x-4">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="p-2 rounded-full hover:bg-gray-700 text-white"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Frame step buttons */}
          <button
            onClick={() => stepFrame(false)}
            className="p-2 rounded-full hover:bg-gray-700 text-white"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => stepFrame(true)}
            className="p-2 rounded-full hover:bg-gray-700 text-white"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 15.707a1 1 0 001.414 0l5-5a1 1 0 000-1.414l-5-5a1 1 0 00-1.414 1.414L8.586 10 4.293 14.293a1 1 0 000 1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Time display */}
          <div className="text-white text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Playback rate */}
          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            className="bg-gray-700 text-white rounded px-2 py-1"
          >
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>

          {/* Volume control */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setVolume(v => v === 0 ? 1 : 0)}
              className="text-white"
            >
              {volume === 0 ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => {
                const vol = parseFloat(e.target.value);
                setVolume(vol);
                if (videoRef.current) {
                  videoRef.current.volume = vol;
                }
              }}
              className="w-24"
            />
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-gray-700 text-white"
          >
            {fullscreen ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 4a1 1 0 011-1h4a1 1 0 010 2H6a1 1 0 01-1-1zm10 0a1 1 0 01-1-1h-4a1 1 0 110 2h4a1 1 0 001-1zM5 16a1 1 0 001 1h4a1 1 0 100-2H6a1 1 0 00-1 1zm10 0a1 1 0 00-1 1h-4a1 1 0 110-2h4a1 1 0 001 1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H4a1 1 0 01-1-1zm12 0a1 1 0 01-1-1h-4a1 1 0 110 2h4a1 1 0 001-1zM3 16a1 1 0 001 1h4a1 1 0 100-2H4a1 1 0 00-1 1zm12 0a1 1 0 00-1 1h-4a1 1 0 110-2h4a1 1 0 001 1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;