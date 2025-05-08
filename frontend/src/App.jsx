import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, GlobalStyles } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import React from 'react';

// Auth & Context
import PrivateRoute from './components/routing/PrivateRoute';
import { ChatProvider } from './context/ChatContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import DashboardLayout from './components/layouts/DashboardLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Public Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
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
import TestEditPage from './pages/vehicles/TestEditPage';
import VehicleScanPage from './pages/vehicles/VehicleScanPage';

// Protected Pages - Incidents
import IncidentsListPage from './pages/incidents/IncidentsListPage';
import IncidentCreatePage from './pages/incidents/IncidentCreatePage';
import IncidentDetailsPage from './pages/incidents/IncidentDetailsPage';
import IncidentEditPage from './pages/incidents/IncidentEditPage';
import OfficerReviewPage from './pages/incidents/OfficerReviewPage';

// Protected Pages - Documents
import DocumentsListPage from './pages/documents/DocumentsListPage';
import DocumentUploadPage from './pages/documents/DocumentUploadPage';
import DocumentDetailsPage from './pages/documents/DocumentDetailsPage';

// Protected Pages - Chat
import ChatPage from './pages/chat/ChatPage';

// Protected Pages - Profile & Admin
import UserProfilePage from './pages/profile/UserProfilePage';
import EditProfilePage from './pages/profile/EditProfilePage';
import UsersManagementPage from './pages/admin/UsersManagementPage';
import SystemLogsPage from './pages/admin/SystemLogsPage';
import SettingsPage from './pages/admin/SettingsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import PromoteMuneebPage from './pages/admin/PromoteMuneebPage';
import NotificationsPage from './pages/profile/NotificationsPage';
import TestNotificationsPage from './pages/admin/TestNotificationsPage';

// Protected Pages - AI Features
import FraudDetectionPage from './pages/ai/FraudDetectionPage';
import DamageAnalysisPage from './pages/ai/DamageAnalysisPage';

// Utils & Helpers
import ScrollToTop from './utils/ScrollToTop';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Test route for debugging
const TestComponent = () => {
  return <div style={{padding: 50, textAlign: 'center'}}>
    <h1>Test Route Works!</h1>
    <p>This is a simple test component to verify routing.</p>
  </div>;
};

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
      <GlobalStyles
        styles={(theme) => ({
          'body': {
            overflow: 'auto',
          },
          '.page-container': {
            paddingTop: '84px', // Add space below navbar for all pages
            minHeight: '100vh',
            position: 'relative',
            zIndex: 1,
          },
        })}
      />
      <ChatProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* Home Page */}
                <Route path="/home" element={<HomePage />} />

                {/* About Page */}
                <Route path="/about" element={<AboutPage />} />
                
                {/* Public Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                </Route>

                {/* Public Vehicle QR Code Scanner Route */}
                <Route path="/vehicles/scan/:id?" element={<VehicleScanPage />} />

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
                      <Route path="edit/:id" element={<VehicleEditPage />} />
                      <Route path="test-edit/:id" element={<TestEditPage />} />
                    </Route>
                    
                    {/* Incidents */}
                    <Route path="incidents">
                      <Route index element={<IncidentsListPage />} />
                      <Route path="create" element={<IncidentCreatePage />} />
                      <Route path=":id" element={<IncidentDetailsPage />} />
                      <Route path=":id/edit" element={<IncidentEditPage />} />
                      <Route path="officer-review" element={<OfficerReviewPage />} />
                    </Route>
                    
                    {/* Documents */}
                    <Route path="documents">
                      <Route index element={<DocumentsListPage />} />
                      <Route path="upload" element={<DocumentUploadPage />} />
                      <Route path=":id" element={<DocumentDetailsPage />} />
                    </Route>
                    
                    {/* Chat */}
                    <Route path="messages">
                      <Route index element={<ChatPage />} />
                    </Route>
                    
                    {/* Profile */}
                    <Route path="profile">
                      <Route index element={<UserProfilePage />} />
                      <Route path="edit" element={<EditProfilePage />} />
                      <Route path="notifications" element={<NotificationsPage />} />
                    </Route>
                    
                    {/* Admin */}
                    <Route path="admin">
                      <Route path="users" element={<UsersManagementPage />} />
                      <Route path="manage-users" element={<AdminUsersPage />} />
                      <Route path="promote-muneeb" element={<PromoteMuneebPage />} />
                      <Route path="logs" element={<SystemLogsPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="test-notifications" element={<TestNotificationsPage />} />
                    </Route>
                    
                    {/* AI Features */}
                    <Route path="ai">
                      <Route path="fraud-detection" element={<FraudDetectionPage />} />
                      <Route path="damage-analysis" element={<DamageAnalysisPage />} />
                    </Route>
                  </Route>
                </Route>

                {/* Redirect from /dashboard to / */}
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                
                {/* Test route */}
                <Route path="/test" element={<TestComponent />} />
                
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
          </NotificationProvider>
        </AuthProvider>
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;
