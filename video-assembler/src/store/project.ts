import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProjectMetadata {
  name: string;
  description?: string;
  created: string;
  modified: string;
  version: string;
}

export interface ProjectSettings {
  frameRate: number;
  resolution: {
    width: number;
    height: number;
  };
  audioSampleRate: number;
  audioChannels: number;
  outputFormat: string;
}

export interface ProjectAsset {
  id: string;
  name: string;
  path: string;
  type: 'video' | 'audio' | 'image';
  duration?: number;
  metadata?: Record<string, any>;
  tags?: string[];
}

interface ProjectState {
  metadata: ProjectMetadata;
  settings: ProjectSettings;
  assets: ProjectAsset[];
  isDirty: boolean;
  currentProjectPath: string | null;
  recentProjects: string[];
  autoSaveEnabled: boolean;
  
  // Actions
  updateMetadata: (metadata: Partial<ProjectMetadata>) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  addAsset: (asset: Omit<ProjectAsset, 'id'>) => ProjectAsset;
  removeAsset: (assetId: string) => void;
  updateAsset: (assetId: string, updates: Partial<ProjectAsset>) => void;
  setProjectPath: (path: string | null) => void;
  addRecentProject: (path: string) => void;
  setAutoSave: (enabled: boolean) => void;
  markDirty: (isDirty: boolean) => void;
  
  // Project operations
  saveProject: () => Promise<void>;
  loadProject: (path: string) => Promise<void>;
  createNewProject: () => void;
  exportProject: (outputPath: string) => Promise<void>;
}

const DEFAULT_SETTINGS: ProjectSettings = {
  frameRate: 30,
  resolution: {
    width: 1920,
    height: 1080
  },
  audioSampleRate: 48000,
  audioChannels: 2,
  outputFormat: 'mp4'
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      metadata: {
        name: 'Untitled Project',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        version: '1.0.0'
      },
      settings: DEFAULT_SETTINGS,
      assets: [],
      isDirty: false,
      currentProjectPath: null,
      recentProjects: [],
      autoSaveEnabled: true,

      updateMetadata: (metadata) => {
        set((state) => ({
          metadata: {
            ...state.metadata,
            ...metadata,
            modified: new Date().toISOString()
          },
          isDirty: true
        }));
      },

      updateSettings: (settings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...settings
          },
          isDirty: true
        }));
      },

      addAsset: (asset) => {
        const newAsset: ProjectAsset = {
          ...asset,
          id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        set((state) => ({
          assets: [...state.assets, newAsset],
          isDirty: true
        }));
        return newAsset;
      },

      removeAsset: (assetId) => {
        set((state) => ({
          assets: state.assets.filter((asset) => asset.id !== assetId),
          isDirty: true
        }));
      },

      updateAsset: (assetId, updates) => {
        set((state) => ({
          assets: state.assets.map((asset) =>
            asset.id === assetId ? { ...asset, ...updates } : asset
          ),
          isDirty: true
        }));
      },

      setProjectPath: (path) => {
        set({ currentProjectPath: path });
        if (path) {
          get().addRecentProject(path);
        }
      },

      addRecentProject: (path) => {
        set((state) => ({
          recentProjects: [
            path,
            ...state.recentProjects.filter((p) => p !== path)
          ].slice(0, 10)
        }));
      },

      setAutoSave: (enabled) => {
        set({ autoSaveEnabled: enabled });
      },

      markDirty: (isDirty) => {
        set({ isDirty });
      },

      saveProject: async () => {
        const state = get();
        if (!state.currentProjectPath) {
          throw new Error('No project path set');
        }

        const projectData = {
          metadata: state.metadata,
          settings: state.settings,
          assets: state.assets
        };

        try {
          // Use electron's IPC to save file
          await window.electronAPI.saveProject(state.currentProjectPath, projectData);
          set({ isDirty: false });
        } catch (error) {
          console.error('Failed to save project:', error);
          throw error;
        }
      },

      loadProject: async (path) => {
        try {
          // Use electron's IPC to load file
          const projectData = await window.electronAPI.loadProject(path);
          set({
            metadata: projectData.metadata,
            settings: projectData.settings,
            assets: projectData.assets,
            currentProjectPath: path,
            isDirty: false
          });
          get().addRecentProject(path);
        } catch (error) {
          console.error('Failed to load project:', error);
          throw error;
        }
      },

      createNewProject: () => {
        set({
          metadata: {
            name: 'Untitled Project',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            version: '1.0.0'
          },
          settings: DEFAULT_SETTINGS,
          assets: [],
          isDirty: false,
          currentProjectPath: null
        });
      },

      exportProject: async (outputPath) => {
        const state = get();
        try {
          // Use electron's IPC to export project
          await window.electronAPI.exportProject(outputPath, {
            metadata: state.metadata,
            settings: state.settings,
            assets: state.assets
          });
        } catch (error) {
          console.error('Failed to export project:', error);
          throw error;
        }
      }
    }),
    {
      name: 'video-assembler-project',
      partialize: (state) => ({
        recentProjects: state.recentProjects,
        autoSaveEnabled: state.autoSaveEnabled
      })
    }
  )
);

// Add type definition for window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      saveProject: (path: string, data: any) => Promise<void>;
      loadProject: (path: string) => Promise<any>;
      exportProject: (path: string, data: any) => Promise<void>;
    };
  }
}