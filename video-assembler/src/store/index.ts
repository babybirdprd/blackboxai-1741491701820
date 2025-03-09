import { useTimelineStore } from './timeline';
import { useEffectsStore, EFFECT_CATEGORIES, PARAMETER_TYPES } from './effects';
import { useProjectStore } from './project';
import { useUIStore, type PanelId, type DialogId, type Theme, type Layout } from './ui';

// Re-export all stores and types
export {
  useTimelineStore,
  useEffectsStore,
  useProjectStore,
  useUIStore,
  EFFECT_CATEGORIES,
  PARAMETER_TYPES
};

// Export types
export type { PanelId, DialogId, Theme, Layout };

// Export interfaces from individual stores
export type {
  ProjectMetadata,
  ProjectSettings,
  ProjectAsset
} from './project';

export type {
  Effect
} from './effects';

// Create a hook to access all stores at once
export const useStores = () => ({
  timeline: useTimelineStore(),
  effects: useEffectsStore(),
  project: useProjectStore(),
  ui: useUIStore()
});

// Helper functions for common store operations
export const storeHelpers = {
  // Project operations
  createNewProject: () => {
    useProjectStore.getState().createNewProject();
    useTimelineStore.getState().tracks = [];
    useEffectsStore.getState().selectedEffectId = null;
  },

  // Timeline operations
  clearTimeline: () => {
    const timelineState = useTimelineStore.getState();
    timelineState.tracks.forEach(track => {
      timelineState.removeTrack(track.id);
    });
  },

  // Effect operations
  removeAllEffects: (segmentId: string) => {
    const timelineState = useTimelineStore.getState();
    const segment = timelineState.tracks
      .flatMap(track => track.segments)
      .find(seg => seg.id === segmentId);

    if (segment && segment.effects) {
      segment.effects.forEach(effect => {
        timelineState.removeEffect(segmentId, effect.id);
      });
    }
  },

  // UI operations
  toggleAllPanels: (visible: boolean) => {
    const uiState = useUIStore.getState();
    Object.keys(uiState.panels).forEach(panelId => {
      uiState.panels[panelId as PanelId].visible = visible;
    });
  }
};

// Store subscription helpers
export const createStoreSubscriber = (callback: () => void) => {
  const unsubscribeTimeline = useTimelineStore.subscribe(callback);
  const unsubscribeEffects = useEffectsStore.subscribe(callback);
  const unsubscribeProject = useProjectStore.subscribe(callback);
  const unsubscribeUI = useUIStore.subscribe(callback);

  return () => {
    unsubscribeTimeline();
    unsubscribeEffects();
    unsubscribeProject();
    unsubscribeUI();
  };
};

// Store persistence helpers
export const persistStores = async () => {
  try {
    await Promise.all([
      useProjectStore.persist.rehydrate(),
      useUIStore.persist.rehydrate()
    ]);
    return true;
  } catch (error) {
    console.error('Failed to persist stores:', error);
    return false;
  }
};

// Store state snapshot helpers
export const getStoreSnapshot = () => ({
  timeline: useTimelineStore.getState(),
  effects: useEffectsStore.getState(),
  project: useProjectStore.getState(),
  ui: useUIStore.getState()
});

// Store state restoration helper
export const restoreStoreSnapshot = (snapshot: ReturnType<typeof getStoreSnapshot>) => {
  useTimelineStore.setState(snapshot.timeline);
  useEffectsStore.setState(snapshot.effects);
  useProjectStore.setState(snapshot.project);
  useUIStore.setState(snapshot.ui);
};

// Middleware for logging store changes in development
if (process.env.NODE_ENV === 'development') {
  const subscribeWithLogger = (storeName: string, store: any) => {
    store.subscribe((state: any, prevState: any) => {
      console.log(`[${storeName} Store] State updated:`, {
        prev: prevState,
        next: state,
        diff: Object.keys(state).filter(key => state[key] !== prevState[key])
      });
    });
  };

  subscribeWithLogger('Timeline', useTimelineStore);
  subscribeWithLogger('Effects', useEffectsStore);
  subscribeWithLogger('Project', useProjectStore);
  subscribeWithLogger('UI', useUIStore);
}

// Export a function to initialize all stores
export const initializeStores = async () => {
  // Rehydrate persisted stores
  await persistStores();

  // Set initial theme
  const { theme } = useUIStore.getState();
  document.documentElement.setAttribute('data-theme', theme);

  // Initialize any other store-related setup
  return true;
};