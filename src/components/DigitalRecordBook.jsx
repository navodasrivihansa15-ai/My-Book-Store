import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Lock, Shield, Calendar, Clock, ShoppingCart, Globe, CheckCircle, Package, User, RefreshCw, LogIn, LogOut, Timer, Trophy, TrendingUp, Medal } from 'lucide-react';
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
    } catch (err) {
      setFetchError(err.message || 'Unknown error occurred.');
    } finally {
      setLoadingData(false);
    }
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-brand-gold/10 w-20 h-20 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-brand-gold" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-white mb-2 tracking-wide">Owner's Vault Lock Screen</h2>
        <p className="text-slate-400 mb-8 text-center max-w-md">Enter Owner Password to Decrypt Logs. Unauthorized access attempts are recorded.</p>
        
        <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter Owner Password" 
              className="w-full bg-slate-900 border-2 border-slate-700 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all placeholder-slate-500 font-medium tracking-widest shadow-inner"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm font-semibold text-center">{error}</p>}
          <button 
            type="submit" 
            disabled={unlocking}
            className="w-full bg-brand-gold text-black font-bold py-3 rounded-lg hover:bg-yellow-500 transition-colors uppercase tracking-widest text-sm disabled:opacity-50 cursor-pointer"
          >
            {unlocking ? 'Decrypting...' : 'Unlock Vault'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-brand-gold uppercase tracking-widest flex items-center gap-2">
            <Shield size={24} /> Staff Activity Vault
          </h2>
          <p className="text-slate-400 text-sm mt-1">Real-time tracking of employee sessions and performance.</p>
        </div>
        <button 
          onClick={fetchVaultData}
          disabled={loadingData}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-brand-gold/20 text-brand-gold rounded-lg font-bold text-sm transition-colors border-2 border-brand-gold/30 disabled:opacity-50 cursor-pointer shadow-lg"
        >
          <RefreshCw size={16} className={loadingData ? "animate-spin" : ""} /> 
          Refresh Vault
        </button>
      </div>

      <div className="flex gap-4 border-b-2 border-slate-800 pb-0">
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
          {activeTab === 'logs' && (
            <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300">
              {sessions.slice(0, 50).map((session) => (
                <div key={session.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden flex flex-col lg:flex-row gap-6 hover:border-slate-700 transition-colors">
                  
                  {/* Staff Info & Time Block */}
                  <div className="flex-1 border-b lg:border-b-0 lg:border-r border-slate-800 pb-4 lg:pb-0 lg:pr-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                          <User size={20} className="text-slate-500"/> {session.staff_name}
                        </h3>
                        <span className="inline-block bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">
                          {session.role}
                        </span>
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
          )}

          {/* TAB 2: LEADERBOARD & STATS */}
          {activeTab === 'leaderboard' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center bg-slate-800/50 p-5 rounded-xl border border-slate-700 mb-6 shadow-md">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-emerald-400" size={20}/>
                  <span className="text-white font-bold tracking-wide">Performance Filter:</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setTimeFilter('month')} className={`px-5 py-2 rounded-lg text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg ${timeFilter === 'month' ? 'bg-brand-gold text-black shadow-brand-gold/20' : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'}`}>This Month</button>
                  <button onClick={() => setTimeFilter('year')} className={`px-5 py-2 rounded-lg text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg ${timeFilter === 'year' ? 'bg-brand-gold text-black shadow-brand-gold/20' : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'}`}>This Year</button>
                  <button onClick={() => setTimeFilter('all')} className={`px-5 py-2 rounded-lg text-sm font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg ${timeFilter === 'all' ? 'bg-brand-gold text-black shadow-brand-gold/20' : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'}`}>All Time</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            </div>
          )}
        </>
      )}

      <div className="text-center pt-10 pb-4">
         <button onClick={() => setIsUnlocked(false)} className="bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors px-6 py-3 rounded-xl text-sm uppercase tracking-widest font-bold flex items-center gap-3 mx-auto cursor-pointer shadow-lg hover:shadow-red-500/20">
            <Lock size={16}/> LOCK VAULT
         </button>
      </div>
    </motion.div>
  );
}
