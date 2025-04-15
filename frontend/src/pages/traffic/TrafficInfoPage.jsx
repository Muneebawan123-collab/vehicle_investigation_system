import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin, Alert, Tabs, Button, message } from 'antd';
import { SafetyOutlined, WarningOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const TrafficInfoPage = () => {
  const [safetyTips, setSafetyTips] = useState([]);
  const [trafficAlerts, setTrafficAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchSafetyTips = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : {};
      
      const response = await axios.get('http://localhost:5000/api/traffic/safety-tips', config);
      setSafetyTips(prevTips => [...prevTips, response.data]);
    } catch (err) {
      setError('Failed to fetch safety tips. Please try again later.');
      console.error('Error fetching safety tips:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrafficAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : {};
      
      const response = await axios.get('http://localhost:5000/api/traffic/alerts', config);
      setTrafficAlerts(prevAlerts => [...prevAlerts, response.data]);
    } catch (err) {
      setError('Failed to fetch traffic alerts. Please try again later.');
      console.error('Error fetching traffic alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafetyTips();
    fetchTrafficAlerts();
  }, []);

  const handleRefreshTip = () => {
    fetchSafetyTips();
    message.success('New safety tip loaded!');
  };

  const handleRefreshAlert = () => {
    fetchTrafficAlerts();
    message.success('New traffic alert loaded!');
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '120px auto 0' }}>
      <Title level={2} style={{ marginBottom: '32px' }}>Traffic Information Center</Title>
      
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '24px' }} />}
      
      <Tabs defaultActiveKey="1">
        <TabPane 
          tab={
            <span>
              <SafetyOutlined /> Safety Tips
            </span>
          } 
          key="1"
        >
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={handleRefreshTip}
            loading={loading}
            style={{ marginBottom: '16px' }}
          >
            Get New Tip
          </Button>
          
          <Row gutter={[16, 16]}>
            {safetyTips.map((tip, index) => (
              <Col xs={24} sm={24} md={12} lg={8} key={index}>
                <Card 
                  title={<><SafetyOutlined /> Safety Tip</>} 
                  bordered={true}
                  style={{ height: '100%' }}
                >
                  <p>{tip.tip}</p>
                  <div style={{ marginTop: '16px' }}>
                    <Text type="secondary">Source: {tip.source}</Text>
                    <br />
                    <Text type="secondary">Updated: {new Date(tip.timestamp).toLocaleString()}</Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <WarningOutlined /> Traffic Alerts
            </span>
          } 
          key="2"
        >
          <Button 
            type="primary" 
            danger 
            icon={<ReloadOutlined />} 
            onClick={handleRefreshAlert}
            loading={loading}
            style={{ marginBottom: '16px' }}
          >
            Get New Alert
          </Button>
          
          <Row gutter={[16, 16]}>
            {trafficAlerts.map((alert, index) => (
              <Col xs={24} sm={24} md={12} lg={8} key={index}>
                <Card 
                  title={<><WarningOutlined /> Traffic Alert</>} 
                  bordered={true}
                  style={{ height: '100%' }}
                  headStyle={{ background: '#fff2f0' }}
                >
                  <p>{alert.alert}</p>
                  <div style={{ marginTop: '16px' }}>
                    <Text strong>Location: {alert.location}</Text>
                    <br />
                    <Text type="secondary">Updated: {new Date(alert.timestamp).toLocaleString()}</Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default TrafficInfoPage; 