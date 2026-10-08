import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const fallbackImage = 'https://placehold.co/400x600/e2e8f0/0b1d3a?text=No+Cover';

export default function BookCard({ book, addToCart }) {
  const { cart } = useCart();
  const hasDiscount = book.discount_percentage > 0 && book.sale_price;
  
  const cartItem = cart.find(item => item.id === book.id);
  const isStockLimitReached = cartItem && cartItem.quantity >= book.stock;

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
          <div className="absolute bottom-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">
            -{book.discount_percentage}%
          </div>
        )}
      </Link>
      
      <div className="p-5 flex flex-col flex-grow bg-slate-50 relative z-20">
        <Link to={`/book/${book.id}`}>
          <h2 className="text-lg font-bold text-theme-darkest line-clamp-1 hover:text-theme-medium transition-colors">
            {book.title}
          </h2>
        </Link>
        <p className="text-sm text-slate-500 font-medium tracking-wide mt-1 line-clamp-2 whitespace-normal h-10">{book.author}</p>
        
        <div className="mt-4 flex flex-col gap-3 justify-end h-full">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <span className="text-xs text-theme-darkest/50 line-through">LKR {book.price?.toFixed(2)}</span>
                <span className="text-xl font-bold text-theme-medium">LKR {book.sale_price?.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-xl font-bold text-theme-darkest">LKR {book.price?.toFixed(2)}</span>
            )}
          </div>
          
          <button 
            onClick={() => addToCart({ ...book, price: hasDiscount ? book.sale_price : book.price })} 
            disabled={book.stock <= 0 || isStockLimitReached}
            className="w-full bg-theme-deep/85 backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(26,61,99,0.3)] hover:bg-theme-darkest transition-all duration-300 hover:shadow-[0_6px_16px_rgba(26,61,99,0.4)] text-theme-bg py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={16} /> {isStockLimitReached ? 'Max Reached' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
