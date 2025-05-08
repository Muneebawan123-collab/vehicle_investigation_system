import React, { useState, useEffect } from 'react';
import { Space, Tag, Typography, Spin } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

/**
 * Component to display user information, fetching it if only an ID is provided
 */
const UserDisplay = ({ user, userId, showEmail = true, showRole = false }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If user object is provided, use it directly
    if (user && typeof user === 'object') {
      setUserData(user);
      return;
    }

    // If only userId is provided (as a string), fetch the user data
    if (userId && typeof userId === 'string' && !userData) {
      const fetchUser = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const token = localStorage.getItem('token');
          const response = await axios.get(`/api/users/public/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          setUserData(response.data);
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to load user information');
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    }
  }, [user, userId, userData]);

  if (loading) {
    return <Spin size="small" />;
  }

  if (error) {
    return <Text type="danger">{userId || 'Unknown user'}</Text>;
  }

  // If we have user data, display it nicely
  if (userData) {
    return (
      <Space>
        <UserOutlined />
        <Text strong>
          {userData.name || 
           `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 
           userData.email || 
           'Unknown'}
        </Text>
        
        {showEmail && userData.email && (
          <Text type="secondary">({userData.email})</Text>
        )}
        
        {showRole && userData.role && (
          <Tag color={
            userData.role === 'admin' ? 'red' : 
            userData.role === 'investigator' ? 'blue' :
            userData.role === 'officer' ? 'purple' :
            'default'
          }>
            {userData.role}
          </Tag>
        )}
      </Space>
    );
  }

  // Fallback if nothing else works
  return <Text>{typeof userId === 'string' ? userId : (typeof user === 'string' ? user : 'Unknown user')}</Text>;
};

export default UserDisplay; 