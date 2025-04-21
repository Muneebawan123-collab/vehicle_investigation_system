import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, DatePicker, Select, message, Card, Spin } from 'antd';
import moment from 'moment';
import axios from 'axios';

const { Option } = Select;
const API_BASE_URL = '';  // Empty string to use relative URLs

const VehicleEditPage = () => {
  console.log('VehicleEditPage component rendering');
  const { id } = useParams();
  console.log('Vehicle ID from route params:', id);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('VehicleEditPage useEffect called with ID:', id);
    fetchVehicleDetails();
  }, [id]);

  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching vehicle details for ID:', id);
      
      // Make sure we have a valid ID
      if (!id) {
        console.error('Missing vehicle ID');
        message.error('Vehicle ID is missing');
        navigate('/vehicles');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        message.error('Authentication required');
        navigate('/login');
        return;
      }
      
      console.log(`Making API request to: /api/vehicles/${id}`);
      
      const response = await axios.get(`/api/vehicles/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.data) {
        throw new Error('No data received from API');
      }
      
      console.log('Vehicle details response:', response.data);
      const vehicle = response.data;
      
      // Format the dates for the form
      const formData = {
        ...vehicle,
        registrationExpiry: vehicle.registrationExpiry ? moment(vehicle.registrationExpiry) : null,
        insuranceExpiry: vehicle.insuranceExpiry ? moment(vehicle.insuranceExpiry) : null,
        theftReportDate: vehicle.theftReportDate ? moment(vehicle.theftReportDate) : null
      };
      
      console.log('Setting form fields with data:', formData);
      form.setFieldsValue(formData);
      
      console.log('Form fields set successfully');
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', error.response?.data || 'No response data');
      
      let errorMessage = 'Failed to fetch vehicle details';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Vehicle not found';
        } else if (error.response.status === 401) {
          errorMessage = 'You are not authorized to access this vehicle';
          navigate('/login');
          return;
        } else {
          errorMessage += `: ${error.response?.data?.message || error.message}`;
        }
      } else if (error.request) {
        errorMessage = 'No response received from server. Please check your connection.';
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      message.error(errorMessage);
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      console.log('Form submitted with values:', values);
      
      // Validate that we have an ID
      if (!id) {
        console.error('Missing vehicle ID');
        message.error('Vehicle ID is missing');
        return;
      }
      
      // Convert moment objects to ISO strings for dates
      const formattedValues = {
        ...values,
        registrationExpiry: values.registrationExpiry?.toISOString() || null,
        insuranceExpiry: values.insuranceExpiry?.toISOString() || null,
        theftReportDate: values.theftReportDate?.toISOString() || null
      };
      
      console.log('Formatted values for API:', formattedValues);

      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        message.error('Authentication required');
        navigate('/login');
        return;
      }
      
      console.log(`Making API PUT request to: /api/vehicles/${id}`);
      
      const response = await axios.put(`/api/vehicles/${id}`, formattedValues, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Update response:', response.data);
      message.success('Vehicle updated successfully');
      
      // Redirect back to the details page
      navigate(`/vehicles/${id}`);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', error.response?.data || 'No response data');
      
      let errorMessage = 'Failed to update vehicle';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Vehicle not found';
        } else if (error.response.status === 401) {
          errorMessage = 'You are not authorized to update this vehicle';
          navigate('/login');
          return;
        } else if (error.response.status === 400) {
          errorMessage = `Validation error: ${error.response.data?.message || 'Please check the form fields'}`;
        } else {
          errorMessage += `: ${error.response.data?.message || error.message}`;
        }
      } else if (error.request) {
        errorMessage = 'No response received from server. Please check your connection.';
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      message.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', marginTop: '64px' }}>
      <Card title="Edit Vehicle">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            status: 'active'
          }}
        >
          <Form.Item
            name="licensePlate"
            label="License Plate"
            rules={[{ required: true, message: 'Please enter the license plate' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="vin"
            label="VIN"
            rules={[{ required: true, message: 'Please enter the VIN' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="make"
            label="Make"
            rules={[{ required: true, message: 'Please enter the make' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="model"
            label="Model"
            rules={[{ required: true, message: 'Please enter the model' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="year"
            label="Year"
            rules={[{ required: true, message: 'Please enter the year' }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="color"
            label="Color"
            rules={[{ required: true, message: 'Please enter the color' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="registrationState"
            label="Registration State"
            rules={[{ required: true, message: 'Please enter the registration state' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="registrationExpiry"
            label="Registration Expiry"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="ownerName"
            label="Owner Name"
            rules={[{ required: true, message: 'Please enter the owner name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="ownerContact"
            label="Owner Contact"
            rules={[{ required: true, message: 'Please enter the owner contact' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="ownerEmail"
            label="Owner Email"
          >
            <Input type="email" />
          </Form.Item>

          <Form.Item
            name="ownerAddress"
            label="Owner Address"
            rules={[{ required: true, message: 'Please enter the owner address' }]}
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item
            name="insuranceProvider"
            label="Insurance Provider"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="insurancePolicyNumber"
            label="Insurance Policy Number"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="insuranceExpiry"
            label="Insurance Expiry"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select the status' }]}
          >
            <Select>
              <Option value="active">Active</Option>
              <Option value="stolen">Stolen</Option>
              <Option value="recovered">Recovered</Option>
              <Option value="impounded">Impounded</Option>
            </Select>
          </Form.Item>

          {/* Additional fields for stolen vehicles */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}
          >
            {({ getFieldValue }) =>
              getFieldValue('status') === 'stolen' ? (
                <>
                  <Form.Item
                    name="theftReportDate"
                    label="Theft Report Date"
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    name="theftLocation"
                    label="Theft Location"
                  >
                    <Input.TextArea />
                  </Form.Item>

                  <Form.Item
                    name="policeReportNumber"
                    label="Police Report Number"
                  >
                    <Input />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update Vehicle
            </Button>
            <Button 
              style={{ marginLeft: 8 }} 
              onClick={() => navigate(`/vehicles/${id}`)}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default VehicleEditPage; 