import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Paper, CircularProgress,
  List, ListItem, ListItemText, Divider, Avatar, Button, Alert, Stack,
  TextField
} from '@mui/material';
import {
  DirectionsCar, Description, Report, Timeline, Add, Upload,
  Warning, Notifications, ErrorOutline, SearchOutlined as SearchIcon
} from '@mui/icons-material';
import { vehicleService, incidentService, documentService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import LiveTrafficUpdates from '../../components/traffic/LiveTrafficUpdates';
import VehicleDetails from '../../components/vehicles/VehicleDetails';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const DashboardPage = () => {
  const { user } = useAuth();
  const [vehicleCount, setVehicleCount] = useState(0);
  const [incidentCount, setIncidentCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [recentVehicles, setRecentVehicles] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [vehiclesByMake, setVehiclesByMake] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch vehicle statistics
        const vehicleResponse = await vehicleService.getAllVehicles();
        const vehicles = Array.isArray(vehicleResponse.data) ? vehicleResponse.data : 
                        (vehicleResponse.data?.data || []);
        setVehicleCount(vehicles.length);
        
        // Get 5 most recent vehicles
        const sortedVehicles = vehicles
          .sort((a, b) => new Date(b.createdAt || b.registrationDate || 0) - 
                         new Date(a.createdAt || a.registrationDate || 0))
          .slice(0, 5);
        setRecentVehicles(sortedVehicles);
        
        // Group vehicles by make for chart
        const makeCount = {};
        vehicles.forEach(vehicle => {
          const make = vehicle.make || 'Unknown';
          makeCount[make] = (makeCount[make] || 0) + 1;
        });
        
        const makeData = Object.entries(makeCount)
          .map(([make, count]) => ({ name: make, value: count }))
          .sort((a, b) => b.value - a.value);
        
        setVehiclesByMake(makeData);

        // Fetch incident statistics
        const incidentResponse = await incidentService.getAllIncidents();
        const incidents = Array.isArray(incidentResponse.data) ? incidentResponse.data :
                         (incidentResponse.data?.data || []);
        setIncidentCount(incidents.length);

        // Fetch document statistics
        const documentResponse = await documentService.getAllDocuments();
        let documents = [];
        
        // Handle different possible response structures
        if (documentResponse && documentResponse.data) {
          if (Array.isArray(documentResponse.data)) {
            documents = documentResponse.data;
          } else if (documentResponse.data.data && Array.isArray(documentResponse.data.data)) {
            documents = documentResponse.data.data;
          } else if (documentResponse.data.resources && Array.isArray(documentResponse.data.resources)) {
            documents = documentResponse.data.resources;
          }
        }
        
        setDocumentCount(documents.length);
        
        // Get 5 most recent documents
        const sortedDocuments = documents
          .sort((a, b) => new Date(b.uploadDate || b.createdAt || 0) - 
                         new Date(a.uploadDate || a.createdAt || 0))
          .slice(0, 5);
        setRecentDocuments(sortedDocuments);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        // Initialize empty states on error
        setVehicleCount(0);
        setIncidentCount(0);
        setDocumentCount(0);
        setRecentVehicles([]);
        setRecentDocuments([]);
        setVehiclesByMake([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      setSearchError(null);
      const response = await vehicleService.searchVehicles(searchQuery);
      
      // Check if response has the expected structure
      if (response && response.data) {
        // Access the data array from the response
        const vehicles = response.data.data || [];
        setSearchResults(vehicles);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError(err.response?.data?.message || 'Failed to search vehicles');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const renderStatCard = (title, value, isLoading, icon) => (
    <Card 
      elevation={3} 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        borderRadius: 2,
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        backdropFilter: 'blur(5px)',
        color: '#fff',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 6,
        }
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', color: 'white', width: 50, height: 50 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="h5" component="div" fontWeight="bold" color="white">
            {isLoading ? <CircularProgress size={24} /> : value !== null ? value : 'N/A'}
          </Typography>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
  
  const renderQuickAction = (title, icon, onClick) => (
    <Button
      variant="contained"
      startIcon={icon}
      onClick={onClick}
      sx={{
        py: 1.5,
        flexGrow: 1,
        justifyContent: 'flex-start',
        textTransform: 'none',
        fontWeight: 'normal',
        boxShadow: 2,
        borderRadius: 2,
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        }
      }}
    >
      {title}
    </Button>
  );
  
  // Prepare data for the PieChart
  const pieChartData = vehiclesByMake.length > 0 
    ? vehiclesByMake.map(item => ({ 
        name: item.name, 
        value: item.value 
      }))
    : [
        { name: 'Vehicles', value: vehicleCount || 0 },
        { name: 'Incidents', value: incidentCount || 0 },
        { name: 'Documents', value: documentCount || 0 }
      ];

  if (loading) {
    return (
      <Box className="page-container" display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="page-container" sx={{
      backgroundImage: 'url(https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)',
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: -1
      }
    }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
        borderBottom: '2px solid #3f51b5',
        paddingBottom: 1,
        marginBottom: 2,
        display: 'inline-block'
      }}>
        Vehicle Investigation Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph sx={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 1.5,
        borderRadius: 1,
        marginBottom: 3,
        maxWidth: '800px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        color: '#e0e0e0'
      }}>
        Welcome to the Vehicle Investigation System. Use this dashboard to manage vehicles, incidents, and documents.
      </Typography>
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}
      
      {/* Search Section */}
      <Paper sx={{ p: 3, mb: 3, boxShadow: 3, borderRadius: 2, backgroundColor: 'rgba(18, 18, 18, 0.8)', color: '#fff' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
          <SearchIcon sx={{ mr: 1 }} />
          Search Vehicle
        </Typography>
        
        <form onSubmit={handleSearch}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                label="Enter vehicle license plate number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputBase-input': {
                    color: '#fff',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={searchLoading}
                sx={{ height: '100%', minHeight: '56px' }}
              >
                {searchLoading ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* Search Results */}
      {searchError && (
        <Alert severity="error" sx={{ mb: 3, boxShadow: 2 }}>
          {searchError}
        </Alert>
      )}

      {searchResults && (
        <Paper sx={{ p: 3, mb: 3, boxShadow: 3, borderRadius: 2, backgroundColor: 'rgba(18, 18, 18, 0.8)', color: '#fff' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
            Search Results ({searchResults.length} vehicles found)
          </Typography>
          {searchResults.length === 0 ? (
            <Alert severity="info">
              No vehicles found matching your search criteria.
            </Alert>
          ) : (
            searchResults.map((vehicle) => (
              <VehicleDetails key={vehicle._id} vehicle={vehicle} />
            ))
          )}
        </Paper>
      )}
      
      {/* Quick Actions Section */}
      <Paper sx={{ p: 3, mb: 3, boxShadow: 3, borderRadius: 2, backgroundColor: 'rgba(18, 18, 18, 0.8)', color: '#fff' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
          <Notifications sx={{ mr: 1 }} />
          Quick Actions
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            {renderQuickAction('Register Vehicle', <Add />, () => navigate('/vehicles/register'))}
          </Grid>
          <Grid item xs={12} sm={4}>
            {renderQuickAction('Upload Document', <Upload />, () => navigate('/documents/upload'))}
          </Grid>
          <Grid item xs={12} sm={4}>
            {renderQuickAction('Report Incident', <Report />, () => navigate('/incidents/new'))}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Alerts Section - Only show if there are alerts */}
      {alerts.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, boxShadow: 3, borderRadius: 2, backgroundColor: 'rgba(18, 18, 18, 0.8)', color: '#fff' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
            <Warning sx={{ mr: 1, color: 'warning.main' }} />
            Alerts & Notifications
          </Typography>
          
          <Stack spacing={2}>
            {alerts.map((alert, index) => (
              <Alert 
                key={index}
                severity={alert.type}
                icon={alert.type === 'error' ? <ErrorOutline /> : undefined}
                action={
                  <Button 
                    color="inherit"
                    size="small"
                    onClick={alert.action}
                  >
                    View
                  </Button>
                }
              >
                {alert.message}
              </Alert>
            ))}
          </Stack>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          {renderStatCard('Total Vehicles', vehicleCount, loading, <DirectionsCar />)}
        </Grid>
        
        <Grid item xs={12} md={4}>
          {renderStatCard('Active Incidents', incidentCount, loading, <Report />)}
        </Grid>
        
        <Grid item xs={12} md={4}>
          {renderStatCard('Uploaded Documents', documentCount, loading, <Description />)}
        </Grid>
      </Grid>
      
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, height: '100%', boxShadow: 3, borderRadius: 2, backgroundColor: 'rgba(18, 18, 18, 0.8)', color: '#fff' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
              {vehiclesByMake.length > 0 ? 'Vehicles by Make Distribution' : 'System Overview'}
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress />
              </Box>
            ) : (
              <Box height={300} display="flex" justifyContent="center" alignItems="center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      isAnimationActive={true}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} (${((value / pieChartData.reduce((sum, entry) => sum + entry.value, 0)) * 100).toFixed(1)}%)`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, height: '100%', boxShadow: 3, borderRadius: 2, backgroundColor: 'rgba(18, 18, 18, 0.8)', color: '#fff' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
              Vehicles by Make
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress />
              </Box>
            ) : vehiclesByMake.length > 0 ? (
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={vehiclesByMake}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => value} />
                    <Legend />
                    <Bar dataKey="value" name="Count">
                      {vehiclesByMake.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography variant="body2" align="center">No vehicle data available</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', boxShadow: 3, borderRadius: 2, backgroundColor: 'rgba(18, 18, 18, 0.8)', color: '#fff' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                Recent Vehicle Registrations
              </Typography>
              <Button 
                size="small" 
                color="primary" 
                onClick={() => navigate('/vehicles')}
              >
                View All
              </Button>
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress />
              </Box>
            ) : recentVehicles.length > 0 ? (
              <List>
                {recentVehicles.map((vehicle, index) => (
                  <Box key={vehicle.id || vehicle._id || index}>
                    <ListItem 
                      component="button"
                      onClick={() => navigate(`/vehicles/${vehicle.id || vehicle._id}`)}
                      sx={{ 
                        transition: 'background-color 0.2s',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
                      }}
                    >
                      <ListItemText
                        primary={`${vehicle.make || ''} ${vehicle.model || ''} (${vehicle.year || 'N/A'})`}
                        secondary={`License: ${vehicle.licensePlate || 'N/A'} | Registered: ${
                          new Date(vehicle.createdAt || vehicle.registrationDate || Date.now()).toLocaleDateString()
                        }`}
                        primaryTypographyProps={{ style: { color: '#fff' } }}
                        secondaryTypographyProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                      />
                    </ListItem>
                    {index < recentVehicles.length - 1 && <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />}
                  </Box>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>No vehicle registrations found.</Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', boxShadow: 3, borderRadius: 2, backgroundColor: 'rgba(18, 18, 18, 0.8)', color: '#fff' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                Recent Document Uploads
              </Typography>
              <Button 
                size="small" 
                color="primary" 
                onClick={() => navigate('/documents')}
              >
                View All
              </Button>
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress />
              </Box>
            ) : recentDocuments.length > 0 ? (
              <List>
                {recentDocuments.map((doc, index) => (
                  <Box key={doc.id || doc._id || index}>
                    <ListItem
                      component="button"
                      onClick={() => doc.url && window.open(doc.url, '_blank')}
                      sx={{ 
                        transition: 'background-color 0.2s',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
                      }}
                    >
                      <ListItemText
                        primary={doc.name || 'Unnamed Document'}
                        secondary={`Type: ${doc.type?.toUpperCase() || 'N/A'} | Uploaded: ${
                          new Date(doc.uploadDate || doc.createdAt || Date.now()).toLocaleDateString()
                        }`}
                        primaryTypographyProps={{ style: { color: '#fff' } }}
                        secondaryTypographyProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                      />
                    </ListItem>
                    {index < recentDocuments.length - 1 && <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />}
                  </Box>
                ))}
              </List>
            ) : (
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>No document uploads found.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Traffic Updates Component */}
      <Box sx={{ mt: 3 }}>
        <LiveTrafficUpdates />
      </Box>
      
      <Paper sx={{ p: 3, mt: 3, boxShadow: 3, borderRadius: 2, backgroundColor: 'rgba(18, 18, 18, 0.8)', color: '#fff' }}>
        <Box display="flex" alignItems="center" mb={1}>
          <Timeline color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
            System Status
        </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          {loading ? 'Loading system status...' : 'All systems operational.'}
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'rgba(46, 125, 50, 0.2)', p: 1 }}>
              <Typography variant="body2" sx={{ color: '#81c784' }}>Database: Online</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'rgba(46, 125, 50, 0.2)', p: 1 }}>
              <Typography variant="body2" sx={{ color: '#81c784' }}>Cloudinary: Connected</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'rgba(46, 125, 50, 0.2)', p: 1 }}>
              <Typography variant="body2" sx={{ color: '#81c784' }}>API: Responsive</Typography>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DashboardPage;
