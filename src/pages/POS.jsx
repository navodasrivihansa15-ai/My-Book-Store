import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, Trash2, Printer, CheckCircle2, ChevronLeft, CreditCard, Banknote, Camera, X, Smartphone, Keyboard, Save, RotateCcw } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { formatPrice } from '../lib/utils';
import { Link } from 'react-router-dom';
import AddBookModal from '../components/AddBookModal';
import { useAuth } from '../context/AuthContext';

const defaultShortcuts = {
  openShortcutsMenu: 'Alt+k',
  addScannedItem: 'Space', // Spacebar
  checkout: 'Enter', // Opens Cash Payment
  deleteLastItem: 'Backspace',
  clearOrder: 'Delete',
  closeModals: 'Escape', // Also acts as "Next Order" on success screen
  reprintBill: 'p',
  hardwareScanner: 'Control+b'
};

const getEventKeyString = (e) => {
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return null;
  let keyString = '';
  if (e.ctrlKey) keyString += 'Control+';
  if (e.altKey) keyString += 'Alt+';
  if (e.shiftKey && e.key.length === 1) {
    keyString += e.key;
  } else if (e.shiftKey) {
    keyString += 'Shift+';
  }
  keyString += e.key === ' ' ? 'Space' : e.key;
  return keyString;
};

