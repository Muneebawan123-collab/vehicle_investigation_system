import React from 'react';
import { Card, Alert, Space } from 'antd';
import AssignIncidentForm from './AssignIncidentForm';
import InvestigationReportForm from './InvestigationReportForm';
import OfficerReviewForm from './OfficerReviewForm';

const IncidentActions = ({ 
  incident, 
  currentUser, 
  onAssignSuccess, 
  onReportSuccess, 
  onReviewSuccess 
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const isInvestigator = currentUser?.role === 'investigator';
  const isOfficer = currentUser?.role === 'officer';
  
  // Check if this investigator is assigned to this incident
  const isAssignedInvestigator = isInvestigator && 
    incident?.assignedTo === currentUser?._id || 
    incident?.caseFile?.assignedInvestigator === currentUser?._id;
  
  // Check if a report has been submitted for the incident
  const hasSubmittedReport = incident?.caseFile?.investigationReport?.status === 'submitted';
  
  // Render based on role and state
  if (isAdmin) {
    return (
      <Card title="Admin Actions" style={{ marginTop: 16 }}>
        <Space>
          <AssignIncidentForm 
            incidentId={incident._id} 
            onSuccess={onAssignSuccess} 
          />
        </Space>
      </Card>
    );
  }
  
  if (isInvestigator) {
    if (isAssignedInvestigator) {
      if (hasSubmittedReport) {
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
      
      return (
        <InvestigationReportForm 
          incidentId={incident._id} 
          onSuccess={onReportSuccess} 
        />
      );
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
    if (hasSubmittedReport) {
      return (
        <OfficerReviewForm 
          incidentId={incident._id} 
          reportData={incident.caseFile.investigationReport}
          onSuccess={onReviewSuccess} 
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

export default IncidentActions; 