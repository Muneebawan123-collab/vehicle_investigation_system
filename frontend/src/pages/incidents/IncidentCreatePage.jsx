import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, message, Card, Spin, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { WarningOutlined, LoadingOutlined } from '@ant-design/icons';
import { incidentService, vehicleService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { Option } = Select;
const { TextArea } = Input;

const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const IncidentCreatePage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const { isAuthenticated, user } = useAuth();
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch vehicles for the dropdown
  useEffect(() => {
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

    if (isAuthenticated) {
      fetchVehicles();
    }
  }, [isAuthenticated]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      // Format the date
      const formattedDate = values.dateTime ? values.dateTime.toISOString() : new Date().toISOString();
      
      // Create the incident data with proper location structure
      const incidentData = {
        title: values.title,
        description: values.description,
        incidentType: values.incidentType,
        severity: values.severity,
        dateTime: formattedDate,
        location: {
          type: 'Point',
          coordinates: [0, 0],
          address: {
            street: values.location,
            city: '',
            state: '',
            zipCode: '',
            country: 'USA'
          }
        },
        vehicle: values.vehicle,
        policeReportNumber: values.policeReportNumber || "",
        status: values.status // Status will now be lowercase from the Select options
      };

      console.log("Sending incident data:", JSON.stringify(incidentData, null, 2));

      // Use the incidentService from api.js
      const response = await incidentService.createIncident(incidentData);
      
      message.success('Incident reported successfully!');
      console.log('Created incident:', response.data);
      navigate('/incidents');
    } catch (error) {
      console.error('Failed to report incident:', error);
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        
        // Handle validation errors
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          const errorMessages = error.response.data.errors.map(err => `${err.param}: ${err.msg}`).join('; ');
          setErrorMessage(`Validation Error: ${errorMessages}`);
          message.error(`Validation Error: ${errorMessages}`);
        } else {
          // Generic error
          setErrorMessage(error.response.data.message || 'Failed to report incident');
          message.error(error.response.data.message || 'Failed to report incident');
        }
      } else {
        setErrorMessage('Failed to report incident: ' + error.message);
        message.error('Failed to report incident: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h2>You must be logged in to report an incident</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px',
      paddingTop: '450px', // Fix excessive padding
      position: 'relative',
      zIndex: 0
    }}>
      <Card 
        title={<h2><WarningOutlined /> Report New Incident</h2>}
        style={{ maxWidth: 800, margin: '0 auto' }}
      >
        {errorMessage && (
          <Alert
            message="Error"
            description={errorMessage}
            type="error"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}
        
        <Form
          form={form}
          name="incident-create"
          onFinish={onFinish}
          layout="vertical"
          initialValues={{ 
            severity: 'medium',
            status: 'open',
            incidentType: 'accident'
          }}
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
              <Option value="open">Open</Option>
              <Option value="under_investigation">Under Investigation</Option>
              <Option value="pending">Pending</Option>
              <Option value="closed">Closed</Option>
              <Option value="reopened">Reopened</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
            >
              {loading ? <Spin indicator={antIcon} /> : 'Report Incident'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default IncidentCreatePage; 