import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Landing from '../pages/Landing';
import Browse from '../pages/Browse';
import ListingDetail from '../pages/ListingDetail';
import DonorDashboard from '../pages/DonorDashboard';
import RecipientDashboard from '../pages/RecipientDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import Auth from '../pages/Auth';
import About from '../pages/About';
import NotificationsPage from '../pages/NotificationsPage';
import ProfilePage from '../pages/ProfilePage';
import AnalyticsPage from '../pages/AnalyticsPage';
import MapPage from '../pages/MapPage';
import DonorFoodCreate from '../pages/DonorFoodCreate';
import InventoryPage from '../pages/InventoryPage';
import InventoryHistoryPage from '../pages/InventoryHistoryPage';
import ScheduledDonations from '../pages/ScheduledDonations';
import DonorQR from '../pages/DonorQR';
import DonorQRPage from '../pages/DonorQRPage';
import NgoScanner from '../pages/NgoScanner';
import V2AnalyticsPage from '../pages/V2AnalyticsPage';
import ProtectedRoute from '../components/shared/ProtectedRoute';

export default function AppRouter() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"           element={<Landing />} />
        <Route path="/browse"     element={<Browse />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/auth"       element={<Auth />} />
        <Route path="/about"      element={<About />} />
        <Route path="/map"        element={<MapPage />} />

        <Route path="/donor" element={
          <ProtectedRoute allowedRoles={['DONOR']}>
            <DonorDashboard />
          </ProtectedRoute>
        } />

        {/* V2 donor pages */}
        <Route path="/donor/food/new" element={
          <ProtectedRoute allowedRoles={['DONOR']}><DonorFoodCreate /></ProtectedRoute>
        } />
        <Route path="/donor/inventory" element={
          <ProtectedRoute allowedRoles={['DONOR']}><InventoryPage /></ProtectedRoute>
        } />
        <Route path="/donor/inventory/history" element={
          <ProtectedRoute allowedRoles={['DONOR']}><InventoryHistoryPage /></ProtectedRoute>
        } />
        <Route path="/donor/scheduled" element={
          <ProtectedRoute allowedRoles={['DONOR']}><ScheduledDonations /></ProtectedRoute>
        } />
        <Route path="/donor/donations/:id/qr" element={
          <ProtectedRoute allowedRoles={['DONOR']}><DonorQR /></ProtectedRoute>
        } />
        <Route path="/donor/qr" element={
          <ProtectedRoute allowedRoles={['DONOR']}><DonorQRPage /></ProtectedRoute>
        } />

        <Route path="/ngo" element={
          <ProtectedRoute allowedRoles={['NGO']}>
            <RecipientDashboard />
          </ProtectedRoute>
        } />

        {/* V2 NGO pages */}
        <Route path="/ngo/scan" element={
          <ProtectedRoute allowedRoles={['NGO']}><NgoScanner /></ProtectedRoute>
        } />
        <Route path="/ngo/scheduled" element={
          <ProtectedRoute allowedRoles={['NGO']}><ScheduledDonations /></ProtectedRoute>
        } />

        {/* Backwards-compatible alias for the old /recipient route */}
        <Route path="/recipient" element={<Navigate to="/ngo" replace />} />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AnalyticsPage />
          </ProtectedRoute>
        } />

        {/* V2 admin analytics */}
        <Route path="/admin/v2" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <V2AnalyticsPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
