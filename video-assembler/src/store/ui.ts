import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PanelId = 'effects' | 'assets' | 'script' | 'properties';
export type DialogId = 'settings' | 'export' | 'about' | 'shortcuts';
export type Theme = 'light' | 'dark' | 'system';
export type Layout = 'default' | 'minimal' | 'advanced';

interface UIState {
  // Panel visibility and dimensions
  panels: {
    [key in PanelId]: {
      visible: boolean;
      width?: number;
      height?: number;
      position?: 'left' | 'right' | 'bottom';
    };
  };
  
  // Dialog states
  dialogs: {
    [key in DialogId]: {
      visible: boolean;
      data?: any;
    };
  };
  
  // Timeline UI state
  timeline: {
    height: number;
    showWaveforms: boolean;
    showThumbnails: boolean;
    snapToGrid: boolean;
    gridSize: number;
  };
  
  // Preview window state
  preview: {
    quality: 'auto' | 'low' | 'medium' | 'high';
    showSafeAreas: boolean;
    showGrid: boolean;
    zoom: number;
  };
  
  // General UI settings
  theme: Theme;
  layout: Layout;
  fontSize: number;
  showTooltips: boolean;
  confirmOnDelete: boolean;
  autoSaveInterval: number;
  
  // Actions
  togglePanel: (panelId: PanelId) => void;
  resizePanel: (panelId: PanelId, size: { width?: number; height?: number }) => void;
  showDialog: (dialogId: DialogId, data?: any) => void;
  hideDialog: (dialogId: DialogId) => void;
  updateTimelineSettings: (settings: Partial<UIState['timeline']>) => void;
  updatePreviewSettings: (settings: Partial<UIState['preview']>) => void;
  setTheme: (theme: Theme) => void;
  setLayout: (layout: Layout) => void;
  updateGeneralSettings: (settings: Partial<Pick<UIState, 'fontSize' | 'showTooltips' | 'confirmOnDelete' | 'autoSaveInterval'>>) => void;
  resetLayout: () => void;
}

const DEFAULT_LAYOUT: Pick<UIState, 'panels' | 'timeline' | 'preview'> = {
  panels: {
    effects: { visible: true, width: 300, position: 'right' },
    assets: { visible: true, width: 250, position: 'left' },
    script: { visible: false, width: 400, position: 'right' },
    properties: { visible: true, width: 300, position: 'right' }
  },
  timeline: {
    height: 200,
    showWaveforms: true,
    showThumbnails: true,
    snapToGrid: true,
    gridSize: 10
  },
  preview: {
    quality: 'auto',
    showSafeAreas: true,
    showGrid: false,
    zoom: 1
  }
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      panels: DEFAULT_LAYOUT.panels,
      dialogs: {
        settings: { visible: false },
        export: { visible: false },
        about: { visible: false },
        shortcuts: { visible: false }
      },
      timeline: DEFAULT_LAYOUT.timeline,
      preview: DEFAULT_LAYOUT.preview,
      theme: 'system',
      layout: 'default',
      fontSize: 14,
      showTooltips: true,
      confirmOnDelete: true,
      autoSaveInterval: 5,

      // Actions
      togglePanel: (panelId) => {
        set((state) => ({
          panels: {
            ...state.panels,
            [panelId]: {
              ...state.panels[panelId],
              visible: !state.panels[panelId].visible
            }
          }
        }));
      },

      resizePanel: (panelId, size) => {
        set((state) => ({
          panels: {
            ...state.panels,
            [panelId]: {
              ...state.panels[panelId],
              ...size
            }
          }
        }));
      },

      showDialog: (dialogId, data) => {
        set((state) => ({
          dialogs: {
            ...state.dialogs,
            [dialogId]: {
              visible: true,
              data
            }
          }
        }));
      },

      hideDialog: (dialogId) => {
        set((state) => ({
          dialogs: {
            ...state.dialogs,
            [dialogId]: {
              visible: false,
              data: undefined
            }
          }
        }));
      },

      updateTimelineSettings: (settings) => {
        set((state) => ({
          timeline: {
            ...state.timeline,
            ...settings
          }
        }));
      },

      updatePreviewSettings: (settings) => {
        set((state) => ({
          preview: {
            ...state.preview,
            ...settings
          }
        }));
      },

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
      },

      setLayout: (layout) => {
        set({ layout });
        // Apply layout-specific settings
        switch (layout) {
          case 'minimal':
            set((state) => ({
              panels: {
                ...state.panels,
                script: { ...state.panels.script, visible: false },
                properties: { ...state.panels.properties, visible: false }
              }
            }));
            break;
          case 'advanced':
            set((state) => ({
              panels: {
                ...state.panels,
                script: { ...state.panels.script, visible: true },
                properties: { ...state.panels.properties, visible: true }
              }
            }));
            break;
        }
      },

      updateGeneralSettings: (settings) => {
        set((state) => ({
          ...state,
          ...settings
        }));
      },

      resetLayout: () => {
        set((state) => ({
          ...state,
          panels: DEFAULT_LAYOUT.panels,
          timeline: DEFAULT_LAYOUT.timeline,
          preview: DEFAULT_LAYOUT.preview
        }));
      }
    }),
    {
      name: 'video-assembler-ui',
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        showTooltips: state.showTooltips,
        confirmOnDelete: state.confirmOnDelete,
        autoSaveInterval: state.autoSaveInterval
      })
    }
  )
);

// Utility functions for layout management
export const getVisiblePanels = (state: UIState) =>
  Object.entries(state.panels)
    .filter(([_, panel]) => panel.visible)
    .map(([id]) => id as PanelId);

export const getPanelsByPosition = (state: UIState, position: 'left' | 'right' | 'bottom') =>
  Object.entries(state.panels)
    .filter(([_, panel]) => panel.visible && panel.position === position)
    .map(([id]) => id as PanelId);

export const getTotalPanelWidth = (state: UIState, position: 'left' | 'right') =>
  Object.values(state.panels)
    .filter((panel) => panel.visible && panel.position === position)
    .reduce((total, panel) => total + (panel.width || 0), 0);