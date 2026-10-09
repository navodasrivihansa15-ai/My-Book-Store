import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Scanner() {
  const [notification, setNotification] = useState({ type: '', message: '' });
  const lastScanTime = useRef(0);

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

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { 
      fps: 10, 
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.0,
      supportedScanTypes: [0] // Optional: limit to rear camera if possible
    }, false);

    scanner.render(async (decodedText) => {
      const now = Date.now();
      if (now - lastScanTime.current < 1500) return; // Debounce 1.5s
      lastScanTime.current = now;

      playBeep();
      showNotification('success', 'Sent to POS!');

      const { error } = await supabase.from('pos_scans').insert({ barcode: decodedText });
      if (error) console.error("Error inserting scan:", error);

    }, (err) => {
      // ignore frame errors
    });

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative z-[999999]">
      <AnimatePresence>
        {notification.message && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 bg-green-500 text-white whitespace-nowrap">
            <CheckCircle2 size={20}/>
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 flex items-center gap-4 bg-slate-900 border-b border-slate-800">
        <Link to="/admin" className="p-2 hover:bg-slate-800 rounded-full transition-colors"><ChevronLeft size={24} className="text-gray-400" /></Link>
        <h1 className="text-xl font-bold tracking-widest text-brand-gold uppercase">Mobile Scanner</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-black">
        <div id="reader" className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-slate-800 text-black"></div>
        <p className="mt-8 text-slate-400 font-medium text-center px-4">Aim the camera at any barcode.<br/>Scans are instantly sent to your PC's POS.</p>
      </div>
    </div>
  );
}
