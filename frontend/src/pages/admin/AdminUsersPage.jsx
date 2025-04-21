import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Alert, Box
} from '@mui/material';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { promoteMuneebToAdmin } from '../../utils/updateUserRole';
import { message } from 'antd';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getAllUsers();
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRoleChange = async (userId, newRole) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      console.log(`Updating user ${userId} to role: ${newRole}`);
      
      // Show processing message
      message.loading(`Updating user role to ${newRole}...`, 1);
      
      // Track current selection to restore if there's an error
      const originalUser = users.find(user => user._id === userId);
      const originalRole = originalUser?.role;
      
      // Update UI optimistically
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        )
      );
      
      try {
        const response = await adminService.updateUserRole(userId, newRole);
        console.log('Role update response:', response.data);
        
        // Show success on completion
        message.success(`User role updated successfully to ${newRole}`, 3);
        setSuccess(`User role updated successfully to ${newRole}`);
      } catch (error) {
        console.error('Error updating role:', error);
        
        // Revert the optimistic UI update
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId ? { ...user, role: originalRole } : user
          )
        );
        
        // Show detailed error message
        const errorMessage = error.response?.data?.message || 'Failed to update user role. Please try again.';
        message.error(errorMessage, 5);
        setError(errorMessage);
        
        if (error.response?.status === 403) {
          message.warning('You may not have sufficient permissions for this action.', 5);
        }
      }
    } catch (err) {
      console.error('Unexpected error handling role change:', err);
      message.error('An unexpected error occurred', 3);
      setError('An unexpected error occurred while updating the user role.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePromoteMuneeb = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await promoteMuneebToAdmin();
      
      // Update the users list
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === '67fdfab1c5f4f06ad5dced30' ? { ...user, role: 'admin' } : user
        )
      );
      
      setSuccess('Muneeb has been promoted to admin successfully!');
    } catch (err) {
      console.error('Failed to promote Muneeb to admin:', err);
      setError('Failed to promote Muneeb to admin. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          You do not have permission to access this page. Only administrators can manage users.
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        User Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
      )}
      
      <Box mb={3}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handlePromoteMuneeb}
          disabled={loading}
        >
          Promote Muneeb Awan to Admin
        </Button>
      </Box>
      
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              )}
              
              {!loading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              
              {users.map(user => (
                <TableRow key={user._id} sx={user._id === '67fdfab1c5f4f06ad5dced30' ? { bgcolor: '#f0f8ff' } : {}}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`role-label-${user._id}`}>Role</InputLabel>
                      <Select
                        labelId={`role-label-${user._id}`}
                        value={user.role || ''}
                        label="Role"
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={loading}
                      >
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="officer">Officer</MenuItem>
                        <MenuItem value="investigator">Investigator</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    {user._id === '67fdfab1c5f4f06ad5dced30' && user.role !== 'admin' && (
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => handleRoleChange(user._id, 'admin')}
                        disabled={loading}
                      >
                        Promote to Admin
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default AdminUsersPage; 