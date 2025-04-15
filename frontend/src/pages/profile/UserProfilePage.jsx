import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Descriptions, Button, Space, Progress, Alert, Divider } from 'antd';
import { EditOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const UserProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Calculate profile completion percentage
  const profileCompletion = useMemo(() => {
    if (!user) return { percent: 0, missingFields: [] };

    // Define required fields and check which ones are completed
    const fields = [
      { name: 'name', label: 'Name', completed: !!user.name },
      { name: 'email', label: 'Email', completed: !!user.email },
      { name: 'role', label: 'Role', completed: !!user.role },
      { name: 'department', label: 'Department', completed: !!user.department },
      { name: 'phone', label: 'Phone Number', completed: !!user.phone },
      { name: 'address', label: 'Address', completed: !!user.address }
    ];

    const completedFields = fields.filter(field => field.completed);
    const percent = Math.round((completedFields.length / fields.length) * 100);
    const missingFields = fields.filter(field => !field.completed);

    return { percent, fields, missingFields, completedFields };
  }, [user]);

  const getProgressStatus = (percent) => {
    if (percent === 100) return 'success';
    if (percent >= 70) return 'active';
    if (percent >= 30) return 'normal';
    return 'exception';
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <Card
        title={
          <Space>
            <UserOutlined />
            <span>User Profile</span>
          </Space>
        }
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
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 'bold' }}>Profile Completion: {profileCompletion.percent}%</span>
            {profileCompletion.percent === 100 && (
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <span style={{ color: '#52c41a' }}>Complete</span>
              </Space>
            )}
          </div>
          <Progress 
            percent={profileCompletion.percent} 
            status={getProgressStatus(profileCompletion.percent)}
            strokeWidth={8}
          />
          
          {profileCompletion.percent < 100 && (
            <Alert
              message="Complete Your Profile"
              description={
                <div>
                  <p>Please fill in the following information to complete your profile:</p>
                  <ul>
                    {profileCompletion.missingFields.map(field => (
                      <li key={field.name}>{field.label}</li>
                    ))}
                  </ul>
                  <Button 
                    type="primary" 
                    onClick={() => navigate('/profile/edit')}
                    style={{ marginTop: 8 }}
                  >
                    Complete Profile
                  </Button>
                </div>
              }
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>

        <Divider />

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