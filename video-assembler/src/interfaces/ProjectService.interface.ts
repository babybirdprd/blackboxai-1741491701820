import { TimelineState } from '../services/TimelineService';
import { VideoSegment } from '../services/LosslessVideoService';

export interface ProjectMetadata {
  name: string;
  created: string;
  modified: string;
  version: string;
}

export interface ProjectData {
  metadata: ProjectMetadata;
  timeline: TimelineState;
  segments: VideoSegment[];
}

export interface IProjectService {
  /**
   * Create a new project
   */
  createProject(name: string): Promise<void>;

  /**
   * Save project to file
   */
  saveProject(path?: string): Promise<void>;

  /**
   * Load project from file
   */
  loadProject(path: string): Promise<void>;

  /**
   * Get current project data
   */
  getCurrentProject(): ProjectData | null;

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges(): boolean;

  /**
   * Clean up resources
   */
  dispose(): void;

  // Event handlers
  on(event: 'projectCreated', listener: (project: ProjectData) => void): void;
  on(event: 'projectSaved', listener: (path: string) => void): void;
  on(event: 'projectLoaded', listener: (project: ProjectData) => void): void;
  on(event: 'autoSave', listener: (path: string) => void): void;
  on(event: 'error', listener: (message: string) => void): void;
}
