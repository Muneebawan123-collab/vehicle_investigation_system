import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, message, Alert, Row, Col, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CarOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const { Option } = Select;
const API_BASE_URL = 'http://localhost:5000';

const VehicleRegistrationPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isAuthenticated, hasRole } = useAuth();

  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, user, hasRole: user?.role });
    
    if (!isAuthenticated) {
      message.error('Please log in to register a vehicle');
      navigate('/login');
      return;
    }

    if (!hasRole('officer') && !hasRole('admin') && !hasRole('investigator')) {
      setError('You do not have permission to register vehicles. Please contact an administrator.');
    }

    // Initialize form with default values
    form.setFieldsValue({
      licensePlate: '',
      vin: '',
      make: '',
      model: '',
      year: '',
      color: '',
      registrationState: '',
      ownerName: '',
      ownerContact: '',
      ownerAddress: ''
    });
  }, [isAuthenticated, hasRole, navigate, user, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError(null);

      // Log form values before submission
      console.log('Form values before submission:', values);

      // Validate required fields
      if (!values.licensePlate) {
        throw new Error('License plate is required');
      }

      const licensePlate = values.licensePlate.toUpperCase().trim();
      if (!licensePlate) {
        throw new Error('License plate cannot be empty');
      }

      // Format the data to match backend model
      const vehicleData = {
        licensePlate: licensePlate,
        make: values.make?.trim() || '',
        model: values.model?.trim() || '',
        year: values.year ? parseInt(values.year) : null,
        vin: values.vin?.toUpperCase().trim() || '',
        color: values.color?.trim() || '',
        registrationState: values.registrationState?.trim() || '',
        registrationExpiry: values.registrationExpiry?.toISOString() || null,
        insuranceProvider: values.insuranceProvider?.trim() || null,
        insurancePolicyNumber: values.insurancePolicyNumber?.trim() || null,
        insuranceExpiry: values.insuranceExpiry?.toISOString() || null,
        owner: {
          name: values.ownerName?.trim() || '',
          contact: {
            phone: values.ownerContact?.trim() || '',
            email: values.ownerEmail?.trim() || '',
            address: values.ownerAddress?.trim() || ''
          }
        },
        status: 'active'
      };

      // Log the data being sent
      console.log('Sending vehicle data:', JSON.stringify(vehicleData, null, 2));

      // Make API call
      const response = await axios.post(
        `${API_BASE_URL}/api/vehicles`,
        vehicleData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('Registration successful:', response.data);
      message.success('Vehicle registered successfully!');
      form.resetFields();
      navigate('/vehicles');

    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Failed to register vehicle. ';

      if (error.response) {
        console.error('Server response:', error.response.data);
        
        if (error.response.status === 401) {
          errorMessage = 'Please log in to register a vehicle';
          navigate('/login');
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to register vehicles';
        } else if (error.response.status === 409) {
          errorMessage = `A vehicle with license plate "${values.licensePlate}" already exists`;
        } else if (error.response.status === 400) {
          errorMessage = 'Validation failed: ' + (error.response.data?.message || 'Please check all required fields');
          if (error.response.data?.errors) {
            const errors = Object.entries(error.response.data.errors)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join(', ');
            errorMessage += ` (${errors})`;
          }
        } else {
          errorMessage += error.response.data?.message || 'An unknown error occurred';
        }
      } else if (error.message) {
        errorMessage += error.message;
      }

      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px',
      marginTop: '750px',
      minHeight: 'calc(100vh - 80px)'
    }}>
      <div style={{ 
        maxWidth: 800, 
        margin: '0 auto',
        padding: '24px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginBottom: '24px' }}>
          <CarOutlined /> Register New Vehicle
        </h1>
        
        <Card>
          <Form
            form={form}
            name="vehicle-registration"
            layout="vertical"
            size="large"
            initialValues={{
              status: 'active'
            }}
            onFinish={handleSubmit}
          >
            <h3 style={{ marginBottom: '16px' }}>Vehicle Information</h3>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="licensePlate"
                  label="License Plate"
                  rules={[
                    { required: true, message: 'Please input the license plate!' },
                    { pattern: /^[A-Z0-9-]+$/, message: 'Please enter a valid license plate (letters, numbers, and hyphens only)!' }
                  ]}
                >
                  <Input 
                    placeholder="e.g., ABC-123" 
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      form.setFieldsValue({ licensePlate: value });
                    }}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="vin"
                  label="VIN"
                  rules={[
                    { required: true, message: 'Please input the VIN!' },
                    { pattern: /^[A-HJ-NPR-Z0-9]{17}$/, message: 'Please enter a valid 17-character VIN!' }
                  ]}
                >
                  <Input 
                    placeholder="Enter 17-character VIN"
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      form.setFieldsValue({ vin: value });
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="make"
                  label="Make"
                  rules={[{ required: true, message: 'Please select the make!' }]}
                >
                  <Select 
                    placeholder="Select make"
                    showSearch
                    optionFilterProp="children"
                  >
                    <Option value="Toyota">Toyota</Option>
                    <Option value="Honda">Honda</Option>
                    <Option value="Ford">Ford</Option>
                    <Option value="BMW">BMW</Option>
                    <Option value="Mercedes">Mercedes</Option>
                    <Option value="Chevrolet">Chevrolet</Option>
                    <Option value="Nissan">Nissan</Option>
                    <Option value="Hyundai">Hyundai</Option>
                    <Option value="Kia">Kia</Option>
                    <Option value="Volkswagen">Volkswagen</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="model"
                  label="Model"
                  rules={[{ required: true, message: 'Please input the model!' }]}
                >
                  <Input 
                    placeholder="e.g., Camry" 
                    onChange={(e) => {
                      const value = e.target.value;
                      form.setFieldsValue({ model: value });
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="year"
                  label="Year"
                  rules={[
                    { required: true, message: 'Please select the year!' },
                    {
                      validator: async (_, value) => {
                        if (!value) {
                          return Promise.reject('Please enter a year');
                        }
                        const year = parseInt(value);
                        const currentYear = new Date().getFullYear();
                        if (isNaN(year) || year < 1900 || year > currentYear + 1) {
                          return Promise.reject(`Year must be between 1900 and ${currentYear + 1}`);
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input type="number" placeholder="e.g., 2020" min={1900} max={new Date().getFullYear() + 1} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="color"
                  label="Color"
                  rules={[{ required: true, message: 'Please input the color!' }]}
                >
                  <Input placeholder="e.g., Black" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="registrationState"
                  label="Registration State"
                  rules={[{ required: true, message: 'Please input the registration state!' }]}
                >
                  <Input placeholder="e.g., California" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="registrationExpiry"
                  label="Registration Expiry Date"
                  rules={[{ required: false }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="insuranceProvider"
                  label="Insurance Provider"
                  rules={[{ required: false }]}
                >
                  <Input placeholder="e.g., State Farm" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="insurancePolicyNumber"
                  label="Insurance Policy Number"
                  rules={[{ required: false }]}
                >
                  <Input placeholder="Enter policy number" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="insuranceExpiry"
              label="Insurance Expiry Date"
              rules={[{ required: false }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>Owner Information</h3>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="ownerName"
                  label="Owner Name"
                  rules={[{ required: true, message: 'Please input the owner name!' }]}
                >
                  <Input placeholder="Full name of the owner" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="ownerContact"
                  label="Owner Contact"
                  rules={[
                    { required: true, message: 'Please input the owner contact!' },
                    { pattern: /^[0-9-+()\s]+$/, message: 'Please enter a valid contact number!' }
                  ]}
                >
                  <Input placeholder="Contact number" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="ownerEmail"
              label="Owner Email"
              rules={[
                { type: 'email', message: 'Please enter a valid email!' },
                { required: false }
              ]}
            >
              <Input placeholder="Owner's email address" />
            </Form.Item>

            <Form.Item
              name="ownerAddress"
              label="Owner Address"
              rules={[{ required: true, message: 'Please input the owner address!' }]}
            >
              <Input.TextArea placeholder="Owner's address" rows={4} />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                block
                disabled={!isAuthenticated || (!hasRole('officer') && !hasRole('admin') && !hasRole('investigator'))}
                style={{ marginTop: '24px' }}
              >
                Register Vehicle
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </div>
    </div>
  );
};

export default VehicleRegistrationPage; 