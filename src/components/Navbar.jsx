import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, User, Shield, Search, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [logoExt, setLogoExt] = useState('png');
  const [imgTimestamp] = useState(Date.now());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cart } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const searchQuery = searchParams.get('search') || '';

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
    await supabase.auth.signOut();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-2 md:top-0 w-[95%] left-[2.5%] md:w-full md:left-0 z-50 bg-theme-deep/90 md:bg-theme-deep/70 backdrop-blur-xl border border-white/10 md:border-b md:border-white/10 shadow-lg text-theme-bg rounded-2xl md:rounded-none"
    >
      <div className="max-w-[1440px] mx-auto px-3 py-2 md:py-0 md:px-6">
        <div className="flex justify-between items-center h-14 md:h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src={`${supabase.storage.from('web-assets').getPublicUrl(`Logo Top Nav Bar.${logoExt}`).data.publicUrl}?t=${imgTimestamp}`} 
              onError={() => {
                if (logoExt === 'png') setLogoExt('svg');
              }}
              alt="Alexandria Books" 
              className="h-8 md:h-16 hover:opacity-80 transition-opacity" 
            />
          </Link>

          {/* Desktop Search */}
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
              <ShoppingCart size={24} className={`transition-colors ${isActive('/cart') ? 'text-theme-light' : 'text-theme-bg/80 hover:text-theme-light'}`} />
              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-2 -right-2 bg-theme-medium text-theme-bg text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-md"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {user ? (
              <div className="flex items-center gap-6">
                {user.email === 'navodasrivihansa15@gmail.com' && (
                  <Link to="/admin" className={`relative group flex items-center gap-1.5 text-sm font-semibold tracking-wide transition-colors ${isActive('/admin') ? 'text-theme-light' : 'text-theme-bg hover:text-theme-light'}`}>
                    <Shield size={16} />
                    <span className="hidden sm:inline">Admin</span>
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-theme-light transition-all group-hover:w-full"></span>
                  </Link>
                )}
                <Link to="/account" className={`relative group flex items-center gap-1.5 text-sm font-semibold tracking-wide transition-colors ${isActive('/account') ? 'text-theme-light' : 'text-theme-bg hover:text-theme-light'}`}>
                  <User size={18} />
                  <span className="hidden sm:inline">Account</span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-theme-light transition-all group-hover:w-full"></span>
                </Link>
                <button onClick={handleLogout} className="text-xs uppercase tracking-widest text-theme-bg/80 hover:text-theme-bg border border-theme-medium/50 px-4 py-2 rounded-full transition-colors hover:border-theme-light cursor-pointer font-semibold">
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-theme-medium text-theme-bg px-6 py-2.5 rounded-full text-sm font-bold tracking-wide hover:bg-theme-deep transition-all shadow-md cursor-pointer border border-theme-medium/50">
                Sign In
              </Link>
            )}
          </div>
          
          {/* Mobile Right Icons (Cart + Hamburger) */}
          <div className="flex items-center gap-4 md:hidden">
            <Link to="/cart" className="relative group cursor-pointer mr-2">
              <ShoppingCart size={20} className={`transition-colors ${isActive('/cart') ? 'text-theme-light' : 'text-theme-bg/80 hover:text-theme-light'}`} />
              <AnimatePresence>
                {cartItemCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-2 -right-2 bg-theme-medium text-theme-bg text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-md"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-theme-bg">
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-white/10 mt-2"
            >
              <div className="flex flex-col gap-4 py-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-darkest/50" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search books..." 
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 bg-white rounded-full text-sm text-theme-darkest focus:outline-none"
                  />
                </div>
                
                {user ? (
                  <div className="flex flex-col gap-3">
                    {user.email === 'navodasrivihansa15@gmail.com' && (
                      <Link onClick={() => setIsMobileMenuOpen(false)} to="/admin" className="flex items-center gap-2 text-sm font-semibold p-2 hover:bg-white/10 rounded-lg">
                        <Shield size={16} /> Admin
                      </Link>
                    )}
                    <Link onClick={() => setIsMobileMenuOpen(false)} to="/account" className="flex items-center gap-2 text-sm font-semibold p-2 hover:bg-white/10 rounded-lg">
                      <User size={16} /> Account
                    </Link>
                    <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="text-left text-sm font-semibold p-2 hover:bg-white/10 rounded-lg text-red-300">
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link onClick={() => setIsMobileMenuOpen(false)} to="/login" className="bg-theme-medium text-center text-theme-bg px-6 py-2.5 rounded-full text-sm font-bold tracking-wide mt-2">
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
