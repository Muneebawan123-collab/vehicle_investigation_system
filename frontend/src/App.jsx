import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';

// Auth & Context
import PrivateRoute from './components/routing/PrivateRoute';

// Layouts
import DashboardLayout from './components/layouts/DashboardLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Public Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Pages - Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Protected Pages - Vehicle
import VehiclesListPage from './pages/vehicles/VehiclesListPage';
import VehicleRegistrationPage from './pages/vehicles/VehicleRegistrationPage';
import VehicleDetailsPage from './pages/vehicles/VehicleDetailsPage';
import VehicleEditPage from './pages/vehicles/VehicleEditPage';

// Protected Pages - Incidents
import IncidentsListPage from './pages/incidents/IncidentsListPage';
import IncidentCreatePage from './pages/incidents/IncidentCreatePage';
import IncidentDetailsPage from './pages/incidents/IncidentDetailsPage';
import IncidentEditPage from './pages/incidents/IncidentEditPage';

// Protected Pages - Documents
import DocumentsListPage from './pages/documents/DocumentsListPage';
import DocumentUploadPage from './pages/documents/DocumentUploadPage';
import DocumentDetailsPage from './pages/documents/DocumentDetailsPage';

// Protected Pages - Profile & Admin
import UserProfilePage from './pages/profile/UserProfilePage';
import EditProfilePage from './pages/profile/EditProfilePage';
import UsersManagementPage from './pages/admin/UsersManagementPage';
import SystemLogsPage from './pages/admin/SystemLogsPage';
import SettingsPage from './pages/admin/SettingsPage';

// Utils & Helpers
import ScrollToTop from './utils/ScrollToTop';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  // Theme preference from system
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  // State for theme mode
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode !== null ? JSON.parse(savedMode) : prefersDarkMode;
  });

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Create theme
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: [
        'Poppins',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<DashboardLayout darkMode={darkMode} setDarkMode={setDarkMode} />}>
              {/* Dashboard */}
              <Route index element={<DashboardPage />} />
              
              {/* Vehicles */}
              <Route path="vehicles">
                <Route index element={<VehiclesListPage />} />
                <Route path="register" element={<VehicleRegistrationPage />} />
                <Route path=":id" element={<VehicleDetailsPage />} />
                <Route path=":id/edit" element={<VehicleEditPage />} />
              </Route>
              
              {/* Incidents */}
              <Route path="incidents">
                <Route index element={<IncidentsListPage />} />
                <Route path="create" element={<IncidentCreatePage />} />
                <Route path=":id" element={<IncidentDetailsPage />} />
                <Route path=":id/edit" element={<IncidentEditPage />} />
              </Route>
              
              {/* Documents */}
              <Route path="documents">
                <Route index element={<DocumentsListPage />} />
                <Route path="upload" element={<DocumentUploadPage />} />
                <Route path=":id" element={<DocumentDetailsPage />} />
              </Route>
              
              {/* Profile */}
              <Route path="profile">
                <Route index element={<UserProfilePage />} />
                <Route path="edit" element={<EditProfilePage />} />
              </Route>
              
              {/* Admin */}
              <Route path="admin">
                <Route path="users" element={<UsersManagementPage />} />
                <Route path="logs" element={<SystemLogsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>

          {/* Redirect from /dashboard to / */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
      
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={darkMode ? 'dark' : 'light'}
      />
    </ThemeProvider>
  );
}

export default App;
