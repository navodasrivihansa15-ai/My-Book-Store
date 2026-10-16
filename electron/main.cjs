const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

// Prevent multiple instances of POS from running concurrently
const gotTheLock = app.requestSingleInstanceLock();

let mainWindow = null;

const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Alexandria Books POS',
    icon: path.join(__dirname, '../public/Icon-512.png'),
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    show: false, // Prevent white flash before React is rendered
  });

  // Smooth appearance when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external links safely in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Focus existing window if a second instance is launched
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ==========================================
// IPC HANDLERS FOR NATIVE FEATURES
// ==========================================
function registerIpcHandlers() {
  // 1. Get system printers (for POS thermal printer selection)
  ipcMain.handle('print:getPrinters', async () => {
    try {
      if (!mainWindow) return { success: false, error: 'No active window', printers: [] };
      const printers = await mainWindow.webContents.getPrintersAsync();
      return { success: true, printers };
    } catch (err) {
      return { success: false, error: err.message, printers: [] };
    }
  });

  // 2. Silent Print current window / receipt view
  ipcMain.handle('print:silent', async (event, options = {}) => {
    if (!mainWindow) return { success: false, error: 'No active window' };

    return new Promise((resolve) => {
      const printOptions = {
        silent: options.silent !== undefined ? options.silent : true,
        printBackground: true,
        deviceName: options.deviceName || '',
        color: options.color !== undefined ? options.color : true,
        margins: options.margins || { marginType: 'none' },
        landscape: Boolean(options.landscape),
        copies: options.copies || 1,
      };

      mainWindow.webContents.print(printOptions, (success, failureReason) => {
        if (!success) {
          resolve({ success: false, error: failureReason });
        } else {
          resolve({ success: true });
        }
      });
    });
  });

  // 3. Silent Print arbitrary HTML in a background offscreen window
  // (Leaves cashier screen untouched without any flicker or page disturbance)
  ipcMain.handle('print:receiptHtml', async (event, { html, options = {} }) => {
    return new Promise((resolve) => {
      let printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
        },
      });

      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>${options.title || 'Receipt'}</title>
          <style>
            @page { margin: 0; size: auto; }
            body { margin: 0; padding: 4px; font-family: monospace, sans-serif; font-size: 12px; color: black; background: white; }
            .print-only-pos-receipt { width: 100%; max-width: 80mm; margin: 0 auto; }
            .dashed-line { border-bottom: 1px dashed #666; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;

      printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`);

      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.print({
          silent: options.silent !== undefined ? options.silent : true,
          printBackground: true,
          deviceName: options.deviceName || '',
          margins: options.margins || { marginType: 'none' },
        }, (success, failureReason) => {
          printWindow.close();
          printWindow = null;
          if (!success) {
            resolve({ success: false, error: failureReason });
          } else {
            resolve({ success: true });
          }
        });
      });

      printWindow.webContents.on('did-fail-load', (e, code, desc) => {
        if (printWindow) {
          printWindow.close();
          printWindow = null;
        }
        resolve({ success: false, error: desc });
      });
    });
  });

  // 4. Standard print with OS dialog
  ipcMain.handle('print:dialog', async (event, options = {}) => {
    if (!mainWindow) return { success: false, error: 'No active window' };

    return new Promise((resolve) => {
      mainWindow.webContents.print({
        silent: false,
        printBackground: true,
        ...options,
      }, (success, failureReason) => {
        resolve({ success, error: failureReason });
      });
    });
  });

  // 5. Window controls (Minimize, Maximize, Close)
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
    return true;
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.close();
    return true;
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  // 6. App Metadata & External Link handler
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:openExternal', (event, url) => shell.openExternal(url));
}
