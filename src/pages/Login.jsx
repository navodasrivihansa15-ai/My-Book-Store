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

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // Redirect back to the home page or current URL
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Google Login Error:", error);
      setError("Failed to login with Google.");
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

            <div className="mt-6 flex items-center">
              <div className="flex-grow border-t border-theme-light/30"></div>
              <span className="px-4 text-xs tracking-wider text-theme-medium uppercase bg-white/80">Or continue with</span>
              <div className="flex-grow border-t border-theme-light/30"></div>
            </div>
            
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full mt-6 bg-white border border-gray-300 text-gray-700 font-semibold tracking-wider py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 shadow-sm cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Google
            </button>
            
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
