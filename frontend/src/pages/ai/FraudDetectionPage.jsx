import React, { useState, useEffect } from 'react';
import { 
  Typography, Paper, Grid, Box, CircularProgress, 
  Card, CardContent, Divider, Chip, Button, 
  Alert, TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { 
  WarningAmber, CheckCircle, VerifiedUser, 
  ErrorOutline, Search, Refresh, DataUsage
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const FraudDetectionPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vehicleId, setVehicleId] = useState('');
  const [fraudResults, setFraudResults] = useState(null);
  const [searchType, setSearchType] = useState('vehicleId');
  const [searchValue, setSearchValue] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [batchResults, setBatchResults] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [aiDisabled, setAiDisabled] = useState(false);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // If search value changes, reset results
    setFraudResults(null);
  }, [searchValue]);
  
  // Check if AI features are available
  useEffect(() => {
    const checkAiStatus = async () => {
      try {
        await axios.get('/api/ai/health-check');
      } catch (error) {
        // If we get a 503 response, AI is disabled
        if (error.response && error.response.status === 503) {
          setAiDisabled(true);
          setError(error.response.data.message || 'AI features are currently disabled.');
        }
      }
    };
    
    checkAiStatus();
  }, []);
  
  const searchVehicles = async () => {
    if (!searchValue.trim()) return;
    
    setLoadingVehicles(true);
    setError(null);
    
    try {
      let endpoint = `/api/vehicles?`;
      
      switch (searchType) {
        case 'licensePlate':
          endpoint += `licensePlate=${encodeURIComponent(searchValue)}`;
          break;
        case 'vin':
          endpoint += `vin=${encodeURIComponent(searchValue)}`;
          break;
        case 'make':
          endpoint += `make=${encodeURIComponent(searchValue)}`;
          break;
        default:
          endpoint += `search=${encodeURIComponent(searchValue)}`;
      }
      
      const response = await axios.get(endpoint);
      setVehicles(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error searching vehicles');
      toast.error('Error searching vehicles');
    } finally {
      setLoadingVehicles(false);
    }
  };
  
  const detectFraud = async (id) => {
    if (!id || aiDisabled) return;
    
    setLoading(true);
    setError(null);
    setFraudResults(null);
    
    try {
      const response = await axios.get(`/api/ai/fraud/${id}`);
      setFraudResults(response.data);
    } catch (err) {
      if (err.response && err.response.status === 503) {
        setAiDisabled(true);
        setError(err.response.data.message || 'AI features are currently disabled.');
      } else {
        setError(err.response?.data?.message || 'Error detecting fraud');
        toast.error('Error detecting fraud');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const runBatchDetection = async () => {
    if (aiDisabled) return;
    
    setBatchLoading(true);
    setBatchResults(null);
    setError(null);
    
    try {
      const response = await axios.get('/api/ai/fraud/batch');
      setBatchResults(response.data);
      toast.success(`Found ${response.data.length} suspicious vehicles`);
    } catch (err) {
      if (err.response && err.response.status === 503) {
        setAiDisabled(true);
        setError(err.response.data.message || 'AI features are currently disabled.');
      } else {
        setError(err.response?.data?.message || 'Error running batch detection');
        toast.error('Error running batch detection');
      }
    } finally {
      setBatchLoading(false);
    }
  };
  
  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
    setSearchValue('');
    setVehicles([]);
  };
  
  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#2196f3';
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      searchVehicles();
    }
  };
  
  const handleVehicleSelect = (id) => {
    setVehicleId(id);
    detectFraud(id);
  };
  
  return (
    <Box sx={{ py: 3, px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Fraud Detection
      </Typography>
      
      {aiDisabled ? (
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <ErrorOutline sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            AI Features Currently Unavailable
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {error || 'The AI-powered fraud detection features are currently disabled. Please contact your system administrator to enable these features.'}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/')}
          >
            Return to Dashboard
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Vehicle Search Section */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Search Vehicle
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Search By</InputLabel>
                <Select
                  value={searchType}
                  label="Search By"
                  onChange={handleSearchTypeChange}
                >
                  <MenuItem value="vehicleId">Vehicle ID</MenuItem>
                  <MenuItem value="licensePlate">License Plate</MenuItem>
                  <MenuItem value="vin">VIN</MenuItem>
                  <MenuItem value="make">Make</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label={`Enter ${searchType === 'vehicleId' ? 'ID' : searchType.charAt(0).toUpperCase() + searchType.slice(1)}`}
                variant="outlined"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                sx={{ mb: 2 }}
              />
              
              <Button 
                variant="contained" 
                startIcon={<Search />} 
                onClick={searchVehicles}
                disabled={loadingVehicles || !searchValue.trim()}
                fullWidth
              >
                {loadingVehicles ? 'Searching...' : 'Search'}
              </Button>
              
              {loadingVehicles && (
                <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
                  <CircularProgress />
                </Box>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              
              {vehicles.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Search Results ({vehicles.length})
                  </Typography>
                  <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                    {vehicles.map((vehicle) => (
                      <Card 
                        key={vehicle._id} 
                        sx={{ 
                          mb: 1, 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => handleVehicleSelect(vehicle._id)}
                      >
                        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                          <Typography variant="subtitle2">
                            {vehicle.make} {vehicle.model} ({vehicle.year})
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            License: {vehicle.licensePlate} | VIN: {vehicle.vin?.substring(0, 8)}...
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Box>
              )}
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Batch Detection
              </Typography>
              
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<DataUsage />}
                onClick={runBatchDetection}
                disabled={batchLoading}
                fullWidth
              >
                {batchLoading ? 'Processing...' : 'Run Batch Fraud Detection'}
              </Button>
            </Paper>
          </Grid>
          
          {/* Fraud Analysis Results */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, minHeight: '600px' }}>
              <Typography variant="h6" gutterBottom>
                Fraud Analysis Results
              </Typography>
              
              {loading && (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ py: 10 }}>
                  <CircularProgress size={60} />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Analyzing vehicle data for fraud indicators...
                  </Typography>
                </Box>
              )}
              
              {!loading && !fraudResults && !batchResults && (
                <Box 
                  display="flex" 
                  flexDirection="column" 
                  alignItems="center" 
                  justifyContent="center" 
                  sx={{ py: 10, color: 'text.secondary' }}
                >
                  <VerifiedUser sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                  <Typography variant="h6">
                    Select a vehicle to perform fraud detection
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Or run batch detection to analyze multiple vehicles
                  </Typography>
                </Box>
              )}
              
              {fraudResults && (
                <Box>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      mb: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        icon={fraudResults.fraudProbability > 0.6 ? <WarningAmber /> : <CheckCircle />}
                        label={`Risk Level: ${fraudResults.riskLevel?.toUpperCase()}`}
                        sx={{ 
                          bgcolor: getRiskColor(fraudResults.riskLevel),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        Fraud Probability: {(fraudResults.fraudProbability * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    
                    <Button 
                      startIcon={<Refresh />}
                      onClick={() => detectFraud(vehicleId)}
                      size="small"
                    >
                      Refresh
                    </Button>
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  {fraudResults.suspiciousPatterns?.length > 0 ? (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        Suspicious Patterns Detected:
                      </Typography>
                      
                      {fraudResults.suspiciousPatterns.map((pattern, index) => (
                        <Card key={index} sx={{ mb: 2, bgcolor: pattern.severity === 'high' ? '#fff8f8' : 'white' }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="subtitle2" color="primary">
                                {pattern.type.replace(/_/g, ' ')}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={pattern.severity.toUpperCase()}
                                sx={{ 
                                  bgcolor: 
                                    pattern.severity === 'high' ? '#ffebee' : 
                                    pattern.severity === 'medium' ? '#fff3e0' : '#e8f5e9',
                                  color: 
                                    pattern.severity === 'high' ? '#c62828' : 
                                    pattern.severity === 'medium' ? '#ef6c00' : '#2e7d32',
                                }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {pattern.description}
                            </Typography>
                            
                            {pattern.data && (
                              <Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                <pre style={{ margin: 0, overflow: 'auto' }}>
                                  {JSON.stringify(pattern.data, null, 2)}
                                </pre>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <Box textAlign="center" sx={{ py: 4 }}>
                      <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        No suspicious patterns detected
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        This vehicle shows no immediate signs of fraudulent activity
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/vehicles/${vehicleId}`)}
                    >
                      View Vehicle Details
                    </Button>
                    
                    {fraudResults.riskLevel === 'high' && (
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => navigate(`/incidents/new?vehicleId=${vehicleId}&type=Fraud Investigation`)}
                      >
                        Create Fraud Investigation
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
              
              {batchResults && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Batch Detection Results ({batchResults.length} vehicles)
                  </Typography>
                  
                  {batchResults.length === 0 ? (
                    <Alert severity="info">
                      No suspicious vehicles detected in batch analysis
                    </Alert>
                  ) : (
                    <Box sx={{ maxHeight: '500px', overflow: 'auto' }}>
                      {batchResults.map((result) => (
                        <Card key={result.vehicleId} sx={{ mb: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle2">
                                {result.make} {result.model} - {result.licensePlate}
                              </Typography>
                              <Chip 
                                size="small"
                                label={`${(result.fraudProbability * 100).toFixed(1)}% Risk`}
                                sx={{ 
                                  bgcolor: getRiskColor(result.riskLevel),
                                  color: 'white'
                                }}
                              />
                            </Box>
                            
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="textSecondary">
                                VIN: {result.vin}
                              </Typography>
                              <Button
                                size="small"
                                onClick={() => {
                                  setVehicleId(result.vehicleId);
                                  detectFraud(result.vehicleId);
                                }}
                              >
                                Analyze
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default FraudDetectionPage; 