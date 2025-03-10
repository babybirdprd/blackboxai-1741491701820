import { EventEmitter } from 'events';
import { ServiceError } from '../interfaces';
import { IProjectService, ProjectData, ProjectMetadata } from '../interfaces/ProjectService.interface';
import FileSystemService from './FileSystemService';
import TimelineService from './TimelineService';

interface ProjectEvents {
  initialized: () => void;
  disposed: () => void;
  error: (error: ServiceError) => void;
  projectCreated: (project: ProjectData) => void;
  projectSaved: (path: string) => void;
  projectLoaded: (project: ProjectData) => void;
  autoSave: (path: string) => void;
}

export class ProjectService extends EventEmitter implements IProjectService {
  private static instance: ProjectService;
  private initialized = false;
  private currentProject: ProjectData | null = null;
  private hasChanges = false;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    super();
    this.setupAutoSave();
  }

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize required services
      await FileSystemService.initialize();
      await TimelineService.initialize();

      this.initialized = true;
      this.emit('initialized');
    } catch (error) {
      const serviceError = this.createError(
        'Failed to initialize project service',
        'PROJECT_INIT_ERROR',
        error
      );
      this.emit('error', serviceError);
      throw serviceError;
    }
  }

  public async dispose(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      this.clearAutoSave();
      this.currentProject = null;
      this.hasChanges = false;
      this.initialized = false;
      this.emit('disposed');
    } catch (error) {
      const serviceError = this.createError(
        'Failed to dispose project service',
        'PROJECT_DISPOSE_ERROR',
        error
      );
      this.emit('error', serviceError);
      throw serviceError;
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async createProject(name: string): Promise<void> {
    this.checkInitialized();

    const metadata: ProjectMetadata = {
      name,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      version: '1.0.0',
    };

    const project: ProjectData = {
      metadata,
      timeline: TimelineService.getState(),
      segments: [],
    };

    this.currentProject = project;
    this.hasChanges = true;
    this.emit('projectCreated', project);
  }

  public async saveProject(path?: string): Promise<void> {
    this.checkInitialized();

    if (!this.currentProject) {
      throw this.createError('No project to save', 'NO_PROJECT');
    }

    try {
      // Update modification time
      this.currentProject.metadata.modified = new Date().toISOString();

      // Get current timeline state
      this.currentProject.timeline = TimelineService.getState();

      // Save to file
      await FileSystemService.saveProject(
        path || this.currentProject.metadata.name,
        this.currentProject
      );

      this.hasChanges = false;
      this.emit('projectSaved', path || this.currentProject.metadata.name);
    } catch (error) {
      throw this.createError('Failed to save project', 'PROJECT_SAVE_ERROR', error);
    }
  }

  public async loadProject(path: string): Promise<void> {
    this.checkInitialized();

    try {
      const project = await FileSystemService.loadProject(path) as ProjectData;

      // Validate project data
      if (!this.isValidProjectData(project)) {
        throw new Error('Invalid project data');
      }

      // Load timeline state
      await TimelineService.dispose(); // Clear current timeline
      await TimelineService.initialize(); // Reinitialize timeline

      // Set timeline state
      const state = project.timeline;
      state.tracks.forEach(track => {
        const newTrack = TimelineService.createTrack(track.type);
        track.segments.forEach(segment => {
          TimelineService.addSegment(newTrack.id, segment, segment.position);
        });
      });

      this.currentProject = project;
      this.hasChanges = false;
      this.emit('projectLoaded', project);
    } catch (error) {
      throw this.createError('Failed to load project', 'PROJECT_LOAD_ERROR', error);
    }
  }

  public getCurrentProject(): ProjectData | null {
    return this.currentProject ? { ...this.currentProject } : null;
  }

  public hasUnsavedChanges(): boolean {
    return this.hasChanges;
  }

  private setupAutoSave(): void {
    this.clearAutoSave();
    this.autoSaveInterval = setInterval(async () => {
      if (this.hasChanges && this.currentProject) {
        try {
          await this.saveProject();
          this.emit('autoSave', this.currentProject.metadata.name);
        } catch (error) {
          this.emit('error', this.createError('Auto-save failed', 'AUTO_SAVE_ERROR', error));
        }
      }
    }, this.DEFAULT_AUTO_SAVE_INTERVAL);
  }

  private clearAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  private checkInitialized(): void {
    if (!this.initialized) {
      throw this.createError('Project service not initialized', 'SERVICE_NOT_INITIALIZED');
    }
  }

  private isValidProjectData(data: unknown): data is ProjectData {
    const project = data as ProjectData;
    return (
      project &&
      typeof project === 'object' &&
      'metadata' in project &&
      'timeline' in project &&
      'segments' in project &&
      Array.isArray(project.segments)
    );
  }

  private createError(
    message: string,
    code: string = 'PROJECT_ERROR',
    details?: unknown
  ): ServiceError {
    return {
      name: 'ProjectError',
      message,
      code,
      details,
    };
  }

  // Type-safe event emitter methods
  public override on<K extends keyof ProjectEvents>(
    event: K,
    listener: ProjectEvents[K]
  ): this {
    return super.on(event, listener);
  }

  public override off<K extends keyof ProjectEvents>(
    event: K,
    listener: ProjectEvents[K]
  ): this {
    return super.off(event, listener);
  }

  public override emit<K extends keyof ProjectEvents>(
    event: K,
    ...args: Parameters<ProjectEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  public override once<K extends keyof ProjectEvents>(
    event: K,
    listener: ProjectEvents[K]
  ): this {
    return super.once(event, listener);
  }
}

export default ProjectService.getInstance();
