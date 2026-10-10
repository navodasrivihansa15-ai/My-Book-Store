import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Lock, Shield, Calendar, Clock, ShoppingCart, Globe, CheckCircle, Package, User, RefreshCw, LogIn, LogOut, Timer, Trophy, TrendingUp, Medal, Download, Upload, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DigitalRecordBook() {
  const { user } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState('');
  
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'leaderboard'
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'month', 'year'

  const [restoreData, setRestoreData] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [storeSettings, setStoreSettings] = useState({ name: 'My Book Shop', address: '123 Main St, City', phone: '+1 234 567 8900', email: 'store@example.com' });

  // Auto-lock when component unmounts
  useEffect(() => {
    return () => setIsUnlocked(false);
  }, []);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlocking(true);
    setError('');
    
    // Verify using supabase auth
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password
    });

    if (signInError) {
      setError('Invalid owner password. Access Denied.');
      setUnlocking(false);
      return;
    }

    setIsUnlocked(true);
    setUnlocking(false);
    fetchVaultData();
  };

  const fetchVaultData = async () => {
    setLoadingData(true);
    setFetchError('');
    try {
      const { data, error } = await supabase.from('staff_sessions')
        .select('*')
        .order('login_time', { ascending: false })
        .limit(500); // Fetch more for better all-time stats
        
      if (data) setSessions(data);
      else if (error) setFetchError('Stats Error: ' + error.message);

      const { data: settingsData } = await supabase.from('store_settings').select('*').limit(1).single();
      if (settingsData) setStoreSettings(settingsData);

    } catch (err) {
      setFetchError(err.message || 'Unknown error occurred.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleVaultBackup = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase.from('staff_sessions').select('*');
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `store_audit_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('Vault Backup Successful!');
    } catch (err) {
      alert('Backup failed: ' + err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleVaultRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("Invalid backup format");
      
      setRestoreData(data);
      setShowRestoreModal(true);
    } catch (err) {
      alert('Restore read failed: ' + err.message);
    } finally {
      e.target.value = null;
    }
  };

  const confirmRestore = async (mode) => {
    setShowRestoreModal(false);
    if (!restoreData) return;
    
    try {
      setLoadingData(true);
      
      if (mode === 'override') {
        const { error: deleteError } = await supabase.from('staff_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) throw deleteError;
      }
      
      const { error } = await supabase.from('staff_sessions').upsert(restoreData, { ignoreDuplicates: false });
      if (error) throw error;
      
      alert(`Vault Restore (${mode.toUpperCase()}) Successful!`);
      fetchVaultData();
    } catch (err) {
      alert('Restore failed: ' + err.message);
    } finally {
      setLoadingData(false);
      setRestoreData(null);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  useEffect(() => {
    if (!isUnlocked) return;
    
    const vaultSubscription = supabase.channel('vault-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_sessions' }, () => {
        fetchVaultData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(vaultSubscription);
    };
  }, [isUnlocked]);

  const formatDuration = (start, end) => {
    if (!end) return <span className="text-emerald-400 font-bold animate-pulse">Active Session</span>;
    const ms = new Date(end) - new Date(start);
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes === 0) return `< 1m`;
    return `${minutes}m`;
  };

  const leaderboard = useMemo(() => {
    let filtered = sessions;
    const now = new Date();
    
    if (timeFilter === 'month') {
      filtered = sessions.filter(s => {
        const d = new Date(s.login_time);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (timeFilter === 'year') {
      filtered = sessions.filter(s => {
        const d = new Date(s.login_time);
        return d.getFullYear() === now.getFullYear();
      });
    }

    const statsMap = {};
    filtered.forEach(s => {
      if (!statsMap[s.staff_name]) {
        statsMap[s.staff_name] = { 
          name: s.staff_name, 
          role: s.role, 
          pos: 0, 
          web: 0, 
          verified: 0, 
          packed: 0,
          totalScore: 0,
          sessionsCount: 0
        };
      }
      statsMap[s.staff_name].pos += s.pos_handled || 0;
      statsMap[s.staff_name].web += s.web_handled || 0;
      statsMap[s.staff_name].verified += s.payments_verified || 0;
      statsMap[s.staff_name].packed += s.web_packed || 0;
      statsMap[s.staff_name].sessionsCount += 1;
    });

    return Object.values(statsMap).map(stat => ({
      ...stat,
      // Weighted Performance Score formula
      totalScore: (stat.pos * 10) + (stat.web * 5) + (stat.verified * 15) + (stat.packed * 20)
    })).sort((a, b) => b.totalScore - a.totalScore);
  }, [sessions, timeFilter]);

  if (!isUnlocked) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-gold/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="bg-brand-gold/10 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(251,191,36,0.2)] border border-brand-gold/20 relative z-10">
          <Shield className="w-12 h-12 text-brand-gold drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-black text-brand-gold mb-2 tracking-[0.15em] uppercase text-center relative z-10">Owner's Vault</h2>
        <p className="text-slate-400 mb-8 text-center max-w-sm text-sm font-medium leading-relaxed relative z-10">Enter Owner Password to Decrypt Logs.<br/>Unauthorized access attempts are recorded.</p>
        
        <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-5 relative z-10">
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-gold transition-colors" size={18} />
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter Owner Password" 
              className="w-full bg-black/60 border border-slate-700/50 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand-gold/50 focus:ring-1 focus:ring-brand-gold/50 transition-all placeholder-slate-600 font-medium tracking-widest shadow-inner"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm font-bold text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20 animate-pulse">{error}</p>}
          <button 
            type="submit" 
            disabled={unlocking}
            className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black py-4 rounded-xl hover:brightness-110 transition-all uppercase tracking-[0.2em] text-sm disabled:opacity-50 cursor-pointer shadow-[0_5px_20px_rgba(251,191,36,0.3)] hover:shadow-[0_5px_30px_rgba(251,191,36,0.5)] active:scale-95"
          >
            {unlocking ? 'Decrypting...' : 'Unlock Vault'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 print-vault-wrapper print-container">
      <style>
        {`
          @media print {
            body { background: white !important; color: black !important; }
            .print-vault-wrapper * { 
              color: black !important; 
              border-color: #ccc !important; 
              box-shadow: none !important;
              background: white !important;
            }
            .print\\:hidden { display: none !important; }
            .print\\:block { display: block !important; }
            .print-vault-wrapper svg { color: black !important; stroke: black !important; fill: none !important; }
          }
        `}
      </style>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-brand-gold uppercase tracking-widest flex items-center gap-2">
            <Shield size={24} /> Staff Activity Vault
          </h2>
          <p className="text-slate-400 text-sm mt-1">Real-time tracking of employee sessions and performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs transition-colors border-2 border-slate-700 shadow-lg print:hidden"
          >
            <FileText size={14} /> 
            Export PDF
          </button>
          <button 
            onClick={handleVaultBackup}
            disabled={loadingData}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg font-bold text-xs transition-colors border-2 border-emerald-900 shadow-lg print:hidden disabled:opacity-50"
          >
            <Download size={14} /> 
            Backup Vault
          </button>
          <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg font-bold text-xs transition-colors border-2 border-blue-900 shadow-lg print:hidden cursor-pointer disabled:opacity-50">
            <Upload size={14} /> 
            Restore Vault
            <input type="file" accept=".json" onChange={handleVaultRestore} className="hidden" disabled={loadingData} />
          </label>
          <button 
            onClick={fetchVaultData}
            disabled={loadingData}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-brand-gold/20 text-brand-gold rounded-lg font-bold text-sm transition-colors border-2 border-brand-gold/30 disabled:opacity-50 cursor-pointer shadow-lg print:hidden ml-2"
          >
            <RefreshCw size={16} className={loadingData ? "animate-spin" : ""} /> 
            Refresh
          </button>
          <button 
            onClick={() => setIsUnlocked(false)} 
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg font-bold text-sm transition-colors border-2 border-red-500/30 cursor-pointer shadow-lg print:hidden ml-2"
          >
            <Lock size={16}/> 
            Lock Vault
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b-2 border-slate-800 pb-0 print:hidden">
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-5 py-3 font-bold text-sm tracking-wider uppercase transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${activeTab === 'logs' ? 'border-brand-gold text-brand-gold bg-brand-gold/10' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          <Clock size={16}/> Session Logs
        </button>
        <button 
          onClick={() => setActiveTab('leaderboard')}
          className={`px-5 py-3 font-bold text-sm tracking-wider uppercase transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${activeTab === 'leaderboard' ? 'border-brand-gold text-brand-gold bg-brand-gold/10' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
        >
          <Trophy size={16}/> Performance Leaderboard
        </button>
      </div>

      {fetchError && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
          <strong>Error Fetching Vault Data:</strong> {fetchError}
        </div>
      )}

      {loadingData ? (
        <p className="text-slate-400 animate-pulse py-8 text-center">Decrypting vault data...</p>
      ) : (
        <>
          {/* TAB 1: SESSION LOGS */}
          <div className={`${activeTab === 'logs' ? 'block' : 'hidden'} print:block mt-6`}>
            
            {/* SCREEN VIEW */}
            <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300 print:hidden">
              {sessions.slice(0, 50).map((session) => (
                <div key={session.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden flex flex-col lg:flex-row gap-6 hover:border-slate-700 transition-colors">
                  
                  {/* Staff Info & Time Block */}
                  <div className="flex-1 border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0 lg:pr-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          <User size={20} className="text-slate-500"/> {session.staff_name}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border border-brand-gold/30">
                            {session.role}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border border-blue-500/20">
                            {session.device_name || 'Unknown Device'}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest font-mono border border-slate-700">
                            {session.device_id || 'UNASSIGNED'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="flex items-center justify-end gap-1 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                            <Timer size={12}/> Session Time
                         </span>
                         <span className="text-white font-medium">{formatDuration(session.login_time, session.logout_time)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                        <span className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                          <LogIn size={12} className="text-emerald-500"/> Logged In
                        </span>
                        <p className="text-slate-300 font-medium">{new Date(session.login_time).toLocaleTimeString()}</p>
                        <p className="text-slate-500 text-xs">{new Date(session.login_time).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
                        <span className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                          <LogOut size={12} className="text-red-400"/> Logged Out
                        </span>
                        {session.logout_time ? (
                          <>
                            <p className="text-slate-300 font-medium">{new Date(session.logout_time).toLocaleTimeString()}</p>
                            <p className="text-slate-500 text-xs">{new Date(session.logout_time).toLocaleDateString()}</p>
                          </>
                        ) : (
                           <p className="text-emerald-500/50 italic text-xs mt-2">Session still active...</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats Block */}
                  <div className="flex-1 lg:max-w-md">
                     <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">Session Activity</h4>
                     
                     <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-blue-500/30 transition-colors">
                          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium"><ShoppingCart size={16} className="text-blue-400"/> POS Handled</div>
                          <span className="font-bold text-white text-lg">{session.pos_handled || 0}</span>
                        </div>

                        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-purple-500/30 transition-colors">
                          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium"><Globe size={16} className="text-purple-400"/> Web Handled</div>
                          <span className="font-bold text-white text-lg">{session.web_handled || 0}</span>
                        </div>

                        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-emerald-500/30 transition-colors">
                          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium"><CheckCircle size={16} className="text-emerald-400"/> Verified</div>
                          <span className="font-bold text-white text-lg">{session.payments_verified || 0}</span>
                        </div>

                        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-brand-gold/30 transition-colors">
                          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium"><Package size={16} className="text-brand-gold"/> Packed</div>
                          <span className="font-bold text-white text-lg">{session.web_packed || 0}</span>
                        </div>
                     </div>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                 <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
                    <Clock size={48} className="mx-auto text-slate-700 mb-4" />
                    <p className="text-slate-400 font-medium">No employee sessions recorded yet.</p>
                 </div>
              )}
            </div>
            
            {/* PRINT VIEW (TABLE) */}
            <div className="hidden print:block mb-8 break-inside-avoid print:p-8">
              <div className="flex justify-between items-end mb-8 border-b-4 border-slate-900 pb-6">
                <div>
                  <h1 className="text-4xl font-black uppercase tracking-widest text-slate-900 mb-2">{storeSettings.name}</h1>
                  <p className="text-slate-600 font-medium text-sm flex gap-4">
                    <span>{storeSettings.address}</span>
                    <span>•</span>
                    <span>{storeSettings.phone}</span>
                    <span>•</span>
                    <span>{storeSettings.email}</span>
                  </p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-800">Store Security Audit</h2>
                  <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Session Logs</p>
                  <p className="text-xs font-semibold text-slate-400 mt-2 bg-slate-100 px-3 py-1 rounded inline-block">Generated: {new Date().toLocaleString()}</p>
                </div>
              </div>
              
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-2 border border-gray-400 font-bold">Staff Name</th>
                    <th className="p-2 border border-gray-400 font-bold">Role</th>
                    <th className="p-2 border border-gray-400 font-bold bg-gray-300">Device ID</th>
                    <th className="p-2 border border-gray-400 font-bold">Device Name</th>
                    <th className="p-2 border border-gray-400 font-bold">Login Time</th>
                    <th className="p-2 border border-gray-400 font-bold">Logout Time</th>
                    <th className="p-2 border border-gray-400 font-bold text-center">Duration</th>
                    <th className="p-2 border border-gray-400 font-bold text-center">POS</th>
                    <th className="p-2 border border-gray-400 font-bold text-center">Web</th>
                    <th className="p-2 border border-gray-400 font-bold text-center">Verified</th>
                    <th className="p-2 border border-gray-400 font-bold text-center">Packed</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 100).map((session) => (
                    <tr key={session.id} className="border-b border-gray-300">
                      <td className="p-2 border border-gray-400 font-bold whitespace-nowrap">{session.staff_name}</td>
                      <td className="p-2 border border-gray-400 font-semibold">{session.role}</td>
                      <td className="p-2 border border-gray-400 font-mono font-bold bg-gray-100 text-center">{session.device_id || 'N/A'}</td>
                      <td className="p-2 border border-gray-400">{session.device_name || 'Unknown'}</td>
                      <td className="p-2 border border-gray-400 whitespace-nowrap">{new Date(session.login_time).toLocaleString()}</td>
                      <td className="p-2 border border-gray-400 whitespace-nowrap">{session.logout_time ? new Date(session.logout_time).toLocaleString() : 'Active'}</td>
                      <td className="p-2 border border-gray-400 text-center whitespace-nowrap font-bold">{formatDuration(session.login_time, session.logout_time)}</td>
                      <td className="p-2 border border-gray-400 text-center">{session.pos_handled || 0}</td>
                      <td className="p-2 border border-gray-400 text-center">{session.web_handled || 0}</td>
                      <td className="p-2 border border-gray-400 text-center">{session.payments_verified || 0}</td>
                      <td className="p-2 border border-gray-400 text-center">{session.web_packed || 0}</td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr>
                      <td colSpan="11" className="p-4 text-center text-gray-500 italic border border-gray-400">No session logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TAB 2: LEADERBOARD & STATS */}
          <div className={`${activeTab === 'leaderboard' ? 'block' : 'hidden'} print:block print:mt-12 mt-6`}>
            <div className="animate-in fade-in duration-300">
              <h2 className="hidden print:block text-2xl font-bold mb-4 text-black border-b-2 border-black pb-2">Store Audit: Performance Leaderboard</h2>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/50 p-5 rounded-xl border border-slate-700 mb-6 shadow-md gap-4 print:hidden">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-emerald-400" size={20}/>
                  <span className="text-white font-bold tracking-wide">Performance Filter:</span>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button onClick={() => setTimeFilter('month')} className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg ${timeFilter === 'month' ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.4)] border border-yellow-400' : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800'}`}>This Month</button>
                  <button onClick={() => setTimeFilter('year')} className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg ${timeFilter === 'year' ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.4)] border border-yellow-400' : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800'}`}>This Year</button>
                  <button onClick={() => setTimeFilter('all')} className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg ${timeFilter === 'all' ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.4)] border border-yellow-400' : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800'}`}>All Time</button>
                </div>
              </div>

              {/* SCREEN VIEW (CARDS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
                {leaderboard.map((stat, i) => (
                  <div key={stat.name} className={`bg-slate-900 border rounded-xl p-6 shadow-xl relative overflow-hidden ${i === 0 ? 'border-brand-gold/50 shadow-brand-gold/10' : 'border-slate-800'}`}>
                    {/* Rank Badge */}
                    <div className="absolute top-0 right-0 p-4">
                      {i === 0 ? <Medal size={40} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" /> : 
                       i === 1 ? <Medal size={36} className="text-gray-300" /> : 
                       i === 2 ? <Medal size={32} className="text-amber-600" /> : 
                       <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold">#{i + 1}</div>}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1 pr-12">{stat.name}</h3>
                    <div className="flex gap-2 mb-6">
                      <span className="inline-block bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">
                        {stat.role}
                      </span>
                      <span className="inline-block bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">
                        {stat.sessionsCount} Sessions
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-2 text-slate-300"><ShoppingCart size={16} className="text-blue-400"/> POS Orders</div>
                        <span className="font-bold text-white text-lg">{stat.pos}</span>
                      </div>
                      
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-slate-300"><Globe size={16} className="text-purple-400"/> Web Actions</div>
                          <span className="font-bold text-white text-lg">{stat.verified + stat.packed}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/50">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1"><CheckCircle size={10}/> Verified</span>
                            <span className="font-bold text-emerald-400">{stat.verified}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1"><Package size={10}/> Packed</span>
                            <span className="font-bold text-brand-gold">{stat.packed}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="flex items-center justify-between bg-slate-950/50 p-2 rounded border border-slate-800/50">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Perf. Score</span>
                          <span className={`font-bold ${i === 0 ? 'text-brand-gold' : 'text-white'}`}>{stat.totalScore.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
                    <Trophy size={48} className="mx-auto text-slate-700 mb-4" />
                    <p className="text-slate-400 font-medium">No performance data available for this period.</p>
                  </div>
                )}
              </div>

              {/* PRINT VIEW (TABLE) */}
              <div className="hidden print:block mb-8 break-before-page print:p-8">
                <div className="flex justify-between items-end mb-8 border-b-4 border-slate-900 pb-6">
                  <div>
                    <h1 className="text-4xl font-black uppercase tracking-widest text-slate-900 mb-2">{storeSettings.name}</h1>
                    <p className="text-slate-600 font-medium text-sm flex gap-4">
                      <span>{storeSettings.address}</span>
                      <span>•</span>
                      <span>{storeSettings.phone}</span>
                      <span>•</span>
                      <span>{storeSettings.email}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-800">Store Security Audit</h2>
                    <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-wider">Performance Leaderboard</p>
                    <div className="flex flex-col items-end gap-1 mt-2">
                       <p className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded inline-block">Generated: {new Date().toLocaleString()}</p>
                       <p className="text-xs font-bold text-brand-gold bg-amber-50 border border-amber-200 px-3 py-1 rounded inline-block">Filter: {timeFilter.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border border-gray-400 text-center font-bold">Rank</th>
                      <th className="p-2 border border-gray-400 font-bold">Staff Name</th>
                      <th className="p-2 border border-gray-400 font-bold">Role</th>
                      <th className="p-2 border border-gray-400 font-bold text-center">Sessions</th>
                      <th className="p-2 border border-gray-400 font-bold text-center">POS Orders</th>
                      <th className="p-2 border border-gray-400 font-bold text-center">Web Handled</th>
                      <th className="p-2 border border-gray-400 font-bold text-center">Verified</th>
                      <th className="p-2 border border-gray-400 font-bold text-center">Packed</th>
                      <th className="p-2 border border-gray-400 font-bold text-center">Total Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((stat, i) => (
                      <tr key={stat.name} className="border-b border-gray-300">
                        <td className="p-2 border border-gray-400 text-center font-bold">#{i + 1}</td>
                        <td className="p-2 border border-gray-400 font-bold whitespace-nowrap">{stat.name}</td>
                        <td className="p-2 border border-gray-400">{stat.role}</td>
                        <td className="p-2 border border-gray-400 text-center">{stat.sessionsCount}</td>
                        <td className="p-2 border border-gray-400 text-center">{stat.pos}</td>
                        <td className="p-2 border border-gray-400 text-center">{stat.web}</td>
                        <td className="p-2 border border-gray-400 text-center">{stat.verified}</td>
                        <td className="p-2 border border-gray-400 text-center">{stat.packed}</td>
                        <td className="p-2 border border-gray-400 text-center font-bold">{stat.totalScore.toLocaleString()}</td>
                      </tr>
                    ))}
                    {leaderboard.length === 0 && (
                      <tr>
                        <td colSpan="9" className="p-4 text-center text-gray-500 italic border border-gray-400">No performance data found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-brand-gold/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(251,191,36,0.15)] animate-in fade-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-brand-gold mb-4 uppercase tracking-widest flex items-center gap-2">
              <Upload size={24}/> Restore Options
            </h3>
            <p className="text-slate-300 mb-6 text-sm leading-relaxed">
              You are about to restore the Staff Activity Vault from a backup. How would you like to proceed?
            </p>
            
            <div className="space-y-4 mb-8">
              <button onClick={() => confirmRestore('merge')} className="w-full text-left bg-slate-800 hover:bg-emerald-900/40 border border-emerald-500/30 p-4 rounded-xl transition-all group cursor-pointer">
                <div className="font-bold text-emerald-400 mb-1 tracking-wide uppercase text-sm flex items-center gap-2"><CheckCircle size={16}/> MERGE WITH EXISTING</div>
                <p className="text-xs text-slate-400">Adds the backup data while keeping your current logs intact. (Safe)</p>
              </button>
              
              <button onClick={() => confirmRestore('override')} className="w-full text-left bg-slate-800 hover:bg-red-900/40 border border-red-500/30 p-4 rounded-xl transition-all group cursor-pointer">
                <div className="font-bold text-red-400 mb-1 tracking-wide uppercase text-sm flex items-center gap-2"><Lock size={16}/> OVERRIDE EXISTING</div>
                <p className="text-xs text-slate-400">Deletes all current logs and replaces them entirely with the backup. (Warning)</p>
              </button>
            </div>
            
            <button onClick={() => setShowRestoreModal(false)} className="w-full py-3 text-slate-400 hover:text-white font-bold uppercase tracking-wider text-sm transition-colors cursor-pointer border border-slate-700 hover:border-slate-500 rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      )}

    </motion.div>
  );
}
