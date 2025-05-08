import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Spin, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

const VehicleQRCode = ({ vehicleId }) => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQRCode();
  }, [vehicleId]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/vehicles/${vehicleId}/qrcode`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setQrCode(response.data.qrCode);
      } else {
        message.error('Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      message.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `vehicle-${vehicleId}-qrcode.png`;
    
    // Append link to body, click it to trigger download, then remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQRCode = () => {
    if (!qrCode) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Vehicle QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
            }
            img {
              max-width: 300px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Vehicle QR Code</h2>
            <p>Scan this QR code to view vehicle details</p>
            <img src="${qrCode}" alt="Vehicle QR Code" />
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card
      title={<Title level={4}>Vehicle QR Code</Title>}
      style={{ width: '100%', marginBottom: '20px' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {qrCode ? (
          <>
            <img
              src={qrCode}
              alt="Vehicle QR Code"
              style={{ maxWidth: '250px', marginBottom: '20px' }}
            />
            <p>Scan this QR code to view vehicle details</p>
            <div style={{ marginTop: '16px' }}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={downloadQRCode}
                style={{ marginRight: '8px' }}
              >
                Download QR Code
              </Button>
              <Button onClick={printQRCode}>Print QR Code</Button>
            </div>
          </>
        ) : (
          <p>Failed to generate QR code. Please try again.</p>
        )}
      </div>
    </Card>
  );
};

export default VehicleQRCode; 