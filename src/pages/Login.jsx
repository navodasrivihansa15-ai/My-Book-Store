import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({ email, password });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
    } else {
      // RECORD ACTIVITY HOOK (Login)
      if (!isSignUp && result.data?.user) {
        const displayName = result.data.user.user_metadata?.full_name || result.data.user.email;
        await supabase.from('audit_logs').insert([{ username: displayName, action_type: 'LOGIN' }]);
      }
      navigate('/');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-[70vh] flex items-center justify-center px-4"
    >
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl border border-theme-light/30 p-10 rounded-2xl shadow-md relative overflow-hidden">
          
          {/* Decorative glow */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-theme-light/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-theme-medium/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-serif text-theme-darkest mb-2">
                {isSignUp ? 'Join the Club' : 'Welcome Back'}
              </h2>
              <p className="text-theme-medium text-sm tracking-wide">
                {isSignUp ? 'Create an account to access premium collections.' : 'Enter your credentials to access your account.'}
              </p>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
            
            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-white border border-theme-medium/50 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium transition-all text-theme-darkest placeholder-theme-darkest/50"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2">Password</label>
                <input
                  type="password"
                  required
                  className="w-full bg-white border border-theme-medium/50 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium transition-all text-theme-darkest placeholder-theme-darkest/50"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-theme-deep text-theme-bg font-semibold tracking-wider uppercase py-4 rounded-lg hover:bg-theme-darkest transition-colors disabled:opacity-50 mt-4 cursor-pointer"
              >
                <span className="relative z-10">{loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
              </button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-theme-light/30 text-center">
              <p className="text-sm text-theme-medium">
                {isSignUp ? 'Already a member?' : <>New to <span className="font-combina">ALEXANDRIA BOOKS</span>?</>}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="ml-2 text-theme-deep hover:text-theme-darkest transition-colors uppercase tracking-wider text-xs font-semibold cursor-pointer"
                >
                  {isSignUp ? 'Sign In' : 'Create Account'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
