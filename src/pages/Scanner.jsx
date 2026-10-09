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
    showNotification('success', currentTarget === 'POS' ? 'Sent to POS!' : 'Sent to Inventory!');

    const { error } = await supabase.from('pos_scans').insert({ barcode: barcodeText, target: currentTarget });
    if (error) console.error("Error inserting scan:", error);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    processScan(manualBarcode.trim());
    setManualBarcode('');
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { 
      fps: 10, 
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.0,
      supportedScanTypes: [0] // Optional: limit to rear camera if possible
    }, false);

    scanner.render(async (decodedText) => {
      await processScan(decodedText);
    }, (err) => {
      // ignore frame errors
    });

    return () => {
      scanner.clear().catch(() => {});
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
    <div className="flex flex-col h-screen w-full bg-gray-900 text-white overflow-hidden relative z-[50]">
      <AnimatePresence>
        {notification.message && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 bg-green-500 text-white whitespace-nowrap">
            <CheckCircle2 size={20}/>
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 flex items-center justify-between bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="p-2 hover:bg-slate-800 rounded-full transition-colors"><ChevronLeft size={24} className="text-gray-400" /></Link>
          <h1 className="text-xl font-bold tracking-widest text-brand-gold uppercase">Scanner</h1>
        </div>
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick}
            className="flex items-center gap-2 bg-brand-gold text-black px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-yellow-500 transition-colors"
          >
            <Download size={16} /> Install App
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center overflow-y-auto p-4 bg-black">
        {/* TARGET TOGGLE */}
        <div className="flex bg-slate-900 rounded-xl p-1 mb-6 w-full max-w-md border border-slate-800">
          <button 
            onClick={() => updateScanTarget('POS')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest rounded-lg transition-colors ${scanTarget === 'POS' ? 'bg-brand-gold text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            🛒 Send to POS
          </button>
          <button 
            onClick={() => updateScanTarget('Inventory')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-widest rounded-lg transition-colors ${scanTarget === 'Inventory' ? 'bg-brand-gold text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            📦 Add to Inventory
          </button>
        </div>

        <div id="reader" className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-slate-800 text-black"></div>
        <p className="mt-8 text-slate-400 font-medium text-center px-4">Aim the camera at any barcode.<br/>Scans are instantly sent to your selected target.</p>
        
        {/* MANUAL ENTRY */}
        <div className="mt-8 w-full max-w-md bg-slate-900 p-4 rounded-xl border border-slate-800">
          <h2 className="text-sm text-slate-400 mb-3 font-bold uppercase tracking-wider">Manual Entry</h2>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter ISBN manually..." 
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="flex-1 bg-black border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-gold transition-colors"
            />
            <button type="submit" className="bg-brand-gold text-black px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
