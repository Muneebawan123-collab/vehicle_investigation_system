import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Spin, message, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { confirm } = Modal;
const API_BASE_URL = 'http://localhost:5000';

const VehicleDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/vehicles/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Vehicle details response:', response.data);
      setVehicle(response.data);
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      message.error('Failed to fetch vehicle details');
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    confirm({
      title: 'Are you sure you want to delete this vehicle?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE_URL}/api/vehicles/${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          message.success('Vehicle deleted successfully');
          navigate('/vehicles');
        } catch (error) {
          console.error('Error deleting vehicle:', error);
          message.error('Failed to delete vehicle');
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

  return (
    <div style={{ padding: '24px', marginTop: '64px' }}>
      <Card
        title={`Vehicle Details - ${vehicle.licensePlate}`}
        extra={
          <div>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/vehicles/${id}/edit`)}
              style={{ marginRight: 8 }}
            >
              Edit
            </Button>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="License Plate">
            {vehicle.licensePlate}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={vehicle.status === 'stolen' ? 'red' : vehicle.status === 'active' ? 'green' : 'orange'}>
              {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Make">{vehicle.make}</Descriptions.Item>
          <Descriptions.Item label="Model">{vehicle.model}</Descriptions.Item>
          <Descriptions.Item label="Year">{vehicle.year}</Descriptions.Item>
          <Descriptions.Item label="Color">{vehicle.color}</Descriptions.Item>
          <Descriptions.Item label="VIN" span={2}>
            {vehicle.vin}
          </Descriptions.Item>
          <Descriptions.Item label="Registration State">
            {vehicle.registrationState}
          </Descriptions.Item>
          <Descriptions.Item label="Registration Expiry">
            {vehicle.registrationExpiry ? new Date(vehicle.registrationExpiry).toLocaleDateString() : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Owner Name" span={2}>
            {vehicle.owner?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Owner Contact" span={2}>
            {vehicle.owner?.contact?.phone}
          </Descriptions.Item>
          <Descriptions.Item label="Owner Email" span={2}>
            {vehicle.owner?.contact?.email || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Owner Address" span={2}>
            {vehicle.owner?.contact?.address}
          </Descriptions.Item>
          <Descriptions.Item label="Insurance Provider" span={2}>
            {vehicle.insuranceProvider || 'N/A'}
          </Descriptions.Item>
          {vehicle.insurancePolicyNumber && (
            <Descriptions.Item label="Insurance Policy Number" span={2}>
              {vehicle.insurancePolicyNumber}
            </Descriptions.Item>
          )}
          {vehicle.insuranceExpiry && (
            <Descriptions.Item label="Insurance Expiry" span={2}>
              {new Date(vehicle.insuranceExpiry).toLocaleDateString()}
            </Descriptions.Item>
          )}
          {vehicle.status === 'stolen' && (
            <>
              <Descriptions.Item label="Theft Report Date" span={2}>
                {vehicle.theftReportDate ? new Date(vehicle.theftReportDate).toLocaleDateString() : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Theft Location" span={2}>
                {vehicle.theftLocation || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Police Report Number" span={2}>
                {vehicle.policeReportNumber || 'N/A'}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>
    </div>
  );
};

export default VehicleDetailsPage; 