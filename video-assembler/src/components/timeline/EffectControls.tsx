import React from 'react';
import { TimelineEffect, EffectParameter } from '../../interfaces/Timeline.interface';
import { KeyframeEditor } from './KeyframeEditor';

interface EffectControlsProps {
  effect: TimelineEffect,
  onParameterChange: (parameterId: string, value: unknown) => void,
  onKeyframeAdd: (parameterId: string, time: number, value: unknown) => void,
  onKeyframeRemove: (parameterId: string, keyframeId: string) => void,
}

export const EffectControls: React.FC<EffectControlsProps> = ({
  effect,
  onParameterChange,
  onKeyframeAdd,
  onKeyframeRemove,
}) => {
  const renderParameterControl = (parameter: EffectParameter) => {
    switch (parameter.type) {
      case 'number':
        return (
          <div key={parameter.id} className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {parameter.name}
            </label>
            <input
              type="range"
              min={parameter.min ?? 0}
              max={parameter.max ?? 100}
              value={parameter.value as number}
              onChange={(e) => onParameterChange(parameter.id, parseFloat(e.target.value))}
              className="w-full"
            />
            {parameter.keyframes && (
              <KeyframeEditor
                keyframes={parameter.keyframes}
                parameterName={parameter.name}
                duration={effect.endTime - effect.startTime}
                onAdd={(time, value) => onKeyframeAdd(parameter.id, time, value)}
                onRemove={(keyframeId) => onKeyframeRemove(parameter.id, keyframeId)}
                onUpdate={(keyframe) => {
                  const keyframes = parameter.keyframes?.map((k) =>
                    k.id === keyframe.id ? keyframe : k
                  );
                  onParameterChange(parameter.id, { ...parameter, keyframes });
                }}
              />
            )}
          </div>
        );

      case 'color':
        return (
          <div key={parameter.id} className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {parameter.name}
            </label>
            <input
              type="color"
              value={parameter.value as string}
              onChange={(e) => onParameterChange(parameter.id, e.target.value)}
              className="w-full h-8"
            />
          </div>
        );

      case 'select':
        return (
          <div key={parameter.id} className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {parameter.name}
            </label>
            <select
              value={parameter.value as string}
              onChange={(e) => onParameterChange(parameter.id, e.target.value)}
              className="w-full p-2 border rounded"
            >
              {parameter.options?.map((option) => (
                <option
                  key={typeof option === 'string' ? option : option.value.toString()}
                  value={typeof option === 'string' ? option : option.value}
                >
                  {typeof option === 'string' ? option : option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'boolean':
        return (
          <div key={parameter.id} className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={parameter.value as boolean}
                onChange={(e) => onParameterChange(parameter.id, e.target.checked)}
                className="form-checkbox"
              />
              <span className="text-sm font-medium">{parameter.name}</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 border-l border-gray-300 bg-white w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">{effect.name}</h3>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={effect.enabled}
              onChange={(e) => onParameterChange('enabled', e.target.checked)}
              className="form-checkbox"
            />
            <span className="text-sm">Enabled</span>
          </label>
        </div>
      </div>
      {effect.parameters.map(renderParameterControl)}
    </div>
  );
};
