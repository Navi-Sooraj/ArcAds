import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { userDarkTheme as theme, adminDarkTheme } from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import OwnerLayout from './components/OwnerLayout';
import AdvertiserLayout from './components/AdvertiserLayout';
import MarketplaceLayout from './components/MarketplaceLayout';
import DynamicRoleLayout from './components/DynamicRoleLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BackgroundMedia from './components/BackgroundMedia';
import { BackgroundProvider } from './context/BackgroundContext';
import AdvertiserDashboard from './pages/AdvertiserDashboard';
import MyBookings from './pages/advertiser/MyBookings';
import UserDashboard from './pages/advertiser/UserDashboard';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import AddAdSpacePage from './pages/owner/AddAdSpacePage';
import MyListingsPage from './pages/owner/MyListingsPage';
import AdminDashboardHome from './pages/admin/AdminDashboardHome';
import UsersManagement from './pages/admin/UsersManagement';
import PendingUsers from './pages/admin/PendingUsers';
import AdSpacesManagement from './pages/admin/AdSpacesManagement';
import BookingsOverview from './pages/admin/BookingsOverview';
// import TemplatesManagement from './pages/admin/TemplatesManagement';
import Marketplace from './pages/Marketplace';
import AdSpaceDetails from './pages/AdSpaceDetails';
import BookingPage from './pages/BookingPage';
import Profile from './pages/Profile';
// import AIDesignCanvas from './pages/AIDesignCanvas'; /* Re-enable for /ai-canvas and /advertiser/ai-canvas */
import AboutUs from './pages/AboutUs';
import AdServices from './pages/AdServices';
import AdCenter from './pages/admin/AdCenter';

function PrivateRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'space_owner') return <Navigate to="/owner" replace />;
    return <Navigate to="/advertiser" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<Layout><AboutUs /></Layout>} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/marketplace" element={<Layout><DynamicRoleLayout><Marketplace /></DynamicRoleLayout></Layout>} />
      <Route path="/ad-services/:categorySlug?" element={<Layout><DynamicRoleLayout><AdServices /></DynamicRoleLayout></Layout>} />
      <Route path="/ad-space/:id" element={<Layout><AdSpaceDetails /></Layout>} />
      <Route path="/book/:adSpaceId" element={<Layout><BookingPage /></Layout>} />
      <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
      {/* <Route path="/ai-canvas" element={<PrivateRoute><Layout><AIDesignCanvas /></Layout></PrivateRoute>} /> */}
      <Route path="/advertiser" element={<PrivateRoute allowedRoles={['advertiser']}><Layout><AdvertiserLayout><AdvertiserDashboard /></AdvertiserLayout></Layout></PrivateRoute>} />
      <Route path="/advertiser/dashboard" element={<PrivateRoute allowedRoles={['advertiser']}><Layout><AdvertiserLayout><UserDashboard /></AdvertiserLayout></Layout></PrivateRoute>} />
      <Route path="/advertiser/bookings" element={<PrivateRoute allowedRoles={['advertiser']}><Layout><AdvertiserLayout><MyBookings /></AdvertiserLayout></Layout></PrivateRoute>} />
      {/* <Route path="/advertiser/ai-canvas" element={<PrivateRoute allowedRoles={['advertiser']}><Layout><AdvertiserLayout><AIDesignCanvas /></Layout></PrivateRoute>} /> */}
      <Route path="/advertiser/book/:adSpaceId" element={<PrivateRoute allowedRoles={['advertiser']}><Layout><AdvertiserLayout><BookingPage /></AdvertiserLayout></Layout></PrivateRoute>} />
      <Route path="/advertiser/ad-space/:id" element={<PrivateRoute allowedRoles={['advertiser']}><Layout><AdvertiserLayout><AdSpaceDetails /></AdvertiserLayout></Layout></PrivateRoute>} />
      <Route path="/advertiser/profile" element={<PrivateRoute allowedRoles={['advertiser']}><Layout><AdvertiserLayout><Profile /></AdvertiserLayout></Layout></PrivateRoute>} />
      <Route path="/owner" element={<PrivateRoute allowedRoles={['space_owner']}><Layout><OwnerLayout><OwnerDashboard /></OwnerLayout></Layout></PrivateRoute>} />
      <Route path="/owner/add" element={<PrivateRoute allowedRoles={['space_owner']}><Layout><OwnerLayout><AddAdSpacePage /></OwnerLayout></Layout></PrivateRoute>} />
      <Route path="/owner/listings" element={<PrivateRoute allowedRoles={['space_owner']}><Layout><OwnerLayout><MyListingsPage /></OwnerLayout></Layout></PrivateRoute>} />
      <Route path="/owner/profile" element={<PrivateRoute allowedRoles={['space_owner']}><Layout><OwnerLayout><Profile /></OwnerLayout></Layout></PrivateRoute>} />
      {/* Admin Routes with Dark Theme */}
      <Route
        path="/admin/*"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <ThemeProvider theme={adminDarkTheme}>
              <CssBaseline />
              <Layout>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminDashboardHome />} />
                    <Route path="users" element={<UsersManagement />} />
                    <Route path="vendor-management" element={<PendingUsers />} />
                    <Route path="pending-users" element={<PendingUsers />} />
                    <Route path="adspaces" element={<AdSpacesManagement />} />
                    <Route path="ad-center" element={<AdCenter />} />
                    <Route path="bookings" element={<BookingsOverview />} />
                    <Route path="profile" element={<Profile />} />
                  </Routes>
                </AdminLayout>
              </Layout>
            </ThemeProvider>
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <BackgroundProvider>
              <BackgroundMedia />
              <AppRoutes />
            </BackgroundProvider>
          </BrowserRouter>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
