import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart } = useCart();
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const isActive = (path) => location.pathname === path;

  // We map search to navigate to the search box or just go to /books if needed.
  // Actually, opening search might just focus the top navbar search.
  // We can just link it to /books for "Categories/Search".
  const handleSearchClick = () => {
    // If not on home or books, navigate to books
    if (location.pathname !== '/' && location.pathname !== '/books') {
      navigate('/books');
    } else {
      // Focus search input
      const searchInput = document.querySelector('input[type="text"]');
      if (searchInput) searchInput.focus();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-[9999] bg-white/90 backdrop-blur-lg border-t border-gray-200 flex justify-around items-center h-16 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <Link to="/" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/') ? 'text-theme-deep' : 'text-gray-500'}`}>
        <Home size={24} className={isActive('/') ? 'fill-theme-deep/20' : ''} />
        <span className="text-[10px] mt-1 font-semibold">Home</span>
      </Link>
      
      <button onClick={handleSearchClick} className={`flex flex-col items-center justify-center w-full h-full ${isActive('/books') ? 'text-theme-deep' : 'text-gray-500'}`}>
        <Search size={24} className={isActive('/books') ? 'text-theme-deep' : 'text-gray-500'} />
        <span className="text-[10px] mt-1 font-semibold">Search</span>
      </button>
      
      <Link to="/cart" className={`flex flex-col items-center justify-center w-full h-full relative ${isActive('/cart') ? 'text-theme-deep' : 'text-gray-500'}`}>
        <div className="relative">
          <ShoppingCart size={24} className={isActive('/cart') ? 'fill-theme-deep/20' : ''} />
          <AnimatePresence>
            {cartItemCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="absolute -top-1.5 -right-1.5 bg-theme-deep text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm border border-white"
              >
                {cartItemCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <span className="text-[10px] mt-1 font-semibold">Cart</span>
      </Link>
      
      <Link to="/account" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/account') ? 'text-theme-deep' : 'text-gray-500'}`}>
        <User size={24} className={isActive('/account') ? 'fill-theme-deep/20' : ''} />
        <span className="text-[10px] mt-1 font-semibold">Profile</span>
      </Link>
    </div>
  );
}
