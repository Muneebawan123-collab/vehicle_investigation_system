import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, Result, message, Typography } from 'antd';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeftOutlined, ScanOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

const VehicleScanPage = () => {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    // If an ID is provided in the URL, fetch that vehicle's details
    if (id) {
      fetchVehicleDetails(id);
    }
    
    return () => {
      // Clean up scanner on component unmount
      if (scanner) {
        try {
          scanner.clear();
        } catch (error) {
          console.error('Error clearing scanner:', error);
        }
      }
    };
  }, [id]);

  const fetchVehicleDetails = async (vehicleId) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!vehicleId) {
        setError('Invalid QR code: No vehicle ID detected');
        setLoading(false);
        return;
      }
      
      console.log('Fetching vehicle details for ID:', vehicleId);
      const apiUrl = `/api/vehicles/scan/${vehicleId}`;
      console.log('API URL:', apiUrl);
      
      const response = await axios.get(apiUrl);
      console.log('API Response:', response.data);
      
      if (response.data.success && response.data.vehicle) {
        setVehicle(response.data.vehicle);
      } else {
        setError('Failed to fetch vehicle details: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        
        if (error.response.status === 404) {
          setError('Vehicle not found. This QR code may be invalid or for a deleted vehicle.');
        } else if (error.response.status === 400) {
          setError('Invalid vehicle ID format. Please scan a valid QR code.');
        } else {
          setError(`Error ${error.response.status}: ${error.response.data.message || 'Unknown error'}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        setError('Network error: Could not connect to the server. Please check your internet connection.');
      } else {
        // Something else caused the error
        setError('Error fetching vehicle details: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const startScanner = () => {
    setIsScanning(true);
    
    const qrCodeScanner = new Html5QrcodeScanner('qr-reader', { 
      fps: 10, 
      qrbox: 250,
      rememberLastUsedCamera: true,
      aspectRatio: 1.0,
    });
    
    const onScanSuccess = (decodedText) => {
      // Extract the vehicle ID from the decoded URL
      console.log('QR Code detected, data:', decodedText);
      
      // The decodedText could be a full URL or just an ID
      let scannedVehicleId;
      
      if (decodedText.includes('/vehicles/scan/')) {
        // It's a URL, extract the ID
        const urlParts = decodedText.split('/');
        scannedVehicleId = urlParts[urlParts.length - 1];
      } else if (decodedText.match(/^[0-9a-fA-F]{24}$/)) {
        // It looks like a MongoDB ObjectId (24 hex characters)
        scannedVehicleId = decodedText;
      } else {
        // Try to extract an ID from the text
        const idMatch = decodedText.match(/([0-9a-fA-F]{24})/);
        scannedVehicleId = idMatch ? idMatch[1] : decodedText;
      }
      
      console.log('Extracted vehicle ID:', scannedVehicleId);
      
      // Stop scanning
      qrCodeScanner.clear();
      setIsScanning(false);
      
      // Fetch the vehicle details
      fetchVehicleDetails(scannedVehicleId);
    };
    
    const onScanFailure = (error) => {
      // console.warn('QR code scan error:', error);
      // We don't need to show these errors as they happen constantly during scanning
    };
    
    qrCodeScanner.render(onScanSuccess, onScanFailure);
    setScanner(qrCodeScanner);
  };

  const stopScanner = () => {
    if (scanner) {
      scanner.clear();
      setIsScanning(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title="Error"
        subTitle={error}
        extra={[
          <Button type="primary" key="scan" onClick={() => {
            setError(null);
            startScanner();
          }}>
            Try Again
          </Button>,
          <Link to="/" key="home">
            <Button>Go Home</Button>
          </Link>,
        ]}
      />
    );
  }

  return (
    <div style={{ padding: '24px', marginTop: '64px', maxWidth: '800px', margin: '0 auto' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/">
              <Button type="text" icon={<ArrowLeftOutlined />} style={{ marginRight: '10px' }} />
            </Link>
            <Title level={3} style={{ margin: 0 }}>
              {vehicle ? `Vehicle: ${vehicle.licensePlate}` : 'Scan Vehicle QR Code'}
            </Title>
          </div>
        }
      >
        {!vehicle && !isScanning && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <ScanOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '20px' }} />
            <Title level={4}>Scan a Vehicle QR Code</Title>
            <Text>Use the camera to scan a vehicle QR code and view its details</Text>
            <div style={{ marginTop: '30px' }}>
              <Button type="primary" size="large" onClick={startScanner}>
                Start Scanner
              </Button>
            </div>
          </div>
        )}
        
        {isScanning && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div id="qr-reader" style={{ width: '100%', maxWidth: '500px' }}></div>
            <Button 
              onClick={stopScanner}
              style={{ marginTop: '20px' }}
              danger
            >
              Cancel Scanning
            </Button>
          </div>
        )}
        
        {vehicle && (
          <div>
            <Descriptions bordered column={1} style={{ marginTop: '20px' }}>
              <Descriptions.Item label="License Plate">
                {vehicle.licensePlate}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
              </Descriptions.Item>
              <Descriptions.Item label="Make">{vehicle.make}</Descriptions.Item>
              <Descriptions.Item label="Model">{vehicle.model}</Descriptions.Item>
              <Descriptions.Item label="Year">{vehicle.year}</Descriptions.Item>
              <Descriptions.Item label="Color">{vehicle.color}</Descriptions.Item>
              <Descriptions.Item label="VIN">
                {vehicle.vin}
              </Descriptions.Item>
              <Descriptions.Item label="Registration State">
                {vehicle.registrationState}
              </Descriptions.Item>
            </Descriptions>
            
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
              <Button 
                type="primary" 
                onClick={() => {
                  setVehicle(null);
                  startScanner();
                }}
              >
                Scan Another QR Code
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VehicleScanPage; 