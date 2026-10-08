import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { User, Package, ShieldCheck, Phone, Save, Edit2, CheckCircle, XCircle, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '../lib/utils';

export default function MyAccount() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'orders'

  if (!user) return <div className="text-center py-20 text-xl font-bold">Please log in to view this page.</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 md:py-12 px-4 flex flex-col md:flex-row gap-8 min-h-[70vh]">
      
      {/* Mobile Top Tabs / Desktop Left Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm md:sticky md:top-24 flex flex-row md:flex-col gap-2 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap flex-1 md:flex-none ${
              activeTab === 'profile' 
                ? 'bg-theme-medium text-white shadow-md' 
                : 'text-theme-darkest/70 hover:bg-slate-100 hover:text-theme-deep'
            }`}
          >
            <User size={18} /> Profile Settings
          </button>
          
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap flex-1 md:flex-none ${
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
      <main className="flex-grow bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-10">
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
      <h2 className="text-2xl font-bold text-theme-deep mb-8 border-b border-theme-light/30 pb-4">Profile Settings</h2>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-32 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}
          >
            {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AUTH DATA SECTION */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
        <h3 className="text-lg font-bold text-theme-darkest flex items-center gap-2 mb-6">
          <ShieldCheck className="text-theme-medium" size={20} /> Account Credentials
        </h3>
        <form onSubmit={handleAuthUpdate} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Email Address</label>
            <input type="email" value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-white border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">New Password (Leave blank to keep current)</label>
            <input type="password" value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-white border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="mt-2 bg-theme-deep text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-theme-darkest transition-colors flex items-center gap-2 cursor-pointer shadow-md">
            <Save size={16} /> Update Credentials
          </button>
        </form>
      </div>

      {/* PERSONAL DATA SECTION */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-theme-darkest flex items-center gap-2 mb-6">
          <User className="text-theme-medium" size={20} /> Personal Information
        </h3>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Full Name</label>
            <input type="text" required value={profileForm.full_name} onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})} className="w-full bg-white border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium" placeholder="John Doe" />
          </div>
          
          <div>
            <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Home Address</label>
            <textarea required value={profileForm.home_address} onChange={(e) => setProfileForm({...profileForm, home_address: e.target.value})} rows="2" className="w-full bg-white border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium resize-none" placeholder="123 Main St, City" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Work Address (Optional)</label>
            <textarea value={profileForm.work_address} onChange={(e) => setProfileForm({...profileForm, work_address: e.target.value})} rows="2" className="w-full bg-white border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium resize-none" placeholder="456 Business Rd, City" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Primary Contact (Mandatory)</label>
              <input type="tel" required value={profileForm.contact_number || ''} onChange={(e) => setProfileForm({...profileForm, contact_number: e.target.value})} className="w-full bg-white border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium" placeholder="+94 77 123 4567" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-theme-medium mb-2 font-bold">Secondary Contact (Optional)</label>
              <input type="tel" value={profileForm.secondary_contact_number || ''} onChange={(e) => setProfileForm({...profileForm, secondary_contact_number: e.target.value})} className="w-full bg-white border border-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-medium" placeholder="+94 71 987 6543" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="mt-4 bg-theme-deep text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-theme-darkest transition-colors flex items-center gap-2 cursor-pointer shadow-md">
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items (quantity, price, books (title))`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setOrders(data);
      setLoading(false);
    };

    if (user) fetchOrders();
  }, [user]);

  if (loading) return <div className="py-10 text-center font-bold text-gray-500 animate-pulse">Loading your orders...</div>;

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-theme-deep mb-8 border-b border-theme-light/30 pb-4">My Orders</h2>
      
      {orders.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center shadow-sm">
          <Package className="mx-auto text-theme-medium/50 mb-4" size={48} />
          <p className="text-theme-darkest/60 font-semibold text-lg">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-slate-50 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 hover:border-theme-medium/50 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-slate-200 pb-4 gap-4">
                <div>
                  <p className="text-xs text-theme-medium font-bold uppercase tracking-wider mb-1">Order ID</p>
                  <p className="font-mono font-bold text-sm bg-white px-2 py-1 rounded border border-slate-200">#{order.id.slice(0,8)}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-theme-darkest/50 font-bold uppercase tracking-wider mb-1">Placed On</p>
                  <p className="text-sm font-semibold">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-theme-darkest/50 font-bold uppercase tracking-wider mb-1">Status</p>
                  <p className={`text-sm font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    order.order_status === 'Shipped' ? 'bg-green-100 text-green-700' : 'bg-theme-light/20 text-theme-deep'
                  }`}>
                    {order.order_status}
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-theme-medium mb-3">Items Purchased</h4>
                <ul className="space-y-2 bg-white p-4 rounded-lg border border-slate-100">
                  {order.order_items.map((item, idx) => (
                    <li key={idx} className="text-sm text-theme-darkest flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <span className="flex-1 line-clamp-1 pr-4">
                        <span className="font-bold text-theme-medium mr-2">{item.quantity}x</span> 
                        {item.books?.title || 'Unknown Book'}
                      </span>
                      <span className="font-bold whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-theme-light/30 shadow-inner">
                <div className="text-xs font-bold uppercase tracking-widest text-theme-darkest/50">Total Amount</div>
                <div className="font-bold text-xl md:text-2xl text-theme-deep">{formatPrice(order.total_amount)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
