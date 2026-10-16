/**
 * Safe Electron Bridge & Dual-Environment Abstraction Layer
 * 
 * Ensures 100% web stability: Every method will gracefully fall back
 * to standard web APIs (or safe no-ops) when running in a standard browser.
 * In Electron desktop mode, it unlocks native hardware APIs (silent thermal printing,
 * system printer enumeration, window controls).
 */

export const isElectron = () => {
  return typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);
};

export const getEnvironment = () => {
  return isElectron() ? 'electron' : 'web';
};

/**
 * Get system printers (Available only in Electron)
 * Returns { success: boolean, printers: Array<{ name: string, isDefault: boolean, ... }> }
 */
export const getSystemPrinters = async () => {
  if (isElectron()) {
    try {
      return await window.electronAPI.getPrinters();
    } catch (err) {
      console.error('[ElectronBridge] Failed to fetch printers:', err);
      return { success: false, error: err.message, printers: [] };
    }
  }
  // Web fallback: browsers do not expose system printers list due to sandbox
  return { success: true, printers: [], isWebFallback: true };
};

/**
 * Silent Print using Electron IPC
 * If in Web: Gracefully falls back to window.print()
 */
export const executeSilentPrint = async (options = {}) => {
  if (isElectron()) {
    try {
      return await window.electronAPI.silentPrint(options);
    } catch (err) {
      console.warn('[ElectronBridge] Silent print failed, falling back to window.print:', err);
      window.print();
      return { success: true, fallback: true, error: err.message };
    }
  }

  // Web fallback
  window.print();
  return { success: true, fallback: true };
};

/**
 * Print Raw HTML (e.g., POS Receipt) directly without disturbing the current screen.
 * In Electron: prints in a hidden background window.
 * In Web: prints via hidden iframe.
 */
export const printReceiptHtml = async (htmlContent, options = {}) => {
  if (isElectron()) {
    try {
      return await window.electronAPI.printReceiptHtml(htmlContent, options);
    } catch (err) {
      console.warn('[ElectronBridge] Receipt HTML background print failed, falling back:', err);
    }
  }

  // Standard Web Iframe Fallback
  return new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${options.title || 'Receipt'}</title>
          <style>
            @page { margin: 0; }
            body { margin: 0; padding: 8px; font-family: monospace, sans-serif; font-size: 12px; }
            .print-only-pos-receipt { width: 100%; max-width: 80mm; margin: 0 auto; }
            .dashed-line { border-bottom: 1px dashed #666; margin: 6px 0; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `);
      doc.close();

      iframe.contentWindow.focus();
      setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve({ success: true, fallback: true });
        }, 1000);
      }, 250);
    } catch (err) {
      console.error('[ElectronBridge] Web fallback print error:', err);
      window.print();
      resolve({ success: false, error: err.message });
    }
  });
};

/**
 * Universal POS Receipt Print Handler
 * Checks localStorage for configured printer & silent mode preferences.
 */
export const printReceipt = async (receiptElementOrOptions = {}) => {
  const savedPrinter = localStorage.getItem('alexandria_pos_printer') || '';
  const silentModeEnabled = localStorage.getItem('alexandria_pos_silent_print') !== 'false';

  if (isElectron() && silentModeEnabled) {
    return await executeSilentPrint({
      silent: true,
      deviceName: savedPrinter || undefined,
      ...receiptElementOrOptions,
    });
  }

  // Default web / dialog behavior
  window.print();
  return { success: true, fallback: !isElectron() };
};

/**
 * Window Control Helpers (Safe no-ops in Web)
 */
export const windowControls = {
  minimize: async () => {
    if (isElectron()) return await window.electronAPI.minimizeWindow();
    return false;
  },
  maximize: async () => {
    if (isElectron()) return await window.electronAPI.maximizeWindow();
    return false;
  },
  close: async () => {
    if (isElectron()) return await window.electronAPI.closeWindow();
    return false;
  },
  isMaximized: async () => {
    if (isElectron()) return await window.electronAPI.isMaximized();
    return false;
  },
};

/**
 * Safe external URL opener
 */
export const openExternalLink = (url) => {
  if (isElectron()) {
    window.electronAPI.openExternal(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
