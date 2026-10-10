import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, User, Shield, Search, Menu, X, LogOut, LogIn, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import MobileCategoryMenu from './MobileCategoryMenu';

export default function Navbar() {
  const [logoExt, setLogoExt] = useState('png');
  const [imgTimestamp] = useState(Date.now());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const { cart } = useCart();
  const { user, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    if (location.pathname !== '/') {
      navigate(`/?search=${encodeURIComponent(value)}`);
    } else {
      setSearchParams(prev => {
        if (value) prev.set('search', value);
        else prev.delete('search');
        return prev;
      });
    }
  };

  const handleLogout = async () => {
    // RECORD ACTIVITY HOOK (Logout)
    if (user) {
      const displayName = user.user_metadata?.full_name || user.email;
      await supabase.from('audit_logs').insert([{ username: displayName, action_type: 'LOGOUT' }]);
      try {
        const activeStaff = JSON.parse(sessionStorage.getItem('active_staff') || '{}');
        if (activeStaff.session_id) {
          await supabase.from('staff_sessions').update({ logout_time: new Date().toISOString() }).eq('id', activeStaff.session_id);
        }
      } catch (e) {}
    }
    sessionStorage.removeItem('active_staff');
    await supabase.auth.signOut();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 w-full z-[60] bg-gradient-to-r from-gray-900/85 via-blue-900/75 to-slate-400/65 backdrop-blur-lg border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)] text-white"
      >
      <div className="max-w-[1440px] mx-auto px-3 py-2 md:py-0 md:px-6">
        
        {/* --- MOBILE NAVBAR --- */}
        <div className="flex items-center justify-between h-14 md:hidden">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-1 hover:text-gray-200 transition-colors cursor-pointer">
            <Menu size={28} />
          </button>
          
          <Link to="/" className="flex-grow flex justify-center">
            <img 
              src={`${supabase.storage.from('web-assets').getPublicUrl(`Logo Top Nav Bar.${logoExt}`).data.publicUrl}?t=${imgTimestamp}`} 
              onError={() => {
                if (logoExt === 'png') setLogoExt('svg');
              }}
              alt="Alexandria Books" 
              className="h-8 w-auto object-contain hover:opacity-80 transition-opacity" 
            />
          </Link>
          
          <div className="w-[36px]"></div> {/* Spacer for perfect centering */}
        </div>

        {/* --- DESKTOP NAVBAR --- */}
        <div className="hidden md:flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src={`${supabase.storage.from('web-assets').getPublicUrl(`Logo Top Nav Bar.${logoExt}`).data.publicUrl}?t=${imgTimestamp}`} 
              onError={() => {
                if (logoExt === 'png') setLogoExt('svg');
              }}
              alt="Alexandria Books" 
              className="h-16 hover:opacity-80 transition-opacity" 
            />
          </Link>

          {/* Search (Desktop Only) */}
          <div className="hidden md:flex flex-grow max-w-xl mx-8 lg:mx-12 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-darkest/50 group-focus-within:text-theme-medium transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search books, authors, ISBN..." 
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-theme-medium transition-all text-sm text-theme-darkest placeholder-theme-darkest/50 shadow-inner"
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/cart" className="relative group cursor-pointer">
              <ShoppingCart size={24} className={`transition-colors ${isActive('/cart') ? 'text-white' : 'text-white/80 hover:text-white'}`} />
              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-2 -right-2 bg-white text-blue-900 text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-md"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {user ? (
              <div className="flex items-center gap-6">
                {(userRole === 'OWNER' || userRole === 'ADMIN') && (
                  <Link to="/admin" className={`relative group flex items-center gap-1.5 text-sm font-semibold tracking-wide transition-colors ${isActive('/admin') ? 'text-white' : 'text-white/90 hover:text-white'}`}>
                    <Shield size={16} />
                    <span className="hidden sm:inline">Admin</span>
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
                  </Link>
                )}
                {userRole === 'STAFF' && (
                  <Link to="/admin/pos" className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow cursor-pointer border border-blue-500/50">
                    Launch POS
                  </Link>
                )}
                <Link to="/account" className={`relative group flex items-center gap-1.5 text-sm font-semibold tracking-wide transition-colors ${isActive('/account') ? 'text-white' : 'text-white/90 hover:text-white'}`}>
                  <User size={18} />
                  <span className="hidden sm:inline">Account</span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full"></span>
                </Link>
                {sessionStorage.getItem('active_staff') && (
                  <button onClick={async () => {
                    try {
                      const activeStaff = JSON.parse(sessionStorage.getItem('active_staff') || '{}');
                      if (activeStaff.session_id) {
                        await supabase.from('staff_sessions').update({ logout_time: new Date().toISOString() }).eq('id', activeStaff.session_id);
                      }
                    } catch (e) {}
                    sessionStorage.removeItem('active_staff');
                    window.location.reload();
                  }} className="text-xs uppercase tracking-widest text-yellow-400 hover:text-white border border-yellow-400/50 px-4 py-2 rounded-full transition-colors hover:border-white cursor-pointer font-semibold flex items-center gap-1">
                    <Lock size={14} /> Lock System
                  </button>
                )}
                <button onClick={handleLogout} className="text-xs uppercase tracking-widest text-white/80 hover:text-white border border-white/30 px-4 py-2 rounded-full transition-colors hover:border-white cursor-pointer font-semibold">
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all shadow-md cursor-pointer border border-white/20 backdrop-blur-md">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
      </motion.nav>

      {/* --- MOBILE SIDE DRAWER --- */}
      <MobileCategoryMenu 
        isOpen={isMobileMenuOpen} 
        setIsOpen={setIsMobileMenuOpen} 
        categories={categories} 
      />
    </>
  );
}
