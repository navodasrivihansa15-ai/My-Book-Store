import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';
import { useState } from 'react';
import StaffPinOverlay from './StaffPinOverlay';

export default function AdminRoute({ children, allowedRoles }) {
  const { user, userRole, loading } = useAuth();
  const [activeStaff, setActiveStaff] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('active_staff')); }
    catch { return null; }
  });

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <div className="w-16 h-16 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold tracking-widest uppercase text-brand-gold flex items-center gap-2">
          <Shield size={20} /> Loading Security...
        </p>
      </div>
    );
  }
  
  if (!user) return <Navigate replace to="/login"/>;
  
  // If user doesn't have the required role
  if (!allowedRoles.includes(userRole)) {
    // Redirect staff to POS if they snoop in unauthorized admin areas
    if (userRole === 'STAFF') return <Navigate replace to="/admin/pos"/>;
    // Kick normal users out
    return <Navigate replace to="/"/>; 
  }

  if (!activeStaff) {
    return <StaffPinOverlay onAuthenticated={(staff) => setActiveStaff(staff)} />;
  }

  return children;
}
