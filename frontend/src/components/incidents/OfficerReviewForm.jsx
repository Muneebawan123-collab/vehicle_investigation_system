import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Select, Descriptions, Tag, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { incidentService } from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

const OfficerReviewForm = ({ incidentId, reportData, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await incidentService.reviewInvestigationReport(incidentId, {
        actions: values.actions,
        notes: values.notes,
        reportStatus: values.reportStatus
      });

      message.success('Investigation report reviewed successfully');
      form.resetFields();
      
      if (onSuccess) {
        onSuccess(response.data.incident);
      }
    } catch (error) {
      console.error('Failed to review report:', error);
      message.error('Failed to review report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card title="Review Investigation Report">
      {reportData && (
        <>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Findings">{reportData.findings || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Recommendations">{reportData.recommendations || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Conclusion">
              <Tag color={
                reportData.conclusion === 'substantiated' ? 'green' :
                reportData.conclusion === 'unsubstantiated' ? 'red' :
                'orange'
              }>
                {reportData.conclusion?.toUpperCase() || 'PENDING'}
              </Tag>
            </Descriptions.Item>
            {reportData.submittedAt && (
              <Descriptions.Item label="Submitted On">{formatDate(reportData.submittedAt)}</Descriptions.Item>
            )}
            <Descriptions.Item label="Report Content">{reportData.content || reportData.reportContent || 'N/A'}</Descriptions.Item>
          </Descriptions>

          <Divider />

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="actions"
              label="Officer Actions"
              rules={[{ required: true, message: 'Please specify your actions' }]}
            >
              <TextArea rows={4} placeholder="Describe actions to be taken based on this report..." />
            </Form.Item>

            <Form.Item
              name="notes"
              label="Additional Notes"
            >
              <TextArea rows={3} placeholder="Any additional notes or comments..." />
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
              <Button.Group>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<CheckCircleOutlined />}
                >
                  Submit Review
                </Button>
              </Button.Group>
            </Form.Item>
          </Form>
        </>
      )}

      {!reportData && (
        <div>No investigation report available for review</div>
      )}
    </Card>
  );
};

export default OfficerReviewForm; 