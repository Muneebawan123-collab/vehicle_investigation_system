import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Spin, message, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { confirm } = Modal;

const IncidentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidentDetails();
  }, [id]);

  const fetchIncidentDetails = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch incident details
      const response = await fetch(`/api/incidents/${id}`);
      const data = await response.json();
      setIncident(data);
    } catch (error) {
      message.error('Failed to fetch incident details');
      navigate('/incidents');
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
          // TODO: Implement API call to delete incident
          await fetch(`/api/incidents/${id}`, {
            method: 'DELETE',
          });
          message.success('Incident deleted successfully');
          navigate('/incidents');
        } catch (error) {
          message.error('Failed to delete incident');
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!incident) {
    return null;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={`Incident Details - ${incident.type}`}
        extra={
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
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="ID">{incident.id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(incident.status)}>
              {incident.status}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Vehicle Registration" span={2}>
            {incident.vehicleRegistrationNumber}
          </Descriptions.Item>
          
          <Descriptions.Item label="Type">{incident.type}</Descriptions.Item>
          <Descriptions.Item label="Date Reported">
            {new Date(incident.dateReported).toLocaleString()}
          </Descriptions.Item>
          
          <Descriptions.Item label="Location" span={2}>
            {incident.location}
          </Descriptions.Item>
          
          <Descriptions.Item label="Description" span={2}>
            {incident.description}
          </Descriptions.Item>
          
          {incident.witnesses && (
            <Descriptions.Item label="Witnesses" span={2}>
              {incident.witnesses}
            </Descriptions.Item>
          )}
          
          {incident.policeReportNumber && (
            <Descriptions.Item label="Police Report Number" span={2}>
              {incident.policeReportNumber}
            </Descriptions.Item>
          )}
          
          <Descriptions.Item label="Created At" span={2}>
            {new Date(incident.createdAt).toLocaleString()}
          </Descriptions.Item>
          
          {incident.updatedAt && (
            <Descriptions.Item label="Last Updated" span={2}>
              {new Date(incident.updatedAt).toLocaleString()}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  );
};

export default IncidentDetailsPage; 