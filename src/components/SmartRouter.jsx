import React from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { isElectron } from '../utils/electronBridge';

/**
 * SmartRouter: Seamless Dual-Environment Routing
 * 
 * - Web App: Uses HTML5 BrowserRouter for clean, standard URLs (e.g., /admin/pos).
 * - Electron Desktop: Automatically uses HashRouter (#/admin/pos) to prevent
 *   file protocol (file://) 404 blank screen errors on reloads and direct navigation.
 */
export function SmartRouter({ children }) {
  if (isElectron()) {
    return <HashRouter>{children}</HashRouter>;
  }
  return <BrowserRouter>{children}</BrowserRouter>;
}

export default SmartRouter;
