import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Descriptions, Button, Space } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const UserProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <Card
        title="User Profile"
        extra={
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate('/profile/edit')}
          >
            Edit Profile
          </Button>
        }
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Name">{user.name}</Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Role">{user.role}</Descriptions.Item>
          <Descriptions.Item label="Department">{user.department || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Phone">{user.phone || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Address">{user.address || 'N/A'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default UserProfilePage; 