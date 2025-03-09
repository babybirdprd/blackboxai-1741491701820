import React, { useState, useEffect } from 'react';
import TimelineService, { TimelineSegment, TimelineEffect } from '../../services/TimelineService';

interface EffectsPanelProps {
  selectedSegment?: TimelineSegment;
  onEffectAdd?: (effect: TimelineEffect) => void;
  onEffectRemove?: (effectId: string) => void;
}

interface EffectDefinition {
  type: string;
  name: string;
  description: string;
  parameters: EffectParameter[];
}

interface EffectParameter {
  name: string;
  type: 'number' | 'color' | 'boolean' | 'select';
  label: string;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
}

const AVAILABLE_EFFECTS: EffectDefinition[] = [
  {
    type: 'blur',
    name: 'Gaussian Blur',
    description: 'Apply gaussian blur to the video',
    parameters: [
      {
        name: 'radius',
        type: 'number',
        label: 'Blur Radius',
        defaultValue: 5,
        min: 0,
        max: 20,
        step: 0.5
      }
    ]
  },
  {
    type: 'brightness',
    name: 'Brightness',
    description: 'Adjust video brightness',
    parameters: [
      {
        name: 'level',
        type: 'number',
        label: 'Level',
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.1
      }
    ]
  },
  {
    type: 'chromakey',
    name: 'Chroma Key',
    description: 'Remove specific color from video',
    parameters: [
      {
        name: 'color',
        type: 'color',
        label: 'Key Color',
        defaultValue: '#00ff00'
      },
      {
        name: 'similarity',
        type: 'number',
        label: 'Similarity',
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.01
      }
    ]
  },
  {
    type: 'text',
    name: 'Text Overlay',
    description: 'Add text overlay to video',
    parameters: [
      {
        name: 'text',
        type: 'text',
        label: 'Text Content',
        defaultValue: 'Sample Text'
      },
      {
        name: 'fontSize',
        type: 'number',
        label: 'Font Size',
        defaultValue: 24,
        min: 8,
        max: 72,
        step: 1
      },
      {
        name: 'color',
        type: 'color',
        label: 'Text Color',
        defaultValue: '#ffffff'
      }
    ]
  }
];

const EffectsPanel: React.FC<EffectsPanelProps> = ({
  selectedSegment,
  onEffectAdd,
  onEffectRemove
}) => {
  const [selectedEffect, setSelectedEffect] = useState<EffectDefinition | null>(null);
  const [effectParameters, setEffectParameters] = useState<Record<string, any>>({});

  // Reset parameters when selected effect changes
  useEffect(() => {
    if (selectedEffect) {
      const defaultParams = selectedEffect.parameters.reduce((acc, param) => {
        acc[param.name] = param.defaultValue;
        return acc;
      }, {} as Record<string, any>);
      setEffectParameters(defaultParams);
    } else {
      setEffectParameters({});
    }
  }, [selectedEffect]);

  // Handle parameter change
  const handleParameterChange = (paramName: string, value: any) => {
    setEffectParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  // Add effect to segment
  const handleAddEffect = () => {
    if (!selectedSegment || !selectedEffect) return;

    const effect: Omit<TimelineEffect, 'id'> = {
      type: selectedEffect.type,
      startTime: 0, // Default to full segment duration
      endTime: selectedSegment.duration,
      parameters: effectParameters
    };

    TimelineService.addEffect(selectedSegment.id, effect);
    onEffectAdd?.(effect as TimelineEffect);
    setSelectedEffect(null);
  };

  // Render parameter input based on type
  const renderParameterInput = (parameter: EffectParameter) => {
    switch (parameter.type) {
      case 'number':
        return (
          <input
            type="range"
            min={parameter.min}
            max={parameter.max}
            step={parameter.step}
            value={effectParameters[parameter.name]}
            onChange={(e) => handleParameterChange(parameter.name, parseFloat(e.target.value))}
            className="w-full"
          />
        );
      
      case 'color':
        return (
          <input
            type="color"
            value={effectParameters[parameter.name]}
            onChange={(e) => handleParameterChange(parameter.name, e.target.value)}
            className="w-full"
          />
        );
      
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={effectParameters[parameter.name]}
            onChange={(e) => handleParameterChange(parameter.name, e.target.checked)}
          />
        );
      
      case 'select':
        return (
          <select
            value={effectParameters[parameter.name]}
            onChange={(e) => handleParameterChange(parameter.name, e.target.value)}
            className="w-full bg-gray-700 text-white rounded px-2 py-1"
          >
            {parameter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            value={effectParameters[parameter.name]}
            onChange={(e) => handleParameterChange(parameter.name, e.target.value)}
            className="w-full bg-gray-700 text-white rounded px-2 py-1"
          />
        );
    }
  };

  return (
    <div className="w-80 bg-gray-800 text-white p-4 flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4">Effects</h2>

      {/* Effect Selection */}
      <div className="mb-4">
        <select
          value={selectedEffect?.type || ''}
          onChange={(e) => {
            const effect = AVAILABLE_EFFECTS.find(ef => ef.type === e.target.value);
            setSelectedEffect(effect || null);
          }}
          className="w-full bg-gray-700 rounded px-2 py-1"
        >
          <option value="">Select an effect...</option>
          {AVAILABLE_EFFECTS.map(effect => (
            <option key={effect.type} value={effect.type}>
              {effect.name}
            </option>
          ))}
        </select>
      </div>

      {/* Effect Parameters */}
      {selectedEffect && (
        <div className="flex-1 overflow-auto">
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">{selectedEffect.description}</p>
          </div>

          {selectedEffect.parameters.map(param => (
            <div key={param.name} className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {param.label}
              </label>
              {renderParameterInput(param)}
              {param.type === 'number' && (
                <div className="text-xs text-gray-400 mt-1">
                  Value: {effectParameters[param.name]}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={handleAddEffect}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2"
          >
            Add Effect
          </button>
        </div>
      )}

      {/* Applied Effects List */}
      {selectedSegment && selectedSegment.effects && selectedSegment.effects.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Applied Effects</h3>
          <div className="space-y-2">
            {selectedSegment.effects.map(effect => (
              <div
                key={effect.id}
                className="flex items-center justify-between bg-gray-700 rounded p-2"
              >
                <div>
                  <div className="font-medium">
                    {AVAILABLE_EFFECTS.find(e => e.type === effect.type)?.name || effect.type}
                  </div>
                  <div className="text-xs text-gray-400">
                    {effect.startTime.toFixed(2)}s - {effect.endTime.toFixed(2)}s
                  </div>
                </div>
                <button
                  onClick={() => onEffectRemove?.(effect.id)}
                  className="text-red-500 hover:text-red-400"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EffectsPanel;