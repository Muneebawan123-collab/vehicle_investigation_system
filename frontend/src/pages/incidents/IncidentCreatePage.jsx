import React, { useState } from 'react';
import { Form, Input, Button, Select, DatePicker, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { WarningOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

const IncidentCreatePage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      // Format the date
      values.dateReported = values.dateReported.toISOString();
      
      // TODO: Implement API call to create incident
      await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      message.success('Incident reported successfully!');
      navigate('/incidents');
    } catch (error) {
      message.error('Failed to report incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1>
          <WarningOutlined /> Report New Incident
        </h1>
        
        <Form
          form={form}
          name="incident-create"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="vehicleRegistrationNumber"
            label="Vehicle Registration Number"
            rules={[
              { required: true, message: 'Please input the vehicle registration number!' },
              { pattern: /^[A-Z0-9-]+$/, message: 'Please enter a valid registration number!' }
            ]}
          >
            <Input placeholder="e.g., ABC-123" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Incident Type"
            rules={[{ required: true, message: 'Please select the incident type!' }]}
          >
            <Select placeholder="Select incident type">
              <Option value="Theft">Theft</Option>
              <Option value="Accident">Accident</Option>
              <Option value="Vandalism">Vandalism</Option>
              <Option value="Traffic Violation">Traffic Violation</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateReported"
            label="Date of Incident"
            rules={[{ required: true, message: 'Please select the date!' }]}
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
            <Input placeholder="Enter incident location" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please provide a description!' },
              { min: 20, message: 'Description must be at least 20 characters!' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Provide detailed description of the incident"
            />
          </Form.Item>

          <Form.Item
            name="witnesses"
            label="Witnesses"
          >
            <TextArea
              rows={2}
              placeholder="List any witnesses (optional)"
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
            initialValue="Open"
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
            <Button type="primary" htmlType="submit" loading={loading} block>
              Report Incident
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default IncidentCreatePage; 