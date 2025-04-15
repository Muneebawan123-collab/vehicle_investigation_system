import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message, Tag, Alert } from 'antd';
import { SearchOutlined, PlusOutlined, EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { incidentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const IncidentsListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState(null);
  const { isAuthenticated, currentUser } = useAuth();
  
  // Check if user is admin
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isAuthenticated) {
      fetchIncidents();
    }
  }, [isAuthenticated]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await incidentService.getAllIncidents();
      console.log('Incidents data:', response.data);
      
      // Check if the response is an array
      if (Array.isArray(response.data)) {
        setIncidents(response.data);
      } else {
        // If response is not in expected format, set empty array
        console.error('Unexpected response format:', response.data);
        setIncidents([]);
        setError('Received invalid data format from server');
      }
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      setError('Failed to fetch incidents. ' + (error.response?.data?.message || error.message));
      message.error('Failed to fetch incidents');
      // Ensure incidents is always an array even on error
      setIncidents([]);
    } finally {
      setLoading(false);
    }
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

  const filteredIncidents = incidents.filter(incident => {
    if (!searchText) return true;
    
    const searchLower = searchText.toLowerCase();
    return (
      (incident.title && incident.title.toLowerCase().includes(searchLower)) ||
      (incident.incidentType && incident.incidentType.toLowerCase().includes(searchLower))
    );
  });

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicle',
      key: 'vehicle',
      render: (vehicle) => {
        if (!vehicle) return 'N/A';
        if (typeof vehicle === 'object') {
          return `${vehicle.make || ''} ${vehicle.model || ''} (${vehicle.licensePlate || ''})`;
        }
        return vehicle;
      },
    },
    {
      title: 'Type',
      dataIndex: 'incidentType',
      key: 'incidentType',
      sorter: (a, b) => a.incidentType.localeCompare(b.incidentType),
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => (
        <Tag color={severity === 'critical' ? 'red' : severity === 'high' ? 'orange' : severity === 'medium' ? 'blue' : 'green'}>
          {severity}
        </Tag>
      ),
    },
    {
      title: 'Date Reported',
      dataIndex: 'dateTime',
      key: 'dateTime',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
      sorter: (a, b) => new Date(a.dateTime || 0) - new Date(b.dateTime || 0),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/incidents/${record._id}`)}
        >
          Details
        </Button>
      ),
    },
  ];

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h2>You must be logged in to view incidents</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px',
      paddingTop: '100px', // Add extra top padding to accommodate navbar
      position: 'relative',
      zIndex: 0
    }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="Search by title or type"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/incidents/create')}
        >
          Report New Incident
        </Button>
      </div>

      {!isAdmin && (
        <Alert
          message="Read-only Mode"
          description="You can view and report incidents, but only administrators can edit or delete them."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: '16px' }}
        />
      )}

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      <Table
        columns={columns}
        dataSource={filteredIncidents}
        loading={loading}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Total ${total} incidents`,
        }}
        locale={{
          emptyText: error ? 'Error loading incidents' : 'No incidents found'
        }}
        onRow={(record) => ({
          onClick: () => navigate(`/incidents/${record._id}`)
        })}
      />
    </div>
  );
};

export default IncidentsListPage; 