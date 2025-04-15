import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Spin, message, Modal, Alert } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { incidentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { confirm } = Modal;

const IncidentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, currentUser } = useAuth();
  
  // Check if user is admin
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchIncidentDetails();
    }
  }, [id, isAuthenticated]);

  const fetchIncidentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await incidentService.getIncidentById(id);
      console.log('Incident details:', response.data);
      setIncident(response.data);
    } catch (error) {
      console.error('Failed to fetch incident details:', error);
      setError('Failed to fetch incident details. ' + (error.response?.data?.message || error.message));
      message.error('Failed to fetch incident details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    confirm({
      title: 'Are you sure you want to delete this incident?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await incidentService.deleteIncident(id);
          message.success('Incident deleted successfully');
          navigate('/incidents');
        } catch (error) {
          console.error('Failed to delete incident:', error);
          message.error('Failed to delete incident: ' + (error.response?.data?.message || error.message));
        }
      },
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Open': 'orange',
      'In Progress': 'blue',
      'Resolved': 'green',
      'Closed': 'red'
    };
    return colors[status] || 'default';
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h2>You must be logged in to view incident details</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '24px',
        paddingTop: '100px',
        maxWidth: 1000, 
        margin: '0 auto' 
      }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={() => navigate('/incidents')} type="primary">
              Back to Incidents
            </Button>
          }
        />
      </div>
    );
  }

  if (!incident) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div style={{ 
      padding: '24px',
      paddingTop: '100px', // Add extra top padding to accommodate navbar
      position: 'relative',
      zIndex: 0
    }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/incidents')}
        style={{ marginBottom: 16 }}
      >
        Back to Incidents
      </Button>
      
      <Card
        title={`Incident: ${incident.title}`}
        style={{ maxWidth: 1000, margin: '0 auto' }}
        extra={
          isAdmin ? (
            <div>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/incidents/${id}/edit`)}
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
          ) : (
            <Alert 
              message="Read-only view" 
              description="Only administrators can edit or delete incidents" 
              type="info" 
              showIcon 
              style={{ padding: '0 12px', margin: 0 }}
            />
          )
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="ID">{incident._id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(incident.status)}>
              {incident.status}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Incident Type">{incident.incidentType}</Descriptions.Item>
          <Descriptions.Item label="Severity">{incident.severity}</Descriptions.Item>
          
          <Descriptions.Item label="Vehicle" span={2}>
            {incident.vehicle ? (
              <>
                {incident.vehicle.make} {incident.vehicle.model} ({incident.vehicle.licensePlate})
              </>
            ) : 'No vehicle information'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Date and Time" span={2}>
            {formatDate(incident.dateTime)}
          </Descriptions.Item>
          
          <Descriptions.Item label="Location" span={2}>
            {incident.location?.address || 'Unknown location'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Description" span={2}>
            {incident.description}
          </Descriptions.Item>
          
          {incident.witnesses && incident.witnesses.length > 0 && (
            <Descriptions.Item label="Witnesses" span={2}>
              <ul>
                {incident.witnesses.map((witness, index) => (
                  <li key={index}>
                    {witness.name} - {witness.contact} - {witness.statement}
                  </li>
                ))}
              </ul>
            </Descriptions.Item>
          )}
          
          {incident.policeReportNumber && (
            <Descriptions.Item label="Police Report Number" span={2}>
              {incident.policeReportNumber}
            </Descriptions.Item>
          )}
          
          <Descriptions.Item label="Reported By">
            {incident.reportedBy?.name || 'Unknown'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Created At">
            {formatDate(incident.createdAt)}
          </Descriptions.Item>
          
          {incident.updatedAt && (
            <Descriptions.Item label="Last Updated" span={2}>
              {formatDate(incident.updatedAt)}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  );
};

export default IncidentDetailsPage; 