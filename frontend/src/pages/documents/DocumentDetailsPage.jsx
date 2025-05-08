import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Tag, Spin, message, Modal, Alert, Tabs, Popconfirm, Space } from 'antd';
import { DownloadOutlined, DeleteOutlined, ExclamationCircleOutlined, ArrowLeftOutlined, EyeOutlined, FileOutlined } from '@ant-design/icons';
import { documentService, downloadBinaryFile, throttledApiClient } from '../../services/api';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { formatFileSize, getFileTypeIcon } from '../../utils/fileUtils';

const { confirm } = Modal;
const { TabPane } = Tabs;

const DocumentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [documentDetails, setDocumentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const { currentUser } = useAuth();
  
  // Check if user is admin
  const isAdmin = currentUser?.role === 'admin';
  // Check if user is officer
  const isOfficer = currentUser?.role === 'officer';

  useEffect(() => {
    fetchDocumentDetails();
  }, [id]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      // Use the document service from API
      const response = await documentService.getDocumentById(id);
      setDocumentDetails(response.data);
      
      // Try to set preview URL
      if (response.data?.fileUrl) {
        setPreviewUrl(response.data.fileUrl);
      }
      
      // Log document access
      await documentService.logDocumentAccess(id, 'view');
    } catch (error) {
      console.error('Failed to fetch document details:', error);
      message.error('Failed to fetch document details');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  // Handle document download
  const handleDownload = async () => {
    if (!documentDetails) {
      message.error('Document details are missing');
      return;
    }
    
    setDownloading(true);
    
    try {
      const docId = documentDetails._id || 
                   documentDetails.id || 
                   documentDetails.publicId?.split('/').pop() || 
                   id;
      
      const result = await documentService.downloadDocument(docId, {
        showNotifications: true
      });
      
      if (!result) {
        throw new Error('Download failed');
      }
      
      // Log successful download
      await documentService.logDocumentAccess(docId, 'download_success');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download document. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleViewDocument = async () => {
    try {
      setViewLoading(true);
      
      // If we already have the preview URL, no need to fetch again
      if (previewUrl) {
        setViewLoading(false);
        return;
      }
      
      // For documents that need direct access, get a temp URL
      const response = await documentService.getDocumentById(id);
      if (response.data?.fileUrl) {
        setPreviewUrl(response.data.fileUrl);
      } else {
        message.error('Document preview is not available');
      }
      
      // Log document access
      await documentService.logDocumentAccess(id, 'view');
    } catch (error) {
      console.error('Failed to view document:', error);
      message.error('Failed to view document');
    } finally {
      setViewLoading(false);
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
          await documentService.deleteDocument(documentDetails.id);
          message.success('Document deleted successfully');
          navigate('/documents');
        } catch (error) {
          console.error('Failed to delete document:', error);
          message.error('Failed to delete document: ' + (error.response?.data?.message || error.message));
        }
      },
    });
  };

  const handleDirectDownload = async () => {
    try {
      if (!documentDetails) return;
      
      // Log the document access
      await documentService.logDocumentAccess(id, 'direct_download');
      
      // Use the enhanced download method
      const result = await documentService.downloadDocument(id, {
        showNotifications: true,
        forceDownload: true
      });
      
      if (!result) {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Direct download error:', error);
      message.error(`Download failed: ${error.message}`);
    }
  };
  
  // New method to download from MongoDB
  const handleMongoDownload = async () => {
    try {
      if (!documentDetails) return;
      
      // Log the document access
      await documentService.logDocumentAccess(id, 'mongo_download');
      
      // Use MongoDB download method
      const result = await documentService.downloadDocumentFromMongoDB(id);
      
      if (!result) {
        throw new Error('MongoDB download failed');
      }
    } catch (error) {
      console.error('MongoDB download error:', error);
      message.error(`MongoDB download failed: ${error.message}`);
    }
  };

  // Universal download function that tries multiple methods
  const universalDownload = async () => {
    if (!documentDetails) {
      message.error('Document details are missing');
      return;
    }
    
    setDownloading(true);
    
    try {
      const docId = documentDetails._id || 
                   documentDetails.id || 
                   documentDetails.publicId?.split('/').pop() || 
                   id;
      
      const result = await documentService.downloadDocument(docId, {
        showNotifications: true
      });
      
      if (!result) {
        throw new Error('Download failed');
      }
      
      // Log successful download
      await documentService.logDocumentAccess(docId, 'download_success');
    } catch (error) {
      console.error('Universal download error:', error);
      message.error('Failed to download document. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Determine the appropriate document viewer based on file type
  const renderDocumentViewer = () => {
    if (!previewUrl) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            loading={viewLoading}
            onClick={handleViewDocument}
          >
            View Document
          </Button>
        </div>
      );
    }

    const docType = documentDetails?.type?.toLowerCase() || '';
    
    // For image files
    if (['jpg', 'jpeg', 'png', 'gif'].includes(docType)) {
      return (
        <div style={{ textAlign: 'center', overflow: 'auto', maxHeight: '600px' }}>
          <img 
            src={previewUrl} 
            alt={documentDetails?.name || 'Document'} 
            style={{ maxWidth: '100%' }} 
            onError={() => message.error('Failed to load image')}
          />
        </div>
      );
    }
    
    // For PDF files
    if (docType === 'pdf') {
      return (
        <div style={{ height: '600px', width: '100%' }}>
          <iframe
            src={`${previewUrl}#toolbar=1&navpanes=1`}
            title={documentDetails?.name || 'PDF Document'}
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: '1px solid #ddd' }}
            onError={() => {
              message.error('Failed to load PDF preview. Try downloading instead.');
            }}
          >
            Your browser does not support embedded PDF viewing. Please <a href={previewUrl} target="_blank" rel="noopener noreferrer">click here</a> to view the PDF.
          </iframe>
          
          {/* Add a fallback option for when PDF viewer fails */}
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Button type="primary" onClick={handleDirectDownload} icon={<DownloadOutlined />}>
              Download for Viewing
            </Button>
          </div>
        </div>
      );
    }
    
    // For other files, show a download button
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Alert
          message="Preview not available"
          description={`Preview is not available for ${docType.toUpperCase()} files. Please download the file to view it.`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Button 
          type="primary" 
          icon={<DownloadOutlined />}
          loading={downloading}
          onClick={handleDownload}
        >
          {downloading ? 'Downloading...' : 'Download to View'}
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!documentDetails) {
    return null;
  }

  const FileIcon = getFileTypeIcon(documentDetails.type);

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
        title={`Document Details: ${documentDetails ? documentDetails.name : 'Loading...'}`}
        style={{ maxWidth: 1000, margin: '0 auto' }}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              loading={downloading}
            >
              Download
            </Button>
              <Button
                type="primary"
              icon={<EyeOutlined />}
              onClick={handleViewDocument}
              loading={viewLoading}
            >
              View
            </Button>
            {(isAdmin || isOfficer) && (
              <Popconfirm
                title="Are you sure you want to delete this document?"
                onConfirm={handleDelete}
                okText="Yes"
                cancelText="No"
              >
                <Button type="primary" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
              </Popconfirm>
            )}
          </Space>
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
        
        <Tabs defaultActiveKey="viewer">
          <TabPane tab="Document Viewer" key="viewer">
            {renderDocumentViewer()}
          </TabPane>
          <TabPane tab="Document Details" key="details">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Type">
                <Tag color="blue">{documentDetails.type ? documentDetails.type.toUpperCase() : 'UNKNOWN'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Size">
                {formatFileSize(documentDetails.size)}
          </Descriptions.Item>
          
          <Descriptions.Item label="Uploaded By" span={2}>
                {documentDetails.uploadedBy?.name || 'Unknown'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Upload Date" span={2}>
                {documentDetails.uploadDate ? new Date(documentDetails.uploadDate).toLocaleString() : 'Unknown'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Description" span={2}>
                {documentDetails.description || 'No description provided'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Created At" span={2}>
                {documentDetails.createdAt ? new Date(documentDetails.createdAt).toLocaleString() : 'Unknown'}
          </Descriptions.Item>
          
              {documentDetails.updatedAt && (
            <Descriptions.Item label="Last Updated" span={2}>
                  {new Date(documentDetails.updatedAt).toLocaleString()}
            </Descriptions.Item>
          )}
          
              {documentDetails.vehicle && (
            <Descriptions.Item label="Related Vehicle" span={2}>
                  {documentDetails.vehicle.licensePlate || documentDetails.vehicle.vin || documentDetails.vehicle._id}
            </Descriptions.Item>
          )}
        </Descriptions>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default DocumentDetailsPage; 