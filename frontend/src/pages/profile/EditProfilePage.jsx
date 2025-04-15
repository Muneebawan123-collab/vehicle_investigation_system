import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Form, Input, Button, Card, message, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';

const EditProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Calculate profile completion percentage
  const profileCompletion = useMemo(() => {
    if (!user) return { percent: 0, missingFields: [] };

    // Define required fields and check which ones are completed
    const fields = [
      { name: 'name', label: 'Name', completed: !!user.name },
      { name: 'email', label: 'Email', completed: !!user.email },
      { name: 'phone', label: 'Phone', completed: !!user.phone },
      { name: 'address', label: 'Address', completed: !!user.address },
      { name: 'department', label: 'Department', completed: !!user.department }
    ];

    const completedFields = fields.filter(field => field.completed);
    const percent = Math.round((completedFields.length / fields.length) * 100);
    const missingFields = fields.filter(field => !field.completed);

    return { percent, missingFields };
  }, [user]);

  const onFinish = async (values) => {
    try {
      await updateProfile(values);
      message.success('Profile updated successfully');
      navigate('/profile');
    } catch (error) {
      message.error('Failed to update profile');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card title="Edit Profile">
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Profile Completion: {profileCompletion.percent}%</span>
            {profileCompletion.missingFields.length > 0 && (
              <span style={{ color: '#999' }}>
                Complete all fields for 100% profile completion
              </span>
            )}
          </div>
          <Progress 
            percent={profileCompletion.percent} 
            status={profileCompletion.percent === 100 ? 'success' : 'active'} 
          />
          
          {profileCompletion.missingFields.length > 0 && (
            <div style={{ marginTop: 8, color: '#1890ff' }}>
              Missing: {profileCompletion.missingFields.map(f => f.label).join(', ')}
            </div>
          )}
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            name: user?.name,
            email: user?.email,
            phone: user?.phone,
            address: user?.address,
            department: user?.department
          }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { required: true, message: 'Please input your phone number!' },
              { pattern: /^[0-9-+()\s]+$/, message: 'Please enter a valid phone number!' }
            ]}
          >
            <Input placeholder="e.g., +1 (123) 456-7890" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please input your address!' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="department"
            label="Department"
            rules={[{ required: true, message: 'Please input your department!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update Profile
            </Button>
            <Button type="default" style={{ marginLeft: 8 }} onClick={() => navigate('/profile')}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditProfilePage; 