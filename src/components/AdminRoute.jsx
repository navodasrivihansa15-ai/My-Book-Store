import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

export default function AdminRoute({ children }) {
  const { user, userRole, loading } = useAuth();

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
  
  // Kick out normal users and STAFF from the main admin routes
  if (userRole !== 'OWNER' && userRole !== 'ADMIN') return <Navigate replace to="/"/>; 

  return children;
}
