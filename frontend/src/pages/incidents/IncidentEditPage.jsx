import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, message, Card, Spin, Alert } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { WarningOutlined, ArrowLeftOutlined, LoadingOutlined } from '@ant-design/icons';
import moment from 'moment';
import { incidentService, vehicleService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { Option } = Select;
const { TextArea } = Input;

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const IncidentEditPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchIncidentDetails();
      fetchVehicles();
    }
  }, [id, isAuthenticated]);

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const response = await vehicleService.getAllVehicles();
      setVehicles(response.data || []);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      message.error('Failed to load vehicles');
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchIncidentDetails = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      
      const response = await incidentService.getIncidentById(id);
      const data = response.data;

      console.log('Incident data for editing:', data);
      
      // Convert date string to moment object for DatePicker
      const incidentDate = data.dateTime ? moment(data.dateTime) : null;
      
      // Format the data for the form
      form.setFieldsValue({
        title: data.title,
        description: data.description,
        incidentType: data.incidentType,
        severity: data.severity,
        dateTime: incidentDate,
        location: data.location?.address || '',
        vehicle: data.vehicle?._id || data.vehicle, // Handle both populated and non-populated vehicle
        policeReportNumber: data.policeReportNumber || '',
        status: data.status || 'Open'
      });
    } catch (error) {
      console.error('Failed to fetch incident details:', error);
      setError('Failed to fetch incident details. ' + (error.response?.data?.message || error.message));
      message.error('Failed to fetch incident details');
    } finally {
      setInitialLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      
      // Format the date
      const formattedDate = values.dateTime ? values.dateTime.toISOString() : new Date().toISOString();
      
      // Create the incident data
      const incidentData = {
        title: values.title,
        description: values.description,
        incidentType: values.incidentType,
        severity: values.severity,
        dateTime: formattedDate,
        location: {
          type: 'Point',
          coordinates: [0, 0], // Default coordinates
          address: values.location
        },
        vehicle: values.vehicle,
        policeReportNumber: values.policeReportNumber || '',
        status: values.status
      };
      
      console.log('Updating incident with data:', incidentData);
      
      // Make API call using incidentService
      const response = await incidentService.updateIncident(id, incidentData);
      
      message.success('Incident updated successfully!');
      navigate(`/incidents/${id}`);
    } catch (error) {
      console.error('Failed to update incident:', error);
      setError('Failed to update incident: ' + (error.response?.data?.message || error.message));
      message.error('Failed to update incident: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h2>You must be logged in to edit incidents</h2>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        paddingTop: '60px'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error && !form.getFieldValue('title')) {
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

  return (
    <div style={{ 
      padding: '24px',
      paddingTop: '100px', // Add extra top padding to accommodate navbar
      position: 'relative',
      zIndex: 0
    }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(`/incidents/${id}`)}
        style={{ marginBottom: 16 }}
      >
        Back to Incident Details
      </Button>
      
      <Card 
        title={<h2><WarningOutlined /> Edit Incident</h2>}
        style={{ maxWidth: 800, margin: '0 auto' }}
      >
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}
        
        <Form
          form={form}
          name="incident-edit"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="Incident Title"
            rules={[{ required: true, message: 'Please enter a title for the incident' }]}
          >
            <Input placeholder="Brief description of the incident" />
          </Form.Item>

          <Form.Item
            name="vehicle"
            label="Vehicle"
            rules={[{ required: true, message: 'Please select a vehicle' }]}
          >
            <Select 
              placeholder="Select a vehicle" 
              loading={loadingVehicles}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {vehicles.map(vehicle => (
                <Option key={vehicle._id} value={vehicle._id}>
                  {vehicle.licensePlate} - {vehicle.make} {vehicle.model}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="incidentType"
            label="Incident Type"
            rules={[{ required: true, message: 'Please select the incident type!' }]}
          >
            <Select placeholder="Select incident type">
              <Option value="accident">Accident</Option>
              <Option value="theft">Theft</Option>
              <Option value="vandalism">Vandalism</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="severity"
            label="Severity"
            rules={[{ required: true, message: 'Please select the severity!' }]}
          >
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="critical">Critical</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateTime"
            label="Date and Time of Incident"
            rules={[{ required: true, message: 'Please select the date and time!' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              showTime
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Form.Item>

          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: 'Please input the location!' }]}
          >
            <Input placeholder="Address or location description" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please provide a description!' }]}
          >
            <TextArea
              rows={4}
              placeholder="Detailed description of the incident"
            />
          </Form.Item>

          <Form.Item
            name="policeReportNumber"
            label="Police Report Number"
          >
            <Input placeholder="Enter police report number (if applicable)" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select the status!' }]}
          >
            <Select>
              <Option value="Open">Open</Option>
              <Option value="In Progress">In Progress</Option>
              <Option value="Resolved">Resolved</Option>
              <Option value="Closed">Closed</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
            >
              {loading ? <Spin indicator={antIcon} /> : 'Update Incident'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default IncidentEditPage; 