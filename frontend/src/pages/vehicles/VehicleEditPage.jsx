import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { CarOutlined } from '@ant-design/icons';

const { Option } = Select;

const VehicleEditPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  const fetchVehicleDetails = async () => {
    try {
      setInitialLoading(true);
      // TODO: Implement API call to fetch vehicle details
      const response = await fetch(`/api/vehicles/${id}`);
      const data = await response.json();
      form.setFieldsValue(data);
    } catch (error) {
      message.error('Failed to fetch vehicle details');
      navigate('/vehicles');
    } finally {
      setInitialLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      // TODO: Implement API call to update vehicle
      await fetch(`/api/vehicles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      message.success('Vehicle updated successfully!');
      navigate(`/vehicles/${id}`);
    } catch (error) {
      message.error('Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1>
          <CarOutlined /> Edit Vehicle
        </h1>
        
        <Form
          form={form}
          name="vehicle-edit"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="registrationNumber"
            label="Registration Number"
            rules={[
              { required: true, message: 'Please input the registration number!' },
              { pattern: /^[A-Z0-9-]+$/, message: 'Please enter a valid registration number!' }
            ]}
          >
            <Input placeholder="e.g., ABC-123" />
          </Form.Item>

          <Form.Item
            name="make"
            label="Make"
            rules={[{ required: true, message: 'Please select the make!' }]}
          >
            <Select placeholder="Select make">
              <Option value="Toyota">Toyota</Option>
              <Option value="Honda">Honda</Option>
              <Option value="Ford">Ford</Option>
              <Option value="BMW">BMW</Option>
              <Option value="Mercedes">Mercedes</Option>
              {/* Add more options as needed */}
            </Select>
          </Form.Item>

          <Form.Item
            name="model"
            label="Model"
            rules={[{ required: true, message: 'Please input the model!' }]}
          >
            <Input placeholder="e.g., Camry" />
          </Form.Item>

          <Form.Item
            name="year"
            label="Year"
            rules={[
              { required: true, message: 'Please select the year!' },
              {
                type: 'number',
                min: 1900,
                max: new Date().getFullYear(),
                message: 'Please enter a valid year!',
              },
            ]}
          >
            <Input type="number" placeholder="e.g., 2020" />
          </Form.Item>

          <Form.Item
            name="color"
            label="Color"
            rules={[{ required: true, message: 'Please input the color!' }]}
          >
            <Input placeholder="e.g., Black" />
          </Form.Item>

          <Form.Item
            name="vin"
            label="VIN"
            rules={[
              { required: true, message: 'Please input the VIN!' },
              { pattern: /^[A-HJ-NPR-Z0-9]{17}$/, message: 'Please enter a valid 17-character VIN!' }
            ]}
          >
            <Input placeholder="Enter 17-character VIN" />
          </Form.Item>

          <Form.Item
            name="ownerName"
            label="Owner Name"
            rules={[{ required: true, message: 'Please input the owner name!' }]}
          >
            <Input placeholder="Full name of the owner" />
          </Form.Item>

          <Form.Item
            name="ownerContact"
            label="Owner Contact"
            rules={[
              { required: true, message: 'Please input the owner contact!' },
              { pattern: /^[0-9-+()]+$/, message: 'Please enter a valid contact number!' }
            ]}
          >
            <Input placeholder="Contact number" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select the status!' }]}
          >
            <Select placeholder="Select status">
              <Option value="Active">Active</Option>
              <Option value="Stolen">Stolen</Option>
              <Option value="Recovered">Recovered</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Update Vehicle
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default VehicleEditPage; 