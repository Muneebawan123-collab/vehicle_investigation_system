import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Descriptions, Button, Space, Progress, Alert, Divider, Avatar } from 'antd';
import { EditOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formatFileUrl } from '../../utils/imageUtils';

const UserProfilePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Debug log to see user data
  console.log('User Profile Data:', user);
  console.log('User name specific check:', {
    name: user?.name,
    nameType: typeof user?.name,
    nameLength: user?.name?.length,
    nameExists: !!user?.name
  });
  console.log('User address specific check:', {
    address: user?.address,
    addressType: typeof user?.address,
    addressLength: user?.address?.length,
    addressExists: !!user?.address
  });

  // Calculate profile completion percentage
  const profileCompletion = useMemo(() => {
    if (!user) return { percent: 0, missingFields: [] };

    // Define required fields and check which ones are completed
    const fields = [
      { name: 'name', label: 'Name', completed: !!user.name && user.name !== 'N/A' },
      { name: 'email', label: 'Email', completed: !!user.email && user.email !== 'N/A' },
      { name: 'phone', label: 'Phone Number', completed: !!user.phone && user.phone !== 'N/A' },
      { name: 'address', label: 'Address', completed: !!user.address && user.address !== 'N/A' },
      { name: 'department', label: 'Department', completed: !!user.department && user.department !== 'N/A' }
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

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card>
          <div style={{ padding: '50px 0' }}>
            <h2>Loading profile...</h2>
            <div style={{ marginTop: 20 }}>
              <Progress type="circle" status="active" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center">
        <Card>
          <div style={{ padding: '50px 0' }}>
            <h2>User profile not found</h2>
            <Button 
              type="primary" 
              onClick={() => navigate('/')}
              style={{ marginTop: 20 }}
            >
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar
            size={120}
            icon={<UserOutlined />}
            src={formatFileUrl(user?.profileImage)}
            style={{ marginBottom: 16 }}
          />
          <h2>{user?.name || 'No Name Set'}</h2>
          <p style={{ color: '#666' }}>{user?.role || 'No Role Assigned'}</p>
        </div>

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
            size={8}
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

        <Descriptions 
          bordered 
          column={1}
          styles={{
            label: { fontWeight: 'bold', width: '150px', background: '#fafafa' },
            content: { background: '#fff' }
          }}
          size="large"
        >
          <Descriptions.Item label="Name">{user?.name || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Email">{user?.email || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Role">{user?.role || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Department">{user?.department || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Phone">{user?.phone || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Address">{user?.address || 'N/A'}</Descriptions.Item>
          {user?.joinDate && (
            <Descriptions.Item label="Join Date">
              {new Date(user.joinDate).toLocaleDateString()}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  );
};

export default UserProfilePage; 