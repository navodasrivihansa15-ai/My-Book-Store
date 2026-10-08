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
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return null; // Handled by AuthContext global loading state
  
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  // Replace with actual admin email
  if (!user || user.email !== 'navodasrivihansa15@gmail.com') {
    return <Navigate to="/" replace />;
  }
  
  return children;
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
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="relative min-h-screen flex flex-col w-full">
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-slate-900 via-slate-800 to-transparent -z-10 pointer-events-none"></div>
        <Navbar />
        <SubNavbar />
        <main className="flex-grow pt-16 md:pt-36 pb-20 md:pb-12 px-2 md:px-4 w-[96%] max-w-[1440px] mx-auto relative z-0">
          <AnimatedRoutes />
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
