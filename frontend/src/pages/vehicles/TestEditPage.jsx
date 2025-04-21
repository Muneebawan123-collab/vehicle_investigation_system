import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Typography, Button, Space } from 'antd';

const { Title, Text } = Typography;

const TestEditPage = () => {
  const { id } = useParams();
  
  return (
    <div style={{ padding: '24px', marginTop: '64px' }}>
      <Card title="Test Edit Page">
        <Title level={3}>Route Test</Title>
        <Text strong>Detected ID from URL: </Text>
        <Text>{id || 'No ID detected'}</Text>
        
        <div style={{ marginTop: 20 }}>
          <Text>This is a simple test page to verify that routing to the edit page works correctly.</Text>
        </div>
        
        <Space style={{ marginTop: 30 }}>
          <Button type="primary">
            <Link to={`/vehicles/${id}`}>Back to Vehicle Details</Link>
          </Button>
          <Button>
            <Link to="/vehicles">Back to Vehicles List</Link>
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default TestEditPage; 