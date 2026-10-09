import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddBookModal({ isOpen, onClose, initialBarcode, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    stock: '1',
    barcode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        price: '',
        stock: '1',
        barcode: initialBarcode || ''
      });
      setError('');
    }
  }, [isOpen, initialBarcode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const bookData = {
        title: formData.title,
        price: parseFloat(formData.price),
        sale_price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        barcode: formData.barcode || null,
        weight_g: 250, // default
        categories: [],
        sales_count: 0
      };

      const { data, error: insertError } = await supabase
        .from('books')
        .insert(bookData)
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md mx-auto bg-white rounded-2xl p-6 shadow-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 cursor-pointer z-10"><X size={24} /></button>
            <h2 className="text-xl font-bold text-brand-blue mb-6">Quick Add Book</h2>
            
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode / ISBN</label>
                <input required type="text" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
                <input required type="text" autoFocus value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input required type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty</label>
                  <input required type="number" min="0" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full bg-slate-50 border border-slate-300 focus:bg-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium transition-colors" />
                </div>
              </div>
              
              <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full bg-brand-blue text-white py-3 rounded-xl font-bold hover:bg-brand-blue/90 transition-colors shadow-md disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save & Add to Cart'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
