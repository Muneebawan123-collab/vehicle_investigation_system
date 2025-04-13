import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message, Tag } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const IncidentsListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch incidents
      const response = await fetch('/api/incidents');
      const data = await response.json();
      setIncidents(data);
    } catch (error) {
      message.error('Failed to fetch incidents');
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

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: 'Vehicle',
      dataIndex: 'vehicleRegistrationNumber',
      key: 'vehicleRegistrationNumber',
      sorter: (a, b) => a.vehicleRegistrationNumber.localeCompare(b.vehicleRegistrationNumber),
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return String(record.vehicleRegistrationNumber)
          .toLowerCase()
          .includes(value.toLowerCase());
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      sorter: (a, b) => a.type.localeCompare(b.type),
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
      title: 'Date Reported',
      dataIndex: 'dateReported',
      key: 'dateReported',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.dateReported) - new Date(b.dateReported),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/incidents/${record.id}`)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="Search by vehicle registration"
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

      <Table
        columns={columns}
        dataSource={incidents}
        loading={loading}
        rowKey="id"
        pagination={{
          total: incidents.length,
          pageSize: 10,
          showTotal: (total) => `Total ${total} incidents`,
        }}
      />
    </div>
  );
};

export default IncidentsListPage; 