import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Button, 
  Tag, 
  Spin, 
  message, 
  Modal, 
  Alert, 
  Tabs,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Divider,
  Timeline
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  ExclamationCircleOutlined, 
  ArrowLeftOutlined,
  UserOutlined,
  FileDoneOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { incidentService, adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { confirm } = Modal;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

// Assignment Modal Component for Admins
const AssignmentModal = ({ visible, onCancel, onAssign, investigators, loading, fetchingInvestigators }) => {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        onAssign(values);
        form.resetFields();
      })
      .catch(err => {
        console.error('Validation failed:', err);
      });
  };

  return (
    <Modal
      title="Assign Incident to Investigator"
      open={visible}
      onCancel={onCancel}
      confirmLoading={loading}
      onOk={handleSubmit}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="investigatorId"
          label="Select Investigator"
          rules={[{ required: true, message: 'Please select an investigator' }]}
        >
          <Select 
            placeholder="Select an investigator"
            loading={fetchingInvestigators}
            disabled={fetchingInvestigators}
          >
            {investigators.map(investigator => (
              <Option key={investigator._id} value={investigator._id}>
                {investigator.name || `${investigator.firstName || ''} ${investigator.lastName || ''}`} - {investigator.email}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="priority"
          label="Priority"
          initialValue="medium"
        >
          <Select>
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
            <Option value="urgent">Urgent</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// Investigation Report Form for Investigators
const InvestigationReportForm = ({ onSubmit, loading }) => {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        onSubmit(values);
      })
      .catch(err => {
        console.error('Validation failed:', err);
      });
  };

  return (
    <Card title="Submit Investigation Report" style={{ marginTop: 16 }}>
      <Form form={form} layout="vertical">
        <Form.Item
          name="findings"
          label="Investigation Findings"
          rules={[{ required: true, message: 'Please enter your findings' }]}
        >
          <TextArea rows={4} placeholder="Detail your findings from the investigation" />
        </Form.Item>
        
        <Form.Item
          name="recommendations"
          label="Recommendations"
          rules={[{ required: true, message: 'Please provide recommendations' }]}
        >
          <TextArea rows={3} placeholder="What actions do you recommend based on your findings?" />
        </Form.Item>
        
        <Form.Item
          name="conclusion"
          label="Conclusion"
          rules={[{ required: true, message: 'Please select a conclusion' }]}
        >
          <Select placeholder="Select a conclusion for this investigation">
            <Option value="substantiated">Substantiated</Option>
            <Option value="unsubstantiated">Unsubstantiated</Option>
            <Option value="inconclusive">Inconclusive</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="reportContent"
          label="Detailed Report"
          rules={[{ required: true, message: 'Please provide a detailed report' }]}
        >
          <TextArea rows={6} placeholder="Provide your complete investigation report here" />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Submit Investigation Report
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

// Officer Review Form for reviewing investigation reports
const OfficerReviewForm = ({ report, onSubmit, loading }) => {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        onSubmit(values);
      })
      .catch(err => {
        console.error('Validation failed:', err);
      });
  };

  return (
    <Card title="Review Investigation Report" style={{ marginTop: 16 }}>
      <Descriptions title="Investigation Report Details" bordered column={1}>
        <Descriptions.Item label="Submitted By">
          {report?.submittedBy?.firstName} {report?.submittedBy?.lastName}
        </Descriptions.Item>
        <Descriptions.Item label="Submitted On">
          {report?.submittedAt ? new Date(report.submittedAt).toLocaleString() : 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Findings">{report?.findings || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Recommendations">{report?.recommendations || 'N/A'}</Descriptions.Item>
        <Descriptions.Item label="Conclusion">
          <Tag color={
            report?.conclusion === 'substantiated' ? 'green' : 
            report?.conclusion === 'unsubstantiated' ? 'red' : 'orange'
          }>
            {report?.conclusion?.toUpperCase() || 'PENDING'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Report Content">{report?.reportContent || 'N/A'}</Descriptions.Item>
      </Descriptions>
      
      <Divider />
      
      <Form form={form} layout="vertical">
        <Form.Item
          name="actions"
          label="Officer Actions"
          rules={[{ required: true, message: 'Please specify your actions' }]}
        >
          <TextArea rows={4} placeholder="Describe actions taken or to be taken based on this report" />
        </Form.Item>
        
        <Form.Item
          name="notes"
          label="Additional Notes"
        >
          <TextArea rows={3} placeholder="Any additional notes or comments" />
        </Form.Item>
        
        <Form.Item
          name="reportStatus"
          label="Report Status"
          rules={[{ required: true, message: 'Please approve or reject this report' }]}
        >
          <Select placeholder="Approve or reject this report">
            <Option value="approved">Approve Report</Option>
            <Option value="rejected">Reject Report</Option>
          </Select>
        </Form.Item>
        
        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />} 
              onClick={handleSubmit} 
              loading={loading}
            >
              Submit Review
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

// Main Incident Details Page Component
const IncidentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [investigators, setInvestigators] = useState([]);
  const [fetchingInvestigators, setFetchingInvestigators] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { isAuthenticated, currentUser } = useAuth();
  
  // Check user roles
  const isAdmin = currentUser?.role === 'admin';
  const isInvestigator = currentUser?.role === 'investigator';
  const isOfficer = currentUser?.role === 'officer';
  const isAssignedInvestigator = isInvestigator && incident?.assignedTo === currentUser?._id;

  // Define tab items outside of the return statement
  const getTabItems = () => [
    {
      key: "details",
      label: "Incident Details",
      children: (
        <Card
          title={`Incident: ${incident?.title}`}
          style={{ maxWidth: 1000, margin: '0 auto' }}
        >
          <Descriptions bordered column={2}>
            <Descriptions.Item label="ID">{incident?._id}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(incident?.status)}>
                {incident?.status}
              </Tag>
            </Descriptions.Item>
            
            <Descriptions.Item label="Incident Type">{incident?.incidentType}</Descriptions.Item>
            <Descriptions.Item label="Severity">{incident?.severity}</Descriptions.Item>
            
            <Descriptions.Item label="Vehicle" span={2}>
              {incident?.vehicle ? (
                <>
                  {incident.vehicle.make} {incident.vehicle.model} ({incident.vehicle.licensePlate})
                </>
              ) : 'No vehicle information'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Date and Time" span={2}>
              {formatDate(incident?.dateTime)}
            </Descriptions.Item>
            
            <Descriptions.Item label="Location" span={2}>
              {incident?.location?.address || 'Unknown location'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Description" span={2}>
              {incident?.description}
            </Descriptions.Item>
            
            <Descriptions.Item label="Reported By">
              {incident?.reportedBy?.name || 'Unknown'}
            </Descriptions.Item>
            
            <Descriptions.Item label="Assigned To">
              {incident?.assignedTo ? 
                (typeof incident.assignedTo === 'object' ? 
                  `${incident.assignedTo.name || 'Name not available'} (${incident.assignedTo.role || 'Role not available'})` :
                  incident.assignedTo
                ) : 
                'Not assigned'
              }
            </Descriptions.Item>
          </Descriptions>
          
          {renderRoleBasedActions()}
        </Card>
      )
    },
    {
      key: "investigation",
      label: "Investigation & Reports",
      children: (
        <Card title="Investigation Details" style={{ maxWidth: 1000, margin: '0 auto' }}>
          {incident?.caseFile ? (
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Case Status">
                <Tag color={
                  incident.caseFile.status === 'not_assigned' ? 'default' :
                  incident.caseFile.status === 'assigned' ? 'blue' :
                  incident.caseFile.status === 'under_investigation' ? 'processing' :
                  incident.caseFile.status === 'report_submitted' ? 'warning' :
                  incident.caseFile.status === 'review_complete' ? 'success' :
                  'default'
                }>
                  {incident.caseFile.status?.replace(/_/g, ' ').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Priority">
                <Tag color={
                  incident.caseFile.priority === 'low' ? 'green' :
                  incident.caseFile.priority === 'medium' ? 'blue' :
                  incident.caseFile.priority === 'high' ? 'orange' :
                  incident.caseFile.priority === 'urgent' ? 'red' :
                  'default'
                }>
                  {incident.caseFile.priority?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              
              {incident.caseFile.assignedInvestigator && (
                <Descriptions.Item label="Assigned Investigator">
                  {typeof incident.caseFile.assignedInvestigator === 'object' ?
                    `${incident.caseFile.assignedInvestigator.name || 'Name not available'}` :
                    incident.caseFile.assignedInvestigator
                  }
                </Descriptions.Item>
              )}
              
              {incident.caseFile.investigationStartDate && (
                <Descriptions.Item label="Investigation Start Date">
                  {formatDate(incident.caseFile.investigationStartDate)}
                </Descriptions.Item>
              )}
              
              {incident.caseFile.investigationEndDate && (
                <Descriptions.Item label="Investigation End Date">
                  {formatDate(incident.caseFile.investigationEndDate)}
                </Descriptions.Item>
              )}
              
              {incident.caseFile.findings && (
                <Descriptions.Item label="Findings">
                  {incident.caseFile.findings}
                </Descriptions.Item>
              )}
              
              {incident.caseFile.recommendations && (
                <Descriptions.Item label="Recommendations">
                  {incident.caseFile.recommendations}
                </Descriptions.Item>
              )}
              
              {incident.caseFile.conclusion && (
                <Descriptions.Item label="Conclusion">
                  <Tag color={
                    incident.caseFile.conclusion === 'substantiated' ? 'green' :
                    incident.caseFile.conclusion === 'unsubstantiated' ? 'red' :
                    'orange'
                  }>
                    {incident.caseFile.conclusion.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          ) : (
            <Alert
              message="No Investigation"
              description="No investigation case file has been created for this incident yet."
              type="info"
              showIcon
            />
          )}
          
          {incident?.caseFile?.investigationReport?.status && (
            <div style={{ marginTop: 16 }}>
              <Title level={4}>Investigation Report</Title>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Status">
                  <Tag color={
                    incident.caseFile.investigationReport.status === 'pending' ? 'default' :
                    incident.caseFile.investigationReport.status === 'submitted' ? 'processing' :
                    incident.caseFile.investigationReport.status === 'reviewed' ? 'warning' :
                    incident.caseFile.investigationReport.status === 'approved' ? 'success' :
                    incident.caseFile.investigationReport.status === 'rejected' ? 'error' :
                    'default'
                  }>
                    {incident.caseFile.investigationReport.status.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="Submitted By">
                  {typeof incident.caseFile.investigationReport.submittedBy === 'object' ?
                    `${incident.caseFile.investigationReport.submittedBy.name || 'Name not available'}` :
                    incident.caseFile.investigationReport.submittedBy || 'Unknown'
                  }
                </Descriptions.Item>
                
                <Descriptions.Item label="Submitted At">
                  {formatDate(incident.caseFile.investigationReport.submittedAt)}
                </Descriptions.Item>
                
                <Descriptions.Item label="Content">
                  {incident.caseFile.investigationReport.content || 'No content available'}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
          
          {incident?.caseFile?.officerActions?.status && (
            <div style={{ marginTop: 16 }}>
              <Title level={4}>Officer Review</Title>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Status">
                  <Tag color={
                    incident.caseFile.officerActions.status === 'pending' ? 'default' :
                    incident.caseFile.officerActions.status === 'in_progress' ? 'processing' :
                    incident.caseFile.officerActions.status === 'completed' ? 'success' :
                    'default'
                  }>
                    {incident.caseFile.officerActions.status.replace(/_/g, ' ').toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="Reviewed By">
                  {typeof incident.caseFile.officerActions.reviewedBy === 'object' ?
                    `${incident.caseFile.officerActions.reviewedBy.name || 'Name not available'}` :
                    incident.caseFile.officerActions.reviewedBy || 'Unknown'
                  }
                </Descriptions.Item>
                
                <Descriptions.Item label="Reviewed At">
                  {formatDate(incident.caseFile.officerActions.reviewedAt)}
                </Descriptions.Item>
                
                <Descriptions.Item label="Actions Taken">
                  {incident.caseFile.officerActions.actions || 'No actions specified'}
                </Descriptions.Item>
                
                {incident.caseFile.officerActions.notes && (
                  <Descriptions.Item label="Notes">
                    {incident.caseFile.officerActions.notes}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          )}
        </Card>
      )
    },
    {
      key: "timeline",
      label: "Timeline",
      children: (
        <Card title="Incident Timeline" style={{ maxWidth: 1000, margin: '0 auto' }}>
          {incident?.timeline && incident.timeline.length > 0 ? (
            <Timeline
              mode="left"
              items={incident.timeline.map((event, index) => ({
                key: index,
                label: formatDate(event.date),
                children: (
                  <>
                    <strong>{event.action}</strong>
                    <p>{event.description}</p>
                    {typeof event.performedBy === 'object' && (
                      <Text type="secondary">By: {event.performedBy.name}</Text>
                    )}
                  </>
                )
              }))}
            />
          ) : (
            <Alert
              message="No Timeline Events"
              description="No timeline events have been recorded for this incident."
              type="info"
              showIcon
            />
          )}
        </Card>
      )
    }
  ];

  useEffect(() => {
    if (isAuthenticated && id) {
    fetchIncidentDetails();
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    // Fetch investigators if user is admin and the assignment modal is shown
    if (isAdmin && showAssignModal) {
      fetchInvestigators();
    }
  }, [isAdmin, showAssignModal]);

  const fetchIncidentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await incidentService.getIncidentById(id);
      console.log('Incident details:', response.data);
      setIncident(response.data);
    } catch (error) {
      console.error('Failed to fetch incident details:', error);
      setError('Failed to fetch incident details. ' + (error.response?.data?.message || error.message));
      message.error('Failed to fetch incident details');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestigators = async () => {
    try {
      setFetchingInvestigators(true);
      const response = await adminService.getUsersByRole('investigator');
      setInvestigators(response.data);
    } catch (error) {
      console.error('Failed to fetch investigators:', error);
      message.error('Failed to fetch investigators: ' + (error.response?.data?.message || error.message));
    } finally {
      setFetchingInvestigators(false);
    }
  };

  const handleDelete = () => {
    confirm({
      title: 'Are you sure you want to delete this incident?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await incidentService.deleteIncident(id);
          message.success('Incident deleted successfully');
          navigate('/incidents');
        } catch (error) {
          console.error('Failed to delete incident:', error);
          message.error('Failed to delete incident: ' + (error.response?.data?.message || error.message));
        }
      },
    });
  };

  const handleAssign = async (values) => {
    try {
      setActionLoading(true);
      const response = await incidentService.assignIncident(id, values);
      message.success('Incident assigned successfully');
      setShowAssignModal(false);
      setIncident(response.data.incident);
    } catch (error) {
      console.error('Failed to assign incident:', error);
      message.error('Failed to assign incident: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReport = async (values) => {
    try {
      setActionLoading(true);
      const response = await incidentService.submitInvestigationReport(id, values);
      message.success('Investigation report submitted successfully');
      setIncident(response.data.incident);
    } catch (error) {
      console.error('Failed to submit report:', error);
      message.error('Failed to submit report: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewReport = async (values) => {
    try {
      setActionLoading(true);
      const response = await incidentService.reviewInvestigationReport(id, values);
      message.success('Investigation report reviewed successfully');
      setIncident(response.data.incident);
    } catch (error) {
      console.error('Failed to review report:', error);
      message.error('Failed to review report: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'open': 'orange',
      'under_investigation': 'blue',
      'pending': 'purple',
      'closed': 'green',
      'reopened': 'red'
    };
    return colors[status?.toLowerCase()] || 'default';
  };

  // Content to show based on user role
  const renderRoleBasedActions = () => {
    if (isAdmin) {
    return (
        <Card title="Admin Actions" style={{ marginTop: 16 }}>
          <Space>
            <Button 
              type="primary" 
              icon={<UserOutlined />} 
              onClick={() => setShowAssignModal(true)}
            >
              Assign to Investigator
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/incidents/${id}/edit`)}
            >
              Edit Incident
            </Button>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              Delete Incident
            </Button>
          </Space>
          
          <AssignmentModal 
            visible={showAssignModal}
            onCancel={() => setShowAssignModal(false)}
            onAssign={handleAssign}
            investigators={investigators}
            loading={actionLoading}
            fetchingInvestigators={fetchingInvestigators}
          />
        </Card>
      );
    }
    
    if (isInvestigator) {
      // Check if this investigator is assigned to this incident
      if (incident?.assignedTo === currentUser?._id) {
        // Check if a report has already been submitted
        if (incident?.caseFile?.investigationReport?.status === 'submitted') {
          return (
            <Alert
              message="Report Submitted"
              description="You have already submitted an investigation report for this incident."
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          );
        }
        
        return <InvestigationReportForm onSubmit={handleSubmitReport} loading={actionLoading} />;
      } else {
        return (
          <Alert
            message="Not Assigned"
            description="You are not assigned to investigate this incident."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        );
      }
    }
    
    if (isOfficer) {
      // Check if there's a submitted report to review
      if (incident?.caseFile?.investigationReport?.status === 'submitted') {
        return (
          <OfficerReviewForm 
            report={incident.caseFile.investigationReport}
            onSubmit={handleReviewReport}
            loading={actionLoading}
          />
        );
      } else if (incident?.caseFile?.investigationReport?.status === 'reviewed' ||
                incident?.caseFile?.investigationReport?.status === 'approved' ||
                incident?.caseFile?.investigationReport?.status === 'rejected') {
        return (
          <Alert
            message="Report Already Reviewed"
            description="This investigation report has already been reviewed."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        );
      } else {
        return (
          <Alert
            message="No Report to Review"
            description="There is no submitted investigation report for this incident yet."
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        );
      }
    }
    
    return null;
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h2>You must be logged in to view incident details</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '24px',
        paddingTop: '100px',
        maxWidth: 1000, 
        margin: '0 auto' 
      }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={() => navigate('/incidents')} type="primary">
              Back to Incidents
            </Button>
          }
        />
      </div>
    );
  }

  if (!incident) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
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
        onClick={() => navigate('/incidents')}
        style={{ marginBottom: 16 }}
      >
        Back to Incidents
      </Button>
      
      <Tabs defaultActiveKey="details" type="card" items={incident ? getTabItems() : []} />
    </div>
  );
};

export default IncidentDetailsPage; 