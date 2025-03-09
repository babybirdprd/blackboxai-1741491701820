import ScriptingService from '../ScriptingService';
import LosslessVideoService from '../LosslessVideoService';
import TimelineService from '../TimelineService';

jest.mock('../LosslessVideoService');
jest.mock('../TimelineService');

describe('ScriptingService', () => {
  let service: ScriptingService;

  beforeEach(() => {
    service = ScriptingService.getInstance();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ScriptingService.getInstance();
      const instance2 = ScriptingService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Script Execution', () => {
    it('should execute a simple script', async () => {
      const script = `
        const result = 1 + 1;
        return result;
      `;

      const result = await service.executeScript(script);
      expect(result).toBe(2);
    });

    it('should handle async operations', async () => {
      const script = `
        const result = await new Promise(resolve => setTimeout(() => resolve(42), 10));
        return result;
      `;

      const result = await service.executeScript(script);
      expect(result).toBe(42);
    });

    it('should handle script errors', async () => {
      const script = `
        throw new Error('Test error');
      `;

      await expect(service.executeScript(script)).rejects.toThrow('Test error');
    });

    it('should provide access to registered functions', async () => {
      service.registerFunction('add', (a: number, b: number) => a + b);

      const script = `
        const result = add(2, 3);
        return result;
      `;

      const result = await service.executeScript(script);
      expect(result).toBe(5);
    });
  });

  describe('Template Management', () => {
    const testTemplate = {
      id: 'test-template',
      name: 'Test Template',
      description: 'A test template',
      script: 'return input + 1;',
      parameters: [
        {
          name: 'input',
          type: 'number',
          description: 'Input number',
          required: true
        }
      ]
    };

    it('should register and retrieve templates', () => {
      service.registerTemplate(testTemplate);
      const templates = service.getTemplates();
      
      expect(templates).toContainEqual(testTemplate);
    });

    it('should execute a template with parameters', async () => {
      service.registerTemplate(testTemplate);
      
      const result = await service.executeTemplate('test-template', { input: 5 });
      expect(result).toBe(6);
    });

    it('should validate required parameters', async () => {
      service.registerTemplate(testTemplate);
      
      await expect(
        service.executeTemplate('test-template', {})
      ).rejects.toThrow('Required parameter input not provided');
    });

    it('should throw error for non-existent template', async () => {
      await expect(
        service.executeTemplate('non-existent', {})
      ).rejects.toThrow('Template non-existent not found');
    });
  });

  describe('Batch Processing', () => {
    it('should create a valid batch script', () => {
      const operations = [
        {
          type: 'loadVideo',
          parameters: { path: 'test.mp4' }
        },
        {
          type: 'detectScenes',
          parameters: { threshold: 0.4 }
        }
      ];

      const script = service.createBatchScript(operations);
      
      expect(script).toContain('await loadVideo(');
      expect(script).toContain('await detectScenes(');
    });
  });

  describe('Common Templates', () => {
    beforeEach(() => {
      service.registerCommonTemplates();
    });

    it('should register scene detection template', () => {
      const templates = service.getTemplates();
      const sceneTemplate = templates.find(t => t.id === 'scene-split');
      
      expect(sceneTemplate).toBeDefined();
      expect(sceneTemplate?.parameters).toContainEqual(
        expect.objectContaining({
          name: 'inputPath',
          required: true
        })
      );
    });

    it('should register silence detection template', () => {
      const templates = service.getTemplates();
      const silenceTemplate = templates.find(t => t.id === 'silence-remove');
      
      expect(silenceTemplate).toBeDefined();
      expect(silenceTemplate?.parameters).toContainEqual(
        expect.objectContaining({
          name: 'threshold',
          type: 'number'
        })
      );
    });
  });

  describe('Context Management', () => {
    it('should set and use variables in script context', async () => {
      service.setVariable('testVar', 42);

      const script = `
        return testVar;
      `;

      const result = await service.executeScript(script);
      expect(result).toBe(42);
    });

    it('should override variables with script parameters', async () => {
      service.setVariable('testVar', 42);

      const script = `
        return testVar;
      `;

      const result = await service.executeScript(script, { testVar: 24 });
      expect(result).toBe(24);
    });
  });

  describe('Event Handling', () => {
    it('should emit events during script execution', async () => {
      const completedCallback = jest.fn();
      const errorCallback = jest.fn();

      service.on('scriptCompleted', completedCallback);
      service.on('error', errorCallback);

      await service.executeScript('return 42;');

      expect(completedCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          script: 'return 42;',
          result: 42
        })
      );
      expect(errorCallback).not.toHaveBeenCalled();
    });

    it('should emit error events for script failures', async () => {
      const errorCallback = jest.fn();
      service.on('error', errorCallback);

      try {
        await service.executeScript('throw new Error("Test error");');
      } catch (error) {
        // Expected error
      }

      expect(errorCallback).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
    });
  });

  describe('Integration with Services', () => {
    it('should provide access to video processing functions', async () => {
      const mockDetectScenes = jest.fn().mockResolvedValue([0, 10, 20]);
      (LosslessVideoService.detectScenes as jest.Mock) = mockDetectScenes;

      const script = `
        const scenes = await detectScenes('test.mp4');
        return scenes;
      `;

      const result = await service.executeScript(script);
      expect(result).toEqual([0, 10, 20]);
      expect(mockDetectScenes).toHaveBeenCalledWith('test.mp4');
    });

    it('should provide access to timeline functions', async () => {
      const mockCreateTrack = jest.fn().mockReturnValue({ id: 'track1' });
      (TimelineService.createTrack as jest.Mock) = mockCreateTrack;

      const script = `
        const track = await createTrack('video');
        return track;
      `;

      const result = await service.executeScript(script);
      expect(result).toEqual({ id: 'track1' });
      expect(mockCreateTrack).toHaveBeenCalledWith('video');
    });
  });
});