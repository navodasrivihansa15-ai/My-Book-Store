import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle2, ChevronLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Scanner() {
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [manualBarcode, setManualBarcode] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [scanTarget, setScanTarget] = useState('POS');
  const scanTargetRef = useRef('POS');
  const lastScanTime = useRef(0);
  const broadcastChannel = useRef(null);

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
    
    // Broadcast the scan event using Supabase Realtime (No database table needed!)
    if (broadcastChannel.current) {
      broadcastChannel.current.send({
        type: 'broadcast',
        event: 'scan',
        payload: { barcode: barcodeText, target: currentTarget }
      });
      showNotification('success', currentTarget === 'POS' ? 'Sent to POS!' : 'Sent to Inventory!');
    } else {
      showNotification('error', 'Scanner not connected to Realtime!');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    processScan(manualBarcode.trim());
    setManualBarcode('');
  };

  useEffect(() => {
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
  }, []);

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

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

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

      {/* HEADER */}
      <div className="px-6 py-5 flex items-center justify-center relative z-10 w-full">
        <Link to="/admin" className="absolute left-6 p-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full transition-all shadow-lg active:scale-95 z-20">
          <ChevronLeft size={22} className="text-gray-300" />
        </Link>
        <div className="flex flex-col items-center">
          <h1 className="text-xl md:text-2xl font-black tracking-[0.2em] uppercase bg-gradient-to-r from-brand-gold to-yellow-200 bg-clip-text text-transparent">Scanner</h1>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Wireless Link</span>
        </div>
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick}
            className="absolute right-6 flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 z-20"
          >
            <Download size={16} /> <span className="hidden sm:inline">Install App</span>
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
