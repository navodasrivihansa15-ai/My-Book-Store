import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Package, ShieldCheck, Shield, Phone, Save, Edit2, CheckCircle, XCircle, X, Check, ExternalLink, Receipt, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '../lib/utils';

export default function MyAccount() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'orders'

  if (!user) return <div className="text-center py-20 text-xl font-bold">Please log in to view this page.</div>;

  return (
    <div className="max-w-6xl mx-auto py-4 md:py-12 px-4 flex flex-col md:flex-row gap-4 md:gap-8 min-h-[70vh] pb-24 md:pb-8">
      
      {/* Mobile Top Tabs / Desktop Left Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0">
        
        {/* MOBILE LAYOUT: GRID & ADMIN BUTTON */}
        <div className="md:hidden">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-2 rounded-xl text-center text-[13px] sm:text-sm font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'profile' 
                  ? 'bg-theme-deep text-white shadow-md border-transparent' 
                  : 'bg-white/80 backdrop-blur-sm text-gray-600 border-gray-200 shadow-sm'
              }`}
            >
              <User size={16} /> Profile
            </button>
            
            <button 
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-2 rounded-xl text-center text-[13px] sm:text-sm font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'orders' 
                  ? 'bg-theme-deep text-white shadow-md border-transparent' 
                  : 'bg-white/80 backdrop-blur-sm text-gray-600 border-gray-200 shadow-sm'
              }`}
            >
              <Package size={16} /> Orders
            </button>
          </div>
          
          {user?.email === 'navodasrivihansa15@gmail.com' && (
            <Link 
              to="/admin"
              className="w-full mb-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold text-center flex items-center justify-center gap-2 shadow-lg"
            >
              <Shield size={16} /> Admin Dashboard
            </Link>
          )}
        </div>

        {/* DESKTOP LAYOUT: SIDEBAR */}
        <div className="hidden md:flex bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm sticky top-24 flex-col gap-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center justify-start gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'profile' 
                ? 'bg-theme-medium text-white shadow-md' 
                : 'text-theme-darkest/70 hover:bg-slate-100 hover:text-theme-deep'
            }`}
          >
            <User size={18} /> Profile Settings
          </button>
          
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center justify-start gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'orders' 
                ? 'bg-theme-medium text-white shadow-md' 
                : 'text-theme-darkest/70 hover:bg-slate-100 hover:text-theme-deep'
            }`}
          >
            <Package size={18} /> My Orders
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow bg-transparent md:bg-white md:border md:border-slate-200 rounded-3xl md:rounded-2xl shadow-none md:shadow-sm p-0 md:p-10">
        {activeTab === 'profile' ? <ProfileSettings user={user} /> : <UserOrders user={user} />}
      </main>

    </div>
  );
}

