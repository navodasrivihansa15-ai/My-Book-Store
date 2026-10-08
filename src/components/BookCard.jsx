import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/utils';

const fallbackImage = 'https://placehold.co/400x600/e2e8f0/0b1d3a?text=No+Cover';

export default function BookCard({ book, addToCart }) {
  const { cart } = useCart();
  const hasDiscount = book.discount_percentage > 0 && book.sale_price;
  
  const cartItem = cart.find(item => item.id === book.id);
  const isStockLimitReached = cartItem && cartItem.quantity >= book.stock;
  const navigate = useNavigate();

  const handleBuyNow = () => {
    if (book.stock <= 0 || isStockLimitReached) return;
    addToCart({ ...book, price: hasDiscount ? book.sale_price : book.price });
    navigate('/checkout');
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-slate-50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:shadow-theme-medium/20 transition-all duration-300 border border-slate-200 flex flex-col w-full h-full snap-start"
    >
      <Link to={`/book/${book.id}`} className="relative overflow-hidden aspect-[2/3] w-full block bg-theme-bg group">
        <img 
          src={book.cover_image_url || fallbackImage} 
          alt={book.title} 
          onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {book.is_featured && (
            <span className="bg-theme-medium text-theme-bg text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md w-max">
              Featured
            </span>
          )}
          {book.stock <= 0 ? (
            <span className="bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full text-xs shadow-md w-max">
              Out of Stock
            </span>
          ) : (
            <span className="bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md w-max">
              In Stock
            </span>
          )}
        </div>

        {hasDiscount && (
          <div className="absolute top-2 right-2 md:bottom-3 md:right-3 md:top-auto bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded shadow-md z-10">
            -{book.discount_percentage}%
          </div>
        )}
      </Link>
      
      <div className="p-3 md:p-5 flex flex-col flex-grow bg-slate-50 relative z-20">
        <Link to={`/book/${book.id}`}>
          <h2 className="text-sm md:text-base font-bold text-theme-darkest line-clamp-2 min-h-[2.5rem] md:min-h-[3rem] hover:text-theme-medium transition-colors">
            {book.title}
          </h2>
        </Link>
        <p className="text-xs md:text-sm text-slate-500 font-medium tracking-wide mt-1 line-clamp-1 md:line-clamp-2 min-h-[1rem] md:min-h-[2.5rem]">{book.author}</p>
        
        <div className="mt-2 md:mt-4 flex flex-col gap-2 md:gap-3 justify-end h-full">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <span className="text-[10px] md:text-xs text-theme-darkest/50 line-through">{formatPrice(book.price)}</span>
                <span className="text-base md:text-xl font-bold text-theme-medium">{formatPrice(book.sale_price)}</span>
              </>
            ) : (
              <span className="text-base md:text-xl font-bold text-theme-darkest">{formatPrice(book.price)}</span>
            )}
          </div>
          
          <div className="flex flex-col gap-2 mt-1">
            <button 
              onClick={handleBuyNow} 
              disabled={book.stock <= 0 || isStockLimitReached}
              className="w-full bg-theme-deep text-white hover:bg-theme-darkest shadow-md rounded-lg py-2 text-xs md:text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Buy Now
            </button>
            <button 
              onClick={() => addToCart({ ...book, price: hasDiscount ? book.sale_price : book.price })} 
              disabled={book.stock <= 0 || isStockLimitReached}
              className="w-full border-2 border-theme-deep text-theme-deep hover:bg-theme-deep hover:text-white rounded-lg py-2 text-xs md:text-sm font-semibold flex items-center justify-center gap-1 md:gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-transparent"
            >
              <ShoppingCart size={16} className="w-4 h-4 md:w-5 md:h-5" /> {isStockLimitReached ? 'Max Reached' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
