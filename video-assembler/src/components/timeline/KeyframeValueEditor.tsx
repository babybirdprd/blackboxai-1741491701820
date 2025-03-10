import React, { useState } from 'react';
import { Keyframe } from '../../interfaces/Timeline.interface';

interface KeyframeValueEditorProps {
  keyframe: Keyframe;
  parameterType: 'number' | 'vector2' | 'vector3' | 'color';
  minValue?: number;
  maxValue?: number;
  onUpdate: (keyframe: Keyframe) => void;
}

export const KeyframeValueEditor: React.FC<KeyframeValueEditorProps> = ({
  keyframe,
  parameterType,
  minValue = 0,
  maxValue = 1,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleValueChange = (newValue: number) => {
    onUpdate({
      ...keyframe,
      value: Math.max(minValue, Math.min(maxValue, newValue)),
    });
  };

  const handleEasingChange = (newEasing: Keyframe['easing']) => {
    onUpdate({
      ...keyframe,
      easing: newEasing,
    });
  };

  return (
    <div className="flex items-center space-x-4 p-2 bg-gray-100 rounded">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Value
        </label>
        {isEditing ? (
          <input
            type="number"
            value={typeof keyframe.value === 'number' ? keyframe.value : 0}
            min={minValue}
            max={maxValue}
            step={0.01}
            onChange={(e) => handleValueChange(parseFloat(e.target.value))}
            onBlur={() => setIsEditing(false)}
            className="w-full px-2 py-1 border rounded"
            autoFocus
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="cursor-pointer hover:bg-gray-200 px-2 py-1 rounded"
          >
            {typeof keyframe.value === 'number' ? keyframe.value.toFixed(2) : 'N/A'}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Easing
        </label>
        <select
          value={keyframe.easing || 'linear'}
          onChange={(e) => handleEasingChange(e.target.value as Keyframe['easing'])}
          className="w-32 px-2 py-1 border rounded"
        >
          <option value="linear">Linear</option>
          <option value="easeIn">Ease In</option>
          <option value="easeOut">Ease Out</option>
          <option value="easeInOut">Ease In Out</option>
          <option value="bezier">Bezier</option>
        </select>
      </div>

      {keyframe.easing === 'bezier' && (
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bezier Control Points
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={keyframe.bezierPoints?.[0] ?? 0.33}
              min={0}
              max={1}
              step={0.01}
              onChange={(e) => onUpdate({
                ...keyframe,
                bezierPoints: [
                  parseFloat(e.target.value),
                  keyframe.bezierPoints?.[1] ?? 0.33,
                  keyframe.bezierPoints?.[2] ?? 0.67,
                  keyframe.bezierPoints?.[3] ?? 0.67,
                ],
              })}
              className="w-full px-2 py-1 border rounded"
            />
            <input
              type="number"
              value={keyframe.bezierPoints?.[1] ?? 0.33}
              min={0}
              max={1}
              step={0.01}
              onChange={(e) => onUpdate({
                ...keyframe,
                bezierPoints: [
                  keyframe.bezierPoints?.[0] ?? 0.33,
                  parseFloat(e.target.value),
                  keyframe.bezierPoints?.[2] ?? 0.67,
                  keyframe.bezierPoints?.[3] ?? 0.67,
                ],
              })}
              className="w-full px-2 py-1 border rounded"
            />
            <input
              type="number"
              value={keyframe.bezierPoints?.[2] ?? 0.67}
              min={0}
              max={1}
              step={0.01}
              onChange={(e) => onUpdate({
                ...keyframe,
                bezierPoints: [
                  keyframe.bezierPoints?.[0] ?? 0.33,
                  keyframe.bezierPoints?.[1] ?? 0.33,
                  parseFloat(e.target.value),
                  keyframe.bezierPoints?.[3] ?? 0.67,
                ],
              })}
              className="w-full px-2 py-1 border rounded"
            />
            <input
              type="number"
              value={keyframe.bezierPoints?.[3] ?? 0.67}
              min={0}
              max={1}
              step={0.01}
              onChange={(e) => onUpdate({
                ...keyframe,
                bezierPoints: [
                  keyframe.bezierPoints?.[0] ?? 0.33,
                  keyframe.bezierPoints?.[1] ?? 0.33,
                  keyframe.bezierPoints?.[2] ?? 0.67,
                  parseFloat(e.target.value),
                ],
              })}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};
