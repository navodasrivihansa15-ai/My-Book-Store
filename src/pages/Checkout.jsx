import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2 } from 'lucide-react';

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      let payment_slip_url = null;

      if (paymentMethod !== 'COD' && file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-slips')
          .upload(fileName, file);
        
        if (uploadError) throw new Error('Failed to upload proof of payment: ' + uploadError.message);
        
        const { data: urlData } = supabase.storage
          .from('payment-slips')
          .getPublicUrl(uploadData.path);
        payment_slip_url = urlData.publicUrl;
      } else if (paymentMethod !== 'COD' && !file) {
        throw new Error('Please upload a proof of payment.');
      }

      const { data: order, error: orderError } = await supabase.from('orders').insert({
        user_id: user.id,
        total_amount: total,
        shipping_address: address,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'COD' ? 'Pending' : 'Pending Verification',
        payment_slip_url,
        order_status: 'Processing'
      }).select().single();

      if (orderError) throw new Error(orderError.message);

      const orderItems = cart.map(item => ({
        order_id: order.id,
        book_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

      if (itemsError) throw new Error(itemsError.message);

      clearCart();
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[70vh] flex items-center justify-center text-center px-4">
        <div className="bg-slate-50 border border-theme-light/50 p-12 rounded-2xl max-w-lg shadow-[0_8px_32px_rgba(26,61,99,0.1)]">
          <CheckCircle2 size={64} className="text-theme-medium mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-theme-deep mb-4">Order Confirmed</h2>
          <p className="text-theme-darkest/70 tracking-wide mb-8">
            Thank you for your purchase. Your order has been successfully placed and is now being processed.
          </p>
          <button onClick={() => navigate('/account')} className="bg-theme-deep text-theme-bg px-8 py-3 rounded-full hover:bg-theme-darkest transition-colors uppercase tracking-widest text-sm font-bold shadow-md cursor-pointer">
            View My Orders
          </button>
        </div>
      </motion.div>
    );
  }

  if (cart.length === 0) return <div className="text-center py-20 text-theme-darkest/50 font-bold text-xl">Your cart is empty.</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto pt-8 pb-20">
      <h1 className="text-4xl font-bold text-theme-deep mb-10 border-b border-theme-light/30 pb-6">Secure Checkout</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-8 text-sm font-semibold shadow-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <section className="bg-slate-50 border border-slate-200 p-8 rounded-xl shadow-sm relative overflow-hidden">
             <h2 className="text-xl font-bold text-theme-deep mb-6">1. Shipping Details</h2>
             <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Delivery Address</label>
             <textarea
               required
               rows="4"
               className="w-full bg-slate-50 border border-slate-300 px-4 py-3 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-theme-medium transition-all text-theme-darkest resize-none"
               placeholder="Street, City, Zip Code, Country"
               value={address}
               onChange={(e) => setAddress(e.target.value)}
             ></textarea>
          </section>

          <section className="bg-slate-50 border border-slate-200 p-8 rounded-xl shadow-sm relative overflow-hidden">
             <h2 className="text-xl font-bold text-theme-deep mb-6">2. Payment Method</h2>
             
             <div className="space-y-4 mb-6">
                {['COD', 'Bank Transfer', 'QR Scan & Pay'].map((method) => (
                  <label key={method} className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${paymentMethod === method ? 'border-theme-medium bg-theme-light/10 shadow-inner' : 'border-slate-300 hover:border-theme-light'}`}>
                    <span className="text-sm font-bold text-theme-darkest tracking-wider">{method === 'COD' ? 'Cash on Delivery' : method}</span>
                    <input type="radio" name="paymentMethod" value={method} checked={paymentMethod === method} onChange={(e) => { setPaymentMethod(e.target.value); setFile(null); setPreview(null); }} className="hidden" />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === method ? 'border-theme-medium' : 'border-slate-300'}`}>
                      {paymentMethod === method && <div className="w-2 h-2 bg-theme-medium rounded-full"></div>}
                    </div>
                  </label>
                ))}
             </div>

             <AnimatePresence mode="wait">
               {paymentMethod === 'Bank Transfer' && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                   <div className="bg-theme-bg p-5 rounded-lg border border-theme-light/30 mb-4 shadow-inner">
                     <p className="text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Account Details</p>
                     <p className="font-bold text-theme-deep text-lg">Lumina Heritage Bank</p>
                     <p className="text-theme-darkest font-mono tracking-widest my-1 text-xl">9876 5432 1000 0000</p>
                     <p className="text-sm text-theme-darkest/70">Account Name: Lumina Books Inc.</p>
                   </div>
                   <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Upload Bank Slip</label>
                   <FileInput file={file} preview={preview} setFile={setFile} setPreview={setPreview} />
                 </motion.div>
               )}

               {paymentMethod === 'QR Scan & Pay' && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                   <div className="bg-theme-bg p-6 rounded-lg border border-theme-light/30 mb-4 flex flex-col items-center shadow-inner">
                     <p className="text-xs uppercase tracking-widest text-theme-medium mb-4 font-bold">Scan to Pay</p>
                     <div className="w-48 h-48 bg-white p-2 rounded-xl mb-3 shadow-md border border-slate-200">
                       <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=LuminaBookshopPayment" alt="QR Code" className="w-full h-full object-cover" />
                     </div>
                     <p className="text-xs font-semibold text-theme-medium">Scan using any supported banking app</p>
                   </div>
                   <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Upload Payment Screenshot</label>
                   <FileInput file={file} preview={preview} setFile={setFile} setPreview={setPreview} />
                 </motion.div>
               )}

               {paymentMethod === 'COD' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                   <p className="text-sm text-theme-darkest/70 italic bg-theme-bg p-4 rounded-lg border border-theme-light/30">Pay safely with cash upon delivery of your items.</p>
                 </motion.div>
               )}
             </AnimatePresence>
          </section>
        </div>

        <div>
          <div className="bg-slate-50/80 backdrop-blur-xl border border-slate-200 p-8 rounded-xl sticky top-28 shadow-lg">
            <h2 className="font-bold text-2xl text-theme-deep mb-6 border-b border-theme-light/30 pb-4">Order Summary</h2>
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-theme-medium font-bold">{item.quantity}x</span>
                    <span className="text-theme-darkest font-semibold line-clamp-1">{item.title}</span>
                  </div>
                  <span className="text-theme-deep font-bold">LKR {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-theme-light/30 pt-6 mb-8 flex justify-between items-end">
              <span className="uppercase tracking-widest text-sm font-bold text-theme-medium">Total Payable</span>
              <span className="font-bold text-3xl text-theme-deep">LKR {total.toFixed(2)}</span>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-theme-deep text-theme-bg font-bold tracking-widest uppercase py-4 rounded-full hover:bg-theme-darkest transition-all shadow-[0_8px_20px_rgba(26,61,99,0.2)] disabled:opacity-50 relative overflow-hidden group cursor-pointer"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? <><div className="w-5 h-5 border-2 border-theme-bg border-t-transparent rounded-full animate-spin"></div> Processing...</> : 'Confirm Order'}
              </span>
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

function FileInput({ file, preview, setFile, setPreview }) {
  return (
    <div className="relative group">
      <input type="file" accept="image/*" required onChange={(e) => {
        const s = e.target.files[0];
        if (s) { setFile(s); setPreview(URL.createObjectURL(s)); }
      }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
      <div className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all duration-300 overflow-hidden ${preview ? 'border-theme-medium bg-theme-light/10' : 'border-slate-300 group-hover:border-theme-medium bg-slate-50 hover:bg-white'}`}>
        {preview ? (
          <div className="relative w-full h-full">
            <img src={preview} alt="Slip" className="w-full h-full object-contain bg-white" />
            <div className="absolute inset-0 bg-theme-darkest/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-sm font-bold uppercase tracking-wider">Change Image</span>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 text-theme-medium/70 group-hover:text-theme-deep transition-colors">
            <UploadCloud size={30} className="mx-auto mb-2" />
            <p className="text-xs uppercase tracking-wider font-bold">Upload Image</p>
          </div>
        )}
      </div>
    </div>
  );
}
