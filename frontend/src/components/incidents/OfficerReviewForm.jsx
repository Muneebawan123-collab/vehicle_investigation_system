import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Card, Descriptions, Tag, Divider, message, Space, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { incidentService } from '../../services/api';
import UserDisplay from '../common/UserDisplay';

const { TextArea } = Input;
const { Option } = Select;

const OfficerReviewForm = ({ incident, report, onReviewComplete }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Add debugging on component mount
  useEffect(() => {
    console.log('DEBUGGING INVESTIGATOR DATA:');
    console.log('Incident:', incident);
    console.log('Report:', report);
    console.log('Submitted By:', report?.submittedBy);
    console.log('Assigned Investigator:', incident?.caseFile?.assignedInvestigator);
    console.log('Assigned To:', incident?.assignedTo);
    
    if (typeof report?.submittedBy === 'string') {
      console.log('SubmittedBy is a string, needs to be populated:', report.submittedBy);
    } else if (typeof report?.submittedBy === 'object') {
      console.log('SubmittedBy is an object:', report.submittedBy);
    }
    
    // For debug - load the user data directly if it's a string
    const loadUserData = async (userId) => {
      if (typeof userId === 'string') {
        try {
          // This is just for debugging - not for production
          console.log('Attempting to fetch user data for:', userId);
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      }
    };
    
    if (report?.submittedBy) {
      loadUserData(report.submittedBy);
    }
  }, [incident, report]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setError(null);
      
      console.log('Submitting review with validated values:', values);

      if (!values.actions || !values.reportStatus || !values.conclusion) {
        throw new Error('Missing required fields. Please fill in all required fields.');
      }

      const response = await incidentService.reviewInvestigationReport(incident._id, {
        actions: values.actions,
        notes: values.notes || '',
        reportStatus: values.reportStatus,
        conclusion: values.conclusion,
      });

      message.success('Investigation report reviewed successfully');
      if (onReviewComplete) {
        onReviewComplete(response.data.incident);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      setError(error.response?.data?.message || error.message || 'Failed to submit review');
      message.error('Failed to submit review: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title="Officer Review Form" 
      style={{ marginBottom: '20px' }}
      extra={
        <Tag color="blue">Pending Officer Review</Tag>
      }
    >
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      <Descriptions 
        title="Investigation Report Details" 
        bordered 
        column={1} 
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label="Incident Title">
          {incident?.title || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Incident ID">
          {incident?.incidentNumber || incident?._id || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Submitted By">
          {typeof report?.submittedBy === 'object' ? (
            <UserDisplay user={report.submittedBy} showRole={true} />
          ) : (
            <UserDisplay userId={report?.submittedBy || incident?.caseFile?.assignedInvestigator} showRole={true} />
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Submitted On">
          {report?.submittedAt ? new Date(report.submittedAt).toLocaleString() : 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Findings">
          {report?.findings || incident?.caseFile?.findings || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Recommendations">
          {report?.recommendations || incident?.caseFile?.recommendations || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Investigator's Conclusion">
          <Tag color={
            report?.conclusion === 'substantiated' ? 'green' : 
            report?.conclusion === 'unsubstantiated' ? 'red' : 
            report?.conclusion === 'inconclusive' ? 'orange' : 'default'
          }>
            {(report?.conclusion || incident?.caseFile?.conclusion || 'PENDING').toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Report Content">
          {report?.content || report?.reportContent || incident?.caseFile?.investigationReport?.content || 'N/A'}
        </Descriptions.Item>
      </Descriptions>
      
      <Divider orientation="left">Officer Review</Divider>
      
      <Form form={form} layout="vertical">
        <Form.Item
          name="actions"
          label="Actions to be Taken"
          rules={[{ required: true, message: 'Please specify the actions to be taken' }]}
          tooltip="Specify the actions that need to be taken based on this investigation report"
        >
          <TextArea 
            rows={4} 
            placeholder="Describe actions that should be taken based on the investigation findings" 
            showCount
            maxLength={2000}
          />
        </Form.Item>
        
        <Form.Item
          name="conclusion"
          label="Officer's Conclusion"
          rules={[{ required: true, message: 'Please provide your conclusion' }]}
          tooltip="Your professional assessment of the incident after reviewing the investigation"
        >
          <Select placeholder="Select your conclusion">
            <Option value="confirmed">Confirm Investigation Findings</Option>
            <Option value="additional_investigation">Additional Investigation Required</Option>
            <Option value="case_dismissed">Case Dismissed</Option>
            <Option value="legal_action">Legal Action Required</Option>
            <Option value="other">Other (Specify in Notes)</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="notes"
          label="Additional Notes"
          tooltip="Any additional information or clarification"
        >
          <TextArea 
            rows={3} 
            placeholder="Additional comments, notes, or clarification" 
            showCount
            maxLength={1000}
          />
        </Form.Item>
        
        <Form.Item
          name="reportStatus"
          label="Report Status Decision"
          rules={[{ required: true, message: 'Please approve or reject this report' }]}
          tooltip="Determine if the investigation report is sufficient and can be approved"
        >
          <Select placeholder="Approve or reject this report">
            <Option value="approved">Approve Report</Option>
            <Option value="rejected">Reject Report (Requires Further Investigation)</Option>
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
            <Button 
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
            >
              Save Draft
            </Button>
            <Button 
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => form.resetFields()}
            >
              Reset
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default OfficerReviewForm; 