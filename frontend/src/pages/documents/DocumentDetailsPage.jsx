import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Spin, message, Modal } from 'antd';
import { DownloadOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { confirm } = Modal;

const DocumentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentDetails();
  }, [id]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch document details
      const response = await fetch(`/api/documents/${id}`);
      const data = await response.json();
      setDocument(data);
    } catch (error) {
      message.error('Failed to fetch document details');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      // TODO: Implement document download
      const response = await fetch(`/api/documents/${id}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      message.error('Failed to download document');
    }
  };

  const handleDelete = () => {
    confirm({
      title: 'Are you sure you want to delete this document?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          // TODO: Implement API call to delete document
          await fetch(`/api/documents/${id}`, {
            method: 'DELETE',
          });
          message.success('Document deleted successfully');
          navigate('/documents');
        } catch (error) {
          message.error('Failed to delete document');
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const formatFileSize = (size) => {
    const kb = size / 1024;
    const mb = kb / 1024;
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={document.name}
        extra={
          <div>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              style={{ marginRight: 8 }}
            >
              Download
            </Button>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Type">
            <Tag color="blue">{document.type.toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Size">
            {formatFileSize(document.size)}
          </Descriptions.Item>
          
          <Descriptions.Item label="Uploaded By" span={2}>
            {document.uploadedBy}
          </Descriptions.Item>
          
          <Descriptions.Item label="Upload Date" span={2}>
            {new Date(document.uploadDate).toLocaleString()}
          </Descriptions.Item>
          
          <Descriptions.Item label="Description" span={2}>
            {document.description}
          </Descriptions.Item>
          
          <Descriptions.Item label="Created At" span={2}>
            {new Date(document.createdAt).toLocaleString()}
          </Descriptions.Item>
          
          {document.updatedAt && (
            <Descriptions.Item label="Last Updated" span={2}>
              {new Date(document.updatedAt).toLocaleString()}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  );
};

export default DocumentDetailsPage; 