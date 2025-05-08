import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, Table, Tag, Button, Space, Input, 
  Select, DatePicker, Spin, Alert, Typography,
  Tabs, Badge, Statistic, Row, Col
} from 'antd';
import { 
  SearchOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  FileSearchOutlined,
  ExclamationCircleOutlined,
  FileDoneOutlined
} from '@ant-design/icons';
import { incidentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const OfficerReviewPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState([null, null]);

  // Tabs for different status categories
  const [activeTab, setActiveTab] = useState('pending');

  // Ensure the user is an officer
  useEffect(() => {
    if (currentUser && currentUser.role !== 'officer') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Fetch incidents
  useEffect(() => {
    fetchIncidents();
  }, []);

  // Apply filters when data or filters change
  useEffect(() => {
    applyFilters();
  }, [incidents, searchText, filterType, dateRange, activeTab]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all incidents
      const response = await incidentService.getAllIncidents();
      console.log('Fetched incidents:', response.data);
      
      // Filter incidents with investigation reports
      const incidentsWithReports = response.data.filter(
        incident => incident?.caseFile?.investigationReport
      );
      
      // Count by status
      const pendingCount = incidentsWithReports.filter(
        incident => incident?.caseFile?.investigationReport?.status === 'submitted'
      ).length;
      
      const completedCount = incidentsWithReports.filter(
        incident => ['reviewed', 'approved', 'rejected'].includes(
          incident?.caseFile?.investigationReport?.status
        )
      ).length;
      
      setPendingReviewCount(pendingCount);
      setReviewedCount(completedCount);
      setIncidents(incidentsWithReports);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      setError('Failed to fetch incidents: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...incidents];
    
    // Filter by tab (status)
    if (activeTab === 'pending') {
      filtered = filtered.filter(incident => 
        incident?.caseFile?.investigationReport?.status === 'submitted'
      );
    } else if (activeTab === 'reviewed') {
      filtered = filtered.filter(incident => 
        ['reviewed', 'approved', 'rejected'].includes(
          incident?.caseFile?.investigationReport?.status
        )
      );
    }
    
    // Apply text search
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(incident => 
        incident.title?.toLowerCase().includes(searchLower) ||
        incident.description?.toLowerCase().includes(searchLower) ||
        incident.incidentNumber?.toLowerCase().includes(searchLower) ||
        (incident.vehicle && 
          (`${incident.vehicle.make} ${incident.vehicle.model} ${incident.vehicle.licensePlate}`).toLowerCase().includes(searchLower)
        )
      );
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(incident => incident.type === filterType || incident.incidentType === filterType);
    }
    
    // Apply date range filter
    if (dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      filtered = filtered.filter(incident => {
        const incidentDate = dayjs(incident.date || incident.dateTime || incident.createdAt);
        return incidentDate.isAfter(startDate) && incidentDate.isBefore(endDate);
      });
    }
    
    setFilteredIncidents(filtered);
  };

  const handleRowClick = (record) => {
    navigate(`/incidents/${record._id}`);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'incidentNumber',
      key: 'incidentNumber',
      render: (text, record) => text || (record._id ? record._id.substring(0, 8) + '...' : 'N/A')
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text, record) => text || record.incidentType || 'N/A'
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text, record) => formatDate(text || record.dateTime || record.createdAt)
    },
    {
      title: 'Vehicle',
      key: 'vehicle',
      render: (_, record) => (
        record.vehicle ? 
          `${record.vehicle.make} ${record.vehicle.model} (${record.vehicle.licensePlate})` : 
          'N/A'
      )
    },
    {
      title: 'Report Status',
      key: 'reportStatus',
      render: (_, record) => {
        const status = record?.caseFile?.investigationReport?.status;
        let color = 'default';
        
        if (status === 'submitted') color = 'warning';
        else if (status === 'reviewed') color = 'processing';
        else if (status === 'approved') color = 'success';
        else if (status === 'rejected') color = 'error';
        
        return (
          <Tag color={color}>
            {status ? status.toUpperCase() : 'N/A'}
          </Tag>
        );
      }
    },
    {
      title: 'Submitted By',
      key: 'submittedBy',
      render: (_, record) => {
        const submittedBy = record?.caseFile?.investigationReport?.submittedBy;
        
        if (!submittedBy) return 'N/A';
        
        return typeof submittedBy === 'object' ? 
          submittedBy.name || 'Unknown' : 
          'ID: ' + submittedBy;
      }
    },
    {
      title: 'Submitted On',
      key: 'submittedOn',
      render: (_, record) => formatDate(record?.caseFile?.investigationReport?.submittedAt)
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            size="small"
            icon={<FileSearchOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/incidents/${record._id}`);
            }}
          >
            View
          </Button>
          {record?.caseFile?.investigationReport?.status === 'submitted' && (
            <Button
              type="default"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/incidents/${record._id}?tab=investigation`);
              }}
            >
              Review
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (!currentUser || currentUser.role !== 'officer') {
    return (
      <div style={{ padding: '24px', paddingTop: '100px' }}>
        <Alert
          message="Unauthorized"
          description="You must be an officer to access this page."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', paddingTop: '100px' }}>
      <Title level={2}>Officer Review Dashboard</Title>
      <Text>Review investigation reports and take appropriate actions</Text>
      
      <Row gutter={16} style={{ marginTop: '20px', marginBottom: '20px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Pending Reviews"
              value={pendingReviewCount}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
              suffix="reports"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Reviewed Reports"
              value={reviewedCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<FileDoneOutlined />}
              suffix="reports"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Reports"
              value={incidents.length}
              prefix={<FileSearchOutlined />}
              suffix="reports"
            />
          </Card>
        </Col>
      </Row>
      
      <Card 
        title="Investigation Reports" 
        style={{ marginBottom: 16 }}
        extra={
          <Button 
            type="primary" 
            icon={<SearchOutlined />}
            onClick={() => navigate('/incidents')}
          >
            All Incidents
          </Button>
        }
      >
        {/* Filter controls */}
        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Input
            placeholder="Search incidents"
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
            suffix={<SearchOutlined />}
          />
          
          <Select
            placeholder="Incident Type"
            style={{ width: 150 }}
            onChange={setFilterType}
            defaultValue="all"
          >
            <Option value="all">All Types</Option>
            <Option value="theft">Theft</Option>
            <Option value="accident">Accident</Option>
            <Option value="vandalism">Vandalism</Option>
            <Option value="traffic_violation">Traffic Violation</Option>
            <Option value="dui">DUI</Option>
            <Option value="abandoned">Abandoned</Option>
            <Option value="suspicious_activity">Suspicious Activity</Option>
            <Option value="other">Other</Option>
          </Select>
          
          <DatePicker.RangePicker
            onChange={setDateRange}
            style={{ width: 300 }}
          />
        </div>
        
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          tabBarExtraContent={
            <Button 
              type="default"
              icon={<ExclamationCircleOutlined />}
              onClick={fetchIncidents}
              loading={loading}
            >
              Refresh
            </Button>
          }
        >
          <TabPane 
            tab={
              <span>
                <Badge count={pendingReviewCount} offset={[15, 0]}>
                  <ClockCircleOutlined /> Pending Review
                </Badge>
              </span>
            } 
            key="pending"
          >
            <Table
              columns={columns}
              dataSource={filteredIncidents}
              rowKey="_id"
              loading={loading}
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: 'pointer' }
              })}
              locale={{
                emptyText: loading ? 'Loading...' : (error ? error : 'No incidents found')
              }}
            />
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <FileDoneOutlined /> Reviewed Reports
              </span>
            } 
            key="reviewed"
          >
            <Table
              columns={columns}
              dataSource={filteredIncidents}
              rowKey="_id"
              loading={loading}
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: 'pointer' }
              })}
              locale={{
                emptyText: loading ? 'Loading...' : (error ? error : 'No reviewed reports found')
              }}
            />
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <FileSearchOutlined /> All Reports
              </span>
            } 
            key="all"
          >
            <Table
              columns={columns}
              dataSource={filteredIncidents}
              rowKey="_id"
              loading={loading}
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: 'pointer' }
              })}
              locale={{
                emptyText: loading ? 'Loading...' : (error ? error : 'No reports found')
              }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default OfficerReviewPage; 