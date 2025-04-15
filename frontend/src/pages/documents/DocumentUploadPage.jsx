import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Upload, message, Select, Card, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UploadOutlined, InboxOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { documentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { Option } = Select;
const { Dragger } = Upload;

const DocumentUploadPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [error, setError] = useState(null);
  const { isAuthenticated, currentUser } = useAuth();
  const [authDebugInfo, setAuthDebugInfo] = useState(null);

  // Add effect to log authentication details on mount
  useEffect(() => {
    // Debug authentication status
    const token = localStorage.getItem('token');
    const debugInfo = {
      isAuthenticated,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'No token',
      currentUser: currentUser || 'No user data',
      userRole: currentUser?.role || 'No role'
    };
    
    console.log('Authentication debug info:', debugInfo);
    setAuthDebugInfo(debugInfo);
  }, [isAuthenticated, currentUser]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      
      if (fileList.length === 0) {
        message.error('Please select a file to upload');
        setError('Please select a file to upload');
        return;
      }

      // Get the file object - ensure we're dealing with a real File object
      const fileObj = fileList[0].originFileObj || fileList[0];
      
      if (!fileObj) {
        console.error('No valid file object available');
        setError('File object is not available. Please try selecting the file again.');
        return;
      }
      
      console.log('File to upload:', {
        name: fileObj.name,
        type: fileObj.type,
        size: fileObj.size,
        lastModified: fileObj.lastModified
      });

      // Create a fresh FormData instance
      const formData = new FormData();
      
      // Add the file first - ensure we're using the correct field name 'file'
      formData.append('file', fileObj);
      console.log('File appended to FormData');
      
      // Then add other form fields - ensure these are strings
      formData.append('type', String(values.type || ''));
      formData.append('description', String(values.description || ''));
      console.log('Other fields appended to FormData');

      // Validate FormData contents
      console.log('FormData entries:');
      let hasFile = false;
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[0] === 'file' ? `File object present` : pair[1]);
        if (pair[0] === 'file') hasFile = true;
      }
      
      if (!hasFile) {
        console.error('File was not properly added to FormData');
        setError('Technical error: File could not be processed. Please try a different file.');
        return;
      }

      // Use the documentService API for upload
      console.log('Proceeding with document upload...');
      const response = await documentService.uploadDocument(formData);
      console.log('Upload response:', response.data);

      message.success('Document uploaded successfully!');
      navigate('/documents');
    } catch (error) {
      console.error('Failed to upload document:', error);
      console.log('Error response:', error.response);
      console.log('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to upload document';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Authentication error: You must be logged in to upload documents';
        } else if (error.response.status === 403) {
          errorMessage = 'Authorization error: You do not have permission to upload documents. Required roles: officer, admin, or investigator';
        } else if (error.response.status === 400) {
          errorMessage = 'Bad Request: The server could not process the upload';
          if (error.response.data?.message) {
            errorMessage += ` - ${error.response.data.message}`;
          }
          if (error.response.data?.details) {
            errorMessage += ` (${error.response.data.details})`;
          }
        } else if (error.response.data?.message) {
          errorMessage = `Error: ${error.response.data.message}`;
          if (error.response.data.details) {
            errorMessage += ` - ${error.response.data.details}`;
          }
        }
      }
      
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      // Validate file object
      if (!file || !file.name || !file.type) {
        message.error('Invalid file object. Please try a different file.');
        return Upload.LIST_IGNORE;
      }
    
      // Validate file type
      const isValidType = [
        'application/pdf',
        'image/jpeg',
        'image/png', 
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ].includes(file.type);

      if (!isValidType) {
        message.error(`You can only upload PDF, JPEG, PNG, or Word files! Got ${file.type}`);
        return Upload.LIST_IGNORE;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error(`File must be smaller than 10MB! Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        return Upload.LIST_IGNORE;
      }

      console.log('File selected:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });
      
      // Create a clean file list with just this file
      setFileList([file]);
      return false; // Prevent auto-upload
    },
    fileList,
    multiple: false,
    accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx', // Add explicit accepted file types
  };

  // Add debug information to the page
  const renderAuthDebugInfo = () => {
    if (!authDebugInfo) return null;
    
    return (
      <Alert
        message="Authentication Debug Info"
        description={
          <ul>
            <li>Authenticated: {authDebugInfo.isAuthenticated ? 'Yes' : 'No'}</li>
            <li>Has Token: {authDebugInfo.hasToken ? 'Yes' : 'No'}</li>
            <li>User Role: {authDebugInfo.userRole || 'None'}</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: '20px' }}
      />
    );
  };

  // Add a test upload function
  const testUpload = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (fileList.length === 0) {
        message.error('Please select a file to upload');
        setError('Please select a file to upload');
        return;
      }

      // Get the file object - ensure we're using a real File object
      const fileObj = fileList[0].originFileObj || fileList[0];
      
      if (!fileObj) {
        console.error('No valid file object available');
        setError('File object is not available. Please try selecting the file again.');
        return;
      }

      // Create a fresh FormData instance
      const formData = new FormData();
      
      // Add the file with proper field name
      formData.append('file', fileObj);
      
      console.log('Testing basic upload with file:', fileObj.name);

      // Verify formData contents
      let hasFile = false;
      for (let pair of formData.entries()) {
        if (pair[0] === 'file') hasFile = true;
      }
      
      if (!hasFile) {
        setError('Technical error: File could not be processed. Please try a different file.');
        return;
      }

      // Use the test upload endpoint
      const response = await documentService.testUpload(formData);
      console.log('Test upload response:', response.data);

      message.success('Test upload successful!');
      
    } catch (error) {
      console.error('Test upload failed:', error);
      console.log('Error response:', error.response);
      console.log('Error data:', error.response?.data);
      
      let errorMessage = 'Test upload failed';
      
      if (error.response?.data?.message) {
        errorMessage += ': ' + error.response.data.message;
        
        if (error.response.data.details) {
          errorMessage += ` (${error.response.data.details})`;
        }
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ 
        padding: '24px', 
        paddingTop: '100px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto' 
      }}>
        <Alert
          message="Authentication Required"
          description={
            <div>
              <p>You must be logged in to upload documents.</p>
              <p>Please log in with an account that has one of these roles:</p>
              <ul style={{ textAlign: 'left', maxWidth: '300px', margin: '0 auto' }}>
                <li>Officer</li>
                <li>Admin</li>
                <li>Investigator</li>
              </ul>
              <Button 
                type="primary" 
                onClick={() => navigate('/login')}
                style={{ marginTop: '16px' }}
              >
                Go to Login
              </Button>
            </div>
          }
          type="error"
          showIcon
        />
        {renderAuthDebugInfo()}
        
        <Card 
          title="Test Upload (Development Only)"
          style={{ marginTop: '24px' }}
        >
          <p>You can test basic upload functionality without authentication:</p>
          <Form.Item>
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag file to this area to upload
              </p>
            </Dragger>
          </Form.Item>
          <Button onClick={testUpload} type="default">
            Test Basic Upload
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px',
      paddingTop: '100px', // Add extra top padding to accommodate navbar
      position: 'relative',
      zIndex: 0
    }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/documents')}
        style={{ marginBottom: 16 }}
      >
        Back to Documents
      </Button>
      
      <Card 
        title={<h2><UploadOutlined /> Upload Document</h2>}
        style={{ maxWidth: 600, margin: '0 auto' }}
      >
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}
        
        {renderAuthDebugInfo()}
        
        <Form
          form={form}
          name="document-upload"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item>
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag file to this area to upload
              </p>
              <p className="ant-upload-hint">
                Support for PDF, JPEG, PNG, or Word files. Max file size: 10MB
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item
            name="type"
            label="Document Type"
            rules={[{ required: true, message: 'Please select the document type!' }]}
          >
            <Select placeholder="Select document type">
              <Option value="Report">Report</Option>
              <Option value="Image">Image</Option>
              <Option value="Contract">Contract</Option>
              <Option value="Invoice">Invoice</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please provide a description!' },
              { min: 10, message: 'Description must be at least 10 characters!' }
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Provide a description of the document"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Upload Document
            </Button>
            <Button onClick={testUpload} style={{ marginTop: '10px' }} block>
              Test Basic Upload
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DocumentUploadPage; 