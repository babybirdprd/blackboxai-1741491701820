import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { setupFFmpegHandlers } from './ffmpeg';
import FFmpegConfig from './ffmpeg-config';

async function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: process.env.NODE_ENV === 'production',
    },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  return mainWindow;
}

async function initializeApp() {
  try {
    // Initialize FFmpeg configuration
    const ffmpegConfig = FFmpegConfig.getInstance();
    await ffmpegConfig.initialize();

    // Setup IPC handlers
    setupFFmpegHandlers();

    // Create main window
    const mainWindow = await createWindow();

    // Handle window state
    mainWindow.on('closed', () => {
      app.quit();
    });

    // Handle app activation
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    // Get FFmpeg version info
    const versionInfo = await ffmpegConfig.getVersionInfo();
    console.log('FFmpeg version:', versionInfo.ffmpeg);
    console.log('FFprobe version:', versionInfo.ffprobe);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to initialize app:', errorMessage);
    app.quit();
  }
}

// Handle app ready
app.whenReady().then(initializeApp);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  app.quit();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  app.quit();
});

// Export for TypeScript
export { };
