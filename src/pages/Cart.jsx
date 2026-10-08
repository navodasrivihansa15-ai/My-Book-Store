import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, total } = useCart();

  if (cart.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4"
      >
        <h2 className="text-3xl font-serif text-brand-gold mb-6">Your Collection is Empty</h2>
        <p className="text-gray-400 mb-8 max-w-md tracking-wide">
          Your cart currently holds no items. Discover our premium selection of literature to begin.
        </p>
        <Link to="/" className="border border-brand-gold text-brand-gold px-8 py-3 rounded hover:bg-brand-gold hover:text-brand-black transition-colors uppercase tracking-widest text-sm font-semibold">
          Return to Curated Collection
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-5xl mx-auto pt-8"
    >
      <h1 className="text-4xl font-serif text-brand-gold mb-12 border-b border-white/10 pb-6">Your Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex items-center gap-6 bg-white/5 border border-white/10 p-4 rounded-xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-gold/10 transition-colors"></div>
                
                <div className="w-24 h-36 flex-shrink-0 rounded-md overflow-hidden bg-brand-black">
                  {item.cover_image_url ? (
                    <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs text-gray-500 uppercase tracking-widest text-center">No Cover</div>
                  )}
                </div>
                
                <div className="flex-grow flex flex-col h-full justify-between py-2 z-10">
                  <div>
                    <h3 className="font-serif text-xl text-brand-offwhite mb-1">{item.title}</h3>
                    <p className="text-gray-400 text-xs uppercase tracking-wider">{item.author}</p>
                  </div>
                  
                  <div className="flex items-end justify-between mt-4">
                    <p className="font-serif text-2xl text-brand-gold">${item.price.toFixed(2)}</p>
                    
                    <div className="flex items-center gap-6">
                      <div className="flex items-center border border-white/10 rounded-md bg-brand-black/50 overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 text-gray-400 hover:text-brand-offwhite hover:bg-white/10 transition-colors cursor-pointer"><Minus size={14} /></button>
                        <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 text-gray-400 hover:text-brand-offwhite hover:bg-white/10 transition-colors cursor-pointer"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer" title="Remove Item">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-brand-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-xl sticky top-28">
            <h2 className="font-serif text-2xl text-brand-offwhite mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-8 text-sm tracking-wide text-gray-400 border-b border-white/10 pb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-brand-offwhite">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-brand-offwhite">Complimentary</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes</span>
                <span className="text-brand-offwhite">Calculated at Checkout</span>
              </div>
            </div>
            
            <div className="flex justify-between items-end mb-8">
              <span className="uppercase tracking-widest text-xs text-gray-400">Total</span>
              <span className="font-serif text-3xl text-brand-gold">${total.toFixed(2)}</span>
            </div>
            
            <Link to="/checkout" className="block w-full bg-brand-gold text-brand-black text-center font-semibold tracking-widest uppercase py-4 rounded-lg hover:bg-brand-gold-light transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] cursor-pointer">
              Secure Checkout
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
