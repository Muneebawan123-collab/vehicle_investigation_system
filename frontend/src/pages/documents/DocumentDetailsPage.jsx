import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Spin, message, Modal, Alert } from 'antd';
import { DownloadOutlined, DeleteOutlined, ExclamationCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { documentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { confirm } = Modal;

const DocumentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  
  // Check if user is admin
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    fetchDocumentDetails();
  }, [id]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      // Use the document service from API
      const response = await documentService.getDocumentById(id);
      setDocument(response.data);
    } catch (error) {
      console.error('Failed to fetch document details:', error);
      message.error('Failed to fetch document details');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      // Use the document service from API
      const response = await fetch(document.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.title || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      // Log document access
      await documentService.logDocumentAccess(id, 'download');
    } catch (error) {
      console.error('Failed to download document:', error);
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
          await documentService.deleteDocument(id);
          message.success('Document deleted successfully');
          navigate('/documents');
        } catch (error) {
          console.error('Failed to delete document:', error);
          message.error('Failed to delete document: ' + (error.response?.data?.message || error.message));
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
    if (!size) return 'Unknown';
    const kb = size / 1024;
    const mb = kb / 1024;
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

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
        title={document.title || 'Document Details'}
        style={{ maxWidth: 1000, margin: '0 auto' }}
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
            
            {isAdmin ? (
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            ) : (
              <Tag color="warning">Only admins can delete documents</Tag>
            )}
          </div>
        }
      >
        {!isAdmin && (
          <Alert
            message="Read-only access"
            description="Only administrators can delete or modify documents"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Type">
            <Tag color="blue">{document.type ? document.type.toUpperCase() : 'UNKNOWN'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Size">
            {formatFileSize(document.size)}
          </Descriptions.Item>
          
          <Descriptions.Item label="Uploaded By" span={2}>
            {document.uploadedBy?.name || 'Unknown'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Upload Date" span={2}>
            {document.uploadDate ? new Date(document.uploadDate).toLocaleString() : 'Unknown'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Description" span={2}>
            {document.description || 'No description provided'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Created At" span={2}>
            {document.createdAt ? new Date(document.createdAt).toLocaleString() : 'Unknown'}
          </Descriptions.Item>
          
          {document.updatedAt && (
            <Descriptions.Item label="Last Updated" span={2}>
              {new Date(document.updatedAt).toLocaleString()}
            </Descriptions.Item>
          )}
          
          {document.vehicle && (
            <Descriptions.Item label="Related Vehicle" span={2}>
              {document.vehicle.licensePlate || document.vehicle.vin || document.vehicle._id}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  );
};

export default DocumentDetailsPage; 