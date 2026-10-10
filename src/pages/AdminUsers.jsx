import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ShieldAlert, User, ShieldCheck, UserPlus, ChevronLeft, AlertTriangle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import DigitalRecordBook from '../components/DigitalRecordBook';

export default function AdminUsers() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [activeTab, setActiveTab] = useState('users');
  
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceIdInput, setDeviceIdInput] = useState('');
  const [deviceNameInput, setDeviceNameInput] = useState('');

  useEffect(() => {
    if (userRole === 'STAFF' || userRole === 'USER') {
      navigate('/admin/pos');
      return;
    }

    // Initial fetch
    fetchUsers();

    // Realtime listener
    const rolesChannel = supabase
      .channel('public-user-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        (payload) => {
          console.log("⚡ Realtime Payload Received:", payload);
          // CRITICAL: Call the function that updates your React state (e.g., setUsers)
          fetchUsers(); 
        }
      )
      .subscribe((status, err) => {
        console.log("📶 Realtime Connection Status:", status);
        if (err) console.error("Realtime Subscription Error:", err);
      });

    return () => {
      supabase.removeChannel(rolesChannel);
    };
  }, [userRole, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    // Assuming user_profiles has email and created_at columns, or a view is used.
    // In Supabase, usually you join auth.users via a view or RPC if auth.users is protected.
    // For this implementation, we query 'user_profiles' directly assuming it stores necessary metadata.
    const { data, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching users:", error);
      showNotification('error', "Could not load users.");
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 3000);
  };

  const updateRole = async (targetUserId, newRole) => {
    try {
      // Execute the update query
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', targetUserId)
        .select();

      if (error) {
        console.error("🔥 Supabase Update Error:", error);
        showNotification('error', `Failed to update role: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        console.warn("Update failed silently. Probably blocked by Row Level Security (RLS) in Supabase.");
        showNotification('error', "Update blocked! Please add an UPDATE policy for user_profiles in Supabase.");
        return;
      }

      console.log("Role updated successfully:", data);
      showNotification('success', `User successfully updated to ${newRole}`);
      // Optional fallback: call fetchUsers() here just in case Realtime is slow
      fetchUsers(); 
      
    } catch (err) {
      console.error("Unexpected error during update:", err);
      showNotification('error', "Unexpected error occurred");
    }
  };

  const updateDevice = async (e) => {
    e.preventDefault();
    if (!editingDevice) return;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ device_id: deviceIdInput, device_name: deviceNameInput })
        .eq('id', editingDevice.id);

      if (error) throw error;
      
      // Cascade update to sessions so the Owner Vault instantly reflects the new device info
      if (editingDevice.full_name) {
        await supabase
          .from('staff_sessions')
          .update({ device_id: deviceIdInput, device_name: deviceNameInput })
          .eq('staff_name', editingDevice.full_name);
      }
      
      showNotification('success', 'Device successfully assigned.');
      setEditingDevice(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Failed to assign device.');
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'OWNER':
        return <span className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase"><ShieldAlert size={14}/> OWNER</span>;
      case 'ADMIN':
        return <span className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase"><ShieldCheck size={14}/> ADMIN</span>;
      case 'STAFF':
        return <span className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase"><User size={14}/> STAFF</span>;
      default:
        return <span className="flex items-center gap-1 bg-slate-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase"><User size={14}/> USER</span>;
    }
  };

  // Block rendering if STAFF or USER somehow bypassed redirect
  if (userRole === 'STAFF' || userRole === 'USER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-gray-400">You do not have permission to view this page.</p>
          <Link to="/admin" className="mt-6 inline-block bg-brand-gold text-black px-6 py-2 rounded-lg font-bold">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      {notification.message && (
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 whitespace-nowrap ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
          {notification.message}
        </motion.div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 hover:bg-slate-800 rounded-full transition-colors"><ChevronLeft size={24} className="text-gray-400" /></Link>
            <div>
              <h1 className="text-3xl font-bold tracking-widest text-brand-gold uppercase flex items-center gap-3">
                <Shield size={32} /> User Management
              </h1>
              <p className="text-slate-400 mt-1">Manage system access and role-based permissions</p>
            </div>
          </div>
          {['OWNER', 'ADMIN'].includes(userRole) && (
            <button className="bg-brand-gold text-black px-4 py-2 flex items-center gap-2 rounded-lg font-bold hover:bg-yellow-500 transition-colors">
              <UserPlus size={18} /> Invite New User
            </button>
          )}
        </div>

        {userRole === 'OWNER' && (
          <div className="flex items-center gap-4 mb-8 border-b-2 border-slate-800 pb-0">
            <button 
              onClick={() => setActiveTab('users')} 
              className={`pb-3 px-4 text-sm font-black uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'users' ? 'border-brand-gold text-brand-gold bg-brand-gold/10' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              User Management
            </button>
            <button 
              onClick={() => setActiveTab('vault')} 
              className={`pb-3 px-4 text-sm font-black uppercase tracking-widest transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'vault' ? 'border-brand-gold text-brand-gold bg-brand-gold/10' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Shield size={16}/> 🛡️ Store Audit & Activity Logs
            </button>
          </div>
        )}

        {activeTab === 'users' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-xs">
                  <th className="p-4 font-semibold">User Email</th>
                  <th className="p-4 font-semibold">Current Role</th>
                  <th className="p-4 font-semibold">Assigned Device</th>
                  <th className="p-4 font-semibold">Joined Date</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-12 text-slate-500">Loading users...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-12 text-slate-500">No users found.</td></tr>
                ) : (
                  users.map((targetUser) => {
                    const isSelf = targetUser.email === user?.email || targetUser.id === user?.id;
                    const isTargetOwner = targetUser.role === 'OWNER';
                    
                    // RBAC Logics
                    let canPromoteToAdmin = false;
                    let canPromoteToStaff = false;
                    let canDemoteToStaff = false;
                    let canDemoteToUser = false;

                    const tRole = targetUser.role || 'USER';

                    if (userRole === 'OWNER') {
                      if (!isSelf) {
                        if (tRole === 'USER') { canPromoteToStaff = true; canPromoteToAdmin = true; }
                        if (tRole === 'STAFF') { canDemoteToUser = true; canPromoteToAdmin = true; }
                        if (tRole === 'ADMIN') { canDemoteToStaff = true; canDemoteToUser = true; }
                      }
                    } else if (userRole === 'ADMIN') {
                      if (!isTargetOwner && !isSelf) {
                        if (tRole === 'USER') { canPromoteToStaff = true; }
                        if (tRole === 'STAFF') { canDemoteToUser = true; canPromoteToAdmin = true; }
                      }
                    }

                    return (
                      <tr key={targetUser.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium">{targetUser.email || targetUser.full_name || 'N/A'}</div>
                          {isSelf && <span className="text-[10px] text-brand-gold uppercase tracking-widest font-bold mt-1 block">It's You</span>}
                        </td>
                        <td className="p-4">
                          {getRoleBadge(targetUser.role)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-mono text-slate-300">{targetUser.device_id || 'UNASSIGNED'}</span>
                            {targetUser.device_name && <span className="text-[10px] text-slate-500 uppercase">{targetUser.device_name}</span>}
                          </div>
                        </td>
                        <td className="p-4 text-slate-400 text-sm">
                          {targetUser.created_at ? new Date(targetUser.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 flex-wrap">
                            {canPromoteToAdmin && (
                              <button onClick={() => updateRole(targetUser.id, 'ADMIN')} className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all">
                                Make Admin
                              </button>
                            )}
                            {canPromoteToStaff && (
                              <button onClick={() => updateRole(targetUser.id, 'STAFF')} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(5,150,105,0.3)] hover:shadow-[0_0_20px_rgba(5,150,105,0.5)] px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all">
                                Make Staff
                              </button>
                            )}
                            {canDemoteToStaff && (
                              <button onClick={() => updateRole(targetUser.id, 'STAFF')} className="bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_20px_rgba(234,88,12,0.5)] px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all">
                                Demote to Staff
                              </button>
                            )}
                            {canDemoteToUser && (
                              <button onClick={() => updateRole(targetUser.id, 'USER')} className="bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all">
                                Demote to User
                              </button>
                            )}
                            
                            {!canPromoteToAdmin && !canPromoteToStaff && !canDemoteToStaff && !canDemoteToUser && (
                              <span className="text-slate-600 text-xs uppercase tracking-widest font-semibold px-2 block">
                                {isSelf ? 'No Actions Available' : isTargetOwner ? 'Protected' : 'No Actions Available'}
                              </span>
                            )}
                            
                            {(userRole === 'OWNER' || userRole === 'ADMIN') && (
                              <button 
                                onClick={() => {
                                  setEditingDevice(targetUser);
                                  setDeviceIdInput(targetUser.device_id || '');
                                  setDeviceNameInput(targetUser.device_name || '');
                                }} 
                                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(51,65,85,0.5)]"
                              >
                                Assign Device
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        ) : (
          <DigitalRecordBook />
        )}
      </div>

      {/* Device Assignment Modal */}
      {editingDevice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-white mb-2">Assign POS Device</h3>
            <p className="text-slate-400 text-sm mb-6">Assigning device to <strong className="text-white">{editingDevice.full_name || editingDevice.email}</strong></p>
            <form onSubmit={updateDevice} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Device ID (e.g. PC-01)</label>
                <input 
                  type="text" 
                  value={deviceIdInput} 
                  onChange={(e) => setDeviceIdInput(e.target.value)} 
                  placeholder="PC-01" 
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-brand-gold font-mono"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">Device Name/Model</label>
                <input 
                  type="text" 
                  value={deviceNameInput} 
                  onChange={(e) => setDeviceNameInput(e.target.value)} 
                  placeholder="Main Counter Lenovo" 
                  required
                  className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-brand-gold"
                />
              </div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setEditingDevice(null)} className="flex-1 py-3 text-slate-400 hover:text-white font-bold uppercase tracking-wider text-sm transition-colors border border-slate-700 hover:border-slate-500 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-gold text-black font-bold uppercase tracking-wider text-sm transition-colors hover:bg-yellow-500 rounded-lg">Save Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
