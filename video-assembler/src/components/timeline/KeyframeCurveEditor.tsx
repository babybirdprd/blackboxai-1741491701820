import React, { useRef, useState } from 'react';
import { Keyframe } from '../../interfaces/Timeline.interface';

interface KeyframeCurveEditorProps {
  keyframe: Keyframe;
  nextKeyframe: Keyframe;
  onUpdate: (keyframe: Keyframe) => void;
}

interface ControlPoint {
  x: number;
  y: number;
}

export const KeyframeCurveEditor: React.FC<KeyframeCurveEditorProps> = ({
  keyframe,
  nextKeyframe,
  onUpdate,
}) => {
  const EDITOR_SIZE = 200;
  const HANDLE_SIZE = 8;
  
  const editorRef = useRef<SVGSVGElement>(null);
  const [draggingHandle, setDraggingHandle] = useState<'in' | 'out' | null>(null);
  const [controlPoints, setControlPoints] = useState<{in: ControlPoint; out: ControlPoint}>({
    in: { x: 0.33, y: 0.33 },
    out: { x: 0.67, y: 0.67 },
  });

  const handleMouseDown = (handle: 'in' | 'out') => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingHandle(handle);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingHandle || !editorRef.current) return;

    const rect = editorRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / EDITOR_SIZE));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / EDITOR_SIZE));

    setControlPoints(prev => ({
      ...prev,
      [draggingHandle]: { x, y },
    }));

    // Update keyframe with new bezier curve parameters
    onUpdate({
      ...keyframe,
      easing: 'bezier',
      bezierPoints: [
        controlPoints.in.x,
        controlPoints.in.y,
        controlPoints.out.x,
        controlPoints.out.y,
      ],
    });
  };

  const handleMouseUp = () => {
    setDraggingHandle(null);
  };

  return (
    <svg
      ref={editorRef}
      width={EDITOR_SIZE}
      height={EDITOR_SIZE}
      className="bg-gray-100 border border-gray-300 rounded"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid lines */}
      <g stroke="#ddd" strokeWidth="1">
        <line x1="0" y1={EDITOR_SIZE / 2} x2={EDITOR_SIZE} y2={EDITOR_SIZE / 2} />
        <line x1={EDITOR_SIZE / 2} y1="0" x2={EDITOR_SIZE / 2} y2={EDITOR_SIZE} />
      </g>

      {/* Bezier curve */}
      <path
        d={`M 0 ${EDITOR_SIZE}
           C ${controlPoints.in.x * EDITOR_SIZE} ${controlPoints.in.y * EDITOR_SIZE},
             ${controlPoints.out.x * EDITOR_SIZE} ${controlPoints.out.y * EDITOR_SIZE},
             ${EDITOR_SIZE} 0`}
        fill="none"
        stroke="rgb(59, 130, 246)"
        strokeWidth="2"
      />

      {/* Control point handles */}
      <g>
        {/* In handle */}
        <line
          x1="0"
          y1={EDITOR_SIZE}
          x2={controlPoints.in.x * EDITOR_SIZE}
          y2={controlPoints.in.y * EDITOR_SIZE}
          stroke="#666"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        <circle
          cx={controlPoints.in.x * EDITOR_SIZE}
          cy={controlPoints.in.y * EDITOR_SIZE}
          r={HANDLE_SIZE / 2}
          fill="white"
          stroke="#666"
          strokeWidth="2"
          className="cursor-move"
          onMouseDown={handleMouseDown('in')}
        />

        {/* Out handle */}
        <line
          x1={EDITOR_SIZE}
          y1="0"
          x2={controlPoints.out.x * EDITOR_SIZE}
          y2={controlPoints.out.y * EDITOR_SIZE}
          stroke="#666"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        <circle
          cx={controlPoints.out.x * EDITOR_SIZE}
          cy={controlPoints.out.y * EDITOR_SIZE}
          r={HANDLE_SIZE / 2}
          fill="white"
          stroke="#666"
          strokeWidth="2"
          className="cursor-move"
          onMouseDown={handleMouseDown('out')}
        />
      </g>
    </svg>
  );
};
