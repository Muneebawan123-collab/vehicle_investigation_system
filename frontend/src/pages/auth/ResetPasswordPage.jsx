import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { Form, Input, Button, message, Alert } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { Box, Link } from '@mui/material';
import axios from 'axios';

const ResetPasswordPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { token } = useParams();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      // TODO: Implement reset password API call with token and new password
      message.success('Password reset successful! Please login with your new password.');
      navigate('/login');
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Reset Password</h1>
        <p>Enter your new password below.</p>

        <Form
          form={form}
          name="reset-password"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your new password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="New Password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm New Password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Reset Password
            </Button>
          </Form.Item>

          <div className="auth-links">
            Remember your password?{' '}
            <Button type="link" onClick={() => navigate('/login')}>
              Login
            </Button>
          </div>
        </Form>
      </div>
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Link component={RouterLink} to="/home" variant="body2">
          Return to Home Page
        </Link>
      </Box>
    </div>
  );
};

export default ResetPasswordPage; 