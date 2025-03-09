import { ipcMain } from 'electron';
import ffmpeg from 'fluent-ffmpeg';
import { join } from 'path';
import { createWriteStream } from 'fs';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';

// Configure ffmpeg path (this should be set based on the platform)
// ffmpeg.setFfmpegPath(/* path to ffmpeg binary */);
// ffmpeg.setFprobePath(/* path to ffprobe binary */);

export function setupFFmpegHandlers() {
  // Get media information
  ipcMain.handle('ffmpeg:probe', async (_, filePath: string) => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });
  });

  // Perform lossless cut
  ipcMain.handle('ffmpeg:cut', async (_, { input, output, startTime, endTime }) => {
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(output)
        .outputOptions(['-c copy']) // Copy streams without re-encoding
        .on('progress', progress => {
          // Send progress updates to renderer
          _.sender.send('ffmpeg:progress', progress);
        })
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  });

  // Merge multiple files
  ipcMain.handle('ffmpeg:merge', async (_, { inputs, output }) => {
    // Create temporary concat file
    const concatFile = join(process.cwd(), 'temp_concat.txt');
    const concatContent = inputs.map(file => `file '${file}'`).join('\n');
    await writeFile(concatFile, concatContent);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatFile)
        .inputOptions(['-f concat', '-safe 0'])
        .output(output)
        .outputOptions(['-c copy']) // Copy streams without re-encoding
        .on('progress', progress => {
          _.sender.send('ffmpeg:progress', progress);
        })
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  });

  // Extract stream
  ipcMain.handle('ffmpeg:extract-stream', async (_, { input, output, streamIndex }) => {
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .map(`0:${streamIndex}`)
        .output(output)
        .outputOptions(['-c copy'])
        .on('progress', progress => {
          _.sender.send('ffmpeg:progress', progress);
        })
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  });

  // Generate thumbnails
  ipcMain.handle('ffmpeg:thumbnails', async (_, { input, outputPattern, interval }) => {
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .screenshots({
          count: 999999, // Will be limited by duration
          folder: process.cwd(),
          filename: outputPattern,
          timemarks: ['00:00:00'], // This will be calculated based on interval
        })
        .on('end', resolve)
        .on('error', reject);
    });
  });

  // Extract waveform data
  ipcMain.handle('ffmpeg:waveform', async (_, { input }) => {
    return new Promise((resolve, reject) => {
      const waveformData: number[] = [];
      
      ffmpeg(input)
        .toFormat('wav')
        .audioFilters('aformat=channel_layouts=mono')
        .pipe()
        .on('data', (chunk) => {
          // Process audio data to generate waveform
          const samples = new Float32Array(chunk.buffer);
          for (let i = 0; i < samples.length; i++) {
            waveformData.push(Math.abs(samples[i]));
          }
        })
        .on('end', () => resolve(waveformData))
        .on('error', reject);
    });
  });

  // Detect scenes
  ipcMain.handle('ffmpeg:scene-detect', async (_, { input }) => {
    return new Promise((resolve, reject) => {
      const scenes: number[] = [];
      
      ffmpeg(input)
        .outputOptions([
          '-filter:v', 'select=\'gt(scene,0.4)\',showinfo', // Adjust threshold as needed
          '-f', 'null',
        ])
        .on('stderr', (stderrLine) => {
          // Parse ffmpeg output to detect scene changes
          if (stderrLine.includes('pts_time:')) {
            const match = stderrLine.match(/pts_time:([\d.]+)/);
            if (match) {
              scenes.push(parseFloat(match[1]));
            }
          }
        })
        .on('end', () => resolve(scenes))
        .on('error', reject)
        .run();
    });
  });

  // Detect silence
  ipcMain.handle('ffmpeg:silence-detect', async (_, { input, threshold }) => {
    return new Promise((resolve, reject) => {
      const silentSegments: Array<{start: number, end: number}> = [];
      
      ffmpeg(input)
        .outputOptions([
          '-af', `silencedetect=noise=${threshold}dB:d=0.5`,
          '-f', 'null',
        ])
        .on('stderr', (stderrLine) => {
          // Parse silence detection output
          const startMatch = stderrLine.match(/silence_start: ([\d.]+)/);
          const endMatch = stderrLine.match(/silence_end: ([\d.]+)/);
          
          if (startMatch) {
            silentSegments.push({ start: parseFloat(startMatch[1]), end: 0 });
          }
          if (endMatch && silentSegments.length > 0) {
            silentSegments[silentSegments.length - 1].end = parseFloat(endMatch[1]);
          }
        })
        .on('end', () => resolve(silentSegments))
        .on('error', reject)
        .run();
    });
  });

  // Remux video
  ipcMain.handle('ffmpeg:remux', async (_, { input, output }) => {
    return new Promise((resolve, reject) => {
      ffmpeg(input)
        .output(output)
        .outputOptions(['-c copy'])
        .on('progress', progress => {
          _.sender.send('ffmpeg:progress', progress);
        })
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  });

  // Update metadata
  ipcMain.handle('ffmpeg:metadata', async (_, { input, output, metadata }) => {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(input);
      
      // Add metadata
      Object.entries(metadata).forEach(([key, value]) => {
        command.outputOptions([`-metadata`, `${key}=${value}`]);
      });

      command
        .output(output)
        .outputOptions(['-c copy'])
        .on('progress', progress => {
          _.sender.send('ffmpeg:progress', progress);
        })
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  });
}