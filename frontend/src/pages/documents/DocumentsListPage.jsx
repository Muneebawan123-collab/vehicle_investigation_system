import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message, Tag, Alert, Spin } from 'antd';
import { SearchOutlined, UploadOutlined, DownloadOutlined, DeleteOutlined, FileTextOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DocumentsListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState(null);
  const { isAuthenticated, currentUser } = useAuth();
  
  // Check if user is admin
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
    }
  }, [isAuthenticated]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await documentService.getAllDocuments();
      console.log('Documents response:', response);
      
      // Properly handle the response structure from backend
      if (response.data && Array.isArray(response.data.data)) {
        // Handle standard backend response format with data property
        console.log('Documents found:', response.data.data.length);
        setDocuments(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        // Handle simple array response
        console.log('Documents found (array):', response.data.length);
        setDocuments(response.data);
      } else if (response.data && Array.isArray(response.data.resources)) {
        // Handle Cloudinary response format
        console.log('Documents found (Cloudinary):', response.data.resources.length);
        setDocuments(response.data.resources.map(doc => ({
          id: doc.public_id,
          name: doc.public_id.split('/').pop(),
          type: doc.format || 'document',
          size: doc.bytes || 0,
          url: doc.secure_url,
          uploadDate: doc.created_at,
          uploadedBy: 'System'
        })));
      } else {
        console.log('No documents found or unrecognized response format:', response.data);
        setDocuments([]);
        if (response.data && response.data.success === false) {
          setError(`Server error: ${response.data.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      let errorMessage = 'Failed to fetch documents';
      
      if (error.response) {
        console.error('Error response:', error.response);
        if (error.response.data && error.response.data.message) {
          errorMessage += `: ${error.response.data.message}`;
          if (error.response.data.details) {
            errorMessage += ` (${error.response.data.details})`;
          }
        } else {
          errorMessage += `: ${error.message}`;
        }
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId, documentUrl) => {
    try {
      // Direct download from URL if available
      if (documentUrl) {
        window.open(documentUrl, '_blank');
        return;
      }
      
      // Otherwise use API
      const response = await documentService.getDocumentById(documentId);
      if (response.data && response.data.secure_url) {
        window.open(response.data.secure_url, '_blank');
      } else {
        message.error('Document URL not found');
      }
    } catch (error) {
      console.error('Failed to download document:', error);
      message.error('Failed to download document');
    }
  };

  const handleDelete = async (documentId) => {
    try {
      await documentService.deleteDocument(documentId);
      message.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      message.error('Failed to delete document: ' + (error.response?.data?.message || error.message));
    }
  };

  const getFileIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileTextOutlined style={{ color: 'red' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileTextOutlined style={{ color: 'blue' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {getFileIcon(record.type)}
          {text}
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color="blue">{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size) => {
        const kb = size / 1024;
        const mb = kb / 1024;
        return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
      },
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
    },
    {
      title: 'Upload Date',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.uploadDate) - new Date(b.uploadDate),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.id, record.url)}
          >
            Download
          </Button>
          {isAdmin && (
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            >
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h2>You must be logged in to view documents</h2>
      </div>
    );
  }

  const filteredDocuments = documents.filter(doc => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return doc.name?.toLowerCase().includes(searchLower);
  });

  return (
    <div style={{ 
      padding: '24px',
      paddingTop: '100px', // Add extra top padding to accommodate navbar
      position: 'relative',
      zIndex: 0
    }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input
            placeholder="Search documents"
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchDocuments}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => navigate('/documents/upload')}
        >
          Upload Document
        </Button>
      </div>

      {!isAdmin && (
        <Alert
          message="Read-only Mode"
          description="You can view and download documents, but only administrators can delete them."
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: '16px' }}
        />
      )}

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      <Table
        columns={columns}
        dataSource={filteredDocuments}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Total ${total} documents`,
        }}
        locale={{
          emptyText: loading ? 
            <Spin /> : 
            <div style={{ padding: '20px' }}>
              <p>No documents found</p>
              {documents.length === 0 && !error && (
                <div>
                  <p>Try uploading a new document or refreshing the list.</p>
                  <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchDocuments}>
                      Refresh
                    </Button>
                    <Button 
                      type="primary" 
                      icon={<UploadOutlined />}
                      onClick={() => navigate('/documents/upload')}
                    >
                      Upload Document
                    </Button>
                  </Space>
                </div>
              )}
            </div>
        }}
      />
    </div>
  );
};

export default DocumentsListPage; 