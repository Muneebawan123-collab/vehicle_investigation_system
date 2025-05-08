import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const NewChatDialog = ({ open, onClose }) => {
  const { createChat } = useChat();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [error, setError] = useState(null);

  // Fetch users when dialog opens
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    setError(null);
    try {
      // Only admin can see all users
      const endpoint = user?.role === 'admin' 
        ? '/users' 
        : '/users/available';
      
      const response = await api.get(endpoint);
      
      // Filter out current user and inactive users
      const filteredUsers = response.data.filter(u => 
        u._id !== user?._id && u.isActive !== false
      );
      
      setUsers(filteredUsers);
    } catch (err) {
      setError('Failed to fetch users: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching users:', err);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      setError('Please select a user to chat with');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Create a new chat with the selected user
      const chat = await createChat(
        [selectedUser], 
        null,  // Default title
        initialMessage
      );
      
      if (chat) {
        toast.success('Chat created successfully');
        handleClose();
      }
    } catch (err) {
      setError('Failed to create chat: ' + (err.response?.data?.message || err.message));
      console.error('Error creating chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUser('');
    setInitialMessage('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Start a New Conversation</DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <FormControl 
          fullWidth 
          margin="normal" 
          disabled={fetchingUsers || loading}
        >
          <InputLabel id="user-select-label">Select User</InputLabel>
          <Select
            labelId="user-select-label"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            label="Select User"
          >
            {fetchingUsers ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading users...
              </MenuItem>
            ) : users.length === 0 ? (
              <MenuItem disabled>No users available</MenuItem>
            ) : (
              users.map((u) => (
                <MenuItem key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
        
        <TextField
          fullWidth
          margin="normal"
          label="Initial Message (Optional)"
          multiline
          rows={3}
          value={initialMessage}
          onChange={(e) => setInitialMessage(e.target.value)}
          disabled={loading}
        />
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Start a conversation with another user in the system. 
          {user?.role === 'admin' 
            ? ' As an admin, you can message any user.' 
            : ' You can message admins or specific users based on your role.'}
        </Typography>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!selectedUser || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Start Chat'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewChatDialog; 