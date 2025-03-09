// Core application types
export interface ApplicationConfig {
  version: string;
  environment: 'development' | 'production' | 'test';
  features: Record<string, boolean>;
}

// Media types
export interface MediaMetadata {
  duration: number;
  width?: number;
  height?: number;
  frameRate?: number;
  bitrate?: number;
  codec?: string;
  container?: string;
  audioChannels?: number;
  audioSampleRate?: number;
  rotation?: number;
  creationDate?: string;
  modificationDate?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  tags?: Record<string, string>;
}

export interface MediaStream {
  index: number;
  type: 'video' | 'audio' | 'subtitle';
  codec: string;
  language?: string;
  bitrate?: number;
  // Video-specific properties
  width?: number;
  height?: number;
  frameRate?: number;
  // Audio-specific properties
  channels?: number;
  sampleRate?: number;
  // Subtitle-specific properties
  format?: string;
}

// Effect types
export interface EffectParameter<T = any> {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'color' | 'select' | 'position';
  label: string;
  value: T;
  defaultValue: T;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{
    label: string;
    value: T;
  }>;
}

export interface Effect {
  id: string;
  name: string;
  type: string;
  category: string;
  parameters: Record<string, EffectParameter>;
  preview?: string;
  description?: string;
  isEnabled: boolean;
  startTime: number;
  endTime: number;
}

// Timeline types
export interface TimelineMarker {
  id: string;
  time: number;
  type: 'in' | 'out' | 'custom';
  label?: string;
  color?: string;
}

export interface TimelineRegion {
  id: string;
  startTime: number;
  endTime: number;
  label?: string;
  color?: string;
  type?: string;
}

// Export types
export interface ExportSettings {
  format: string;
  codec: string;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  quality: 'low' | 'medium' | 'high';
  audioCodec?: string;
  audioBitrate?: number;
  audioSampleRate?: number;
  includeSubtitles?: boolean;
  metadata?: Record<string, string>;
}

export interface ExportProgress {
  phase: 'preparing' | 'processing' | 'finalizing';
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  timeRemaining?: number;
  currentFile?: string;
}

// Script types
export interface ScriptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  value: any;
  description?: string;
}

export interface ScriptFunction {
  name: string;
  parameters: Array<{
    name: string;
    type: string;
    description?: string;
    defaultValue?: any;
  }>;
  returnType: string;
  description?: string;
}

export interface Script {
  id: string;
  name: string;
  content: string;
  variables: ScriptVariable[];
  functions: ScriptFunction[];
  isEnabled: boolean;
}

// UI types
export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export interface ToastProps {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: Array<{
    label: string;
    icon?: string;
    action: () => void;
    disabled?: boolean;
    separator?: boolean;
  }>;
}

// Event types
export interface TimelineEvent {
  type: 'segment' | 'marker' | 'region';
  action: 'add' | 'remove' | 'update' | 'move';
  data: any;
  timestamp: number;
}

export interface ProjectEvent {
  type: 'save' | 'load' | 'export' | 'close';
  status: 'start' | 'progress' | 'complete' | 'error';
  data?: any;
  error?: Error;
  timestamp: number;
}

// Error types
export interface AppError extends Error {
  code: string;
  details?: Record<string, any>;
}

// State types
export interface ApplicationState {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
}

export interface ProjectState {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
}

// Command types
export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  execute: () => void;
  undo?: () => void;
  isEnabled?: () => boolean;
}

export interface CommandHistory {
  undoStack: Command[];
  redoStack: Command[];
}

// Plugin types
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  initialize: () => Promise<void>;
  cleanup: () => Promise<void>;
  commands?: Command[];
  effects?: Effect[];
}

// Service types
export interface ServiceConfig {
  name: string;
  version: string;
  dependencies?: string[];
  config?: Record<string, any>;
}

export interface Service {
  initialize: () => Promise<void>;
  cleanup: () => Promise<void>;
  getConfig: () => ServiceConfig;
  isInitialized: () => boolean;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any;