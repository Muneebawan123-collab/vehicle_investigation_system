import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const ChatDetail = ({ chatId, onBack }) => {
  const { fetchChat, currentChat, loading, error, sendMessage } = useChat();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chatId) {
      fetchChat(chatId);
    }
  }, [chatId, fetchChat]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    setSending(true);
    try {
      await sendMessage(chatId, message);
      setMessage('');
    } catch (err) {
      toast.error('Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  // Get the other participant (for 1:1 chats)
  const otherParticipant = currentChat?.participants?.find(
    (p) => p._id !== user?._id
  );

  if (loading && !currentChat) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
        <Typography variant="body1">{error}</Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 1 }}
          onClick={() => fetchChat(chatId)}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  if (!currentChat) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No chat selected
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat header */}
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton sx={{ mr: 1 }} onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar sx={{ mr: 2 }}>
          <AccountCircleIcon />
        </Avatar>
        <Typography variant="h6">
          {otherParticipant?.name || currentChat.title || 'Chat'}
        </Typography>
      </Paper>
      
      {/* Messages area */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          mb: 2
        }}
      >
        {currentChat.messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          currentChat.messages.map((msg, index) => {
            const isCurrentUser = msg.sender._id === user?._id;
            const displayName = isCurrentUser ? 'You' : msg.sender.name;
            
            return (
              <Box 
                key={index}
                sx={{
                  alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                  maxWidth: '70%'
                }}
              >
                <Paper 
                  elevation={1}
                  sx={{
                    p: 2,
                    bgcolor: isCurrentUser ? 'primary.light' : 'background.paper',
                    borderRadius: 2,
                    position: 'relative'
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {displayName} • {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                  </Typography>
                  <Typography variant="body1">
                    {msg.content}
                  </Typography>
                </Paper>
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>
      
      <Divider />
      
      {/* Message input */}
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={sending}
          size="small"
        />
        <Button
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          type="submit"
          disabled={sending || !message.trim()}
        >
          {sending ? <CircularProgress size={24} /> : 'Send'}
        </Button>
      </Box>
    </Box>
  );
};

export default ChatDetail; 