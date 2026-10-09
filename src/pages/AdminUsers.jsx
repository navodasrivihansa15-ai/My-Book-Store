import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ShieldAlert, User, ShieldCheck, UserPlus, ChevronLeft, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminUsers() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ type: '', message: '' });

  useEffect(() => {
    if (userRole === 'STAFF' || userRole === 'USER') {
      navigate('/admin/pos');
      return;
    }

    // Initial fetch
    fetchUsers();

    // Realtime listener
    const rolesChannel = supabase
      .channel('public-user-roles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
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
    // Assuming user_roles has email and created_at columns, or a view is used.
    // In Supabase, usually you join auth.users via a view or RPC if auth.users is protected.
    // For this implementation, we query 'user_roles' directly assuming it stores necessary metadata.
    const { data, error } = await supabase.from('user_roles').select('*').order('created_at', { ascending: false });
    
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
        .from('user_roles')
        .update({ role: newRole })
        .eq('id', targetUserId)
        .select();

      if (error) {
        console.error("🔥 Supabase Update Error:", error);
        showNotification('error', `Failed to update role: ${error.message}`);
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

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-xs">
                  <th className="p-4 font-semibold">User Email</th>
                  <th className="p-4 font-semibold">Current Role</th>
                  <th className="p-4 font-semibold">Joined Date</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-12 text-slate-500">Loading users...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-12 text-slate-500">No users found.</td></tr>
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
                          <div className="font-medium">{targetUser.email || 'N/A'}</div>
                          {isSelf && <span className="text-[10px] text-brand-gold uppercase tracking-widest font-bold mt-1 block">It's You</span>}
                        </td>
                        <td className="p-4">
                          {getRoleBadge(targetUser.role)}
                        </td>
                        <td className="p-4 text-slate-400 text-sm">
                          {targetUser.created_at ? new Date(targetUser.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 flex-wrap">
                            {canPromoteToAdmin && (
                              <button onClick={() => updateRole(targetUser.id, 'ADMIN')} className="bg-blue-500/10 text-blue-500 border border-blue-500/30 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
                                Make Admin
                              </button>
                            )}
                            {canPromoteToStaff && (
                              <button onClick={() => updateRole(targetUser.id, 'STAFF')} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
                                Make Staff
                              </button>
                            )}
                            {canDemoteToStaff && (
                              <button onClick={() => updateRole(targetUser.id, 'STAFF')} className="bg-orange-500/10 text-orange-500 border border-orange-500/30 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
                                Demote to Staff
                              </button>
                            )}
                            {canDemoteToUser && (
                              <button onClick={() => updateRole(targetUser.id, 'USER')} className="bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
                                Demote to User
                              </button>
                            )}
                            
                            {!canPromoteToAdmin && !canPromoteToStaff && !canDemoteToStaff && !canDemoteToUser && (
                              <span className="text-slate-600 text-xs uppercase tracking-widest font-semibold px-2 mt-1 block">
                                {isSelf ? 'No Actions Available' : isTargetOwner ? 'Protected' : 'No Actions Available'}
                              </span>
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
      </div>
    </div>
  );
}
