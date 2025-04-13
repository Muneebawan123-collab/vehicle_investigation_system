import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const VehiclesListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const fetchVehicles = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/vehicles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          page,
          limit,
          sort: '-createdAt'
        }
      });
      
      // Handle both array and paginated response formats
      const vehicles = Array.isArray(response.data) ? response.data : response.data.vehicles || [];
      const total = Array.isArray(response.data) ? response.data.length : response.data.total || 0;
      
      setVehicles(vehicles);
      setPagination({
        ...pagination,
        current: page,
        total: total
      });

      // Log for debugging
      console.log('Fetched vehicles:', vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error.response || error);
      message.error(error.response?.data?.message || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles(pagination.current, pagination.pageSize);
  }, []);

  // Add a refresh function
  const refreshVehicles = () => {
    fetchVehicles(pagination.current, pagination.pageSize);
  };

  // Add interval to refresh the list
  useEffect(() => {
    // Refresh the list every 5 seconds
    const interval = setInterval(refreshVehicles, 5000);
    return () => clearInterval(interval);
  }, [pagination.current, pagination.pageSize]);

  const handleTableChange = (newPagination, filters, sorter) => {
    fetchVehicles(newPagination.current, newPagination.pageSize);
  };

  const columns = [
    {
      title: 'Registration Number',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      sorter: true,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return String(record.licensePlate)
          .toLowerCase()
          .includes(value.toLowerCase());
      },
    },
    {
      title: 'Make',
      dataIndex: 'make',
      key: 'make',
      sorter: true,
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      sorter: true,
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{ 
          color: status === 'stolen' ? '#ff4d4f' : 
                 status === 'recovered' ? '#faad14' : 
                 status === 'active' ? '#52c41a' : '#8c8c8c'
        }}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/vehicles/${record._id}`)}
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
          placeholder="Search by registration number"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/vehicles/register')}
        >
          Register New Vehicle
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={vehicles}
        loading={loading}
        rowKey="_id"
        pagination={pagination}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default VehiclesListPage; 