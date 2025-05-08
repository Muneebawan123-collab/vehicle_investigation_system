import { useAuth } from '../../context/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const PrivateRoute = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading indicator while authentication is being checked
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Check for authentication with fallback to localStorage
  const localStorageUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  const hasLocalAuth = !!localStorageUser && !!token;
  
  if (!user && !isAuthenticated && !hasLocalAuth) {
    console.log('User not authenticated, redirecting to /home');
    return <Navigate to="/home" state={{ from: { pathname: "/" } }} replace />;
  }

  console.log('User authenticated, rendering protected content');
  
  // Render the protected route
  return <Outlet />;
};

export default PrivateRoute; 