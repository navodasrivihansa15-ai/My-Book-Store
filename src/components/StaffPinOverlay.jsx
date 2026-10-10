import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, User, KeyRound, CheckCircle } from 'lucide-react';

export default function StaffPinOverlay({ onAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError('Invalid email or password. Please try again.');
      setIsLoggingIn(false);
      return;
    }

    // Fetch role, name, and assigned device info for the newly logged in user
    const { data: roleData } = await supabase.from('user_profiles').select('role, full_name, device_id, device_name').eq('id', data.user.id).single();
    const userRole = roleData?.role || 'USER';

    if (userRole === 'USER') {
      setError('Access denied: You do not have staff privileges.');
      await supabase.auth.signOut();
      setIsLoggingIn(false);
      return;
    }

    const displayName = roleData?.full_name || data.user.email;
    const deviceId = roleData?.device_id || 'UNASSIGNED';
    const deviceName = roleData?.device_name || 'Unknown Device';
    
    // Create new staff session
    const { data: sessionData } = await supabase.from('staff_sessions').insert({
        staff_name: displayName,
        role: userRole,
        device_id: deviceId,
        device_name: deviceName
    }).select().single();

    const sessionId = sessionData ? sessionData.id : null;
    sessionStorage.setItem('active_staff', JSON.stringify({ name: displayName, role: userRole, session_id: sessionId }));
    
    // RECORD ACTIVITY HOOK (Login)
    await supabase.from('audit_logs').insert([{ username: displayName, action_type: 'LOGIN' }]);

    onAuthenticated({ name: displayName, role: userRole });
  };

  return (
    <div className="fixed inset-0 bg-brand-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="bg-brand-gold/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-brand-gold" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-theme-deep mb-2">Store Security Lock</h2>
          <p className="text-gray-500 text-sm">Please identify yourself to access the system.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-700 mb-2">Staff Email Address</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email"
                required
                placeholder="staff@alexandria.com"
                className="w-full bg-gray-50 border border-gray-300 text-black rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-700 mb-2">Account Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-300 text-black rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isLoggingIn}
            className="w-full bg-theme-deep text-white font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-theme-darkest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoggingIn ? (
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <CheckCircle size={20} /> 
            )}
            {isLoggingIn ? 'Verifying...' : 'Access System'}
          </button>
        </form>
      </div>
    </div>
  );
}
