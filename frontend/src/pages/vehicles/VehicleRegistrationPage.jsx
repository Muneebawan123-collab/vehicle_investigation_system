import React, { useState, useEffect, useCallback } from 'react';
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
  const [formErrors, setFormErrors] = useState({});
  const { user, isAuthenticated, hasRole } = useAuth();

  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, user, hasRole: user?.role });
    
    if (!isAuthenticated) {
      message.error('Please log in to register a vehicle');
      navigate('/login');
      return;
    }

    if (!hasRole('officer') && !hasRole('admin') && !hasRole('investigator')) {
      setFormErrors({ message: 'You do not have permission to register vehicles. Please contact an administrator.' });
    }

    // Initialize all form fields with empty values to avoid undefined errors
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
      ownerAddress: '',
      // Optional fields can also be initialized
      registrationExpiry: null,
      insuranceProvider: '',
      insurancePolicyNumber: '',
      insuranceExpiry: null
    });

    // Set page title
    document.title = 'Register Vehicle | Vehicle Investigation System';
  }, [isAuthenticated, hasRole, navigate, user, form]);

  const onFinish = useCallback(async (values) => {
    setLoading(true);
    setFormErrors({});
    console.log('Form values being submitted:', values);

    try {
      // Format dates if they exist
      const formattedValues = {
        ...values,
        registrationExpiry: values.registrationExpiry ? values.registrationExpiry.format('YYYY-MM-DD') : undefined,
        insuranceExpiry: values.insuranceExpiry ? values.insuranceExpiry.format('YYYY-MM-DD') : undefined
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/vehicles/register`,
        formattedValues,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      console.log('Vehicle registration response:', response.data);
      
      if (response.data.success) {
        message.success('Vehicle registered successfully!');
        form.resetFields();
        navigate('/vehicles');
      } else {
        // Handle case where API returns a failure status
        message.error(response.data.message || 'Failed to register vehicle');
        setFormErrors(response.data.errors || {});
      }
    } catch (error) {
      console.error('Vehicle registration error:', error);
      
      if (error.response && error.response.data) {
        message.error(error.response.data.message || 'Failed to register vehicle');
        
        // If there are validation errors, mark the fields
        if (error.response.data.errors) {
          setFormErrors(error.response.data.errors);
        }
      } else {
        message.error('An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  }, [form, navigate]);

  if (formErrors.message) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error"
          description={formErrors.message}
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
      minHeight: 'calc(100vh - 80px)',
      position: 'relative',
      zIndex: 1
    }}>
      <div style={{ 
        maxWidth: 800, 
        margin: '0 auto',
        padding: '32px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <h1 style={{ marginBottom: '32px', fontSize: '28px' }}>
          <CarOutlined style={{ marginRight: '12px' }} /> Register New Vehicle
        </h1>
        
        {formErrors.message && (
          <Alert
            message="Error"
            description={formErrors.message}
            type="error"
            showIcon
            style={{ marginBottom: '24px' }}
            closable
          />
        )}
        
        <Card 
          title="Register New Vehicle" 
          variant="outlined"
          style={{ maxWidth: 800, margin: '0 auto' }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              status: 'active'
            }}
          >
            <h3 style={{ marginBottom: '16px', fontSize: '18px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>Vehicle Information</h3>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="licensePlate"
                  label="License Plate"
                  rules={[
                    { required: true, message: 'Please enter the license plate' },
                    { pattern: /^[A-Z0-9-]+$/, message: 'Please enter a valid license plate (letters, numbers, and hyphens only)' }
                  ]}
                  tooltip="License plate of the vehicle"
                >
                  <Input 
                    placeholder="e.g., ABC-123" 
                    maxLength={20}
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
                    { required: true, message: 'Please enter the VIN' },
                    { pattern: /^[A-HJ-NPR-Z0-9]{17}$/, message: 'Please enter a valid 17-character VIN' }
                  ]}
                  tooltip="Vehicle Identification Number (17 characters)"
                >
                  <Input 
                    placeholder="Enter 17-character VIN"
                    maxLength={17}
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
                size="large"
                disabled={!isAuthenticated || (!hasRole('officer') && !hasRole('admin') && !hasRole('investigator'))}
                style={{ marginTop: '24px', height: '48px', fontSize: '16px' }}
                icon={<CarOutlined />}
              >
                Register Vehicle
              </Button>
              <Button 
                htmlType="button" 
                onClick={() => form.resetFields()}
                style={{ marginTop: '24px', marginLeft: '16px' }}
                disabled={loading}
              >
                Reset Form
              </Button>
            </Form.Item>
            
            {!isAuthenticated && (
              <Alert 
                message="Authentication Required" 
                description="You need to login to register a vehicle" 
                type="warning" 
                showIcon 
              />
            )}
            
            {isAuthenticated && !hasRole('officer') && !hasRole('admin') && !hasRole('investigator') && (
              <Alert 
                message="Permission Required" 
                description="You don't have permission to register vehicles. Please contact an administrator." 
                type="warning" 
                showIcon 
              />
            )}
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default VehicleRegistrationPage; 