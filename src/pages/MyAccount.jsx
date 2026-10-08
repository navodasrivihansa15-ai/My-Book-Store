import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function MyAccount() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            books (title)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setOrders(data);
      setLoading(false);
    };

    if (user) fetchOrders();
  }, [user]);

  if (loading) return <div className="text-center py-10">Loading account...</div>;

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-theme-deep mb-8 border-b border-theme-light/30 pb-4">My Account</h1>
      
      <h2 className="text-2xl font-bold text-theme-deep mb-6">Order History</h2>
      {orders.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center shadow-sm">
          <p className="text-theme-darkest/60 font-semibold">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4 border-b pb-4">
                <div>
                  <p className="text-sm text-theme-medium font-bold uppercase tracking-wider mb-1">Order #{order.id.slice(0,8)}</p>
                  <p className="text-sm text-theme-darkest/70">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-theme-deep mb-1">LKR {order.total_amount.toFixed(2)}</p>
                  <p className={`text-sm font-bold ${order.order_status === 'Shipped' ? 'text-green-600' : 'text-theme-medium'}`}>
                    Status: {order.order_status}
                  </p>
                  <p className="text-sm text-theme-darkest/70">Payment: {order.payment_status}</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-3 text-theme-deep">Items:</h4>
                <ul className="space-y-2">
                  {order.order_items.map((item, idx) => (
                    <li key={idx} className="text-sm text-theme-darkest flex justify-between border-b border-slate-200 pb-2 last:border-0">
                      <span><span className="font-bold text-theme-medium mr-2">{item.quantity}x</span> {item.books?.title || 'Unknown Book'}</span>
                      <span className="font-bold">LKR {(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
