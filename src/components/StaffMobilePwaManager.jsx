import React, { useState, useEffect } from 'react';

export default function StaffMobilePwaManager({ userRole, scannerRoute = '/admin/scanner' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showHelperModal, setShowHelperModal] = useState(false);
  const [installTarget, setInstallTarget] = useState(''); // 'SCANNER' | 'WEB'

  // Check if user is Owner, Admin, or Staff
  const roleStr = String(userRole || '').toUpperCase();
  const isAuthorizedStaff = ['OWNER', 'ADMIN', 'STAFF', 'CASHIER'].includes(roleStr) || 
                            Boolean(localStorage.getItem('pos_scanner_active_user'));

  const isOnScannerPage = window.location.pathname.toLowerCase().includes('scanner');

  useEffect(() => {
    // 1. Mobile-only check
    const checkMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768;
    setIsMobile(checkMobile);

    // 2. Check if already opened inside an installed PWA window
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(standalone);

    // 3. Dynamically ensure correct manifest is linked when navigating via React Router
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.setAttribute('href', isOnScannerPage ? '/scanner-manifest.json' : '/manifest.webmanifest');
    }

    // 4. Capture browser install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isOnScannerPage]);

  // Strictly hide on Desktop or for normal customers
  if (!isMobile || !isAuthorizedStaff || isStandalone) return null;

  // Trigger Install for Scanner PWA
  const handleInstallScannerPwa = async () => {
    if (!isOnScannerPage) {
      // Hard redirect to scanner route so browser loads /scanner-manifest.json cleanly
      window.location.href = `${scannerRoute}?install=scanner`;
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setInstallTarget('SCANNER');
      setShowHelperModal(true);
    }
  };

  // Trigger Install for Full Web PWA
  const handleInstallFullWebPwa = async () => {
    if (isOnScannerPage) {
      // Hard redirect to home route so browser loads main /manifest.webmanifest cleanly
      window.location.href = '/?install=web';
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setInstallTarget('WEB');
      setShowHelperModal(true);
    }
  };

  return (
    <>
      <div className="bg-gray-900 border-b border-gray-700 px-3 py-2.5 text-white flex flex-wrap items-center justify-between gap-2 text-xs shadow-md w-full relative z-30">
        <span className="font-semibold text-gray-300">📲 Staff App Setup:</span>
        <div className="flex items-center gap-2">
          {/* Option 1: Install Dedicated Scanner PWA */}
          <button
            type="button"
            onClick={handleInstallScannerPwa}
            className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-md font-medium transition flex items-center gap-1"
          >
            <span>📷</span>
            <span>{isOnScannerPage ? 'Install Scanner App' : 'Get Scanner App'}</span>
          </button>

          {/* Option 2: Install Full Web Store PWA */}
          <button
            type="button"
            onClick={handleInstallFullWebPwa}
            className="bg-gray-700 hover:bg-gray-600 text-gray-100 px-2.5 py-1.5 rounded-md font-medium transition flex items-center gap-1"
          >
            <span>🌐</span>
            <span>{!isOnScannerPage ? 'Install Full Web App' : 'Get Full Web App'}</span>
          </button>
        </div>
      </div>

      {/* Fallback Instruction Modal for iOS / Browsers where native prompt requires menu tap */}
      {showHelperModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-sm w-full p-5 text-white shadow-2xl">
            <h3 className="text-base font-bold mb-2">
              {installTarget === 'SCANNER' ? '📷 Install POS Scanner App' : '🌐 Install Full Web Store App'}
            </h3>
            <p className="text-xs text-gray-300 mb-4 leading-relaxed">
              To install this as a standalone app on your phone:
            </p>
            <ol className="text-xs text-gray-200 space-y-2 mb-5 list-decimal list-inside bg-gray-900 p-3 rounded-lg">
              <li>Tap your browser&apos;s <strong>Menu (⋮)</strong> or <strong>Share (⬆️)</strong> button.</li>
              <li>Select <strong>&quot;Install App&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowHelperModal(false)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-xs"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
