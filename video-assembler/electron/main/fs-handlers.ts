import { ipcMain } from 'electron';
import { join, dirname } from 'path';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

interface FileOperationResult {
  success: boolean;
  error?: string;
}

export function setupFileSystemHandlers() {
  // Create temporary file path
  ipcMain.handle('fs:create-temp-path', async (_, extension: string) => {
    const tempDir = tmpdir();
    const fileName = `${uuidv4()}${extension}`;
    return join(tempDir, fileName);
  });

  // Clean up file
  ipcMain.handle('fs:cleanup', async (_, filePath: string) => {
    try {
      await fs.unlink(filePath);
      return { success: true } as FileOperationResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      } as FileOperationResult;
    }
  });

  // Save project file
  ipcMain.handle('fs:save-project', async (_, { path, data }: { path: string; data: string }) => {
    try {
      // Ensure directory exists
      await fs.mkdir(dirname(path), { recursive: true });
      await fs.writeFile(path, data, 'utf8');
      return { success: true } as FileOperationResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      } as FileOperationResult;
    }
  });

  // Load project file
  ipcMain.handle('fs:load-project', async (_, path: string) => {
    try {
      const data = await fs.readFile(path, 'utf8');
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load project: ${errorMessage}`);
    }
  });

  // Check if file exists
  ipcMain.handle('fs:exists', async (_, path: string) => {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  });

  // Get file stats
  ipcMain.handle('fs:stats', async (_, path: string) => {
    try {
      const stats = await fs.stat(path);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get file stats: ${errorMessage}`);
    }
  });

  // Ensure directory exists
  ipcMain.handle('fs:ensure-dir', async (_, path: string) => {
    try {
      await fs.mkdir(path, { recursive: true });
      return { success: true } as FileOperationResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      } as FileOperationResult;
    }
  });

  // Watch file or directory
  const watchers = new Map<string, fs.FileHandle>();

  ipcMain.handle('fs:watch', async (event, { path, options }: { path: string; options?: { recursive?: boolean } }) => {
    try {
      // Close existing watcher if any
      const existingWatcher = watchers.get(path);
      if (existingWatcher) {
        await existingWatcher.close();
      }

      const watcher = await fs.open(path, 'r');
      watchers.set(path, watcher);

      const watchCallback = (eventType: string, filename: string | null) => {
        event.sender.send('fs:watch-event', {
          path,
          type: eventType,
          filename,
        });
      };

      await fs.watch(path, options, watchCallback);
      return { success: true } as FileOperationResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      } as FileOperationResult;
    }
  });

  // Stop watching a path
  ipcMain.handle('fs:unwatch', async (_, path: string) => {
    try {
      const watcher = watchers.get(path);
      if (watcher) {
        await watcher.close();
        watchers.delete(path);
      }
      return { success: true } as FileOperationResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      } as FileOperationResult;
    }
  });

  // Clean up all watchers when app quits
  process.on('exit', () => {
    watchers.forEach(async (watcher) => {
      try {
        await watcher.close();
      } catch (error) {
        console.error('Failed to close file watcher:', error);
      }
    });
    watchers.clear();
  });
}
