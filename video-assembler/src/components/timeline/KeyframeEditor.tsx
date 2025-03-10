import React, { useRef, useState, useEffect } from 'react';
import { Keyframe } from '../../interfaces/Timeline.interface';

interface KeyframeEditorProps {
  keyframes: Keyframe[];
  parameterName: string;
  duration: number;
  parameterType?: 'number' | 'vector2' | 'vector3' | 'color';
  minValue?: number;
  maxValue?: number;
  onAdd: (time: number, value: number | string | boolean | Record<string, unknown>) => void;
  onRemove: (keyframeId: string) => void;
  onUpdate: (keyframe: Keyframe) => void;
}

interface DragState {
  keyframeId: string;
  initialX: number;
  initialY: number;
  isDragging: boolean;
}

export const KeyframeEditor: React.FC<KeyframeEditorProps> = ({
  keyframes,
  parameterName,
  duration,
  parameterType = 'number',
  minValue = 0,
  maxValue = 1,
  onAdd,
  onRemove,
  onUpdate,
}) => {
  const EDITOR_HEIGHT = 100;
  const KEYFRAME_SIZE = 8;
  const CURVE_HANDLE_SIZE = 6;

  const editorRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredKeyframe, setHoveredKeyframe] = useState<string | null>(null);
  const [showCurveHandles, setShowCurveHandles] = useState(false);

  const timeToX = (time: number): number => {
    return (time / duration) * 100;
  };

  const valueToY = (value: number): number => {
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    return ((1 - normalizedValue) * EDITOR_HEIGHT);
  };

  const xToTime = (x: number): number => {
    return (x / 100) * duration;
  };

  const yToValue = (y: number): number => {
    const normalizedValue = 1 - (y / EDITOR_HEIGHT);
    return normalizedValue * (maxValue - minValue) + minValue;
  };

  const handleKeyframeAdd = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!editorRef.current) return;

    const rect = editorRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const time = xToTime(x);
    const value = yToValue(y);
    
    onAdd(time, value);
  };

  const handleKeyframeDragStart = (e: React.MouseEvent, keyframeId: string) => {
    e.stopPropagation();
    if (!editorRef.current) return;

    const rect = editorRef.current.getBoundingClientRect();
    setDragState({
      keyframeId,
      initialX: e.clientX - rect.left,
      initialY: e.clientY - rect.top,
      isDragging: true
    });
  };

  const handleKeyframeDrag = (e: React.MouseEvent) => {
    if (!dragState?.isDragging || !editorRef.current) return;

    const rect = editorRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = Math.max(0, Math.min(duration, xToTime(x)));
    const value = Math.max(minValue, Math.min(maxValue, yToValue(y)));

    const keyframe = keyframes.find(k => k.id === dragState.keyframeId);
    if (keyframe) {
      onUpdate({
        ...keyframe,
        time,
        value: parameterType === 'number' ? value : keyframe.value
      });
    }
  };

  const handleKeyframeDragEnd = () => {
    setDragState(null);
  };

  const interpolateValue = (time: number): number => {
    const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);
    
    // Find surrounding keyframes
    const nextIndex = sortedKeyframes.findIndex(k => k.time > time);
    if (nextIndex === -1) return sortedKeyframes[sortedKeyframes.length - 1]?.value as number;
    if (nextIndex === 0) return sortedKeyframes[0]?.value as number;

    const k1 = sortedKeyframes[nextIndex - 1];
    const k2 = sortedKeyframes[nextIndex];
    
    // Linear interpolation by default
    const t = (time - k1.time) / (k2.time - k1.time);
    const v1 = k1.value as number;
    const v2 = k2.value as number;

    switch (k1.easing) {
      case 'easeIn':
        return v1 + (v2 - v1) * Math.pow(t, 2);
      case 'easeOut':
        return v1 + (v2 - v1) * (1 - Math.pow(1 - t, 2));
      case 'easeInOut':
        return v1 + (v2 - v1) * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      default:
        return v1 + (v2 - v1) * t;
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      handleKeyframeDragEnd();
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">{parameterName}</div>
        <select
          className="text-sm border rounded px-2 py-1"
          value={keyframes[0]?.easing || 'linear'}
          onChange={(e) => {
            keyframes.forEach(keyframe => {
              onUpdate({ ...keyframe, easing: e.target.value as Keyframe['easing'] });
            });
          }}
        >
          <option value="linear">Linear</option>
          <option value="easeIn">Ease In</option>
          <option value="easeOut">Ease Out</option>
          <option value="easeInOut">Ease In Out</option>
        </select>
      </div>
      <svg
        ref={editorRef}
        className="w-full bg-gray-100 border border-gray-300 rounded"
        height={EDITOR_HEIGHT}
        onClick={handleKeyframeAdd}
        onMouseMove={handleKeyframeDrag}
      >
        {/* Value range guides */}
        <line
          x1="0"
          y1={valueToY(maxValue)}
          x2="100"
          y2={valueToY(maxValue)}
          stroke="#ccc"
          strokeDasharray="2,2"
        />
        <line
          x1="0"
          y1={valueToY(minValue)}
          x2="100"
          y2={valueToY(minValue)}
          stroke="#ccc"
          strokeDasharray="2,2"
        />

        {/* Interpolation curve */}
        <path
          d={Array.from({ length: 100 }).map((_, i) => {
            const time = (i / 99) * duration;
            const value = interpolateValue(time);
            const x = timeToX(time);
            const y = valueToY(value);
            return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
          }).join(' ')}
          stroke="rgba(59, 130, 246, 0.5)"
          fill="none"
          strokeWidth="1"
        />

        {/* Keyframe connection lines */}
        <path
          d={keyframes
            .sort((a, b) => a.time - b.time)
            .map((k, i) => {
              const x = timeToX(k.time);
              const y = valueToY(typeof k.value === 'number' ? k.value : 0);
              return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
            })
            .join(' ')}
          stroke="rgb(59, 130, 246)"
          fill="none"
          strokeWidth="2"
        />

        {/* Keyframe points */}
        {keyframes.map((keyframe) => {
          const x = timeToX(keyframe.time);
          const y = valueToY(typeof keyframe.value === 'number' ? keyframe.value : 0);
          const isHovered = hoveredKeyframe === keyframe.id;
          const isDragging = dragState?.keyframeId === keyframe.id;

          return (
            <g
              key={keyframe.id}
              transform={`translate(${x}, ${y})`}
              onMouseEnter={() => setHoveredKeyframe(keyframe.id)}
              onMouseLeave={() => setHoveredKeyframe(null)}
            >
              {/* Keyframe point */}
              <circle
                r={KEYFRAME_SIZE / 2}
                fill={isDragging ? 'rgb(59, 130, 246)' : 'white'}
                stroke="rgb(59, 130, 246)"
                strokeWidth="2"
                className="cursor-move"
                onMouseDown={(e) => handleKeyframeDragStart(e, keyframe.id)}
              />

              {/* Keyframe value tooltip */}
              {(isHovered || isDragging) && (
                <g transform="translate(0, -20)">
                  <rect
                    x="-25"
                    y="-15"
                    width="50"
                    height="20"
                    rx="4"
                    fill="black"
                    fillOpacity="0.8"
                  />
                  <text
                    fill="white"
                    fontSize="10"
                    textAnchor="middle"
                    dy="-2"
                  >
                    {typeof keyframe.value === 'number' 
                      ? keyframe.value.toFixed(2)
                      : 'N/A'}
                  </text>
                </g>
              )}

              {/* Delete button */}
              {isHovered && (
                <g
                  transform="translate(10, -10)"
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(keyframe.id);
                  }}
                >
                  <circle
                    r={KEYFRAME_SIZE / 2}
                    fill="red"
                    className="hover:fill-red-700"
                  />
                  <path
                    d="M-2,-2 L2,2 M-2,2 L2,-2"
                    stroke="white"
                    strokeWidth="1"
                  />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
