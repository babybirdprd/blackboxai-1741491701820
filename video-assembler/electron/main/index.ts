import { app, BrowserWindow, dialog } from 'electron';
import { join } from 'path';
import { setupFFmpegHandlers } from './ffmpeg';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    },
  });

  // In development, load from the local dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built files
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
  }

  // Initialize FFmpeg handlers
  setupFFmpegHandlers();

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', () => {
  createWindow();

  // Setup error handling
  process.on('uncaughtException', (error) => {
    dialog.showErrorBox('Error', `An error occurred: ${error.message}`);
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle file open dialog
app.whenReady().then(() => {
  const handleFileOpen = async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv'] },
        { name: 'Audio', extensions: ['mp3', 'wav', 'aac'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!canceled && mainWindow) {
      mainWindow.webContents.send('files-selected', filePaths);
    }
  };

  // Add IPC handlers for file operations
  const { ipcMain } = require('electron');
  
  ipcMain.handle('dialog:openFile', handleFileOpen);
  
  ipcMain.handle('get-app-path', () => {
    return app.getPath('userData');
  });

  // Add handler for saving files
  ipcMain.handle('dialog:saveFile', async (_, defaultPath: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath,
      filters: [
        { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv'] },
        { name: 'Audio', extensions: ['mp3', 'wav', 'aac'] }
      ]
    });

    if (!canceled && filePath) {
      return filePath;
    }
    return null;
  });
});

// Export for TypeScript
export {};