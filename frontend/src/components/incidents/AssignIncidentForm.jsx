import React, { useState, useEffect } from 'react';
import { Form, Select, Button, Card, message, Modal } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { incidentService, adminService } from '../../services/api';

const { Option } = Select;

const AssignIncidentForm = ({ incidentId, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchingInvestigators, setFetchingInvestigators] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [investigators, setInvestigators] = useState([]);

  // Fetch real investigators from the database
  useEffect(() => {
    const fetchInvestigators = async () => {
      try {
        setFetchingInvestigators(true);
        const response = await adminService.getUsersByRole('investigator');
        setInvestigators(response.data);
      } catch (error) {
        console.error('Failed to fetch investigators:', error);
        message.error('Failed to load investigators. Please try again.');
      } finally {
        setFetchingInvestigators(false);
      }
    };

    if (modalVisible) {
      fetchInvestigators();
    }
  }, [modalVisible]);

  const showModal = () => {
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await incidentService.assignIncident(incidentId, {
        investigatorId: values.investigatorId,
        priority: values.priority
      });

      message.success('Incident assigned successfully');
      setModalVisible(false);
      form.resetFields();
      
      if (onSuccess) {
        onSuccess(response.data.incident);
      }
    } catch (error) {
      console.error('Failed to assign incident:', error);
      message.error('Failed to assign incident: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        type="primary" 
        icon={<UserOutlined />} 
        onClick={showModal}
      >
        Assign to Investigator
      </Button>

      <Modal
        title="Assign Incident to Investigator"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="investigatorId"
            label="Investigator"
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
    </>
  );
};

export default AssignIncidentForm; 