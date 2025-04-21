import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  AdminPanelSettings,
  PersonOff,
  Security,
  Warning
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const UserRoleManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    user: null,
    action: null
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.filter(u => u._id !== currentUser._id)); // Exclude current user
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    setConfirmDialog({
      open: true,
      title: `Confirm Role Change`,
      message: `Are you sure you want to ${newRole === 'admin' ? 'promote' : 'demote'} ${user.name} ${newRole === 'admin' ? 'to' : 'from'} admin role? This action will ${newRole === 'admin' ? 'grant' : 'remove'} all administrative privileges.`,
      user,
      action: async () => {
        try {
          const response = await fetch(`/api/users/${user._id}/role`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ role: newRole })
          });

          if (!response.ok) {
            throw new Error('Failed to update user role');
          }

          // Update local state
          setUsers(users.map(u => 
            u._id === user._id ? { ...u, role: newRole } : u
          ));

          // Show success message
          setError({ type: 'success', message: `Successfully ${newRole === 'admin' ? 'promoted' : 'demoted'} ${user.name}` });
        } catch (err) {
          console.error('Error updating user role:', err);
          setError({ type: 'error', message: 'Failed to update user role. Please try again.' });
        }
      }
    });
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleConfirm = async () => {
    if (confirmDialog.action) {
      await confirmDialog.action();
    }
    handleConfirmDialogClose();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Security sx={{ mr: 2 }} />
        <Typography variant="h6">User Role Management</Typography>
      </Box>

      {error && (
        <Alert 
          severity={error.type || 'error'} 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error.message || error}
        </Alert>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Current Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={user.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                    icon={user.role === 'admin' ? <AdminPanelSettings /> : undefined}
                  />
                </TableCell>
                <TableCell align="right">
                  {user.role === 'admin' ? (
                    <IconButton
                      color="warning"
                      onClick={() => handleRoleChange(user, 'user')}
                      title="Revoke admin access"
                    >
                      <PersonOff />
                    </IconButton>
                  ) : (
                    <IconButton
                      color="primary"
                      onClick={() => handleRoleChange(user, 'admin')}
                      title="Grant admin access"
                    >
                      <AdminPanelSettings />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleConfirmDialogClose}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Warning color="warning" sx={{ mr: 1 }} />
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>Cancel</Button>
          <Button 
            onClick={handleConfirm} 
            variant="contained" 
            color="primary"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default UserRoleManagement; 