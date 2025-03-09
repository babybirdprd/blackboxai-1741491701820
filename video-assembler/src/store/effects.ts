import { create } from 'zustand';
import { TimelineEffect } from '../services/TimelineService';

export interface Effect extends TimelineEffect {
  name: string;
  description: string;
  category: string;
  previewUrl?: string;
}

interface EffectsState {
  availableEffects: Effect[];
  selectedEffectId: string | null;
  effectParameters: Record<string, any>;
  previewMode: boolean;

  // Actions
  addEffect: (effect: Omit<Effect, 'id'>) => Effect;
  removeEffect: (effectId: string) => void;
  updateEffectParameters: (effectId: string, parameters: Record<string, any>) => void;
  setSelectedEffect: (effectId: string | null) => void;
  setPreviewMode: (enabled: boolean) => void;
  getEffectById: (effectId: string) => Effect | undefined;
  getEffectsByCategory: (category: string) => Effect[];
}

export const useEffectsStore = create<EffectsState>((set, get) => ({
  availableEffects: [
    {
      id: 'blur',
      name: 'Gaussian Blur',
      description: 'Apply gaussian blur to the video',
      category: 'filters',
      type: 'blur',
      startTime: 0,
      endTime: 0,
      parameters: {
        radius: {
          type: 'number',
          label: 'Blur Radius',
          value: 5,
          min: 0,
          max: 20,
          step: 0.5
        }
      }
    },
    {
      id: 'brightness',
      name: 'Brightness',
      description: 'Adjust video brightness',
      category: 'adjustments',
      type: 'brightness',
      startTime: 0,
      endTime: 0,
      parameters: {
        level: {
          type: 'number',
          label: 'Level',
          value: 1,
          min: 0,
          max: 2,
          step: 0.1
        }
      }
    },
    {
      id: 'chromakey',
      name: 'Chroma Key',
      description: 'Remove specific color from video',
      category: 'keying',
      type: 'chromakey',
      startTime: 0,
      endTime: 0,
      parameters: {
        color: {
          type: 'color',
          label: 'Key Color',
          value: '#00ff00'
        },
        similarity: {
          type: 'number',
          label: 'Similarity',
          value: 0.4,
          min: 0,
          max: 1,
          step: 0.01
        }
      }
    },
    {
      id: 'text',
      name: 'Text Overlay',
      description: 'Add text overlay to video',
      category: 'text',
      type: 'text',
      startTime: 0,
      endTime: 0,
      parameters: {
        content: {
          type: 'text',
          label: 'Text Content',
          value: 'Sample Text'
        },
        fontSize: {
          type: 'number',
          label: 'Font Size',
          value: 24,
          min: 8,
          max: 72,
          step: 1
        },
        color: {
          type: 'color',
          label: 'Text Color',
          value: '#ffffff'
        },
        position: {
          type: 'position',
          label: 'Position',
          value: { x: 0.5, y: 0.5 }
        }
      }
    }
  ],
  selectedEffectId: null,
  effectParameters: {},
  previewMode: false,

  addEffect: (effect) => {
    const newEffect: Effect = {
      ...effect,
      id: `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    set((state) => ({
      availableEffects: [...state.availableEffects, newEffect]
    }));
    return newEffect;
  },

  removeEffect: (effectId) => {
    set((state) => ({
      availableEffects: state.availableEffects.filter((effect) => effect.id !== effectId),
      selectedEffectId: state.selectedEffectId === effectId ? null : state.selectedEffectId
    }));
  },

  updateEffectParameters: (effectId, parameters) => {
    set((state) => ({
      availableEffects: state.availableEffects.map((effect) => {
        if (effect.id === effectId) {
          return {
            ...effect,
            parameters: {
              ...effect.parameters,
              ...parameters
            }
          };
        }
        return effect;
      })
    }));
  },

  setSelectedEffect: (effectId) => {
    set({ selectedEffectId: effectId });
  },

  setPreviewMode: (enabled) => {
    set({ previewMode: enabled });
  },

  getEffectById: (effectId) => {
    return get().availableEffects.find((effect) => effect.id === effectId);
  },

  getEffectsByCategory: (category) => {
    return get().availableEffects.filter((effect) => effect.category === category);
  }
}));

// Effect categories
export const EFFECT_CATEGORIES = [
  { id: 'filters', name: 'Filters' },
  { id: 'adjustments', name: 'Adjustments' },
  { id: 'keying', name: 'Keying' },
  { id: 'text', name: 'Text' },
  { id: 'transitions', name: 'Transitions' },
  { id: 'transforms', name: 'Transforms' }
];

// Parameter types and their configurations
export const PARAMETER_TYPES = {
  number: {
    component: 'Slider',
    defaultConfig: {
      min: 0,
      max: 100,
      step: 1
    }
  },
  color: {
    component: 'ColorPicker',
    defaultConfig: {
      format: 'hex'
    }
  },
  text: {
    component: 'TextInput',
    defaultConfig: {
      multiline: false
    }
  },
  position: {
    component: 'PositionControl',
    defaultConfig: {
      constrainToFrame: true
    }
  },
  boolean: {
    component: 'Toggle',
    defaultConfig: {
      label: 'Enable'
    }
  },
  select: {
    component: 'Dropdown',
    defaultConfig: {
      options: []
    }
  }
};