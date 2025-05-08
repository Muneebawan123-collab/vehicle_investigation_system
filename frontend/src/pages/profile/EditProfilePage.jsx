import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Form, Input, Button, Card, message, Progress, Upload, Avatar, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UploadOutlined, UserOutlined } from '@ant-design/icons';
import { formatFileUrl } from '../../utils/imageUtils';

const EditProfilePage = () => {
  const auth = useAuth();
  const user = auth?.user;
  const updateProfile = auth?.updateProfile;
  const authLoading = auth?.loading || false;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.profileImage);
  const [error, setError] = useState(null);

  // Debug log to see user data
  console.log('Edit Profile - Auth Data:', auth);
  console.log('Edit Profile - User Data:', user);
  console.log('Edit Profile - Name value:', user?.name);
  console.log('Edit Profile - Address value:', user?.address);

  // Handle auth context not being available
  useEffect(() => {
    if (!auth) {
      setError('Authentication context not available. Please try logging in again.');
      console.error('Auth context is undefined in EditProfilePage');
    }
  }, [auth]);

  // Calculate profile completion percentage
  const profileCompletion = useMemo(() => {
    if (!user) return { percent: 0, missingFields: [] };

    // Define required fields and check which ones are completed
    const fields = [
      { name: 'name', label: 'Name', completed: !!user.name },
      { name: 'email', label: 'Email', completed: !!user.email },
      { name: 'phone', label: 'Phone', completed: !!user.phone },
      { name: 'address', label: 'Address', completed: !!user.address },
      { name: 'department', label: 'Department', completed: !!user.department },
      { name: 'profileImage', label: 'Profile Picture', completed: !!user.profileImage }
    ];

    const completedFields = fields.filter(field => field.completed);
    const percent = Math.round((completedFields.length / fields.length) * 100);
    const missingFields = fields.filter(field => !field.completed);

    return { percent, missingFields };
  }, [user]);

  const handleImageChange = (info) => {
    if (info.file.status === 'done') {
      // Get the uploaded file
      setImageFile(info.file.originFileObj);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(info.file.originFileObj);
      
      console.log('Image file prepared for upload:', info.file.originFileObj.name);
    }
  };

  const onFinish = async (values) => {
    try {
      if (!updateProfile) {
        message.error('Update functionality not available. Please try logging in again.');
        console.error('updateProfile function is undefined');
        return;
      }

      // Debug log form values
      console.log('Form values before submit:', values);
      
      // Create FormData object to send file
      const formData = new FormData();
      
      // Add all form values to FormData
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, value);
          console.log(`Adding ${key} to formData:`, value);
        }
      });
      
      // Append the image file if it exists
      if (imageFile) {
        formData.append('profileImage', imageFile);
        console.log('Adding profileImage to formData');
      }

      // Log the form data for debugging
      console.log('Submitting form data:', values);

      // Show loading indicator
      message.loading('Updating profile...', 0);
      
      const response = await updateProfile(formData);
      
      // Hide loading indicator
      message.destroy();
      
      if (response && response.success) {
        message.success('Profile updated successfully');
        
        // Wait a moment before navigating to ensure state is updated
        setTimeout(() => {
          navigate('/profile');
        }, 800);
      } else {
        message.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      message.error(error.message || 'Failed to update profile');
    }
  };

  // Add useEffect to update form values when user data changes
  useEffect(() => {
    if (user) {
      console.log('Setting form values with user data:', {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        department: user.department || ''
      });
      
      form.setFieldsValue({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        department: user.department || ''
      });
      
      setImagePreview(user.profileImage);
      setLoading(false);
    } else {
      setLoading(false); // Still set loading to false to show potential error messages
    }
  }, [user, form]);

  // Show loading state
  if (loading || authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin spinning={true}>
          <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: '4px', minHeight: '200px', minWidth: '300px' }}>
            <h3>Loading profile data...</h3>
            <p>Please wait while we retrieve your information</p>
          </div>
        </Spin>
      </div>
    );
  }

  // Show error state if authentication context is not available
  if (error || !auth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Card style={{ width: 500, textAlign: 'center' }}>
          <h2 style={{ color: '#ff4d4f' }}>Authentication Error</h2>
          <p>{error || 'Unable to load your profile. Please try logging in again.'}</p>
          <Button type="primary" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  // Show error state if user data is not available
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Card style={{ width: 500, textAlign: 'center' }}>
          <h2 style={{ color: '#ff4d4f' }}>Profile Not Found</h2>
          <p>We couldn't find your profile information. Please try logging in again.</p>
          <Button type="primary" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

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
            size={8}
          />
          
          {profileCompletion.missingFields.length > 0 && (
            <div style={{ marginTop: 8, color: '#1890ff' }}>
              Missing: {profileCompletion.missingFields.map(f => f.label).join(', ')}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar
            size={100}
            icon={<UserOutlined />}
            src={imagePreview || formatFileUrl(user?.profileImage)}
            style={{ marginBottom: 16 }}
          />
          <Upload
            accept="image/*"
            showUploadList={false}
            customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
            onChange={handleImageChange}
          >
            <Button icon={<UploadOutlined />}>Change Profile Picture</Button>
          </Upload>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            address: user?.address || '',
            department: user?.department || ''
          }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input placeholder="Enter your email address" />
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
            <Input.TextArea rows={3} placeholder="Enter your complete address" />
          </Form.Item>

          <Form.Item
            name="department"
            label="Department"
            rules={[{ required: true, message: 'Please input your department!' }]}
          >
            <Input placeholder="Enter your department" />
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