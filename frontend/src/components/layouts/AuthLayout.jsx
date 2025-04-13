import { Outlet } from 'react-router-dom';
import { Container, Box, Paper, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';

const AuthLayout = () => {
  const { loading } = useAuth();

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography 
            component="h1" 
            variant="h4" 
            align="center" 
            sx={{ mb: 3, fontWeight: 700 }}
          >
            Vehicle Investigation System
          </Typography>
        </motion.div>

        <motion.div
          style={{ width: '100%' }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2,
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Outlet />
            )}
          </Paper>
        </motion.div>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            &copy; {new Date().getFullYear()} Vehicle Investigation System
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <Link component={RouterLink} to="/privacy-policy" color="inherit">
              Privacy Policy
            </Link>
            {' | '}
            <Link component={RouterLink} to="/terms-of-service" color="inherit">
              Terms of Service
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default AuthLayout; 