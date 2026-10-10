import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import SubNavbar from './components/SubNavbar';
import BottomNav from './components/BottomNav';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import AllBooks from './pages/AllBooks';
import Publishers from './pages/Publishers';
import Authors from './pages/Authors';
import Offers from './pages/Offers';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyAccount from './pages/MyAccount';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import BookDetails from './pages/BookDetails';
import ProfilePage from './pages/ProfilePage';
import MobileExplore from './pages/MobileExplore';
import POS from './pages/POS';
import Scanner from './pages/Scanner';
import AdminUsers from './pages/AdminUsers';
import AdminRoute from './components/AdminRoute';
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return null; // Handled by AuthContext global loading state
  
  return user ? children : <Navigate to="/login" replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<AllBooks />} />
        <Route path="/publishers" element={<Publishers />} />
        <Route path="/authors" element={<Authors />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
        <Route path="/account" element={<PrivateRoute><MyAccount /></PrivateRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/book/:id" element={<BookDetails />} />
        <Route path="/author/:name" element={<ProfilePage type="author" />} />
        <Route path="/translator/:name" element={<ProfilePage type="translator" />} />
        <Route path="/publishers/:name" element={<ProfilePage type="publisher" />} />
        <Route path="/admin" element={<AdminRoute allowedRoles={['OWNER', 'ADMIN']}><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/pos" element={<AdminRoute allowedRoles={['OWNER', 'ADMIN', 'STAFF']}><POS /></AdminRoute>} />
        <Route path="/admin/scanner" element={<Scanner />} />
        <Route path="/admin/users" element={<AdminRoute allowedRoles={['OWNER', 'ADMIN']}><AdminUsers /></AdminRoute>} />
        <Route path="/explore" element={<MobileExplore />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppLayout() {
  const location = useLocation();
  const isAdminStandalone = location.pathname.startsWith('/admin/pos') || location.pathname.startsWith('/admin/scanner') || location.pathname.startsWith('/admin/users');

  if (isAdminStandalone) {
    return <AnimatedRoutes />;
  }

  return (
    <div className="relative min-h-screen flex flex-col w-full">
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-slate-900 via-slate-800 to-transparent -z-10 pointer-events-none"></div>
      <Navbar />
      <SubNavbar />
      <main className="flex-grow pt-24 md:pt-36 pb-20 md:pb-12 px-2 md:px-4 w-[96%] max-w-[1440px] mx-auto relative z-0">
        <AnimatedRoutes />
      </main>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