const PosReceiptPrint = ({ data, storeSettings, isPreview = false }) => {
  if (!data) return null;
  return (
    <div className={isPreview ? "bg-white text-black font-sans" : "print-only-pos-receipt"}>
      <div className="text-center mb-4">
        <h1 className="font-bold text-[16px] leading-tight">{storeSettings?.name}</h1>
        <p className="text-[12px]">{storeSettings?.address}</p>
        <p className="text-[12px]">Tel: {storeSettings?.phone}</p>
      </div>
      <div className="dashed-line"></div>
      <div className="text-[12px] mb-2 flex justify-between">
        <span>Order: #{data.display_id}</span>
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
          {data.items.map((item, idx) => (
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
        <span>Rs. {data.total_amount}</span>
      </div>
      <div className="flex justify-between mt-1 text-[11px]">
        <span>Cash Tendered:</span>
        <span>{data.amount_paid}</span>
      </div>
      <div className="flex justify-between font-bold text-[12px] mt-1 border-t border-dashed border-black pt-1">
        <span>Balance / Change:</span>
        <span>{data.balance}</span>
      </div>
      <div className="flex justify-between text-[12px] my-1 mt-2">
        <span>Payment Method:</span>
        <span>{data.payment_method}</span>
      </div>
      <div className="dashed-line"></div>
      
      <div className="text-center mt-4 text-[12px]">
        <p className="font-bold">Thank you for your purchase!</p>
        <p className="mt-1">Powered by Antigravity POS</p>
        <div className="text-[10px] text-gray-500 italic text-center mt-2 border-t border-dashed border-black pt-1">
          * Delivery fees are based solely on actual postal or courier charges.
        </div>
      </div>
    </div>
  );
};

const ShortcutSettingsModal = ({ shortcuts, setShortcuts, onClose, showNotification }) => {
  const [localShortcuts, setLocalShortcuts] = useState({ ...shortcuts });

  const handleKeyCapture = (e, keyName) => {
    e.preventDefault();
    e.stopPropagation();

    // Ignore standalone modifier keys
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

    // Build the key combination string (e.g., 'Control+b' or 'Enter' or 'F2')
    let keyString = '';
    if (e.ctrlKey) keyString += 'Control+';
    if (e.altKey) keyString += 'Alt+';
    if (e.shiftKey && e.key.length === 1) {
      // If it's a shifted character, just use the character itself, otherwise add Shift+
      keyString += e.key; 
    } else if (e.shiftKey) {
      keyString += 'Shift+';
    }

    // Add the main key (handle spacebar visually)
    keyString += e.key === ' ' ? 'Space' : e.key;

    // Update state
    setLocalShortcuts(prev => ({ ...prev, [keyName]: keyString === 'Space' ? 'Space' : keyString }));
  };

  const saveSettings = () => {
    setShortcuts(localShortcuts);
    localStorage.setItem('pos_shortcuts', JSON.stringify(localShortcuts));
    showNotification('success', 'Shortcuts saved successfully!');
    onClose();
  };

  const resetToDefaults = () => {
    setLocalShortcuts(defaultShortcuts);
    setShortcuts(defaultShortcuts);
    localStorage.setItem('pos_shortcuts', JSON.stringify(defaultShortcuts));
    showNotification('success', 'Shortcuts reset to defaults!');
  };

  const shortcutLabels = {
    openShortcutsMenu: 'Open Shortcuts Menu',
    addScannedItem: 'Add Item to Cart (Search Bar)',
    checkout: 'Checkout / Confirm Sale',
    deleteLastItem: 'Remove Last Item',
    clearOrder: 'Void / Clear Entire Order',
    closeModals: 'Close Pop-ups / Next Order',
    reprintBill: 'Print / Reprint Receipt',
    hardwareScanner: 'Trigger Hardware Scanner'
  };

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Keyboard size={20} className="text-theme-medium" />
            <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="hover:bg-slate-800 p-1 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="p-4 bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-sm font-semibold flex gap-2">
          <span>💡</span> 
          <span>Note: Typing any letter or number while not in a menu will automatically focus the Search Bar.</span>
        </div>

        <div className="p-6 flex flex-col gap-4 max-h-[50vh] overflow-y-auto">
          {Object.keys(shortcutLabels).map(key => (
            <div key={key} className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-sm font-bold text-gray-700">{shortcutLabels[key]}</span>
              <input 
                value={localShortcuts[key] === ' ' ? 'Space' : (localShortcuts[key] || '')}
                onKeyDown={(e) => handleKeyCapture(e, key)}
                readOnly // Prevent normal typing
                className="w-40 border-2 p-2 rounded-lg text-center cursor-pointer font-mono font-bold text-sm text-theme-deep bg-gray-50 focus:bg-white focus:border-theme-deep focus:ring-2 focus:ring-theme-deep/30 outline-none transition-all shadow-sm"
                title="Click here and press any key combination to change"
              />
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          <button onClick={resetToDefaults} className="px-4 py-2 flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
            <RotateCcw size={16} /> Reset All
          </button>
          <button onClick={saveSettings} className="px-6 py-2 bg-theme-deep text-white rounded-lg font-bold flex items-center gap-2 hover:bg-theme-deep/90 shadow-md transition-all">
            <Save size={16} /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default function POS() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('pos_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Failed to parse cart from local storage", error);
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash or Card
  const [completedOrder, setCompletedOrder] = useState(null);
  const [storeSettings, setStoreSettings] = useState({ name: 'Alexandria Books', address: '', phone: '' });
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [showScanner, setShowScanner] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [showMobileQR, setShowMobileQR] = useState(false);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [unrecognizedBarcode, setUnrecognizedBarcode] = useState('');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [shortcuts, setShortcuts] = useState(() => {
    const saved = localStorage.getItem('pos_shortcuts');
    return saved ? JSON.parse(saved) : defaultShortcuts;
  });
  const mobileScannerUrl = window.location.origin + '/admin/scanner';
  const { user, userFullName } = useAuth();
  let activeStaffName = null;
  try { 
    const stored = JSON.parse(sessionStorage.getItem('active_staff'))?.name;
    if (stored && !stored.includes('@')) {
      activeStaffName = stored;
    }
  } catch(e) {}
  const handlerName = activeStaffName || userFullName || user?.email || user?.user_metadata?.full_name || 'Unknown Staff';

  const searchInputRef = useRef(null);
  const booksRef = useRef(books);

  useEffect(() => {
    booksRef.current = books;
  }, [books]);

  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showScanner) {
      // Removed qrbox constraint to prevent NotReadableError on webcams
      const scanner = new Html5QrcodeScanner("reader", { fps: 10 }, false);
      scanner.render((text) => {
        scanner.clear();
        setShowScanner(false);
        handleBarcodeScan(text);
      }, (err) => {
        // ignore
      });
      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [showScanner]);

  // REAL-TIME LISTENER FOR MOBILE SCANNER
  useEffect(() => {
    // 1. Listen for Broadcast messages (No Database required!)
    const scannerChannel = supabase
      .channel('scanner-broadcast-channel')
      .on(
        'broadcast',
        { event: 'scan' },
        async (payload) => {
          console.log("🔥 REALTIME BROADCAST RECEIVED IN POS:", payload);
          const scannedBarcode = payload.payload.barcode;
          const target = payload.payload.target;
          
          if (target && target !== 'POS') return; // Ignore inventory scans

          if (scannedBarcode) {
            try {
              // 2. Call your function to handle the barcode
              await handleBarcodeScan(scannedBarcode);
            } catch (err) {
              console.error("Error processing scan broadcast:", err);
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log("📶 Supabase Realtime Status (POS Broadcast Listener):", status);
        if (err) console.error("Realtime Error (POS Listener):", err);
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(scannerChannel);
    };
  }, []);

  useEffect(() => {
    if (search) {
      const lower = search.toLowerCase();
      setFilteredBooks(books.filter(b => 
        b.title.toLowerCase().includes(lower) || 
        b.author?.toLowerCase().includes(lower) || 
        b.id.includes(lower) ||
        b.barcode?.toLowerCase() === lower
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

  const onAddBookSuccess = (newBook) => {
    setBooks(prev => [...prev, newBook]);
    setFilteredBooks(prev => [...prev, newBook]);
    addToCart(newBook);
    showNotification('success', 'New book added to cart!');
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

  const setQuantity = (id, newQ) => {
    setCart(prev => prev.map(item => {
      if (item.book.id === id) {
        if (newQ > item.book.stock) newQ = item.book.stock;
        if (newQ < 1) newQ = 1;
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.book.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const triggerCheckout = () => {
    if (cart.length === 0 || processing) return;
    if (paymentMethod === 'Cash') {
      setIsPaymentModalOpen(true);
      setAmountPaid('');
    } else {
      // For Card payments, bypass the cash popup and finalize immediately
      handleCompleteSale(total, 0);
    }
  };

  const handleCompleteSale = async (paidAmount, calculatedBalance) => {
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
        amount_paid: paidAmount,
        balance: calculatedBalance,
        shipping_fee: 0,
        shipping_breakdown: 'POS Pick-up',
        payment_method: paymentMethod,
        payment_status: 'Verified',
        order_status: 'Completed',
        order_source: 'POS',
        handled_by: handlerName
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

      try {
        const activeStaff = JSON.parse(sessionStorage.getItem('active_staff') || '{}');
        if (activeStaff.session_id) {
          await supabase.rpc('increment_session_stat', { session_id: activeStaff.session_id, stat_column: 'pos_handled' });
        }
      } catch (e) {}

      // Deduct stock
      for (const item of cart) {
        await supabase.from('books')
          .update({ stock: item.book.stock - item.quantity, sales_count: (item.book.sales_count || 0) + item.quantity })
          .eq('id', item.book.id);
      }

      const displayId = order.display_id || order.id.split('-')[0].toUpperCase();
      
      // 1. Save the finalized order details to the completedOrder state
      setCompletedOrder({ ...order, display_id: displayId, items: cart });
      
      // 2. Clear the POS cart for the next customer
      setCart([]);
      
      // 3. Close the modal upon success so it transitions directly to the preview
      setIsPaymentModalOpen(false);
      
      fetchData(); // Refresh stock
      
      // Auto-print disabled so cashier can preview bill first

    } catch (err) {
      showNotification('error', "Error processing sale: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleVoidSale = async () => {
    if (!completedOrder) return;
    if (!window.confirm('Are you sure you want to cancel this sale and restock the items?')) return;
    
    setProcessing(true);
    try {
      // 1. Mark order as cancelled
      const { error: cancelError } = await supabase.from('orders')
        .update({ order_status: 'Cancelled' })
        .eq('id', completedOrder.id);
        
      if (cancelError) throw new Error(cancelError.message);

      // 2. Restock items
      for (const item of completedOrder.items) {
        // We increment stock back based on current stock in DB to avoid race conditions
        const { data: currentBook } = await supabase.from('books').select('stock, sales_count').eq('id', item.book.id).single();
        if (currentBook) {
          await supabase.from('books')
            .update({ 
              stock: currentBook.stock + item.quantity, 
              sales_count: Math.max(0, (currentBook.sales_count || 0) - item.quantity) 
            })
            .eq('id', item.book.id);
        }
      }

      showNotification('success', 'Sale Cancelled & Stock Restored');
      setCompletedOrder(null);
      fetchData();
    } catch (err) {
      showNotification('error', "Error voiding sale: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBarcodeScan = async (scannedBarcode) => {
    // Always use booksRef.current inside listeners to avoid stale state closures
    const book = booksRef.current.find(b => b.barcode === scannedBarcode);
    if (book) {
      addToCart(book);
      setSearch('');
      showNotification('success', 'Mobile Scan: Added ' + book.title);
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 150);
      } catch (e) {}
      if (searchInputRef.current) searchInputRef.current.focus();
    } else {
      setSearch('');
      setUnrecognizedBarcode(scannedBarcode);
      setIsAddBookModalOpen(true);
      showNotification('error', 'New Book Detected! Please add details.');
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 300);
      } catch (e) {}
      if (searchInputRef.current) searchInputRef.current.focus();
    }
  };

  const handleSearchKeyDown = (e) => {
    const keyStr = getEventKeyString(e);
    if (!keyStr) return;

    // Add Item (Spacebar)
    if (keyStr === shortcuts.addScannedItem) {
      e.preventDefault(); // Prevent typing a space
      if (search.trim() !== '') {
        const exactBarcodeBook = books.find(b => b.barcode === search.trim());
        if (exactBarcodeBook) {
          handleBarcodeScan(search.trim());
        } else if (filteredBooks.length > 0) {
          addToCart(filteredBooks[0]);
          setSearch('');
        } else {
          showNotification('error', 'Book not found');
          setSearch('');
        }
      }
    }
    // Delete Last Item (Backspace)
    else if (keyStr === shortcuts.deleteLastItem && search === '') {
      e.preventDefault();
      if (cart.length > 0) {
        const newCart = [...cart];
        newCart.pop(); // Remove the last added item
        setCart(newCart);
      }
    }
    // Complete Sale (Enter)
    else if (keyStr === shortcuts.checkout && search === '') {
      e.preventDefault();
      triggerCheckout();
    }
  };

  useEffect(() => {
    const handleSuccessKeys = (e) => {
      // Only active if the success screen is showing
      if (!completedOrder) return;

      const keyStr = getEventKeyString(e);
      if (!keyStr) return;

      const isMatch = (action) => shortcuts[action] && shortcuts[action].toLowerCase() === keyStr.toLowerCase();

      if (isMatch('reprintBill')) {
        e.preventDefault();
        const originalTitle = document.title;
        document.title = completedOrder.display_id || 'Invoice';
        window.print();
        document.title = originalTitle;
      } else if (isMatch('clearOrder')) {
        e.preventDefault();
        handleVoidSale();
      } else if (isMatch('closeModals') || e.key === 'Escape') {
        e.preventDefault();
        setCompletedOrder(null);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };

    window.addEventListener('keydown', handleSuccessKeys);
    return () => window.removeEventListener('keydown', handleSuccessKeys);
  }, [completedOrder]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (completedOrder || isPaymentModalOpen) return; // Prevent global listener when success screen or payment modal is active
      
      const activeEl = document.activeElement;
      const isInputFocused = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA';

      const keyStr = getEventKeyString(e);
      if (!keyStr) return;

      const isMatch = (action) => shortcuts[action] && shortcuts[action].toLowerCase() === keyStr.toLowerCase();

      // 1. Close Modals
      if (isMatch('closeModals') || e.key === 'Escape') {
        setIsAddBookModalOpen(false);
        setShowScanner(false);
        setShowShortcutsModal(false);
        setShowMobileQR(false);
        searchInputRef.current?.focus();
        return;
      }

      // If a modal is open, don't trigger other background shortcuts
      if (isAddBookModalOpen || showScanner || showShortcutsModal || showMobileQR) return;

      if (isMatch('hardwareScanner')) {
        e.preventDefault();
        showNotification('success', 'Hardware Scanner Mode Ready');
        return;
      }
      
      if (isMatch('openShortcutsMenu')) {
        e.preventDefault();
        setShowShortcutsModal(true);
        return;
      }

      if (!isInputFocused) {
        // 2. Global Actions (When not typing in a box)
        if (isMatch('checkout')) {
          e.preventDefault();
          triggerCheckout();
        } else if (isMatch('clearOrder')) {
          e.preventDefault();
          if (completedOrder) handleVoidSale();
          else setCart([]);
        } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          // 3. AUTO-FOCUS SEARCH BAR: If user starts typing any letter/number, auto-focus the search bar!
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [shortcuts, cart, completedOrder, isAddBookModalOpen, showScanner, showShortcutsModal, showMobileQR, paymentMethod]);

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-theme-deep font-bold">Loading POS...</div>;

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

      {/* TRANSACTION SUCCESS OVERLAY */}
      {completedOrder ? (
        <div className="flex flex-col md:flex-row gap-8 p-6 bg-gray-50 h-full w-full justify-center items-start overflow-y-auto">
          {/* LEFT SIDE: Actions & Status */}
          <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-200">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Sale Completed!</h2>
            <p className="text-gray-500 mb-8">Order ID: {completedOrder.display_id}</p>

            {/* Fixed Button Layout */}
            <div className="flex flex-col gap-3 max-w-sm mx-auto">
              <button onClick={() => {
                const originalTitle = document.title;
                document.title = completedOrder.display_id || 'Invoice';
                window.print();
                document.title = originalTitle;
              }} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-md">
                🖨️ Print / Reprint <span className="opacity-70 text-sm font-normal">(P / R)</span>
              </button>
              <button onClick={handleVoidSale} disabled={processing} className="w-full py-3 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 disabled:opacity-50">
                ❌ {processing ? 'Voiding...' : <><span className="mr-1">Delete Order</span> <span className="opacity-70 text-sm font-normal">(Del)</span></>}
              </button>
              <button onClick={() => { setCompletedOrder(null); setTimeout(() => searchInputRef.current?.focus(), 100); }} className="w-full py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 mt-4">
                ➕ Next Order <span className="opacity-70 text-sm font-normal">(Esc)</span>
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: Bill Preview Wrapper */}
          <div className="w-[80mm] shrink-0 bg-white shadow-xl border border-gray-300 mx-auto md:mx-0 overflow-hidden relative">
            <div className="bg-gray-200 text-center text-xs font-bold py-1 border-b border-gray-300 text-gray-600">
              RECEIPT PREVIEW
            </div>
            <div className="p-2 pointer-events-none">
              <PosReceiptPrint data={completedOrder} storeSettings={storeSettings} isPreview={true} />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* LEFT PANEL: PRODUCTS */}
          <div className="flex-1 flex flex-col h-full bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row items-center gap-4 bg-gray-50">
          <Link to="/admin" className="p-2 hover:bg-gray-200 rounded-full transition-colors shrink-0"><ChevronLeft size={24} className="text-gray-600" /></Link>
          <div className="relative w-full flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              ref={searchInputRef}
              type="text" 
              autoFocus
              placeholder="Scan barcode or type name... (Auto-focus)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-white border-2 border-gray-300 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-theme-medium text-lg font-medium transition-colors"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end w-full md:w-auto">
            <button 
              onClick={() => setShowShortcutsModal(true)}
              className="bg-gray-200 text-gray-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold hover:bg-gray-300 transition-colors shadow-sm cursor-pointer shrink-0"
              title="Keyboard Shortcuts"
            >
              <Keyboard size={20} /> <span className="hidden lg:inline">Shortcuts</span>
            </button>
            <button 
              onClick={() => {
                showNotification('success', 'Hardware Scanner Mode Ready');
              }}
              className="bg-theme-deep text-white px-4 py-3 rounded-xl flex items-center gap-2 font-bold hover:bg-theme-darkest transition-colors shadow-sm cursor-pointer shrink-0"
            >
              📠 <span className="hidden lg:inline">Barcode Scanner</span> <span className="text-xs opacity-70">({shortcuts.hardwareScanner})</span>
            </button>
            <button 
              onClick={() => setShowMobileQR(true)}
              className="bg-purple-600 text-white px-4 py-3 rounded-xl flex items-center gap-2 font-bold hover:bg-purple-700 transition-colors shadow-sm cursor-pointer shrink-0"
            >
              📱 <span className="hidden lg:inline">Mobile Scanner</span>
            </button>
          </div>
        </div>

        {/* MOBILE SCANNER QR MODAL */}
        {showMobileQR && (
          <div className="fixed inset-0 z-[50] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm">
              <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="font-bold text-lg text-theme-deep flex items-center gap-2"><Smartphone size={20} /> Mobile Scanner</h2>
                <button onClick={() => setShowMobileQR(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer text-gray-500"><X size={20} /></button>
              </div>
              <div className="p-8 flex flex-col items-center text-center">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(mobileScannerUrl)}`} alt="Scanner QR" className="w-48 h-48 mb-6 rounded-xl shadow-sm" />
                <h3 className="font-bold text-gray-800 text-xl mb-2">Scan with your Phone</h3>
                <p className="text-gray-500 text-sm mb-4">Open this QR code with your phone's camera to use it as a wireless barcode scanner for this POS.</p>
                <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono text-gray-600 break-all">{mobileScannerUrl}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* CAMERA SCANNER MODAL */}
        {showScanner && (
          <div className="fixed inset-0 z-[50] flex flex-col bg-black/90 text-white animate-in fade-in">
            <div className="flex justify-between items-center p-4 bg-black">
              <h2 className="font-bold text-xl flex items-center gap-2"><Camera size={24} /> Scan Barcode</h2>
              <button onClick={() => setShowScanner(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"><X size={24} /></button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div id="reader" className="w-full max-w-md bg-white rounded-xl overflow-hidden shadow-2xl"></div>
              <p className="mt-6 text-gray-400">Position the barcode inside the frame</p>
            </div>
          </div>
        )}
        
        {/* ADD BOOK MODAL */}
        <AddBookModal 
          isOpen={isAddBookModalOpen} 
          onClose={() => setIsAddBookModalOpen(false)} 
          initialBarcode={unrecognizedBarcode} 
          onSuccess={onAddBookSuccess} 
        />
        
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
        <div className="p-6 border-b border-gray-200 bg-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-theme-deep tracking-tight">Current Sale</h2>
            <p className="text-sm text-gray-500">{cart.length} items</p>
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-bold" title={`Clear Cart (${shortcuts.clearOrder})`}>
              <Trash2 size={16} /> Clear <span className="hidden xl:inline text-xs opacity-70">({shortcuts.clearOrder})</span>
            </button>
          )}
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
                  <input 
                    type="number" 
                    min="1" 
                    max={item.book.stock}
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setQuantity(item.book.id, val);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.target.blur();
                        searchInputRef.current?.focus();
                      }
                    }}
                    className="font-bold text-sm w-12 text-center bg-transparent border-none focus:ring-2 focus:ring-theme-deep rounded outline-none"
                  />
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
            onClick={triggerCheckout}
            className="w-full py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600 shadow-[0_10px_20px_rgba(34,197,94,0.3)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : <><CheckCircle2 size={24} /> Complete Sale <span className="text-sm opacity-70 ml-1">({shortcuts.checkout})</span></>}
          </button>
        </div>
      </div>
        </>
      )}


      {/* PRINT RECEIPT DATA - TELEPORTED TO BODY TO AVOID DOM CLIPPING */}
      {completedOrder && createPortal(
        <PosReceiptPrint data={completedOrder} storeSettings={storeSettings} isPreview={false} />,
        document.body
      )}

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[50] animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl w-96 text-center shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Cash Payment</h2>
            
            <div className="text-gray-500 mb-1">Grand Total</div>
            <div className="text-4xl font-extrabold text-blue-600 mb-6">Rs. {total}</div>
            
            <div className="mb-4 text-left">
              <label className="block text-sm font-semibold mb-1">Cash Tendered (Rs)</label>
              <input 
                type="number" 
                autoFocus
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsPaymentModalOpen(false);
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (processing) return;
                    const paid = parseFloat(amountPaid) || 0;
                    if (paid >= total) {
                      handleCompleteSale(paid, paid - total);
                    } else {
                      showNotification('error', "Amount is less than total!");
                    }
                  }
                }}
                className="w-full text-2xl p-3 border-2 border-gray-300 rounded-xl outline-none focus:border-theme-medium text-center"
              />
            </div>
            
            <div className="bg-gray-100 p-4 rounded-xl flex justify-between items-center mt-6 mb-4">
              <span className="font-semibold text-gray-600">Balance:</span>
              <span className={`text-2xl font-bold ${((parseFloat(amountPaid) || 0) - total) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                Rs. {((parseFloat(amountPaid) || 0) - total) >= 0 ? ((parseFloat(amountPaid) || 0) - total) : 0}
              </span>
            </div>
            
            <button 
              disabled={processing || !amountPaid}
              onClick={() => {
                const paid = parseFloat(amountPaid) || 0;
                if (paid >= total) {
                  handleCompleteSale(paid, paid - total);
                } else {
                  showNotification('error', "Amount is less than total!");
                }
              }}
              className="w-full py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? 'Processing...' : 'Confirm Payment (Enter)'}
            </button>
          </div>
        </div>
      )}

      {/* SHORTCUTS MODAL */}
      {showShortcutsModal && (
        <ShortcutSettingsModal 
          shortcuts={shortcuts} 
          setShortcuts={setShortcuts} 
          onClose={() => setShowShortcutsModal(false)} 
        />
      )}
    </div>
  );
}