// ==========================================
// PROFILE SETTINGS COMPONENT
// ==========================================
function ProfileSettings({ user }) {
  const [authForm, setAuthForm] = useState({ email: user?.email || '', password: '' });
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    home_address: '',
    work_address: '',
    contact_number: '',
    secondary_contact_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (data) setProfileForm(data);
    };
    if (user) fetchProfile();
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleAuthUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authForm.password) {
        const { error } = await supabase.auth.updateUser({ password: authForm.password });
        if (error) throw error;
      }
      if (authForm.email && authForm.email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email: authForm.email });
        if (error) throw error;
      }
      showToast('Authentication details updated successfully!');
      setAuthForm({ ...authForm, password: '' }); // Clear password field
    } catch (err) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('user_profiles').upsert({
        id: user.id,
        ...profileForm
      });
      if (error) throw error;
      showToast('Personal profile updated successfully!');
    } catch (err) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <h2 className="hidden md:block text-2xl font-bold text-theme-deep mb-8 border-b border-theme-light/30 pb-4">Profile Settings</h2>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-32 left-1/2 -translate-x-1/2 z-[50] px-6 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}
          >
            {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AUTH DATA SECTION */}
      <div className="bg-white/60 md:bg-slate-50 backdrop-blur-md border border-gray-100 md:border-slate-200 rounded-2xl p-4 md:p-6 mb-4 md:mb-8 shadow-sm">
        <h3 className="text-lg font-bold text-theme-darkest flex items-center gap-2 mb-4 md:mb-6">
          <ShieldCheck className="text-theme-medium" size={20} /> Account Credentials
        </h3>
        <form onSubmit={handleAuthUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Email Address</label>
            <input type="email" value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-white border border-slate-200 md:border-slate-300 px-4 py-3 md:py-2.5 rounded-xl md:rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">New Password</label>
            <input type="password" value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-white border border-slate-200 md:border-slate-300 px-4 py-3 md:py-2.5 rounded-xl md:rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full md:w-auto mt-2 bg-theme-deep text-white px-6 py-3 md:py-2.5 rounded-xl md:rounded-lg font-bold text-sm hover:bg-theme-darkest transition-colors flex justify-center items-center gap-2 cursor-pointer shadow-md md:col-span-2">
            <Save size={16} /> Update Credentials
          </button>
        </form>
      </div>

      {/* PERSONAL DATA SECTION */}
      <div className="bg-white/60 md:bg-slate-50 backdrop-blur-md border border-gray-100 md:border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm mb-4">
        <h3 className="text-lg font-bold text-theme-darkest flex items-center gap-2 mb-4 md:mb-6">
          <User className="text-theme-medium" size={20} /> Personal Information
        </h3>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Full Name</label>
            <input type="text" required value={profileForm.full_name} onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})} className="w-full bg-white border border-slate-200 md:border-slate-300 px-4 py-3 md:py-2.5 rounded-xl md:rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium" placeholder="John Doe" />
          </div>
          
          <div>
            <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Home Address</label>
            <textarea required value={profileForm.home_address} onChange={(e) => setProfileForm({...profileForm, home_address: e.target.value})} rows="2" className="w-full bg-white border border-slate-200 md:border-slate-300 px-4 py-3 md:py-2.5 rounded-xl md:rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium resize-none" placeholder="123 Main St, City" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Work Address (Optional)</label>
            <textarea value={profileForm.work_address} onChange={(e) => setProfileForm({...profileForm, work_address: e.target.value})} rows="2" className="w-full bg-white border border-slate-200 md:border-slate-300 px-4 py-3 md:py-2.5 rounded-xl md:rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium resize-none" placeholder="456 Business Rd, City" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Primary Contact (Mandatory)</label>
              <input type="tel" required value={profileForm.contact_number || ''} onChange={(e) => setProfileForm({...profileForm, contact_number: e.target.value})} className="w-full bg-white border border-slate-200 md:border-slate-300 px-4 py-3 md:py-2.5 rounded-xl md:rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium" placeholder="+94 77 123 4567" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Secondary Contact (Optional)</label>
              <input type="tel" value={profileForm.secondary_contact_number || ''} onChange={(e) => setProfileForm({...profileForm, secondary_contact_number: e.target.value})} className="w-full bg-white border border-slate-200 md:border-slate-300 px-4 py-3 md:py-2.5 rounded-xl md:rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium" placeholder="+94 71 987 6543" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full md:w-auto mt-4 bg-theme-deep text-white px-6 py-3 md:py-2.5 rounded-xl md:rounded-lg font-bold text-sm hover:bg-theme-darkest transition-colors flex justify-center items-center gap-2 cursor-pointer shadow-md">
            <Save size={16} /> Save Profile Data
          </button>
        </form>
      </div>

    </div>
  );
}

