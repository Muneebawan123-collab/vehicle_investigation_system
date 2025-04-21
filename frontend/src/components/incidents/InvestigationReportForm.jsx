import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Select } from 'antd';
import { FileDoneOutlined } from '@ant-design/icons';
import { incidentService } from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

const InvestigationReportForm = ({ incidentId, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await incidentService.submitInvestigationReport(incidentId, {
        findings: values.findings,
        recommendations: values.recommendations,
        conclusion: values.conclusion,
        reportContent: values.reportContent,
        attachments: values.attachments || []
      });

      message.success('Investigation report submitted successfully');
      form.resetFields();
      
      if (onSuccess) {
        onSuccess(response.data.incident);
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      message.error('Failed to submit report: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title="Submit Investigation Report" 
      extra={<FileDoneOutlined />}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="findings"
          label="Investigation Findings"
          rules={[{ required: true, message: 'Please enter your findings' }]}
        >
          <TextArea rows={4} placeholder="Detail your findings from the investigation..." />
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
          <TextArea rows={6} placeholder="Provide your complete investigation report here..." />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<FileDoneOutlined />}
          >
            Submit Investigation Report
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default InvestigationReportForm; 