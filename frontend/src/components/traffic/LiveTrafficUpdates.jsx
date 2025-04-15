import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Chip,
  useTheme,
  Skeleton
} from '@mui/material';
import { 
  DirectionsCar, 
  Notifications, 
  Info, 
  Warning, 
  AccessTime,
  PlayArrow,
  Pause
} from '@mui/icons-material';
import { getTrafficData } from '../../utils/trafficService';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

/**
 * LiveTrafficUpdates Component - Displays real-time traffic tips and alerts
 * Auto-refreshes every 5 seconds with smooth animations
 */
const LiveTrafficUpdates = () => {
  const [trafficData, setTrafficData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const theme = useTheme();

  // Function to fetch traffic data
  const fetchData = async () => {
    if (isPaused) return;
    
    setLoading(true);
    try {
      const data = await getTrafficData();
      setTrafficData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching traffic data:', err);
      setError('Unable to fetch traffic updates');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
    
    // Set up interval for auto-refresh
    intervalRef.current = setInterval(fetchData, 5000); // Refresh every 5 seconds
    
    // Clean up interval on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused]);

  // Function to toggle pause/play state
  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Get severity color based on alert level
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };

  // Render loading skeleton
  if (loading && !trafficData) {
    return (
      <Card
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          position: 'relative',
          mb: 3
        }}
      >
        <CardContent>
          <Skeleton variant="text" width="60%" height={30} />
          <Skeleton variant="text" width="90%" height={24} />
          <Skeleton variant="text" width="40%" height={24} />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error && !trafficData) {
    return (
      <Card
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'error.light',
          color: 'error.contrastText',
          mb: 3
        }}
      >
        <CardContent>
          <Typography variant="h6">
            <Warning fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
            Traffic Updates Unavailable
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={trafficData?.timestamp}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Card
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            position: 'relative',
            mb: 3,
            mt: 2,
            borderLeft: trafficData?.type === 'alert' ? 
              `4px solid ${getSeverityColor(trafficData?.severity)}` : 
              `4px solid ${theme.palette.info.main}`
          }}
        >
          {/* Indicator bar */}
          <Box
            sx={{
              height: 4,
              width: '100%',
              bgcolor: loading ? theme.palette.grey[300] : theme.palette.primary.main,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {!isPaused && (
              <Box
                component={motion.div}
                animate={{
                  x: ['-100%', '0%'],
                }}
                transition={{
                  duration: 5,
                  ease: 'linear',
                  repeat: Infinity,
                  repeatType: 'loop'
                }}
                sx={{
                  height: '100%',
                  width: '100%',
                  background: `linear-gradient(90deg, 
                    ${theme.palette.primary.main}22, 
                    ${theme.palette.primary.main}, 
                    ${theme.palette.primary.main}22)`,
                }}
              />
            )}
          </Box>
          
          <CardContent>
            {/* Header */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 1
              }}
            >
              <Typography 
                variant="h6" 
                color={trafficData?.type === 'alert' ? getSeverityColor(trafficData?.severity) : 'info.main'}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontWeight: 600 
                }}
              >
                {trafficData?.type === 'alert' ? (
                  <Notifications fontSize="small" sx={{ mr: 1 }} />
                ) : (
                  <Info fontSize="small" sx={{ mr: 1 }} />
                )}
                {trafficData?.type === 'alert' ? 'Traffic Alert' : 'Safety Tip'}
              </Typography>
              
              <Box>
                {trafficData?.type === 'alert' && (
                  <Chip 
                    size="small" 
                    label={trafficData?.severity?.toUpperCase()} 
                    color={
                      trafficData?.severity === 'high' ? 'error' :
                      trafficData?.severity === 'medium' ? 'warning' : 'success'
                    }
                    sx={{ mr: 1 }}
                  />
                )}
                
                <IconButton 
                  size="small" 
                  onClick={togglePause}
                  color={isPaused ? 'primary' : 'default'}
                >
                  {isPaused ? <PlayArrow fontSize="small" /> : <Pause fontSize="small" />}
                </IconButton>
              </Box>
            </Box>
            
            {/* Content */}
            <Typography 
              variant="body1" 
              sx={{ 
                my: 1.5,
                fontWeight: trafficData?.type === 'alert' ? 500 : 400
              }}
            >
              {trafficData?.content}
            </Typography>
            
            {/* Footer */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center', 
                mt: 2,
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}
            >
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsCar fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                {trafficData?.type === 'alert' ? trafficData?.location : trafficData?.source}
              </Typography>
              
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTime fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                {trafficData?.timestamp && format(new Date(trafficData.timestamp), 'h:mm a')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default LiveTrafficUpdates; 