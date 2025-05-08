import React, { useState, useRef, useEffect } from 'react';
import { 
  Typography, Paper, Grid, Box, CircularProgress, 
  Card, CardContent, Divider, Chip, Button, 
  Alert, TextField, FormControl, InputLabel, Select, MenuItem,
  IconButton, Stack, LinearProgress
} from '@mui/material';
import { 
  PhotoCamera, AssessmentOutlined, CheckCircle, 
  ErrorOutline, Search, FileUpload, Close, AddTask,
  BarChart, PriceCheck, Timeline
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const DamageAnalysisPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vehicleId, setVehicleId] = useState('');
  const [searchType, setSearchType] = useState('vehicleId');
  const [searchValue, setSearchValue] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [detailedResults, setDetailedResults] = useState(null);
  const [createIncident, setCreateIncident] = useState(true);
  const [aiDisabled, setAiDisabled] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('standard'); // 'standard' or 'detailed'
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
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
  
  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
    setSearchValue('');
    setVehicles([]);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      searchVehicles();
    }
  };
  
  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleId(vehicle._id);
    // Reset any previous analysis
    setAnalysisResults(null);
    setDetailedResults(null);
  };
  
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const analyzeImage = async () => {
    if (!selectedImage || !selectedVehicle || aiDisabled) {
      if (aiDisabled) {
        toast.error('AI features are currently disabled');
      } else {
        toast.error('Please select both a vehicle and an image');
      }
      return;
    }
    
    setLoading(true);
    setError(null);
    setAnalysisResults(null);
    setDetailedResults(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('vehicleId', selectedVehicle._id);
      formData.append('saveToVehicle', 'true');
      formData.append('createIncident', createIncident ? 'true' : 'false');
      formData.append('cleanupFile', 'true');
      
      // Choose endpoint based on analysis mode
      const endpoint = analysisMode === 'detailed' ? 
        '/api/ai/detailed-damage-analysis' : 
        '/api/ai/damage-analysis';
      
      console.log('Making API request to:', endpoint);
      console.log('Analysis mode:', analysisMode);
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('API response received:', response.data);
      
      if (analysisMode === 'detailed') {
        setDetailedResults(response.data);
      } else {
        setAnalysisResults(response.data);
      }
      
      toast.success(`${analysisMode === 'detailed' ? 'Detailed' : 'Standard'} analysis completed successfully`);
    } catch (err) {
      console.error('Error analyzing image:', err);
      
      if (err.response) {
        console.error('Error response:', err.response.status, err.response.data);
      }
      
      if (err.response && err.response.status === 503) {
        setAiDisabled(true);
        setError(err.response.data.message || 'AI features are currently disabled.');
        toast.error('AI features are currently disabled');
      } else {
        setError(err.response?.data?.message || 'Error analyzing image');
        toast.error('Error analyzing vehicle damage');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const getDamageSeverityColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return '#d32f2f';
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
  
  // Format currency for cost estimate
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <Box sx={{ py: 3, px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Damage Analysis
      </Typography>
      
      {aiDisabled ? (
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <ErrorOutline sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            AI Features Currently Unavailable
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {error || 'The AI-powered damage analysis features are currently disabled. Please contact your system administrator to enable these features.'}
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
          {/* Vehicle Search & Image Upload */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
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
                          '&:hover': { bgcolor: 'action.hover' },
                          border: selectedVehicle?._id === vehicle._id ? '2px solid #3f51b5' : 'none'
                        }}
                        onClick={() => handleVehicleSelect(vehicle)}
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
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Upload Image for Analysis
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="contained-button-file"
                  type="file"
                  onChange={handleImageSelect}
                  ref={fileInputRef}
                />
                <label htmlFor="contained-button-file">
                  <Button
                    variant={selectedImage ? "outlined" : "contained"}
                    component="span"
                    startIcon={<PhotoCamera />}
                    fullWidth
                    disabled={!selectedVehicle}
                  >
                    Select Image
                  </Button>
                </label>
              </Box>
              
              {imagePreview && (
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <IconButton
                    sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8, 
                      bgcolor: 'rgba(0,0,0,0.5)',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                      color: 'white',
                      zIndex: 1
                    }}
                    size="small"
                    onClick={handleRemoveImage}
                  >
                    <Close />
                  </IconButton>
                  <img 
                    src={imagePreview} 
                    alt="Selected" 
                    style={{ 
                      width: '100%', 
                      borderRadius: '4px',
                      maxHeight: '300px',
                      objectFit: 'contain'
                    }} 
                  />
                </Box>
              )}
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Analysis Options:
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Create Incident:
                  </Typography>
                  <Chip 
                    label={createIncident ? "Yes" : "No"}
                    color={createIncident ? "primary" : "default"}
                    onClick={() => setCreateIncident(!createIncident)}
                    sx={{ cursor: 'pointer' }}
                  />
                </Stack>
                
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Analysis Type:
                  </Typography>
                  <Chip 
                    label="Standard"
                    color={analysisMode === 'standard' ? "primary" : "default"}
                    onClick={() => setAnalysisMode('standard')}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip 
                    label="Detailed"
                    color={analysisMode === 'detailed' ? "secondary" : "default"}
                    onClick={() => setAnalysisMode('detailed')}
                    sx={{ cursor: 'pointer' }}
                  />
                </Stack>
              </FormControl>
              
              <Button
                variant="contained"
                color={analysisMode === 'detailed' ? "secondary" : "primary"}
                startIcon={analysisMode === 'detailed' ? <BarChart /> : <AssessmentOutlined />}
                onClick={analyzeImage}
                disabled={loading || !selectedImage || !selectedVehicle}
                fullWidth
                sx={{ mt: 1 }}
              >
                {loading ? 'Analyzing...' : `${analysisMode === 'detailed' ? 'Detailed' : 'Standard'} Analysis`}
              </Button>
            </Paper>
          </Grid>
          
          {/* Analysis Results */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, minHeight: '600px' }}>
              <Typography variant="h6" gutterBottom>
                Damage Analysis Results
              </Typography>
              
              {loading && (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ py: 10 }}>
                  <CircularProgress size={60} />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Analyzing vehicle damage using AI...
                  </Typography>
                  <Box sx={{ width: '80%', mt: 3 }}>
                    <LinearProgress />
                  </Box>
                </Box>
              )}
              
              {!loading && !analysisResults && !detailedResults && (
                <Box 
                  display="flex" 
                  flexDirection="column" 
                  alignItems="center" 
                  justifyContent="center" 
                  sx={{ py: 10, color: 'text.secondary' }}
                >
                  <PhotoCamera sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
                  <Typography variant="h6">
                    Select a vehicle and upload an image for damage analysis
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', maxWidth: '80%' }}>
                    Our AI system will analyze the image to detect damage, determine severity, 
                    and provide repair cost estimates
                  </Typography>
                </Box>
              )}
              
              {analysisResults && analysisMode === 'standard' && (
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
                        icon={
                          analysisResults.overallDamageLevel === 'none' ? <CheckCircle /> : 
                          <ErrorOutline />
                        }
                        label={`Damage Level: ${analysisResults.overallDamageLevel?.toUpperCase() || 'N/A'}`}
                        sx={{ 
                          bgcolor: getDamageSeverityColor(analysisResults.overallDamageLevel),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        {analysisResults.vehicleDetected ? 
                          `Detected: ${analysisResults.vehicleType}` : 
                          'No vehicle detected'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                    {/* Image with annotations (if available) */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Analyzed Image
                      </Typography>
                      <Box sx={{ 
                        position: 'relative', 
                        border: '1px solid #eee', 
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}>
                        {/* In a real application, you might render the image with bounding boxes */}
                        <img 
                          src={imagePreview} 
                          alt="Analyzed" 
                          style={{ 
                            width: '100%', 
                            maxHeight: '300px',
                            objectFit: 'contain'
                          }} 
                        />
                        
                        {analysisResults.vehicleBoundingBox && (
                          <Box sx={{
                            position: 'absolute',
                            border: '2px solid #2196f3',
                            top: `${analysisResults.vehicleBoundingBox[1]}%`,
                            left: `${analysisResults.vehicleBoundingBox[0]}%`,
                            width: `${analysisResults.vehicleBoundingBox[2]}%`,
                            height: `${analysisResults.vehicleBoundingBox[3]}%`,
                            pointerEvents: 'none',
                            zIndex: 2
                          }} />
                        )}
                      </Box>
                    </Grid>
                    
                    {/* Cost estimation card in standard analysis */}
                    <Grid item xs={12} md={6}>
                      <Card elevation={3} sx={{ mb: 3 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <PriceCheck sx={{ color: 'primary.main', mr: 1 }} />
                            <Typography variant="h6">
                              Repair Cost Estimate
                            </Typography>
                          </Box>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="body1" gutterBottom>
                            Estimated repair range:
                          </Typography>
                          <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="h5" color="primary" align="center">
                              {formatCurrency(analysisResults.repairCostEstimate?.min || 0)} - {formatCurrency(analysisResults.repairCostEstimate?.max || 0)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Based on the detected damage severity and type. Actual costs may vary.
                          </Typography>
                        </CardContent>
                      </Card>
                      
                      {/* Classification Results */}
                      <Card elevation={3}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <BarChart sx={{ color: 'primary.main', mr: 1 }} />
                            <Typography variant="h6">
                              Classification Results
                            </Typography>
                          </Box>
                          <Divider sx={{ mb: 2 }} />
                          {analysisResults.classifications && (
                            <Box>
                              {analysisResults.classifications.map((item, index) => (
                                <Box key={index} sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2">
                                    {item.className}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box 
                                      sx={{ 
                                        width: 100, 
                                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0', 
                                        height: 8, 
                                        borderRadius: 1, 
                                        mr: 1,
                                        overflow: 'hidden'
                                      }}
                                    >
                                      <Box 
                                        sx={{ 
                                          width: `${item.probability * 100}%`, 
                                          bgcolor: 'primary.main', 
                                          height: '100%' 
                                        }} 
                                      />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {(item.probability * 100).toFixed(1)}%
                                    </Typography>
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  
                  {/* Detailed damage assessment */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Damage Details
                    </Typography>
                    
                    {analysisResults.damages?.length > 0 ? (
                      <Grid container spacing={2}>
                        {analysisResults.damages.map((damage, index) => (
                          <Grid item xs={12} md={6} key={index}>
                            <Card sx={{ 
                              bgcolor: (theme) => theme.palette.mode === 'dark' 
                                ? (damage.severity === 'critical' || damage.severity === 'high' ? 'rgba(244, 67, 54, 0.1)' : 'background.paper') 
                                : (damage.severity === 'critical' || damage.severity === 'high' ? '#fff8f8' : 'white')
                            }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Typography variant="subtitle2" color="primary">
                                    {damage.type}
                                  </Typography>
                                  <Chip 
                                    size="small" 
                                    label={damage.severity.toUpperCase()}
                                    sx={{ 
                                      bgcolor: (theme) => theme.palette.mode === 'dark' 
                                        ? getDamageSeverityColor(damage.severity) + '44'
                                        : getDamageSeverityColor(damage.severity) + '22',
                                      color: getDamageSeverityColor(damage.severity),
                                    }}
                                  />
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Probability:
                                  </Typography>
                                  <Box 
                                    sx={{ 
                                      width: 100, 
                                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0', 
                                      height: 6, 
                                      borderRadius: 1, 
                                      mx: 1,
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <Box 
                                      sx={{ 
                                        width: `${damage.probability * 100}%`, 
                                        bgcolor: getDamageSeverityColor(damage.severity), 
                                        height: '100%' 
                                      }} 
                                    />
                                  </Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {(damage.probability * 100).toFixed(1)}%
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box textAlign="center" sx={{ py: 3 }}>
                        <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                        <Typography variant="h6" sx={{ mt: 1 }}>
                          No damage detected
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          The vehicle appears to be in good condition based on the analyzed image
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/vehicles/${selectedVehicle._id}`)}
                    >
                      View Vehicle Details
                    </Button>
                    
                    {(analysisResults.overallDamageLevel === 'high' || analysisResults.overallDamageLevel === 'critical') && (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<AddTask />}
                        onClick={() => navigate(`/incidents/new?vehicleId=${selectedVehicle._id}&type=Damage Assessment`)}
                      >
                        Create Damage Report
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
              
              {detailedResults && analysisMode === 'detailed' && (
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
                        icon={<AssessmentOutlined />}
                        label={`Overall Severity: ${detailedResults.detailedReport?.overallSeverity?.toUpperCase() || 'N/A'}`}
                        sx={{ 
                          bgcolor: getDamageSeverityColor(detailedResults.detailedReport?.overallSeverity),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        {detailedResults.vehicle ? 
                          `Detected: ${detailedResults.vehicle.type} (${detailedResults.vehicle.detectedMake})` : 
                          'No vehicle detected'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  {/* Summary cards */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                      <Card sx={{ 
                        height: '100%', 
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#f5f5f5' 
                      }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom color="primary">
                            <PriceCheck sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Repair Cost Estimate
                          </Typography>
                          <Typography variant="h4" component="div" sx={{ mb: 2, color: 'text.primary' }}>
                            {detailedResults.repairCost?.estimatedTotal || '₹0.00'}
                          </Typography>
                          
                          {detailedResults.repairCost?.breakdown && (
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Cost Breakdown:
                              </Typography>
                              <Grid container spacing={1}>
                                <Grid item xs={6}>
                                  <Typography variant="body2">Parts:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" align="right">{detailedResults.repairCost.breakdown.parts}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2">Labor:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" align="right">{detailedResults.repairCost.breakdown.labor}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2">Paint:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" align="right">{detailedResults.repairCost.breakdown.paint}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2">Shop Fees:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="body2" align="right">{detailedResults.repairCost.breakdown.shopFees}</Typography>
                                </Grid>
                              </Grid>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card sx={{ 
                        height: '100%', 
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#f5f5f5'
                      }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom color="primary">
                            <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Damage Summary
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 2 }}>
                            {detailedResults.detailedReport?.summary || 'No damage detected'}
                          </Typography>
                          
                          {detailedResults.damages && detailedResults.damages.length > 0 && (
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Primary Damage Types:
                              </Typography>
                              {detailedResults.damages.map((damage, idx) => (
                                <Chip
                                  key={idx}
                                  label={`${damage.type} (${damage.severity})`}
                                  size="small"
                                  sx={{ 
                                    m: 0.5, 
                                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                                      ? getDamageSeverityColor(damage.severity) + '44'
                                      : getDamageSeverityColor(damage.severity) + '22',
                                    color: getDamageSeverityColor(damage.severity)
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card sx={{ 
                        height: '100%', 
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#f5f5f5' 
                      }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom color="primary">
                            <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Repair Timeline
                          </Typography>
                          <Typography variant="h4" component="div" sx={{ mb: 2, color: 'text.primary' }}>
                            {detailedResults.repairPlan?.formattedTime || 'N/A'}
                          </Typography>
                          
                          {detailedResults.repairPlan?.steps && (
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Repair Steps: {detailedResults.repairPlan.steps.length}
                              </Typography>
                              <Typography variant="body2">
                                {detailedResults.repairPlan.steps.length > 0 ? (
                                  `Starting with ${detailedResults.repairPlan.steps[0].description}`
                                ) : 'No repairs needed'}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  
                  {/* Detailed part analysis */}
                  <Typography variant="h6" gutterBottom>
                    Vehicle Part Analysis
                  </Typography>
                  
                  {detailedResults.detailedReport?.partAnalysis && (
                    <Grid container spacing={2}>
                      {detailedResults.detailedReport.partAnalysis
                        .filter(part => part.damaged)
                        .map((part, idx) => (
                          <Grid item xs={12} md={6} key={idx}>
                            <Card sx={{ 
                              mb: 2, 
                              borderLeft: `4px solid ${getDamageSeverityColor(part.severity)}`,
                              bgcolor: (theme) => theme.palette.mode === 'dark' 
                                ? (part.severity === 'High' ? 'rgba(244, 67, 54, 0.1)' : 'background.paper')
                                : (part.severity === 'High' ? '#fff8f8' : 'white')
                            }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle1">
                                    {part.part}
                                  </Typography>
                                  <Chip 
                                    size="small" 
                                    label={part.severity?.toUpperCase() || 'N/A'}
                                    sx={{ 
                                      bgcolor: (theme) => theme.palette.mode === 'dark' 
                                        ? getDamageSeverityColor(part.severity) + '44'
                                        : getDamageSeverityColor(part.severity) + '22',
                                      color: getDamageSeverityColor(part.severity),
                                    }}
                                  />
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  Damage Type: {part.damageType || 'Unknown'}
                                </Typography>
                                
                                <Box sx={{ mt: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    Repair Recommendation:
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {part.repairRecommendation}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Confidence:
                                  </Typography>
                                  <Box 
                                    sx={{ 
                                      width: 100, 
                                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0', 
                                      height: 6, 
                                      borderRadius: 1, 
                                      mx: 1,
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <Box 
                                      sx={{ 
                                        width: `${part.confidence * 100}%`, 
                                        bgcolor: getDamageSeverityColor(part.severity), 
                                        height: '100%' 
                                      }} 
                                    />
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {(part.confidence * 100).toFixed(1)}%
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                    </Grid>
                  )}
                  
                  {/* Repair Plan Timeline */}
                  {detailedResults.repairPlan?.steps && detailedResults.repairPlan.steps.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        Repair Plan Timeline
                      </Typography>
                      
                      <Card>
                        <CardContent>
                          <Box sx={{ position: 'relative' }}>
                            {detailedResults.repairPlan.steps.map((step, idx) => (
                              <Box key={idx} sx={{ display: 'flex', mb: 2, position: 'relative' }}>
                                <Box sx={{ 
                                  width: 28, 
                                  height: 28, 
                                  borderRadius: '50%', 
                                  bgcolor: 'primary.main', 
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: 14,
                                  zIndex: 1
                                }}>
                                  {idx + 1}
                                </Box>
                                
                                {idx < detailedResults.repairPlan.steps.length - 1 && (
                                  <Box sx={{ 
                                    position: 'absolute', 
                                    left: 14, 
                                    top: 28, 
                                    width: 1, 
                                    height: 'calc(100% - 14px)', 
                                    bgcolor: 'divider' 
                                  }} />
                                )}
                                
                                <Box sx={{ ml: 2, flex: 1 }}>
                                  <Typography variant="body1">
                                    {step.description}
                                  </Typography>
                                  <Box sx={{ display: 'flex', mt: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      Estimated time: {step.estimatedTime} {step.estimatedTime === 1 ? 'hour' : 'hours'}
                                    </Typography>
                                    
                                    <Box sx={{ ml: 'auto', display: 'flex' }}>
                                      {step.partReplacement && (
                                        <Chip size="small" label="Replacement" sx={{ mr: 1, bgcolor: '#e3f2fd', color: '#1976d2' }} />
                                      )}
                                      {step.paintRequired && (
                                        <Chip size="small" label="Paint" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  )}
                  
                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/vehicles/${selectedVehicle._id}`)}
                    >
                      View Vehicle Details
                    </Button>
                    
                    <Button
                      variant="contained"
                      color={detailedResults.detailedReport?.overallSeverity === 'High' ? "error" : "primary"}
                      startIcon={<AddTask />}
                      onClick={() => navigate(`/incidents/new?vehicleId=${selectedVehicle._id}&type=Damage Assessment&severity=${detailedResults.detailedReport?.overallSeverity || 'Medium'}`)}
                    >
                      Create Damage Report
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default DamageAnalysisPage; 