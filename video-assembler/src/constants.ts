// Application information
export const APP_VERSION = '1.0.0';
export const APP_NAME = 'Video Assembler';
export const APP_DESCRIPTION = 'A modular video editing application';

// File types and extensions
export const SUPPORTED_VIDEO_FORMATS = [
  { name: 'MP4', extensions: ['mp4'] },
  { name: 'MOV', extensions: ['mov'] },
  { name: 'AVI', extensions: ['avi'] },
  { name: 'MKV', extensions: ['mkv'] },
  { name: 'WebM', extensions: ['webm'] },
  { name: 'M4V', extensions: ['m4v'] }
];

export const SUPPORTED_AUDIO_FORMATS = [
  { name: 'MP3', extensions: ['mp3'] },
  { name: 'WAV', extensions: ['wav'] },
  { name: 'AAC', extensions: ['aac'] },
  { name: 'FLAC', extensions: ['flac'] },
  { name: 'M4A', extensions: ['m4a'] }
];

export const SUPPORTED_IMAGE_FORMATS = [
  { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
  { name: 'PNG', extensions: ['png'] },
  { name: 'GIF', extensions: ['gif'] },
  { name: 'WebP', extensions: ['webp'] }
];

// Timeline constants
export const TIMELINE = {
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 10,
  DEFAULT_ZOOM: 1,
  TRACK_HEIGHT: 80,
  HEADER_HEIGHT: 40,
  THUMBNAIL_HEIGHT: 60,
  WAVEFORM_HEIGHT: 40,
  MIN_SEGMENT_WIDTH: 10,
  GRID_SIZES: [1, 5, 10, 15, 30, 60], // seconds
  SNAP_THRESHOLD: 5 // pixels
};

// Video preview constants
export const PREVIEW = {
  QUALITIES: {
    auto: { label: 'Auto', value: 'auto' },
    low: { label: 'Low (480p)', value: '480p' },
    medium: { label: 'Medium (720p)', value: '720p' },
    high: { label: 'High (1080p)', value: '1080p' }
  },
  SAFE_AREAS: {
    action: { horizontal: 0.9, vertical: 0.9 },
    title: { horizontal: 0.8, vertical: 0.8 }
  },
  ASPECT_RATIOS: [
    { label: '16:9', value: 16/9 },
    { label: '4:3', value: 4/3 },
    { label: '1:1', value: 1 },
    { label: '9:16', value: 9/16 }
  ]
};

// Effect constants
export const EFFECTS = {
  CATEGORIES: [
    { id: 'filters', name: 'Filters' },
    { id: 'adjustments', name: 'Adjustments' },
    { id: 'transitions', name: 'Transitions' },
    { id: 'text', name: 'Text' },
    { id: 'overlays', name: 'Overlays' }
  ],
  PARAMETER_TYPES: {
    number: 'number',
    color: 'color',
    boolean: 'boolean',
    select: 'select',
    text: 'text',
    position: 'position'
  }
};

// Export settings
export const EXPORT = {
  PRESETS: {
    web: {
      name: 'Web',
      format: 'mp4',
      codec: 'h264',
      quality: 'high'
    },
    mobile: {
      name: 'Mobile',
      format: 'mp4',
      codec: 'h264',
      quality: 'medium'
    },
    archive: {
      name: 'Archive',
      format: 'mkv',
      codec: 'h265',
      quality: 'high'
    }
  },
  FORMATS: [
    { id: 'mp4', name: 'MP4', extension: 'mp4' },
    { id: 'mov', name: 'QuickTime', extension: 'mov' },
    { id: 'mkv', name: 'Matroska', extension: 'mkv' },
    { id: 'webm', name: 'WebM', extension: 'webm' }
  ]
};

// Keyboard shortcuts
export const SHORTCUTS = {
  GENERAL: {
    SAVE: 'Ctrl+S',
    SAVE_AS: 'Ctrl+Shift+S',
    OPEN: 'Ctrl+O',
    NEW: 'Ctrl+N',
    UNDO: 'Ctrl+Z',
    REDO: 'Ctrl+Shift+Z',
    DELETE: 'Delete'
  },
  PLAYBACK: {
    PLAY_PAUSE: 'Space',
    NEXT_FRAME: 'Right',
    PREV_FRAME: 'Left',
    NEXT_SEGMENT: 'Shift+Right',
    PREV_SEGMENT: 'Shift+Left',
    MARK_IN: 'I',
    MARK_OUT: 'O'
  },
  TIMELINE: {
    ZOOM_IN: 'Ctrl+=',
    ZOOM_OUT: 'Ctrl+-',
    ZOOM_FIT: 'Ctrl+0',
    SPLIT: 'S',
    RIPPLE_DELETE: 'Shift+Delete'
  }
};

// Error messages
export const ERRORS = {
  GENERAL: {
    UNKNOWN: 'An unknown error occurred',
    NOT_IMPLEMENTED: 'This feature is not implemented yet',
    INVALID_OPERATION: 'Invalid operation'
  },
  FILE: {
    NOT_FOUND: 'File not found',
    INVALID_FORMAT: 'Invalid file format',
    READ_ERROR: 'Error reading file',
    WRITE_ERROR: 'Error writing file'
  },
  PROJECT: {
    LOAD_ERROR: 'Error loading project',
    SAVE_ERROR: 'Error saving project',
    INVALID_PROJECT: 'Invalid project file'
  },
  EXPORT: {
    FAILED: 'Export failed',
    INVALID_SETTINGS: 'Invalid export settings'
  }
};

// UI Theme
export const THEME = {
  COLORS: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: {
      primary: '#111827',
      secondary: '#1F2937',
      tertiary: '#374151'
    }
  },
  FONTS: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace'
  },
  SPACING: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
};

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'video-assembler-theme',
  RECENT_PROJECTS: 'video-assembler-recent-projects',
  UI_SETTINGS: 'video-assembler-ui-settings',
  WORKSPACE: 'video-assembler-workspace'
};

// API endpoints (if needed)
export const API = {
  BASE_URL: process.env.API_URL || 'http://localhost:3000',
  ENDPOINTS: {
    PROJECTS: '/api/projects',
    ASSETS: '/api/assets',
    EXPORT: '/api/export'
  }
};

// Feature flags
export const FEATURES = {
  EXPERIMENTAL: {
    AI_SCENE_DETECTION: false,
    AUTOMATIC_CAPTIONS: false,
    CLOUD_SYNC: false
  },
  BETA: {
    EFFECTS_ENGINE: true,
    SCRIPTING: true,
    REMOTE_COLLABORATION: false
  }
};