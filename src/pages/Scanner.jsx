import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle2, ChevronLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StaffMobilePwaManager from '../components/StaffMobilePwaManager';
import { startStaffSession, endStaffSession, logStaffAction } from '../utils/staffActivityTracker';

export default function Scanner() {
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [manualBarcode, setManualBarcode] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [scanTarget, setScanTarget] = useState('POS');
  const scanTargetRef = useRef('POS');
  const lastScanTime = useRef(0);
  const broadcastChannel = useRef(null);

  // --- ONE-TIME PERSISTENT LOGIN STATE ---
  const [scannerUser, setScannerUser] = useState(() => {
    const saved = localStorage.getItem('pos_scanner_active_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Fetch users for One-Time Scanner Login from user_profiles (with staff_sessions fallback)
  useEffect(() => {
    if (!scannerUser) {
      const fetchStaff = async () => {
        let { data } = await supabase.from('user_profiles').select('*');
        if (!data || data.length === 0) {
          // Fallback to staff_sessions in case user_profiles RLS restricts anonymous read on mobile
          const { data: sessionData } = await supabase.from('staff_sessions').select('staff_name, role');
          if (sessionData && sessionData.length > 0) {
            const map = new Map();
            sessionData.forEach(s => {
              if (s.staff_name && !map.has(s.staff_name)) {
                map.set(s.staff_name, {
                  id: s.staff_name,
                  full_name: s.staff_name,
                  username: s.staff_name,
                  role: s.role || 'STAFF'
                });
              }
            });
            data = Array.from(map.values());
          }
        } else {
          // Filter to staff/admin/owner if user_profiles includes customer records
          const staffOnly = data.filter(u => ['OWNER', 'ADMIN', 'STAFF'].includes(u.role));
          if (staffOnly.length > 0) data = staffOnly;
        }
        if (data) setStaffList(data);
      };
      fetchStaff();
    }
  }, [scannerUser]);

  // SAFEGUARD 1: Safe staff session initialization in the background
  useEffect(() => {
    // Safely check if the user/currentUser exists BEFORE calling the tracker
    const activeUser = scannerUser;
    
    if (activeUser && (activeUser.full_name || activeUser.username)) {
      // Run async in the background without blocking React UI
      startStaffSession(activeUser.full_name || activeUser.username, activeUser.role || 'STAFF')
        .catch(err => console.warn('Tracker init skipped:', err));
    }
  }, [scannerUser]);

  const handleScannerLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const matchedUser = staffList.find(
      (u) => (u.full_name === selectedStaff || u.username === selectedStaff) && 
             (!u.pin || String(u.pin) === String(pinInput))
    );

    if (matchedUser) {
      const userPayload = {
        id: matchedUser.id,
        full_name: matchedUser.full_name || matchedUser.username,
        role: matchedUser.role || 'STAFF'
      };
      localStorage.setItem('pos_scanner_active_user', JSON.stringify(userPayload));
      setScannerUser(userPayload);
      setPinInput('');
    } else {
      setLoginError('Invalid User or PIN!');
    }
  };

  const handleScannerLogout = () => {
    try {
      endStaffSession('LOGGED_OUT');
    } catch (err) {
      console.warn('endStaffSession error in Scanner:', err);
    }
    localStorage.removeItem('pos_scanner_active_user');
    setScannerUser(null);
    setSelectedStaff('');
    setPinInput('');
  };

  // CALL THIS WHEN BARCODE IS DETECTED ON PHONE:
  const sendBarcodeToUserPOS = async (barcodeValue) => {
    if (!scannerUser || !barcodeValue) return;

    const scannedCode = barcodeValue.trim();
    const activeScannerUser = scannerUser.full_name || scannerUser.username || '';

    // Fast Lane: Direct insert to pos_remote_scans only
    try {
      await supabase.from('pos_remote_scans').insert([{
        barcode: scannedCode,
        scanned_by: activeScannerUser.trim()
      }]);
    } catch (err) {
      console.warn("pos_remote_scans insert error:", err);
    }

    // Fire-and-forget local counter (zero network delay)
    try {
      logStaffAction('BARCODE_SCANNED', 'Scanned barcode', { barcode: scannedCode });
    } catch (e) {}

    // 2. Transmit via Supabase Broadcast channel(s) including scanned_by
    if (broadcastChannel.current) {
      broadcastChannel.current.send({
        type: 'broadcast',
        event: 'scan',
        payload: { 
          barcode: scannedCode, 
          target: scanTargetRef.current,
          scanned_by: activeScannerUser.trim() 
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
          scanned_by: scannerUser.full_name 
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
    lastScanTime.current = now;

    playBeep();
    const currentTarget = scanTargetRef.current;
    
    await sendBarcodeToUserPOS(barcodeText);
    showNotification('success', currentTarget === 'POS' ? `Sent to POS (${scannerUser?.full_name})!` : 'Sent to Inventory!');
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    processScan(manualBarcode.trim());
    setManualBarcode('');
  };

  useEffect(() => {
    if (!scannerUser) return;

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
      scanner.clear().catch(() => {});
      supabase.removeChannel(channel);
    };
  }, [scannerUser]);

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
  if (!scannerUser) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-between">
        <StaffMobilePwaManager userRole={null} scannerRoute="/admin/scanner" />
        <div className="flex-1 flex items-center justify-center p-4 w-full">
          <form onSubmit={handleScannerLogin} className="bg-gray-800 p-6 rounded-xl w-full max-w-sm shadow-xl border border-gray-700">
          <div className="flex justify-center mb-3">
            <img 
              src="/Icon-512.jpg" 
              alt="Alexandria Books" 
              className="w-12 h-12 rounded-2xl object-cover border border-amber-400/30 shadow-md"
            />
          </div>
          <h2 className="text-xl font-bold mb-1 text-center">Scanner Login</h2>
          <p className="text-xs text-gray-400 text-center mb-5">One-time setup. Links scans strictly to your POS.</p>
          
          {loginError && <div className="bg-red-500/20 text-red-400 text-sm p-2 rounded mb-4 text-center">{loginError}</div>}

          <label className="block text-xs text-gray-400 mb-1">Select Your Account</label>
          <select 
            value={selectedStaff} 
            onChange={(e) => setSelectedStaff(e.target.value)}
            required
            className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 text-white mb-4"
          >
            <option value="">-- Choose User --</option>
            {staffList.map((u, idx) => {
              const name = u.full_name || u.username;
              return <option key={idx} value={name}>{name} ({u.role})</option>;
            })}
          </select>

          <label className="block text-xs text-gray-400 mb-1">Enter Security PIN</label>
          <input 
            type="password" 
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="••••"
            required
            className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 text-white mb-5 text-center tracking-widest text-lg"
          />

          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold">
            Connect Scanner to My POS
          </button>
        </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#0a0a0f] text-white overflow-hidden relative z-[50] font-sans selection:bg-brand-gold selection:text-black">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

      <AnimatePresence>
        {notification.message && (
          <motion.div initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -50, scale: 0.9 }} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] font-bold flex items-center gap-3 backdrop-blur-md border whitespace-nowrap overflow-hidden">
            {notification.type === 'success' ? (
              <>
                <div className="absolute inset-0 bg-green-500/20 backdrop-blur-md" />
                <div className="absolute inset-0 border border-green-400/50 rounded-full" />
                <CheckCircle2 size={20} className="text-green-400 relative z-10" />
                <span className="text-green-100 relative z-10 tracking-wide">{notification.message}</span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-red-500/20 backdrop-blur-md" />
                <div className="absolute inset-0 border border-red-400/50 rounded-full" />
                <span className="text-red-100 relative z-10 tracking-wide">{notification.message}</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAFF MOBILE PWA MANAGER */}
      <StaffMobilePwaManager userRole={scannerUser?.role} scannerRoute="/admin/scanner" />

      {/* ACCOUNT HEADER BAR */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700 text-white relative z-20 w-full shrink-0">
        <div className="text-xs">
          <span className="text-gray-400">Linked POS: </span>
          <span className="font-bold text-green-400">{scannerUser.full_name}</span>
        </div>
        <button 
          type="button"
          onClick={handleScannerLogout}
          className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-2.5 py-1 rounded"
        >
          Switch User / Logout
        </button>
      </div>

      {/* HEADER */}
      <div className="px-6 py-5 flex items-center justify-center relative z-10 w-full">
        <Link to="/admin" className="absolute left-6 p-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full transition-all shadow-lg active:scale-95 z-20">
          <ChevronLeft size={22} className="text-gray-300" />
        </Link>
        <div className="flex flex-col items-center">
          <img 
            src="/Icon-512.jpg" 
            alt="Alexandria Books" 
            className="w-12 h-12 rounded-2xl object-cover mb-2 border border-brand-gold/30 shadow-[0_0_15px_rgba(251,191,36,0.25)] ring-1 ring-white/10" 
          />
          <h1 className="text-2xl md:text-3xl font-black tracking-[0.25em] uppercase text-brand-gold drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">Scanner</h1>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Wireless Link</span>
        </div>
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick}
            className="absolute right-6 flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 z-20"
          >
            <img src="/Icon-512.jpg" alt="App Icon" className="w-4 h-4 rounded-full object-cover" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center overflow-y-auto px-4 pb-8 relative z-10 hide-scrollbar">
        
        {/* TARGET TOGGLE */}
        <div className="flex bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 mb-8 w-full max-w-md border border-white/10 shadow-2xl relative">
          <button 
            onClick={() => updateScanTarget('POS')}
            className={`flex-1 py-4 text-xs sm:text-sm font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-500 flex items-center justify-center gap-2 relative overflow-hidden ${scanTarget === 'POS' ? 'text-black shadow-[0_0_30px_rgba(251,191,36,0.3)] scale-[1.02]' : 'text-gray-400 hover:text-white'}`}
          >
            {scanTarget === 'POS' && <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500" />}
            <span className="relative z-10 flex items-center gap-2">🛒 POS</span>
          </button>
          <button 
            onClick={() => updateScanTarget('Inventory')}
            className={`flex-1 py-4 text-xs sm:text-sm font-black uppercase tracking-[0.15em] rounded-xl transition-all duration-500 flex items-center justify-center gap-2 relative overflow-hidden ${scanTarget === 'Inventory' ? 'text-black shadow-[0_0_30px_rgba(251,191,36,0.3)] scale-[1.02]' : 'text-gray-400 hover:text-white'}`}
          >
            {scanTarget === 'Inventory' && <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500" />}
            <span className="relative z-10 flex items-center gap-2">📦 Inventory</span>
          </button>
        </div>

        {/* SCANNER CONTAINER */}
        <div className="relative w-full max-w-md">
          {/* Scanner frame decor */}
          <div className="absolute -inset-1 bg-gradient-to-b from-brand-gold/30 to-blue-600/30 rounded-3xl blur-md opacity-70"></div>
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-gold rounded-tl-3xl z-20 pointer-events-none translate-x-[-2px] translate-y-[-2px]"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-gold rounded-tr-3xl z-20 pointer-events-none translate-x-[2px] translate-y-[-2px]"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-gold rounded-bl-3xl z-20 pointer-events-none translate-x-[-2px] translate-y-[2px]"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-gold rounded-br-3xl z-20 pointer-events-none translate-x-[2px] translate-y-[2px]"></div>
          
          <div className="bg-[#13141c] rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-white/5 p-2">
            <div id="reader" className="w-full text-white"></div>
          </div>
        </div>

        <p className="mt-8 text-gray-400 font-medium text-center px-6 text-sm leading-relaxed max-w-md">
          Center the barcode inside the camera view.<br/>
          <span className="text-brand-gold font-bold">Scans are instantly synchronized.</span>
        </p>
        
        {/* MANUAL ENTRY */}
        <div className="mt-8 w-full max-w-md bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl">
          <h2 className="text-xs text-brand-gold mb-4 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></div>
            Manual Override
          </h2>
          <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Enter barcode / ISBN..." 
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white text-sm focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all placeholder-gray-600 font-medium min-w-0"
            />
            <button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-6 py-4 rounded-xl font-black uppercase tracking-wider text-sm shadow-[0_5px_15px_rgba(251,191,36,0.3)] hover:shadow-[0_5px_25px_rgba(251,191,36,0.5)] active:scale-95 transition-all shrink-0">
              Send
            </button>
          </form>
        </div>
      </div>

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
