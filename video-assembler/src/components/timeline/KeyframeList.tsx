import React, { useState } from 'react';
import { Keyframe, EffectParameter } from '../../interfaces/Timeline.interface';
import { KeyframeValueEditor } from './KeyframeValueEditor';
import { formatTime } from '../../utils';

interface KeyframeListProps {
  parameter: EffectParameter;
  duration: number;
  onAdd: (time: number, value: number | string | boolean | Record<string, unknown>) => void;
  onRemove: (keyframeId: string) => void;
  onUpdate: (keyframe: Keyframe) => void;
}

export const KeyframeList: React.FC<KeyframeListProps> = ({
  parameter,
  duration,
  onAdd,
  onRemove,
  onUpdate,
}) => {
  const [selectedKeyframe, setSelectedKeyframe] = useState<string | null>(null);

  const sortedKeyframes = [...(parameter.keyframes || [])].sort((a, b) => a.time - b.time);

  const handleAddKeyframe = () => {
    const time = Math.max(0, Math.min(duration, duration / 2));
    const value = typeof parameter.value === 'number' 
      ? parameter.value 
      : parameter.default;
    
    onAdd(time, value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          {parameter.name} Keyframes
        </h3>
        <button
          onClick={handleAddKeyframe}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Keyframe
        </button>
      </div>

      <div className="space-y-2">
        {sortedKeyframes.map((keyframe, index) => (
          <div
            key={keyframe.id}
            className={`border rounded ${
              selectedKeyframe === keyframe.id ? 'border-blue-500' : 'border-gray-200'
            }`}
          >
            <div
              className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50"
              onClick={() => setSelectedKeyframe(
                selectedKeyframe === keyframe.id ? null : keyframe.id
              )}
            >
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {formatTime(keyframe.time)}
                </span>
                <span className="text-sm text-gray-500">
                  {typeof keyframe.value === 'number' 
                    ? keyframe.value.toFixed(2) 
                    : String(keyframe.value)
                  }
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(keyframe.id);
                  }}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {selectedKeyframe === keyframe.id && (
              <div className="border-t">
                <KeyframeValueEditor
                  keyframe={keyframe}
                  parameterType={parameter.type}
                  minValue={parameter.min}
                  maxValue={parameter.max}
                  onUpdate={onUpdate}
                />
              </div>
            )}
          </div>
        ))}

        {sortedKeyframes.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No keyframes added yet
          </div>
        )}
      </div>
    </div>
  );
};
