import React, { useState, useEffect } from 'react';
import { X, Printer, CheckCircle2, Zap, Globe, RefreshCw } from 'lucide-react';
import { isElectron, getSystemPrinters, executeSilentPrint, printReceiptHtml } from '../utils/electronBridge';

export default function PrinterSetupModal({ onClose }) {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(() => localStorage.getItem('alexandria_pos_printer') || '');
  const [silentMode, setSilentMode] = useState(() => localStorage.getItem('alexandria_pos_silent_print') !== 'false');
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const inElectron = isElectron();

  const loadPrinters = async () => {
    if (!inElectron) return;
    setLoading(true);
    try {
      const res = await getSystemPrinters();
      if (res.success && Array.isArray(res.printers)) {
        setPrinters(res.printers);
        // If no printer selected yet, pick default
        if (!selectedPrinter) {
          const defaultP = res.printers.find(p => p.isDefault);
          if (defaultP) {
            setSelectedPrinter(defaultP.name);
            localStorage.setItem('alexandria_pos_printer', defaultP.name);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrinters();
  }, [inElectron]);

  const handleSave = () => {
    localStorage.setItem('alexandria_pos_printer', selectedPrinter);
    localStorage.setItem('alexandria_pos_silent_print', silentMode ? 'true' : 'false');
    onClose();
  };

  const handleTestPrint = async () => {
    setTestStatus('Printing test receipt...');
    const testHtml = `
      <div style="text-align: center; font-family: monospace; font-size: 13px;">
        <h2 style="margin: 4px 0;">ALEXANDRIA BOOKS</h2>
        <p style="margin: 2px 0;">Thermal Printer Test</p>
        <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
        <p style="text-align: left;">Mode: ${inElectron ? 'Electron Native Desktop' : 'Web Browser'}</p>
        <p style="text-align: left;">Printer: ${selectedPrinter || 'System Default'}</p>
        <p style="text-align: left;">Silent Print: ${silentMode ? 'ENABLED' : 'DISABLED'}</p>
        <p style="text-align: left;">Time: ${new Date().toLocaleTimeString()}</p>
        <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
        <p style="margin: 4px 0; font-weight: bold;">TEST PRINT SUCCESSFUL!</p>
      </div>
    `;

    try {
      const res = await printReceiptHtml(testHtml, {
        title: 'POS_Printer_Test',
        silent: silentMode && inElectron,
        deviceName: selectedPrinter || undefined,
      });

      if (res?.success) {
        setTestStatus('✅ Test print sent!');
      } else {
        setTestStatus('⚠️ Print error: ' + (res?.error || 'Unknown'));
      }
    } catch (err) {
      setTestStatus('❌ Failed: ' + err.message);
    }

    setTimeout(() => setTestStatus(''), 4000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Printer size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg">Receipt Printer Setup</h2>
              <p className="text-xs text-slate-400">Configure POS thermal printing</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
          {/* Environment Status Banner */}
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            inElectron 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}>
            {inElectron ? (
              <>
                <Zap className="text-emerald-600 shrink-0" size={24} />
                <div>
                  <div className="font-bold text-sm">Native Desktop Mode Active</div>
                  <div className="text-xs opacity-90">Direct hardware integration and silent printing enabled.</div>
                </div>
              </>
            ) : (
              <>
                <Globe className="text-amber-600 shrink-0" size={24} />
                <div>
                  <div className="font-bold text-sm">Web Browser Mode</div>
                  <div className="text-xs opacity-90">Printing will use standard browser print dialog. For instant silent printing without prompts, use the Alexandria Desktop App (.exe).</div>
                </div>
              </>
            )}
          </div>

          {/* Silent Print Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <span className="font-bold text-gray-800 text-sm block">Silent Printing (No Dialog)</span>
              <span className="text-xs text-gray-500">
                {inElectron 
                  ? 'Bypasses the OS print dialog for instant POS checkout.' 
                  : 'Requires Electron desktop app. Web browsers always show print dialog.'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={silentMode} 
                onChange={(e) => setSilentMode(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Printer Selection */}
          {inElectron && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Target POS Printer
                </label>
                <button 
                  onClick={loadPrinters} 
                  disabled={loading}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh Printers
                </button>
              </div>

              {printers.length === 0 ? (
                <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 text-center">
                  {loading ? 'Scanning for installed printers...' : 'Using System Default Printer'}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input 
                      type="radio" 
                      name="printer" 
                      value="" 
                      checked={selectedPrinter === ''} 
                      onChange={() => setSelectedPrinter('')} 
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 text-sm font-medium text-gray-700">
                      System Default Printer
                    </div>
                  </label>
                  {printers.map((p) => (
                    <label key={p.name} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors">
                      <input 
                        type="radio" 
                        name="printer" 
                        value={p.name} 
                        checked={selectedPrinter === p.name} 
                        onChange={() => setSelectedPrinter(p.name)} 
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                          {p.name}
                          {p.isDefault && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">Default</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Test Status Banner */}
          {testStatus && (
            <div className="text-sm font-semibold p-3 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 animate-in fade-in">
              {testStatus}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button 
            type="button" 
            onClick={handleTestPrint} 
            className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold text-sm hover:bg-gray-100 transition-colors shadow-xs"
          >
            🖨️ Test Print
          </button>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2.5 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSave} 
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 size={16} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
