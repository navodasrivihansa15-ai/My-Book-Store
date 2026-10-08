import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCart, User, Shield, Search, Menu, X, LogOut, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [logoExt, setLogoExt] = useState('png');
  const [imgTimestamp] = useState(Date.now());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const { cart } = useCart();
  const { user } = useAuth();
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
    await supabase.auth.signOut();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-2 md:top-0 w-[95%] left-[2.5%] md:w-full md:left-0 z-50 bg-gradient-to-br from-blue-400/20 via-theme-deep/40 to-blue-800/30 md:bg-none md:bg-theme-deep/70 backdrop-blur-xl border border-white/30 md:border-x-0 md:border-t-0 md:border-b md:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] md:shadow-lg text-theme-bg rounded-3xl md:rounded-none"
    >
      <div className="max-w-[1440px] mx-auto px-3 py-2 md:py-0 md:px-6">
        
        {/* --- MOBILE NAVBAR --- */}
        <div className="flex items-center justify-between h-14 md:hidden">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-theme-bg p-1 hover:text-white transition-colors cursor-pointer">
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
        </div>
      </div>

      {/* --- MOBILE SIDE DRAWER --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-[999] md:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-150%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-150%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-[70px] bottom-[80px] left-3 w-[85%] max-w-[320px] z-[10000] md:hidden flex flex-col overflow-hidden bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)]"
            >
              {/* Header / Title */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
                <span className="font-bold text-lg text-theme-deep tracking-tight">Categories</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              {/* Scrollable Category List */}
              <div className="flex-1 overflow-y-auto overscroll-contain hide-scrollbar">
                {/* Default All Books Link */}
                <Link 
                  to="/?category=All"
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="block py-3.5 px-5 border-b border-gray-100 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  All Books
                </Link>
                
                {/* Dynamic Categories */}
                {categories && categories.length > 0 ? (
                  categories.map((category) => (
                    <Link
                      key={category.id || category.name}
                      to={`/?category=${encodeURIComponent(category.name)}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-3.5 px-5 border-b border-gray-100 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))
                ) : (
                  <div className="py-4 px-5 text-gray-400 font-medium text-sm text-center">No categories found</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
