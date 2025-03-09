import { ipcRenderer } from 'electron';
import FFmpegService from '../FFmpegService';

jest.mock('electron', () => ({
  ipcRenderer: {
    on: jest.fn(),
    invoke: jest.fn(),
    removeListener: jest.fn()
  }
}));

describe('FFmpegService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be a singleton', () => {
    const instance1 = FFmpegService.getInstance();
    const instance2 = FFmpegService.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe('getMediaInfo', () => {
    it('should invoke ffmpeg:probe with correct parameters', async () => {
      const filePath = 'test.mp4';
      const mockMediaInfo = {
        format: {
          duration: '60',
          size: '1000000'
        },
        streams: []
      };

      (ipcRenderer.invoke as jest.Mock).mockResolvedValueOnce(mockMediaInfo);

      const result = await FFmpegService.getMediaInfo(filePath);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('ffmpeg:probe', filePath);
      expect(result).toEqual(mockMediaInfo);
    });

    it('should handle errors', async () => {
      const filePath = 'nonexistent.mp4';
      const error = new Error('File not found');

      (ipcRenderer.invoke as jest.Mock).mockRejectedValueOnce(error);

      await expect(FFmpegService.getMediaInfo(filePath)).rejects.toThrow('File not found');
    });
  });

  describe('losslessCut', () => {
    it('should invoke ffmpeg:cut with correct parameters', async () => {
      const input = 'input.mp4';
      const output = 'output.mp4';
      const startTime = 0;
      const endTime = 10;

      await FFmpegService.losslessCut(input, output, startTime, endTime);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('ffmpeg:cut', {
        input,
        output,
        startTime,
        endTime
      });
    });
  });

  describe('losslessMerge', () => {
    it('should invoke ffmpeg:merge with correct parameters', async () => {
      const inputs = ['clip1.mp4', 'clip2.mp4'];
      const output = 'merged.mp4';

      await FFmpegService.losslessMerge(inputs, output);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('ffmpeg:merge', {
        inputs,
        output
      });
    });
  });

  describe('Event handling', () => {
    it('should emit progress events', () => {
      const mockProgress = { frame: 1, fps: 30, time: '00:00:01' };
      const progressCallback = jest.fn();

      FFmpegService.getInstance().on('progress', progressCallback);

      // Simulate progress event from main process
      const progressHandler = (ipcRenderer.on as jest.Mock).mock.calls.find(
        call => call[0] === 'ffmpeg:progress'
      )[1];
      
      progressHandler({}, mockProgress);

      expect(progressCallback).toHaveBeenCalledWith(mockProgress);
    });

    it('should emit error events', () => {
      const mockError = 'Processing failed';
      const errorCallback = jest.fn();

      FFmpegService.getInstance().on('error', errorCallback);

      // Simulate error event from main process
      const errorHandler = (ipcRenderer.on as jest.Mock).mock.calls.find(
        call => call[0] === 'ffmpeg:error'
      )[1];
      
      errorHandler({}, mockError);

      expect(errorCallback).toHaveBeenCalledWith(mockError);
    });
  });

  describe('extractStream', () => {
    it('should invoke ffmpeg:extract-stream with correct parameters', async () => {
      const input = 'input.mp4';
      const output = 'audio.aac';
      const streamIndex = 1;

      await FFmpegService.extractStream(input, output, streamIndex);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('ffmpeg:extract-stream', {
        input,
        output,
        streamIndex
      });
    });
  });

  describe('generateThumbnails', () => {
    it('should invoke ffmpeg:thumbnails with correct parameters', async () => {
      const input = 'video.mp4';
      const outputPattern = 'thumb_%d.jpg';
      const interval = 1;

      await FFmpegService.generateThumbnails(input, outputPattern, interval);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('ffmpeg:thumbnails', {
        input,
        outputPattern,
        interval
      });
    });
  });

  describe('detectScenes', () => {
    it('should invoke ffmpeg:scene-detect with correct parameters', async () => {
      const input = 'video.mp4';
      const mockScenes = [0, 10.5, 20.3];

      (ipcRenderer.invoke as jest.Mock).mockResolvedValueOnce(mockScenes);

      const result = await FFmpegService.detectScenes(input);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('ffmpeg:scene-detect', {
        input
      });
      expect(result).toEqual(mockScenes);
    });
  });

  describe('detectSilence', () => {
    it('should invoke ffmpeg:silence-detect with correct parameters', async () => {
      const input = 'audio.mp3';
      const threshold = -50;
      const mockSilences = [
        { start: 0, end: 1.5 },
        { start: 10, end: 12 }
      ];

      (ipcRenderer.invoke as jest.Mock).mockResolvedValueOnce(mockSilences);

      const result = await FFmpegService.detectSilence(input, threshold);

      expect(ipcRenderer.invoke).toHaveBeenCalledWith('ffmpeg:silence-detect', {
        input,
        threshold
      });
      expect(result).toEqual(mockSilences);
    });
  });
});