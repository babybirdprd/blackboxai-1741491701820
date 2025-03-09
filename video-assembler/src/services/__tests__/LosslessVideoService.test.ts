import LosslessVideoService from '../LosslessVideoService';
import FFmpegService from '../FFmpegService';

jest.mock('../FFmpegService', () => ({
  __esModule: true,
  default: {
    getMediaInfo: jest.fn(),
    losslessCut: jest.fn(),
    losslessMerge: jest.fn(),
    extractStream: jest.fn(),
    generateThumbnails: jest.fn(),
    detectScenes: jest.fn(),
    detectSilence: jest.fn(),
    updateMetadata: jest.fn()
  }
}));

describe('LosslessVideoService', () => {
  let service: LosslessVideoService;

  beforeEach(() => {
    service = LosslessVideoService.getInstance();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = LosslessVideoService.getInstance();
      const instance2 = LosslessVideoService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('analyzeFile', () => {
    it('should return media information', async () => {
      const mockMediaInfo = {
        format: {
          duration: '60.5',
          tags: {}
        },
        streams: [
          {
            index: 0,
            codec_type: 'video',
            codec_name: 'h264',
            width: 1920,
            height: 1080
          },
          {
            index: 1,
            codec_type: 'audio',
            codec_name: 'aac',
            sample_rate: '48000',
            channels: 2
          }
        ]
      };

      (FFmpegService.getMediaInfo as jest.Mock).mockResolvedValue(mockMediaInfo);

      const result = await service.analyzeFile('test.mp4');

      expect(FFmpegService.getMediaInfo).toHaveBeenCalledWith('test.mp4');
      expect(result.duration).toBe(60.5);
      expect(result.streams).toHaveLength(2);
    });

    it('should handle errors', async () => {
      const error = new Error('Analysis failed');
      (FFmpegService.getMediaInfo as jest.Mock).mockRejectedValue(error);

      await expect(service.analyzeFile('test.mp4')).rejects.toThrow('Analysis failed');
    });
  });

  describe('createSegment', () => {
    it('should create a segment with correct properties', async () => {
      const mockMediaInfo = {
        format: { duration: '60.5' },
        streams: [
          { index: 0, codec_type: 'video' },
          { index: 1, codec_type: 'audio' }
        ]
      };

      (FFmpegService.getMediaInfo as jest.Mock).mockResolvedValue(mockMediaInfo);

      const segment = await service.createSegment('test.mp4', 10, 20);

      expect(segment).toMatchObject({
        filePath: 'test.mp4',
        startTime: 10,
        endTime: 20,
        streamInfo: {
          videoStreams: [0],
          audioStreams: [1],
          subtitleStreams: []
        }
      });
      expect(segment.id).toBeDefined();
    });
  });

  describe('processSegments', () => {
    const mockSegments = [
      {
        id: 'segment1',
        filePath: 'test1.mp4',
        startTime: 0,
        endTime: 10,
        streamInfo: {
          videoStreams: [0],
          audioStreams: [1]
        }
      },
      {
        id: 'segment2',
        filePath: 'test2.mp4',
        startTime: 0,
        endTime: 10,
        streamInfo: {
          videoStreams: [0],
          audioStreams: [1]
        }
      }
    ];

    it('should process single segment correctly', async () => {
      const options = {
        outputPath: 'output.mp4',
        preserveMetadata: true
      };

      await service.processSegments([mockSegments[0]], options);

      expect(FFmpegService.losslessCut).toHaveBeenCalledWith(
        mockSegments[0].filePath,
        options.outputPath,
        mockSegments[0].startTime,
        mockSegments[0].endTime
      );
    });

    it('should process multiple segments correctly', async () => {
      const options = {
        outputPath: 'output.mp4'
      };

      await service.processSegments(mockSegments, options);

      expect(FFmpegService.losslessCut).toHaveBeenCalledTimes(2);
      expect(FFmpegService.losslessMerge).toHaveBeenCalled();
    });

    it('should handle processing errors', async () => {
      const error = new Error('Processing failed');
      (FFmpegService.losslessCut as jest.Mock).mockRejectedValue(error);

      const options = {
        outputPath: 'output.mp4'
      };

      await expect(service.processSegments([mockSegments[0]], options))
        .rejects.toThrow('Processing failed');
    });

    it('should emit progress events', async () => {
      const options = {
        outputPath: 'output.mp4'
      };

      const progressCallback = jest.fn();
      service.on('progress', progressCallback);

      await service.processSegments(mockSegments, options);

      expect(progressCallback).toHaveBeenCalled();
    });
  });

  describe('extractStreams', () => {
    it('should extract specified streams', async () => {
      const mockMediaInfo = {
        streams: [
          { codec_type: 'video' },
          { codec_type: 'audio' }
        ]
      };

      (FFmpegService.getMediaInfo as jest.Mock).mockResolvedValue(mockMediaInfo);

      await service.extractStreams('input.mp4', [0, 1], 'output');

      expect(FFmpegService.extractStream).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateThumbnails', () => {
    it('should generate thumbnails with correct parameters', async () => {
      const mockThumbnails = ['thumb_1.jpg', 'thumb_2.jpg'];
      (FFmpegService.generateThumbnails as jest.Mock).mockResolvedValue(mockThumbnails);

      const result = await service.generateThumbnails('input.mp4', 'thumb_%d.jpg', 1);

      expect(FFmpegService.generateThumbnails).toHaveBeenCalledWith(
        'input.mp4',
        'thumb_%d.jpg',
        1
      );
      expect(result).toEqual(mockThumbnails);
    });
  });

  describe('detectScenes', () => {
    it('should detect scenes correctly', async () => {
      const mockScenes = [0, 10.5, 20.3];
      (FFmpegService.detectScenes as jest.Mock).mockResolvedValue(mockScenes);

      const result = await service.detectScenes('input.mp4');

      expect(FFmpegService.detectScenes).toHaveBeenCalledWith('input.mp4');
      expect(result).toEqual(mockScenes);
    });
  });

  describe('detectSilence', () => {
    it('should detect silence with default threshold', async () => {
      const mockSilences = [{ start: 0, end: 1.5 }];
      (FFmpegService.detectSilence as jest.Mock).mockResolvedValue(mockSilences);

      const result = await service.detectSilence('input.mp4');

      expect(FFmpegService.detectSilence).toHaveBeenCalledWith('input.mp4', -50);
      expect(result).toEqual(mockSilences);
    });

    it('should detect silence with custom threshold', async () => {
      const mockSilences = [{ start: 0, end: 1.5 }];
      (FFmpegService.detectSilence as jest.Mock).mockResolvedValue(mockSilences);

      const result = await service.detectSilence('input.mp4', -40);

      expect(FFmpegService.detectSilence).toHaveBeenCalledWith('input.mp4', -40);
      expect(result).toEqual(mockSilences);
    });
  });
});