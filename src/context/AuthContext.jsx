import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId, userEmail) => {
    if (!userId) {
      setUserRole(null);
      return;
    }
    const { data, error } = await supabase.from('user_roles').select('role').eq('id', userId).single();
    if (error || !data) {
      console.error("Error fetching user role", error);
      if (userEmail === 'navodasrivihansa15@gmail.com') {
        setUserRole('OWNER');
      } else {
        setUserRole('CUSTOMER');
      }
    } else {
      setUserRole(data.role || 'CUSTOMER');
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchRole(currentUser.id, currentUser.email);
      }
      setLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchRole(currentUser.id, currentUser.email);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, loading }}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen w-screen flex items-center justify-center bg-brand-black text-brand-gold fixed inset-0 z-50"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
              <h2 className="text-2xl font-serif tracking-widest uppercase text-brand-gold-light">Curating</h2>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex-grow flex flex-col w-full min-h-screen"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
