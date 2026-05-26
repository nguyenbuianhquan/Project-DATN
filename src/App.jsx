import './App.css';
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Nav from './Components/Nav/Nav';
import TourListPage from './Components/Pages/Tours';
import HotelDetailPage from './Components/Pages/Hotels';
import TransportDetailPage from './Components/Pages/Transports';
import ContactSection from './Components/Pages/Contact';
import BlogSection from './Components/Pages/Blog';
import Restaurants from './Components/Pages/Restaurant';
import CartPage from './Components/Pages/Cart';
import CheckoutPage from './Components/Pages/ConfirmYourBooking';
import PaymentPage from './Components/Pages/PaymentPage';
import CheckoutUnified from './Components/Pages/CheckoutUnified';
import BookingConfirmation from "./Components/Pages/Tour_Booking_Summery";
import Footer from './Components/Footer/Footer';
import About from './Components/Pages/About';
import TourDetailPage from './Components/Pages/TourDetail';
import HotelDetail from './Components/Pages/HotelDetail';
import HotelRoomSelect from './Components/Pages/HotelRoomSelect';
import TransportDetail from './Components/Pages/TransportDetail';
import RestaurantDetail from './Components/Pages/RestaurantDetail';
import Index from './Components/Pages/Index';
import AuthPage from './Components/Pages/AuthPage';
import Account from './Components/Pages/Account';
import UserDatabase from './Components/Pages/UserDatabase';
import AdminPanel from './Components/Pages/AdminPanel';
import ResetPasswordPage from './Components/Pages/ResetPasswordPage';
import { GuestOnlyRoute, ProtectedRoute } from './Components/Auth/ProtectedRoute';
import { AdminProvider } from './Context/AdminContext';

function AppLayout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  const isAuth  = pathname === '/signin' || pathname === '/signup' || pathname === '/reset-password';
  const hideChrome = isAdmin || isAuth;

  // ── Scroll to top on every route change (web standard) ──
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  useEffect(() => {
    document.title = isAdmin ? 'Admin' : 'DAYTRIP';
  }, [isAdmin]);

  return (
    <>
      {!hideChrome && <Nav />}
      <main className={!hideChrome ? "site-main" : undefined}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/signin"
          element={
            <GuestOnlyRoute>
              <AuthPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnlyRoute>
              <AuthPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/database"
          element={
            <ProtectedRoute requireAdmin>
              <UserDatabase />
            </ProtectedRoute>
          }
        />
        {/* Admin panel has its own isolated session — no ProtectedRoute */}
        <Route
          path="/admin"
          element={
            <AdminProvider>
              <AdminPanel />
            </AdminProvider>
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/TourDetails/:id" element={<TourDetailPage />} />
        <Route path="/hotels/:id" element={<HotelDetail />} />
        <Route path="/hotels/:id/rooms" element={<HotelRoomSelect />} />
        <Route path="/transport/:id" element={<TransportDetail />} />
        <Route path="/restaurants/:id" element={<RestaurantDetail />} />
        <Route path="/cart" element={<CartPage />} />
        {/* Trang checkout mới – kết hợp thông tin + thanh toán */}
        <Route path="/checkout" element={<CheckoutUnified />} />
        {/* Giữ lại route cũ để backward compat */}
        <Route path="/booking-info" element={<CheckoutPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/Tour_Booking_Summery" element={<BookingConfirmation />} />
        <Route path="/tours" element={<TourListPage />} />
        <Route path="/hotels" element={<HotelDetailPage />} />
        <Route path="/transport" element={<TransportDetailPage />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<BlogSection />} />
        <Route path="/contact" element={<ContactSection />} />
      </Routes>
      </main>
      {!hideChrome && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
