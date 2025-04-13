import React, { useState } from 'react';
import { Form, Input, Button, Upload, message, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Dragger } = Upload;

const DocumentUploadPage = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      if (fileList.length === 0) {
        message.error('Please select a file to upload');
        return;
      }

      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj);
      formData.append('type', values.type);
      formData.append('description', values.description);

      // TODO: Implement API call to upload document
      await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      message.success('Document uploaded successfully!');
      navigate('/documents');
    } catch (error) {
      message.error('Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      // You can add file type and size validation here
      const isValidType = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ].includes(file.type);

      if (!isValidType) {
        message.error('You can only upload PDF, JPEG, PNG, or Word files!');
        return Upload.LIST_IGNORE;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return Upload.LIST_IGNORE;
      }

      setFileList([file]);
      return false;
    },
    fileList,
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1>
          <UploadOutlined /> Upload Document
        </h1>
        
        <Form
          form={form}
          name="document-upload"
          onFinish={onFinish}
          layout="vertical"
          size="large"
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
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default DocumentUploadPage; 