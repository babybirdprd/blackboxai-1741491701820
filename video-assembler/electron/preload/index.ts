import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    // File handling
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    saveFile: (defaultPath: string) => ipcRenderer.invoke('dialog:saveFile', defaultPath),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    
    // FFmpeg operations
    ffmpeg: {
      // Media info
      getMediaInfo: (filePath: string) => 
        ipcRenderer.invoke('ffmpeg:probe', filePath),

      // Lossless operations
      cut: (input: string, output: string, startTime: number, endTime: number) =>
        ipcRenderer.invoke('ffmpeg:cut', { input, output, startTime, endTime }),
      
      merge: (inputs: string[], output: string) =>
        ipcRenderer.invoke('ffmpeg:merge', { inputs, output }),
      
      extractStream: (input: string, output: string, streamIndex: number) =>
        ipcRenderer.invoke('ffmpeg:extract-stream', { input, output, streamIndex }),
      
      // Analysis and processing
      generateThumbnails: (input: string, outputPattern: string, interval: number) =>
        ipcRenderer.invoke('ffmpeg:thumbnails', { input, outputPattern, interval }),
      
      extractWaveform: (input: string) =>
        ipcRenderer.invoke('ffmpeg:waveform', { input }),
      
      detectScenes: (input: string) =>
        ipcRenderer.invoke('ffmpeg:scene-detect', { input }),
      
      detectSilence: (input: string, threshold: number) =>
        ipcRenderer.invoke('ffmpeg:silence-detect', { input, threshold }),
      
      // Format operations
      remux: (input: string, output: string) =>
        ipcRenderer.invoke('ffmpeg:remux', { input, output }),
      
      updateMetadata: (input: string, output: string, metadata: Record<string, string>) =>
        ipcRenderer.invoke('ffmpeg:metadata', { input, output, metadata }),
    },

    // Event listeners
    on: (channel: string, callback: (...args: any[]) => void) => {
      // Whitelist channels that can be listened to
      const validChannels = [
        'ffmpeg:progress',
        'ffmpeg:error',
        'files-selected'
      ];
      
      if (validChannels.includes(channel)) {
        const subscription = (_event: any, ...args: any[]) => callback(...args);
        ipcRenderer.on(channel, subscription);

        // Return a function to remove the event listener
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }
      
      return () => {}; // Return empty cleanup function for invalid channels
    },
  }
);

// TypeScript interface for the exposed API
declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<string[]>;
      saveFile: (defaultPath: string) => Promise<string | null>;
      getAppPath: () => Promise<string>;
      ffmpeg: {
        getMediaInfo: (filePath: string) => Promise<any>;
        cut: (input: string, output: string, startTime: number, endTime: number) => Promise<void>;
        merge: (inputs: string[], output: string) => Promise<void>;
        extractStream: (input: string, output: string, streamIndex: number) => Promise<void>;
        generateThumbnails: (input: string, outputPattern: string, interval: number) => Promise<string[]>;
        extractWaveform: (input: string) => Promise<number[]>;
        detectScenes: (input: string) => Promise<number[]>;
        detectSilence: (input: string, threshold: number) => Promise<Array<{start: number, end: number}>>;
        remux: (input: string, output: string) => Promise<void>;
        updateMetadata: (input: string, output: string, metadata: Record<string, string>) => Promise<void>;
      };
      on: (channel: string, callback: (...args: any[]) => void) => () => void;
    };
  }
}