// ==========================================
// USER ORDERS COMPONENT
// ==========================================
function UserOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [storeSettings, setStoreSettings] = useState({ name: 'Alexandria Books', address: '', phone: '', email: 'hello@alexandria.lk' });
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [editDeliveryModalOpen, setEditDeliveryModalOpen] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  const [editDeliveryForm, setEditDeliveryForm] = useState({ shipping_address: '', contact_number: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => {
    const fetchOrdersAndSettings = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (quantity, price, books (title))`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setOrders(data);
      
      const { data: settingsData } = await supabase.from('store_settings').select('*').limit(1).single();
      if (settingsData) setStoreSettings(settingsData);

      setLoading(false);
    };

    if (user) fetchOrdersAndSettings();
  }, [user]);

  if (loading) return <div className="py-10 text-center font-bold text-gray-500 animate-pulse">Loading your orders...</div>;

  return (
    <div className="w-full relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-32 left-1/2 -translate-x-1/2 z-[50] px-6 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}
          >
            {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="hidden md:block text-2xl font-bold text-theme-deep mb-8 border-b border-theme-light/30 pb-4">My Orders</h2>
      
      {orders.length === 0 ? (
        <div className="bg-white/60 md:bg-slate-50 backdrop-blur-md border border-slate-100 md:border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <Package className="mx-auto text-theme-medium/50 mb-4" size={48} />
          <p className="text-theme-darkest/60 font-semibold text-lg">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white/80 md:bg-slate-50 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 md:border-slate-200 hover:border-theme-medium/50 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-slate-100 md:border-slate-200 pb-4 gap-4">
                <div>
                  <p className="text-[10px] md:text-xs text-theme-medium font-bold uppercase tracking-wider mb-1">Order ID</p>
                  <p className="font-mono font-bold text-sm bg-white px-2 py-1 rounded-lg border border-slate-100 md:border-slate-200">#{order.display_id || order.id.split('-')[0].toUpperCase()}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] md:text-xs text-theme-darkest/50 font-bold uppercase tracking-wider mb-1">Placed On</p>
                  <p className="text-sm font-semibold">{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] md:text-xs text-theme-darkest/50 font-bold uppercase tracking-wider mb-1">Payment Status</p>
                  <div className={`inline-flex items-center gap-1.5 text-xs md:text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                    order.payment_status === 'Verified' ? 'bg-green-100 text-green-800' : 
                    order.payment_status === 'Rejected' ? 'bg-red-50 text-red-600 border border-red-200' : 
                    'bg-orange-50 text-orange-600 border border-orange-200'
                  }`}>
                    {order.payment_status === 'Verified' && <CheckCircle size={14} />}
                    {order.payment_status === 'Rejected' && <XCircle size={14} />}
                    {order.payment_status === 'Verified' ? 'Payment Verified' : order.payment_status === 'Rejected' ? 'Payment Rejected' : 'Payment Pending'}
                  </div>
                  <div className="mt-2 flex items-center justify-start sm:justify-end gap-1.5">
                     <span className="text-[10px] md:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Order Status:</span>
                     <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${order.order_status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{order.order_status}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-theme-medium mb-2 md:mb-3">Items Purchased</h4>
                <ul className="space-y-2 bg-white/50 md:bg-white p-3 md:p-4 rounded-xl border border-slate-100">
                  {order.order_items.map((item, idx) => (
                    <li key={idx} className="text-xs md:text-sm text-theme-darkest flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <span className="flex-1 line-clamp-1 pr-4">
                        <span className="font-bold text-theme-medium mr-1.5 md:mr-2">{item.quantity}x</span> 
                        {item.books?.title || 'Unknown Book'}
                      </span>
                      <span className="font-bold whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center bg-white/90 md:bg-white p-3 md:p-4 rounded-xl border border-theme-light/30 shadow-inner">
                <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-theme-darkest/50">Total Amount</div>
                <div className="font-bold text-lg md:text-2xl text-theme-deep">{formatPrice(order.total_amount)}</div>
              </div>

              {order.payment_status === 'Rejected' && order.reject_reason && (
                <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                  <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-red-700 mb-1">Action Required: Payment Rejected</h4>
                    <p className="text-sm text-red-600 font-medium">Reason: <span className="font-bold">{order.reject_reason}</span></p>
                    <p className="text-xs text-red-500 mt-2 font-semibold opacity-80">Please contact support or re-upload your payment proof to resolve this issue.</p>
                  </div>
                </div>
              )}

              {order.order_status === 'Shipped' && order.tracking_number && (
                <div className="mt-4 bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                  <div>
                    <h4 className="text-sm font-bold text-theme-deep mb-1">Track Your Package</h4>
                    <p className="text-sm text-gray-700 font-medium">Shipped via {order.tracking_service || 'Courier'} | Tracking No: <span className="font-bold text-black">{order.tracking_number}</span></p>
                  </div>
                  {order.tracking_link && (
                    <a 
                      href={order.tracking_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full md:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Track Order <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              )}

              {(order.order_status === 'Pending' || order.order_status === 'Processing') && (
                <div className="mt-4">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex items-start gap-2 mb-3 shadow-sm">
                    <span className="text-lg leading-none">⚠️</span>
                    <p>You can update your delivery address and mobile number anytime before the order is marked as shipped by the store.</p>
                  </div>
                  <button onClick={() => {
                    setSelectedOrderForEdit(order);
                    setEditDeliveryForm({ shipping_address: order.shipping_address || '', contact_number: order.contact_number || '' });
                    setEditDeliveryModalOpen(true);
                  }} className="w-full bg-white border border-gray-300 hover:border-gray-400 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-colors shadow-sm cursor-pointer">
                    <Edit2 size={18} /> Edit Delivery Info
                  </button>
                </div>
              )}

              <button onClick={() => setSelectedBill(order)} className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-theme-darkest py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-colors border border-slate-200 shadow-sm cursor-pointer">
                <Receipt size={18} /> View Invoice
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedBill && (
        <div className="fixed top-[56px] md:top-[132px] bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm z-[50] flex items-center justify-center p-2 sm:p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto relative print-container text-black">
            {/* Non-printable header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md p-4 border-b border-gray-100 flex justify-between items-center z-10 no-print rounded-t-2xl">
              <h2 className="font-bold text-lg text-theme-deep flex items-center gap-2"><Receipt size={20}/> Order Invoice</h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-theme-deep text-white p-2 rounded-lg hover:bg-theme-darkest transition-colors shadow-sm cursor-pointer"><Printer size={18}/></button>
                <button onClick={() => setSelectedBill(null)} className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"><X size={18}/></button>
              </div>
            </div>
            
            {/* Printable Area */}
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b-2 border-gray-100 gap-4">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-theme-deep mb-1">{storeSettings.name}</h1>
                  <p className="text-sm text-gray-500">{storeSettings.address}</p>
                  <p className="text-sm text-gray-500">{storeSettings.email || 'hello@alexandria.lk'} | {storeSettings.phone}</p>
                </div>
                <div className="text-left sm:text-right">
                  <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider mb-2">Invoice</h2>
                  <p className="text-sm text-gray-600"><strong>Order No:</strong> #{selectedBill.id.slice(0,8).toUpperCase()}</p>
                  <p className="text-sm text-gray-600"><strong>Date:</strong> {new Date(selectedBill.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Customer & Status Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Billed To</h3>
                  <p className="font-bold text-gray-800">{selectedBill.customer_name || user.email}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedBill.shipping_address || 'Store Pickup'}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedBill.contact_number}</p>
                </div>
                <div className="text-left sm:text-right">
                  <h3 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Order Status</h3>
                  <p className="text-sm text-gray-600 mb-1"><strong>Payment:</strong> <span className={selectedBill.payment_status === 'Verified' ? 'text-green-600 font-bold' : 'text-orange-600 font-bold'}>{selectedBill.payment_status}</span></p>
                  <p className="text-sm text-gray-600 mb-1"><strong>Fulfillment:</strong> <span className="font-bold">{selectedBill.order_status}</span></p>
                  {selectedBill.tracking_number && (
                    <p className="text-sm text-gray-600 mt-2"><strong>Tracking:</strong> {selectedBill.tracking_service} ({selectedBill.tracking_number})</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[400px]">
                  <thead>
                    <tr className="border-b-2 border-gray-800 text-gray-800">
                      <th className="py-3 text-xs uppercase tracking-wider">Item Description</th>
                      <th className="py-3 text-xs uppercase tracking-wider text-center">Qty</th>
                      <th className="py-3 text-xs uppercase tracking-wider text-right">Price</th>
                      <th className="py-3 text-xs uppercase tracking-wider text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedBill.order_items.map((item, idx) => (
                      <tr key={idx} className="avoid-break">
                        <td className="py-4 text-sm font-medium text-gray-800 pr-4">{item.books?.title || 'Unknown Book'}</td>
                        <td className="py-4 text-sm text-center text-gray-600">{item.quantity}</td>
                        <td className="py-4 text-sm text-right text-gray-600">{formatPrice(item.price)}</td>
                        <td className="py-4 text-sm text-right font-bold text-gray-800">{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-full sm:w-1/2">
                  <div className="flex justify-between py-2 text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-800">{formatPrice(selectedBill.total_amount - (selectedBill.shipping_fee || 0))}</span>
                  </div>
                  <div className="flex flex-col py-3 border-b border-gray-200 gap-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Delivery Fee</span>
                      <span className="font-medium text-gray-800">{formatPrice(selectedBill.shipping_fee || 0)}</span>
                    </div>
                    {selectedBill.shipping_breakdown && (
                      <div className="mt-1.5 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 leading-relaxed shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                        <span className="font-bold text-gray-400 tracking-wider text-[10px] uppercase block mb-1 border-b border-gray-200 pb-1">Calculation Breakdown</span>
                        {selectedBill.shipping_breakdown}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between py-3 text-lg font-bold text-theme-deep">
                    <span>Grand Total</span>
                    <span>{formatPrice(selectedBill.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-12 pt-8 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-800 mb-1">Thank you for your purchase!</p>
                <p className="text-xs text-gray-500 mb-3">If you have any questions about this invoice, please contact us at {storeSettings.email || 'hello@alexandria.lk'}</p>
                <div className="text-[10px] text-gray-500 italic text-center mt-2 border-t border-gray-200 pt-3">
                  * Delivery fees are based solely on actual postal or courier charges.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editDeliveryModalOpen && selectedOrderForEdit && (
        <div className="fixed top-[56px] md:top-[132px] bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-md p-6 relative">
            <button onClick={() => setEditDeliveryModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 cursor-pointer"><X size={20}/></button>
            <h2 className="text-xl font-bold text-theme-deep mb-2 flex items-center gap-2"><Edit2 size={20}/> Edit Delivery Details</h2>
            <p className="text-sm text-gray-600 mb-6">Update where we should deliver Order #{selectedOrderForEdit.display_id || selectedOrderForEdit.id.split('-')[0].toUpperCase()}.</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-theme-medium font-bold mb-2">Delivery Address</label>
                <textarea 
                  rows="3" 
                  value={editDeliveryForm.shipping_address} 
                  onChange={e => setEditDeliveryForm({...editDeliveryForm, shipping_address: e.target.value})} 
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-theme-medium focus:ring-1 focus:ring-theme-medium resize-none"
                  placeholder="Enter full delivery address"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-theme-medium font-bold mb-2">Mobile Number</label>
                <input 
                  type="tel" 
                  value={editDeliveryForm.contact_number} 
                  onChange={e => setEditDeliveryForm({...editDeliveryForm, contact_number: e.target.value})} 
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-theme-medium focus:ring-1 focus:ring-theme-medium"
                  placeholder="Enter contact number"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setEditDeliveryModalOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-800 font-bold text-sm uppercase tracking-wider cursor-pointer">Cancel</button>
              <button 
                onClick={async () => {
                  const { error } = await supabase.from('orders').update({
                    shipping_address: editDeliveryForm.shipping_address,
                    contact_number: editDeliveryForm.contact_number
                  }).eq('id', selectedOrderForEdit.id);
                  
                  if (!error) {
                    setOrders(orders.map(o => o.id === selectedOrderForEdit.id ? { ...o, ...editDeliveryForm } : o));
                    if (selectedBill && selectedBill.id === selectedOrderForEdit.id) {
                      setSelectedBill({ ...selectedBill, ...editDeliveryForm });
                    }
                    setEditDeliveryModalOpen(false);
                    showToast('Delivery details updated successfully!', 'success');
                  } else {
                    showToast(error.message, 'error');
                  }
                }}
                className="bg-theme-deep text-white px-5 py-2.5 rounded-xl font-bold uppercase text-sm tracking-wider hover:bg-theme-darkest shadow-sm cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
