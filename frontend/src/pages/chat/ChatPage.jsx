import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, Paper, useMediaQuery, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ChatProvider } from '../../context/ChatContext';
import ChatList from '../../components/chat/ChatList';
import ChatDetail from '../../components/chat/ChatDetail';
import NewChatDialog from '../../components/chat/NewChatDialog';
import { MessageOutlined, ArrowBack } from '@mui/icons-material';

const ChatPage = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Set page title
  useEffect(() => {
    document.title = 'Messages | Vehicle Investigation System';
  }, []);

  const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId);
  };

  const handleBack = () => {
    setSelectedChatId(null);
  };

  return (
    <ChatProvider>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Messages
        </Typography>
        
        <Paper sx={{ p: 0, mb: 4, minHeight: '70vh', overflow: 'hidden' }}>
          <Grid container sx={{ height: '70vh' }}>
            {/* Mobile view with conditional rendering */}
            {isMobile ? (
              selectedChatId ? (
                <Grid item xs={12}>
                  <ChatDetail chatId={selectedChatId} onBack={handleBack} />
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <ChatList 
                    onChatSelect={handleChatSelect} 
                    onNewChat={() => setNewChatDialogOpen(true)} 
                  />
                </Grid>
              )
            ) : (
              /* Desktop view with side-by-side layout */
              <>
                <Grid item xs={12} md={4} sx={{ 
                  borderRight: `1px solid ${theme.palette.divider}`,
                  height: '100%',
                  overflow: 'auto'
                }}>
                  <ChatList 
                    onChatSelect={handleChatSelect} 
                    onNewChat={() => setNewChatDialogOpen(true)} 
                  />
                </Grid>
                <Grid item xs={12} md={8} sx={{ height: '100%' }}>
                  {selectedChatId ? (
                    <ChatDetail chatId={selectedChatId} onBack={isMobile ? handleBack : null} />
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      flexDirection: 'column',
                      height: '100%',
                      p: 3
                    }}>
                      <MessageOutlined sx={{ fontSize: 100, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" align="center">
                        Select a conversation or start a new one
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </>
            )}
          </Grid>
        </Paper>
        
        {/* New Chat Dialog */}
        <NewChatDialog 
          open={newChatDialogOpen} 
          onClose={() => setNewChatDialogOpen(false)} 
        />
      </Container>
    </ChatProvider>
  );
};

export default ChatPage; 