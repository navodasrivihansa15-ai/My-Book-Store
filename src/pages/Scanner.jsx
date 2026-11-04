import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle2, ChevronLeft, Download } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StaffMobilePwaManager from '../components/StaffMobilePwaManager';
import QuickStockUpdateModal from '../components/QuickStockUpdateModal';
import { startStaffSession, endStaffSession, logStaffAction } from '../utils/staffActivityTracker';

export default function Scanner() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [manualBarcode, setManualBarcode] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [scanTarget, setScanTarget] = useState('POS');
  const scanTargetRef = useRef('POS');
  const lastScanTime = useRef(0);
  const broadcastChannel = useRef(null);

  // Quick Stock Update Modal state for Inventory mode
  const [quickStockBook, setQuickStockBook] = useState(null);
  const [isQuickStockOpen, setIsQuickStockOpen] = useState(false);
  const isQuickStockOpenRef = useRef(false);

  useEffect(() => {
    isQuickStockOpenRef.current = isQuickStockOpen;
  }, [isQuickStockOpen]);

  // --- ONE-TIME PERSISTENT LOGIN STATE ---
  const [isScannerLoggedIn, setIsScannerLoggedIn] = useState(false);
  const [activeScannerUser, setActiveScannerUser] = useState(null);
  const [scannerUser, setScannerUser] = useState(null);
  const [activeAccounts, setActiveAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // 1. Auto-login if previously saved in local storage
  useEffect(() => {
    const savedUser = localStorage.getItem('pos_scanner_active_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && (parsed.user_name || parsed.full_name)) {
          const name = parsed.user_name || parsed.full_name;
          setActiveScannerUser(name);
          setIsScannerLoggedIn(true);
          setScannerUser(parsed);
          setSelectedAccount(name);
          setSelectedStaff(name);
        }
      } catch (e) {
        localStorage.removeItem('pos_scanner_active_user');
      }
    }
  }, []);

  // STEP 1: Auto-refreshing polling logic to fetch ACTIVE staff sessions
  useEffect(() => {
    const fetchActiveAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from('staff_sessions')
          .select('user_name, user_role')
          .eq('status', 'ACTIVE')
          .in('user_role', ['STAFF', 'ADMIN', 'SUPER_ADMIN', 'OWNER', 'CASHIER']) // STRICT FILTER
          .order('login_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          // Remove duplicates in case a user has multiple active browser tabs
          const uniqueNames = new Set();
          const uniqueAccounts = [];

          data.forEach((session) => {
            const cleanName = String(session.user_name).trim();
            if (!uniqueNames.has(cleanName)) {
              uniqueNames.add(cleanName);
              uniqueAccounts.push(session);
            }
          });

          setActiveAccounts(uniqueAccounts);
        } else {
          setActiveAccounts([]);
        }
      } catch (err) {
        console.error("Error fetching active accounts for scanner:", err);
      }
    };

    // Fetch immediately on mount
    fetchActiveAccounts();

    // Poll every 5 seconds to automatically show new users who log into the POS
    const interval = setInterval(fetchActiveAccounts, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeScannerUser || scannerUser?.full_name) {
      const name = activeScannerUser || scannerUser?.full_name;
      setSelectedAccount(name);
      setSelectedStaff(name);
    }
  }, [activeScannerUser, scannerUser]);

  // SAFEGUARD 1: Safe staff session initialization in the background
  useEffect(() => {
    const activeName = activeScannerUser || scannerUser?.full_name || scannerUser?.username;
    const role = scannerUser?.role || 'STAFF';

    if (activeName) {
      startStaffSession(activeName, role)
        .catch(err => console.warn('Tracker init skipped:', err));
    }
  }, [activeScannerUser, scannerUser]);

  const handleScannerLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const chosenName = selectedAccount || selectedStaff;
    if (!chosenName) {
      setLoginError('Please select an online user from the dropdown!');
      return;
    }

    const matchedAccount = activeAccounts.find(
      (acc) => acc.user_name === chosenName
    );

    // STEP 2: Save to local storage on login success
    const sessionData = {
      user_name: chosenName,
      full_name: chosenName,
      role: matchedAccount?.user_role || 'STAFF'
    };
    localStorage.setItem('pos_scanner_active_user', JSON.stringify(sessionData));
    setActiveScannerUser(chosenName);
    setIsScannerLoggedIn(true);
    setScannerUser(sessionData);
    setPinInput('');
  };

  const handleAccountChange = (newUserName) => {
    setSelectedAccount(newUserName);
    setSelectedStaff(newUserName);
    const matched = activeAccounts.find((a) => a.user_name === newUserName);
    const sessionData = {
      user_name: newUserName,
      full_name: newUserName,
      role: matched?.user_role || 'STAFF'
    };
    localStorage.setItem('pos_scanner_active_user', JSON.stringify(sessionData));
    setActiveScannerUser(newUserName);
    setIsScannerLoggedIn(true);
    setScannerUser(sessionData);
  };

  const handleScannerLogout = () => {
    try {
      endStaffSession('LOGGED_OUT');
    } catch (err) {
      console.warn('endStaffSession error in Scanner:', err);
    }
    localStorage.removeItem('pos_scanner_active_user');
    setIsScannerLoggedIn(false);
    setActiveScannerUser(null);
    setScannerUser(null);
    setSelectedStaff('');
    setSelectedAccount('');
    setPinInput('');
  };

  // CALL THIS WHEN BARCODE IS DETECTED ON PHONE:
  const sendBarcodeToUserPOS = async (barcodeValue) => {
    const activeName = activeScannerUser || scannerUser?.full_name || scannerUser?.user_name;
    if (!activeName || !barcodeValue) return;

    const scannedCode = barcodeValue.trim();

    // Fast Lane: Direct insert to pos_remote_scans only
    try {
      await supabase.from('pos_remote_scans').insert([{
        barcode: scannedCode,
        scanned_by: activeName.trim()
      }]);
    } catch (err) {
      console.warn("pos_remote_scans insert error:", err);
    }

    // Fire-and-forget local counter (zero network delay)
    try {
      logStaffAction('BARCODE_SCANNED', 'Scanned barcode', { barcode: scannedCode });
    } catch (e) { }

    // 2. Transmit via Supabase Broadcast channel(s) including scanned_by
    if (broadcastChannel.current) {
      broadcastChannel.current.send({
        type: 'broadcast',
        event: 'scan',
        payload: {
          barcode: scannedCode,
          target: scanTargetRef.current,
          scanned_by: activeName.trim()
        }
      });
    }

    try {
      supabase.channel('pos-scanner-channel').send({
        type: 'broadcast',
        event: 'scan',
        payload: {
          barcode: barcodeValue.trim(),
          target: scanTargetRef.current,
          scanned_by: activeName.trim()
        }
      });
    } catch (err) {
      console.warn("pos-scanner-channel broadcast error:", err);
    }
  };

  const updateScanTarget = (target) => {
    setScanTarget(target);
    scanTargetRef.current = target;
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 1500);
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      setTimeout(() => oscillator.stop(), 150);
    } catch (e) {
      console.error(e);
    }
  };

  const processScan = async (barcodeText) => {
    const now = Date.now();
    if (now - lastScanTime.current < 1500) return; // Debounce 1.5s
    if (isQuickStockOpenRef.current) return; // Pause scans while modal is open
    lastScanTime.current = now;

    playBeep();
    const currentTarget = scanTargetRef.current;
    const cleanCode = String(barcodeText || '').trim();
    if (!cleanCode) return;

    // 1. Broadcast / insert to pos_remote_scans as usual so if PC Inventory or POS is open, it reacts too
    await sendBarcodeToUserPOS(cleanCode);

    // 2. If Scanner is in INVENTORY MODE:
    if (currentTarget === 'Inventory') {
      try {
        const { data: existingBook } = await supabase
          .from('books')
          .select('*')
          .or(`barcode.eq.${cleanCode},isbn.eq.${cleanCode}`)
          .maybeSingle();

        if (existingBook) {
          // Pause camera/duplicate scans while modal is open and show QuickStockUpdateModal right on the phone!
          setQuickStockBook(existingBook);
          setIsQuickStockOpen(true);
          showNotification('success', `Found: "${existingBook.title}"`);
        } else {
          // Book is NOT in inventory -> Navigate to Admin Inventory Add Book form with barcode & ISBN auto-filled!
          showNotification('info', `New barcode ${cleanCode}! Opening Add Book form...`);
          setTimeout(() => {
            navigate(`/admin?tab=inventory&inventory_barcode=${encodeURIComponent(cleanCode)}`);
          }, 350);
        }
      } catch (err) {
        console.error("Inventory lookup error on scanner:", err);
      }
    } else {
      showNotification('success', `Sent to POS (${activeScannerUser || scannerUser?.full_name || ''})!`);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    processScan(manualBarcode.trim());
    setManualBarcode('');
  };

  useEffect(() => {
    if (!isScannerLoggedIn) return;

    // Connect to Supabase Broadcast channel
    const channel = supabase.channel('scanner-broadcast-channel');
    channel.subscribe((status) => {
      console.log('Scanner Broadcast Status:', status);
    });
    broadcastChannel.current = channel;

    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 150 }
    }, false);

    scanner.render(async (decodedText) => {
      await processScan(decodedText);
    }, (err) => {
      // ignore frame errors
    });

    return () => {
      scanner.clear().catch(() => { });
      supabase.removeChannel(channel);
    };
  }, [isScannerLoggedIn]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const appleIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (appleIcon) appleIcon.setAttribute('href', '/Icon-512.jpg');
    const favIcon = document.querySelector("link[rel='icon']");
    if (favIcon) favIcon.setAttribute('href', '/Icon-512.jpg');
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // IF NOT LOGGED IN ON PHONE -> RENDER THIS ONE-TIME LOGIN SCREEN:
  if (!isScannerLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-900 flex flex-col items-center justify-between p-4 pb-safe">
        <StaffMobilePwaManager userRole={null} scannerRoute="/admin/scanner" />
        <div className="flex-1 flex items-center justify-center p-4 w-full">
          <form onSubmit={handleScannerLogin} className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md w-full mx-auto my-auto border border-slate-100">
            <div className="flex justify-center mb-3">
              <img
                src="/Icon-512.jpg"
                alt="Alexandria Books"
                className="w-14 h-14 rounded-2xl object-cover border border-blue-100 shadow-md"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-black mb-1 text-center text-slate-900 tracking-tight">Scanner Login</h2>
            <p className="text-xs text-slate-500 text-center mb-6 font-medium">One-time setup. Links scans strictly to your POS.</p>

            {loginError && <div className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold p-2.5 rounded-xl mb-4 text-center">{loginError}</div>}

            {/* ACTIVE POS USER SELECTION FOR SCANNER */}
            <div className="mb-6 w-full">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                Assign Scans To:
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => {
                  setSelectedAccount(e.target.value);
                  setSelectedStaff(e.target.value);
                }}
                required
                className="w-full p-3.5 rounded-xl border-2 border-blue-100 bg-slate-50 text-slate-900 font-extrabold text-sm shadow-xs focus:border-blue-600 focus:outline-none transition-colors appearance-none"
              >
                <option value="" disabled>-- Select an Online User --</option>
                {activeAccounts.length === 0 ? (
                  <option value="" disabled>No active users found on POS</option>
                ) : (
                  activeAccounts.map((acc, idx) => (
                    <option key={idx} value={acc.user_name}>
                      🟢 {acc.user_name} ({acc.user_role})
                    </option>
                  ))
                )}
              </select>
            </div>

            <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer">
              Connect Scanner to My POS
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 pb-safe relative z-[50] font-sans selection:bg-blue-600 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      <AnimatePresence>
        {notification.message && (
          <motion.div initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -50, scale: 0.9 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl font-extrabold text-xs flex items-center gap-2 backdrop-blur-md border border-emerald-400/30 bg-emerald-950/80 text-emerald-300 whitespace-nowrap overflow-hidden">
            {notification.type === 'success' ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>{notification.message}</span>
              </>
            ) : (
              <span className="text-red-300">{notification.message}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAFF MOBILE PWA MANAGER */}
      <StaffMobilePwaManager userRole={scannerUser?.role || 'STAFF'} scannerRoute="/admin/scanner" />

      {/* TOP ACTIVE USER BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between shadow-md shrink-0 relative z-20 mb-3">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ChevronLeft size={20} className="text-slate-400" />
          </Link>
          <div>
            <h2 className="font-black text-sm text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Wireless Barcode Scanner
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">Logged in: <span className="text-emerald-400 font-bold">{activeScannerUser || scannerUser?.full_name || selectedAccount}</span></p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              endStaffSession('LOGGED_OUT');
            } catch (err) { }
            localStorage.removeItem('pos_scanner_active_user');
            setIsScannerLoggedIn(false);
            setActiveScannerUser(null);
            setScannerUser(null);
          }}
          className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-300 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
        >
          Change Profile
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center overflow-y-auto px-2 pb-6 relative z-10 no-scrollbar">

        {/* ACTIVE POS USER SELECTION FOR SCANNER */}
        <div className="mb-4 w-full max-w-sm">
          <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
            Assign Scans To:
          </label>
          <select
            value={selectedAccount || activeScannerUser || scannerUser?.full_name || ''}
            onChange={(e) => handleAccountChange(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-800 bg-slate-900 text-white font-bold text-xs shadow-xs focus:border-blue-500 focus:outline-none transition-colors appearance-none"
          >
            <option value="" disabled>-- Select an Online User --</option>
            {activeAccounts.length === 0 ? (
              <option value="" disabled>No active users found on POS</option>
            ) : (
              activeAccounts.map((acc, idx) => (
                <option key={idx} value={acc.user_name}>
                  🟢 {acc.user_name} ({acc.user_role})
                </option>
              ))
            )}
          </select>
        </div>

        {/* TARGET TOGGLE */}
        <div className="flex bg-slate-900/80 rounded-2xl p-1 mb-4 w-full max-w-sm border border-slate-800 shadow-xl relative">
          <button
            onClick={() => updateScanTarget('POS')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${scanTarget === 'POS' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <span>🛒 POS</span>
          </button>
          <button
            onClick={() => updateScanTarget('Inventory')}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${scanTarget === 'Inventory' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <span>📦 Inventory</span>
          </button>
        </div>

        {/* VIEWFINDER FRAME */}
        <div className="relative w-full max-w-sm mx-auto aspect-square rounded-3xl overflow-hidden border-2 border-blue-500/80 shadow-[0_0_30px_rgba(37,99,235,0.25)] bg-black my-4">
          <div id="reader" className="w-full h-full text-white"></div>
        </div>

        <p className="mt-4 text-slate-400 font-medium text-center px-4 text-xs leading-relaxed max-w-sm">
          Center the barcode inside the camera view.<br />
          <span className="text-blue-400 font-bold">Scans are instantly synchronized to POS.</span>
        </p>

        {/* MANUAL ENTRY */}
        <div className="mt-4 w-full max-w-sm bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xl">
          <h2 className="text-[11px] text-blue-400 mb-3 font-extrabold uppercase tracking-wider flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            Manual Override
          </h2>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter barcode / ISBN..."
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500 transition-all placeholder-slate-500 font-mono"
            />
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-extrabold uppercase tracking-wider text-xs shadow-md active:scale-95 transition-all shrink-0 cursor-pointer">
              Send
            </button>
          </form>
        </div>
      </div>

      {/* QUICK STOCK, PRICE & DISCOUNT UPDATE MODAL */}
      <QuickStockUpdateModal
        book={quickStockBook}
        isOpen={isQuickStockOpen}
        onClose={() => {
          setIsQuickStockOpen(false);
          setQuickStockBook(null);
        }}
        currentUser={scannerUser}
        onUpdated={(updatedBook) => {
          showNotification('success', `Updated: "${updatedBook.title}"!`);
        }}
      />

      {/* CUSTOM CSS FOR HTML5 QR CODE SCANNER */}
      <style>{`
        #reader {
          border: none !important;
          background: transparent !important;
        }
        #reader img {
          display: none !important;
        }
        #reader button {
          background: rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          border-radius: 12px !important;
          padding: 12px 24px !important;
          font-weight: 800 !important;
          font-size: 12px !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          text-transform: uppercase !important;
          letter-spacing: 2px !important;
          margin-top: 15px !important;
          margin-bottom: 10px !important;
          backdrop-filter: blur(10px) !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
          width: 100% !important;
        }
        #reader button:active {
          transform: scale(0.98) !important;
          background: rgba(255, 255, 255, 0.15) !important;
        }
        #reader select {
          background: rgba(0,0,0,0.5) !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
          border-radius: 12px !important;
          padding: 12px 16px !important;
          margin-bottom: 15px !important;
          outline: none !important;
          width: 100% !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          appearance: none !important;
        }
        #reader a {
          display: none !important;
        }
        #reader__dashboard_section_csr span {
          color: #94a3b8 !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          display: block !important;
          margin-bottom: 8px !important;
        }
        #reader__scan_region {
          border-radius: 20px !important;
          overflow: hidden !important;
          background: #000 !important;
          position: relative !important;
        }
        #reader__scan_region video {
          object-fit: cover !important;
          border-radius: 20px !important;
        }
        /* Hide the annoying 'Powered by' text */
        #reader__dashboard_section_swaplink {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
