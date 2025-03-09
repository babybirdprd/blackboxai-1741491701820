import React, { useState, useEffect } from 'react';
import Timeline from './components/timeline/Timeline';
import VideoPreview from './components/preview/VideoPreview';
import EffectsPanel from './components/effects/EffectsPanel';
import ScriptEditor from './components/controls/ScriptEditor';
import { TimelineSegment } from './services/TimelineService';
import LosslessVideoService from './services/LosslessVideoService';

const App: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<TimelineSegment | undefined>();
  const [showScriptEditor, setShowScriptEditor] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to LosslessVideoService events
    const handleProgress = (progress: any) => {
      if (progress.type === 'complete') {
        setIsProcessing(false);
      }
    };

    const handleError = (error: Error) => {
      setError(error.message);
      setIsProcessing(false);
    };

    LosslessVideoService.on('progress', handleProgress);
    LosslessVideoService.on('error', handleError);

    return () => {
      LosslessVideoService.removeListener('progress', handleProgress);
      LosslessVideoService.removeListener('error', handleError);
    };
  }, []);

  // Handle file drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setIsProcessing(true);

    try {
      for (const file of files) {
        const segment = await LosslessVideoService.createSegment(
          file.path,
          0,
          9999 // Temporary duration, will be updated after analysis
        );
        
        // Get actual duration from media info
        const mediaInfo = await LosslessVideoService.analyzeFile(file.path);
        segment.endTime = parseFloat(mediaInfo.duration);
        
        // Add to timeline
        const videoTrack = TimelineService.getTracksByType('video')[0] ||
                          TimelineService.createTrack('video');
        TimelineService.addSegment(videoTrack.id, segment, 0);
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Prevent default drag behavior
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="h-12 bg-gray-800 flex items-center justify-between px-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Video Assembler</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowScriptEditor(!showScriptEditor)}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded"
          >
            {showScriptEditor ? 'Hide Script Editor' : 'Show Script Editor'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Effects */}
        <div className="w-80 border-r border-gray-700">
          <EffectsPanel
            selectedSegment={selectedSegment}
            onEffectAdd={() => setIsProcessing(false)}
            onEffectRemove={(effectId) => {
              if (selectedSegment) {
                TimelineService.removeEffect(selectedSegment.id, effectId);
              }
            }}
          />
        </div>

        {/* Center Panel - Preview and Timeline */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Video Preview */}
          <div className="h-1/2 border-b border-gray-700">
            <VideoPreview
              onTimeUpdate={(time) => {
                // Update timeline playhead
              }}
            />
          </div>

          {/* Timeline */}
          <div className="h-1/2 relative"
               onDrop={handleDrop}
               onDragOver={handleDragOver}>
            <Timeline
              onSegmentSelect={setSelectedSegment}
              onPlayheadChange={(position) => {
                // Update video preview time
              }}
            />

            {/* Drop Zone Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-xl">Processing...</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Script Editor */}
        {showScriptEditor && (
          <div className="w-96 border-l border-gray-700">
            <ScriptEditor
              onScriptExecute={(result) => {
                console.log('Script executed:', result);
              }}
              onError={(error) => {
                setError(error.message);
              }}
            />
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
          <div className="flex items-center space-x-2">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-white hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;