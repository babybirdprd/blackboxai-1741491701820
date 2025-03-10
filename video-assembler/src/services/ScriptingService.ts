import EventEmitter from 'events';
import TimelineService from './TimelineService';
import LosslessVideoService from './LosslessVideoService';
import FFmpegService from './FFmpegService';

export interface ScriptContext {
  timeline: typeof TimelineService;
  video: typeof LosslessVideoService;
  ffmpeg: typeof FFmpegService;
  variables: Record<string, any>;
}

export interface ScriptFunction {
  name: string;
  parameters: string[];
  body: string;
}

interface ScriptingEvents {
  functionRegistered: (functionName: string) => void;
  scriptComplete: (result: { success: boolean }) => void;
  error: (message: string) => void;
  variableSet: (data: { name: string; value: any }) => void;
}

class ScriptingServiceBase extends EventEmitter {
  declare emit: <K extends keyof ScriptingEvents>(event: K, ...args: Parameters<ScriptingEvents[K]>) => boolean;
}

export class ScriptingService extends ScriptingServiceBase {
  private static instance: ScriptingService;
  private context: ScriptContext;
  private functions: Map<string, ScriptFunction>;

  private constructor() {
    super();
    this.functions = new Map();
    this.context = {
      timeline: TimelineService,
      video: LosslessVideoService,
      ffmpeg: FFmpegService,
      variables: {},
    };
  }

  public static getInstance(): ScriptingService {
    if (!ScriptingService.instance) {
      ScriptingService.instance = new ScriptingService();
    }
    return ScriptingService.instance;
  }

  /**
   * Register a custom function
   */
  public registerFunction(func: ScriptFunction): void {
    this.functions.set(func.name, func);
    this.emit('functionRegistered', func.name);
  }

  /**
   * Execute a script in the current context
   */
  public async executeScript(script: string): Promise<any> {
    try {
      // Create function context with available services
      const contextStr = Object.keys(this.context)
        .map((key) => `const ${key} = this.context.${key};`)
        .join('\n');

      // Create registered function definitions
      const functionsStr = Array.from(this.functions.values())
        .map((func) => {
          const params = func.parameters.join(', ');
          return `async function ${func.name}(${params}) {\n${func.body}\n}`;
        })
        .join('\n\n');

      // Combine context, functions, and user script
      const fullScript = `
        ${contextStr}
        ${functionsStr}
        ${script}
      `;

      // Execute in async context
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const scriptFunc = new AsyncFunction('context', fullScript);
      
      const result = await scriptFunc.call(this, this.context);
      this.emit('scriptComplete', { success: true });
      return result;
    } catch (error) {
      this.emit('error', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Execute a query expression (for segment selection)
   */
  public async executeQuery(expression: string): Promise<string[]> {
    try {
      const queryScript = `
        return (async () => {
          const segments = timeline.getState().tracks
            .flatMap((track) => track.segments);
          return segments.filter((segment) => {
            return ${expression};
          }).map((segment) => segment.id);
        })();
      `;
      
      return this.executeScript(queryScript);
    } catch (error) {
      this.emit('error', `Query execution failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Register built-in utility functions
   */
  public registerBuiltIns(): void {
    // Time manipulation
    this.registerFunction({
      name: 'timeToSeconds',
      parameters: ['timeStr'],
      body: `
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
      `,
    });

    // Segment operations
    this.registerFunction({
      name: 'splitSegmentAtTime',
      parameters: ['segmentId', 'time'],
      body: `
        const segment = timeline.getState().tracks
          .flatMap((t) => t.segments)
          .find((s) => s.id === segmentId);
        if (!segment) throw new Error('Segment not found');
        
        const relativeTime = time - segment.position;
        if (relativeTime <= 0 || relativeTime >= segment.duration) {
          throw new Error('Invalid split time');
        }

        const newSegment = await video.createSegment(
          segment.filePath,
          segment.startTime + relativeTime,
          segment.endTime
        );

        timeline.addSegment(segment.trackId, newSegment, time);
        
        // Update original segment
        segment.endTime = segment.startTime + relativeTime;
        segment.duration = relativeTime;
      `,
    });

    // Effect operations
    this.registerFunction({
      name: 'applyEffectToSelection',
      parameters: ['effectType', 'parameters'],
      body: `
        const selection = timeline.getState().selection;
        for (const segmentId of selection) {
          timeline.addEffect(segmentId, {
            type: effectType,
            startTime: 0,
            endTime: Infinity,
            parameters,
          }),
        }
      `,
    });
  }

  /**
   * Set a variable in the script context
   */
  public setVariable(name: string, value: any): void {
    this.context.variables[name] = value;
    this.emit('variableSet', { name, value });
  }

  /**
   * Get a variable from the script context
   */
  public getVariable(name: string): any {
    return this.context.variables[name];
  }
}

export default ScriptingService.getInstance();
