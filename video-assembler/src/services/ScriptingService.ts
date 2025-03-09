import { EventEmitter } from 'events';
import LosslessVideoService, { VideoSegment } from './LosslessVideoService';
import TimelineService, { TimelineEffect } from './TimelineService';

interface ScriptContext {
  variables: Record<string, any>;
  functions: Record<string, Function>;
}

interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  script: string;
  parameters: ScriptParameter[];
}

interface ScriptParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  default?: any;
  required?: boolean;
}

export class ScriptingService extends EventEmitter {
  private static instance: ScriptingService;
  private context: ScriptContext;
  private templates: ScriptTemplate[] = [];

  private constructor() {
    super();
    this.context = {
      variables: {},
      functions: this.buildCoreFunctions()
    };
  }

  public static getInstance(): ScriptingService {
    if (!ScriptingService.instance) {
      ScriptingService.instance = new ScriptingService();
    }
    return ScriptingService.instance;
  }

  /**
   * Build core functions available to scripts
   */
  private buildCoreFunctions(): Record<string, Function> {
    return {
      // File operations
      loadVideo: async (path: string) => {
        try {
          const mediaInfo = await LosslessVideoService.analyzeFile(path);
          return {
            path,
            duration: mediaInfo.duration,
            streams: mediaInfo.streams
          };
        } catch (error) {
          this.emit('error', `Failed to load video: ${error.message}`);
          throw error;
        }
      },

      // Timeline operations
      createTrack: (type: 'video' | 'audio' | 'subtitle') => {
        return TimelineService.createTrack(type);
      },

      addSegment: (trackId: string, videoPath: string, startTime: number, endTime: number, position: number) => {
        return LosslessVideoService.createSegment(videoPath, startTime, endTime)
          .then(segment => TimelineService.addSegment(trackId, segment, position));
      },

      // Effect operations
      addEffect: (segmentId: string, effectType: string, parameters: Record<string, any>) => {
        const effect: Omit<TimelineEffect, 'id'> = {
          type: effectType,
          startTime: 0,
          endTime: 0,
          parameters
        };
        return TimelineService.addEffect(segmentId, effect);
      },

      // Analysis operations
      detectScenes: async (videoPath: string) => {
        return LosslessVideoService.detectScenes(videoPath);
      },

      detectSilence: async (videoPath: string, threshold?: number) => {
        return LosslessVideoService.detectSilence(videoPath, threshold);
      },

      // Export operations
      exportSegment: async (segment: VideoSegment, outputPath: string) => {
        return LosslessVideoService.processSegments([segment], { outputPath });
      }
    };
  }

  /**
   * Register a custom function to be available in scripts
   */
  public registerFunction(name: string, func: Function): void {
    this.context.functions[name] = func;
  }

  /**
   * Set a variable in the script context
   */
  public setVariable(name: string, value: any): void {
    this.context.variables[name] = value;
  }

  /**
   * Execute a script with given parameters
   */
  public async executeScript(script: string, parameters: Record<string, any> = {}): Promise<any> {
    try {
      // Create script context with variables and functions
      const contextString = Object.entries(this.context.functions)
        .map(([name, func]) => `const ${name} = ${func.toString()};`)
        .join('\n');

      const variablesString = Object.entries({ ...this.context.variables, ...parameters })
        .map(([name, value]) => `const ${name} = ${JSON.stringify(value)};`)
        .join('\n');

      // Wrap script in async function for await support
      const wrappedScript = `
        (async () => {
          ${contextString}
          ${variablesString}
          ${script}
        })()
      `;

      // Execute script
      const result = await eval(wrappedScript);
      this.emit('scriptCompleted', { script, result });
      return result;
    } catch (error) {
      this.emit('error', `Script execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Register a script template
   */
  public registerTemplate(template: ScriptTemplate): void {
    this.templates.push(template);
    this.emit('templateAdded', template);
  }

  /**
   * Get all registered templates
   */
  public getTemplates(): ScriptTemplate[] {
    return [...this.templates];
  }

  /**
   * Execute a template with parameters
   */
  public async executeTemplate(templateId: string, parameters: Record<string, any>): Promise<any> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Validate parameters
    for (const param of template.parameters) {
      if (param.required && !(param.name in parameters)) {
        throw new Error(`Required parameter ${param.name} not provided`);
      }
    }

    return this.executeScript(template.script, parameters);
  }

  /**
   * Create a batch processing script
   */
  public createBatchScript(operations: Array<{
    type: string;
    parameters: Record<string, any>;
  }>): string {
    return operations.map(op => {
      const params = JSON.stringify(op.parameters, null, 2);
      return `await ${op.type}(${params});`;
    }).join('\n');
  }

  /**
   * Register common script templates
   */
  public registerCommonTemplates(): void {
    // Template for scene detection and splitting
    this.registerTemplate({
      id: 'scene-split',
      name: 'Scene Detection and Split',
      description: 'Detect scenes in a video and split into segments',
      script: `
        const scenes = await detectScenes(inputPath);
        const videoTrack = await createTrack('video');
        
        for (let i = 0; i < scenes.length - 1; i++) {
          await addSegment(
            videoTrack.id,
            inputPath,
            scenes[i],
            scenes[i + 1],
            scenes[i]
          );
        }
      `,
      parameters: [{
        name: 'inputPath',
        type: 'string',
        description: 'Path to input video file',
        required: true
      }]
    });

    // Template for silence detection and removal
    this.registerTemplate({
      id: 'silence-remove',
      name: 'Silence Detection and Removal',
      description: 'Detect and remove silent segments from audio/video',
      script: `
        const silentSegments = await detectSilence(inputPath, threshold);
        const videoTrack = await createTrack('video');
        let currentPosition = 0;
        
        for (const segment of silentSegments) {
          if (segment.start > currentPosition) {
            await addSegment(
              videoTrack.id,
              inputPath,
              currentPosition,
              segment.start,
              currentPosition
            );
          }
          currentPosition = segment.end;
        }
      `,
      parameters: [{
        name: 'inputPath',
        type: 'string',
        description: 'Path to input video file',
        required: true
      }, {
        name: 'threshold',
        type: 'number',
        description: 'Silence threshold in dB',
        default: -50
      }]
    });
  }
}

export default ScriptingService.getInstance();