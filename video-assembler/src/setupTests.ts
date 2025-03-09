import '@testing-library/jest-dom';

// Mock electron
jest.mock('electron', () => ({
  ipcRenderer: {
    on: jest.fn(),
    invoke: jest.fn(),
    removeListener: jest.fn()
  }
}));

// Mock FFmpeg
jest.mock('@ffmpeg/ffmpeg', () => ({
  createFFmpeg: jest.fn(() => ({
    load: jest.fn(),
    run: jest.fn(),
    FS: {
      writeFile: jest.fn(),
      readFile: jest.fn(),
      unlink: jest.fn()
    }
  }))
}));

// Setup global mocks
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.URL
window.URL.createObjectURL = jest.fn();
window.URL.revokeObjectURL = jest.fn();