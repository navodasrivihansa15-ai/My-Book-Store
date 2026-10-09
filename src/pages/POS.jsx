import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, Trash2, Printer, CheckCircle2, ChevronLeft, CreditCard, Banknote } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function POS() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash or Card
  const [completedOrder, setCompletedOrder] = useState(null);
  const [storeSettings, setStoreSettings] = useState({ name: 'Alexandria Books', address: '', phone: '' });
  const [notification, setNotification] = useState({ type: '', message: '' });

  const searchInputRef = useRef(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (search) {
      const lower = search.toLowerCase();
      setFilteredBooks(books.filter(b => 
        b.title.toLowerCase().includes(lower) || 
        b.author?.toLowerCase().includes(lower) || 
        b.id.includes(lower)
      ));
    } else {
      setFilteredBooks(books);
    }
  }, [search, books]);

  const fetchData = async () => {
    const { data: booksData } = await supabase.from('books').select('*').order('title');
    if (booksData) {
      setBooks(booksData);
      setFilteredBooks(booksData);
    }
    const { data: settingsData } = await supabase.from('store_settings').select('*').limit(1).single();
    if (settingsData) setStoreSettings(settingsData);
    setLoading(false);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const addToCart = (book) => {
    setCart(prev => {
      const existing = prev.find(item => item.book.id === book.id);
      if (existing) {
        if (existing.quantity >= book.stock) return prev; // Prevent adding more than stock
        return prev.map(item => item.book.id === book.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { book, quantity: 1, price: book.sale_price || book.price }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.book.id === id) {
        const newQ = item.quantity + delta;
        if (newQ > item.book.stock || newQ < 1) return item;
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.book.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    
    try {
      const { data: order, error: orderError } = await supabase.from('orders').insert({
        user_id: null,
        customer_name: 'POS Walk-in',
        shipping_address: 'POS',
        billing_address: 'POS',
        contact_number: 'N/A',
        total_amount: total,
        shipping_fee: 0,
        shipping_breakdown: 'POS Pick-up',
        payment_method: paymentMethod,
        payment_status: 'Verified',
        order_status: 'Completed',
        order_source: 'POS'
      }).select().single();

      if (orderError) throw new Error(orderError.message);

      const orderItems = cart.map(item => ({
        order_id: order.id,
        book_id: item.book.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw new Error(itemsError.message);

      // Deduct stock
      for (const item of cart) {
        await supabase.from('books')
          .update({ stock: item.book.stock - item.quantity, sales_count: (item.book.sales_count || 0) + item.quantity })
          .eq('id', item.book.id);
      }

      const displayId = order.display_id || order.id.split('-')[0].toUpperCase();
      setCompletedOrder({ ...order, display_id: displayId, items: cart });
      setCart([]);
      fetchData(); // Refresh stock
      showNotification('success', 'Sale completed successfully!');
      
      // Print trigger
      setTimeout(() => {
        window.print();
        setCompletedOrder(null);
      }, 500);

    } catch (err) {
      showNotification('error', "Error processing sale: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && filteredBooks.length > 0) {
      // Auto-add first matching book if barcode scanner hit Enter
      addToCart(filteredBooks[0]);
      setSearch('');
    }
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-brand-blue font-bold">Loading POS...</div>;

  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-100 no-print">
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {notification.message && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className={`fixed top-4 right-4 z-50 px-6 py-3 rounded shadow-xl font-bold flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={20}/> : <span className="text-xl">!</span>}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT PANEL: PRODUCTS */}
      <div className="flex-1 flex flex-col h-full bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center gap-4 bg-gray-50">
          <Link to="/admin" className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ChevronLeft size={24} className="text-gray-600" /></Link>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              ref={searchInputRef}
              type="text" 
              autoFocus
              placeholder="Scan Barcode or Search Title..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-white border-2 border-gray-300 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-theme-medium text-lg font-medium transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredBooks.map(book => (
            <button 
              key={book.id} 
              onClick={() => addToCart(book)}
              disabled={book.stock < 1}
              className={`relative flex flex-col text-left p-3 rounded-xl border-2 transition-all duration-200 ${book.stock > 0 ? 'bg-white border-gray-100 hover:border-theme-medium hover:shadow-lg cursor-pointer' : 'bg-gray-100 border-gray-100 opacity-60 cursor-not-allowed'}`}
            >
              <div className="aspect-[2/3] w-full bg-gray-200 rounded-lg mb-3 overflow-hidden">
                {book.cover_image_url ? <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No Img</div>}
              </div>
              <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 flex-1">{book.title}</h3>
              <div className="flex justify-between items-end mt-2">
                <span className="font-bold text-theme-deep">{formatPrice(book.sale_price || book.price)}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${book.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{book.stock} left</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: CART */}
      <div className="w-[400px] flex flex-col h-full bg-gray-50 shadow-[-10px_0_30px_rgba(0,0,0,0.05)] z-10">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-bold text-brand-blue tracking-tight">Current Sale</h2>
          <p className="text-sm text-gray-500">{cart.length} items</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {cart.map(item => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={item.book.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-bold text-gray-800 text-sm leading-tight flex-1">{item.book.title}</h4>
                <button onClick={() => removeFromCart(item.book.id)} className="text-gray-400 hover:text-red-500 cursor-pointer p-1"><Trash2 size={16} /></button>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-theme-deep">{formatPrice(item.price * item.quantity)}</span>
                <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.book.id, -1)} className="p-1 hover:bg-white rounded shadow-sm text-gray-600"><Minus size={14} /></button>
                  <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.book.id, 1)} className="p-1 hover:bg-white rounded shadow-sm text-gray-600"><Plus size={14} /></button>
                </div>
              </div>
            </motion.div>
          ))}
          {cart.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-60">
              <Search size={48} className="mb-4" />
              <p className="font-bold">Cart is empty</p>
              <p className="text-sm">Scan a barcode to begin</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 border-t border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-bold text-gray-600">Total</span>
            <span className="text-3xl font-bold text-theme-deep">{formatPrice(total)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => setPaymentMethod('Cash')} className={`py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${paymentMethod === 'Cash' ? 'bg-theme-deep text-white border-theme-deep shadow-lg' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <Banknote size={20} /> Cash
            </button>
            <button onClick={() => setPaymentMethod('Card')} className={`py-4 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${paymentMethod === 'Card' ? 'bg-theme-deep text-white border-theme-deep shadow-lg' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <CreditCard size={20} /> Card
            </button>
          </div>

          <button 
            disabled={cart.length === 0 || processing}
            onClick={handleCompleteSale}
            className="w-full py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600 shadow-[0_10px_20px_rgba(34,197,94,0.3)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : <><CheckCircle2 size={24} /> Complete Sale</>}
          </button>
        </div>
      </div>

      {/* HIDDEN PRINT COMPONENT */}
      <style>
        {`
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { width: 80mm; margin: 0; font-family: monospace; font-size: 12px; color: black; -webkit-print-color-adjust: exact; }
            .print-only-pos-receipt { visibility: visible; position: absolute; left: 0; top: 0; width: 80mm; padding: 4mm; background: white; z-index: 99999; }
            .dashed-line { border-bottom: 1px dashed black; margin: 5px 0; }
            body * { visibility: hidden; }
            .print-only-pos-receipt * { visibility: visible; }
          }
        `}
      </style>
      {completedOrder && (
        <div className="print-only-pos-receipt">
          <div className="text-center mb-4">
            <h1 className="font-bold text-[16px] leading-tight">{storeSettings.name}</h1>
            <p className="text-[12px]">{storeSettings.address}</p>
            <p className="text-[12px]">Tel: {storeSettings.phone}</p>
          </div>
          <div className="dashed-line"></div>
          <div className="text-[12px] mb-2 flex justify-between">
            <span>Order: #{completedOrder.display_id}</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className="dashed-line"></div>
          
          <table className="w-full text-[12px] mb-2">
            <thead>
              <tr className="border-b border-dashed border-black">
                <th className="text-left font-normal pb-1 w-3/5">Item</th>
                <th className="text-center font-normal pb-1 w-1/5">Qty</th>
                <th className="text-right font-normal pb-1 w-1/5">Amt</th>
              </tr>
            </thead>
            <tbody>
              {completedOrder.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1 break-words pr-1">{item.book.title}</td>
                  <td className="py-1 text-center align-top">{item.quantity}</td>
                  <td className="py-1 text-right align-top">{item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="dashed-line"></div>
          <div className="flex justify-between font-bold text-[14px] my-2">
            <span>TOTAL</span>
            <span>Rs. {completedOrder.total_amount}</span>
          </div>
          <div className="flex justify-between text-[12px] my-1">
            <span>Payment Method:</span>
            <span>{completedOrder.payment_method}</span>
          </div>
          <div className="dashed-line"></div>
          
          <div className="text-center mt-4 text-[12px]">
            <p className="font-bold">Thank you for your purchase!</p>
            <p className="mt-1">Powered by Antigravity POS</p>
          </div>
        </div>
      )}
    </div>
  );
}
