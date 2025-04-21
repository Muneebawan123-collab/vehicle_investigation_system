import React from 'react';
import { Container, Grid, Typography } from '@mui/material';
import UserRoleManagement from '../../components/admin/UserRoleManagement';

const AdminDashboard = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <UserRoleManagement />
        </Grid>
        
        {/* Add other admin components here */}
      </Grid>
    </Container>
  );
};

export default AdminDashboard; 