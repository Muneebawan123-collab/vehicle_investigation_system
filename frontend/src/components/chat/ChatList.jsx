import React, { useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Typography, 
  Divider,
  Badge,
  Box,
  Skeleton,
  Paper,
  IconButton,
  Button
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Delete as DeleteIcon,
  Chat as ChatIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

const ChatList = ({ onChatSelect, onNewChat }) => {
  const { chats, loading, error, fetchChats, deleteChat } = useChat();
  const { user } = useAuth();
  
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);
  
  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this chat?')) {
      const success = await deleteChat(chatId);
      if (success) {
        toast.success('Chat deleted successfully');
      } else {
        toast.error('Failed to delete chat');
      }
    }
  };
  
  if (error) {
    return (
      <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
        <Typography variant="body1">{error}</Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 1 }}
          onClick={fetchChats}
        >
          Retry
        </Button>
      </Paper>
    );
  }
  
  return (
    <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          Messages
        </Typography>
        <IconButton color="primary" onClick={onNewChat}>
          <AddIcon />
        </IconButton>
      </Box>
      
      <Divider />
      
      {loading ? (
        // Loading skeletons
        Array.from(new Array(5)).map((_, index) => (
          <React.Fragment key={index}>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Skeleton variant="circular" width={40} height={40} />
              </ListItemAvatar>
              <ListItemText
                primary={<Skeleton width="80%" />}
                secondary={<Skeleton width="60%" />}
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))
      ) : chats.length === 0 ? (
        // Empty state
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <ChatIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1" color="text.secondary">
            No messages yet
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={onNewChat}
            sx={{ mt: 2 }}
          >
            Start a new conversation
          </Button>
        </Box>
      ) : (
        // Actual chat list
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {chats.map((chat) => {
            // Get the other participant (for 1:1 chats)
            const otherParticipant = chat.participants?.find(
              (p) => p._id !== user?._id
            );
            
            return (
              <React.Fragment key={chat._id}>
                <ListItem 
                  alignItems="flex-start" 
                  button 
                  onClick={() => onChatSelect(chat._id)}
                >
                  <ListItemAvatar>
                    <Badge
                      color="primary"
                      badgeContent={chat.unreadCount}
                      invisible={!chat.unreadCount}
                    >
                      <Avatar alt={otherParticipant?.name || 'User'}>
                        <AccountCircleIcon />
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        component="span"
                        variant="body1"
                        color="text.primary"
                        sx={{ fontWeight: chat.unreadCount ? 700 : 400 }}
                      >
                        {otherParticipant?.name || chat.title || 'Chat'}
                      </Typography>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {chat.lastMessage && 
                            formatDistanceToNow(new Date(chat.lastMessage), { 
                              addSuffix: true,
                              includeSeconds: true
                            })
                          }
                        </Typography>
                      </React.Fragment>
                    }
                  />
                  {user?.role === 'admin' && (
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={(e) => handleDeleteChat(chat._id, e)}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default ChatList; 