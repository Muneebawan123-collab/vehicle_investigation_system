import React from 'react';
import { Box, Typography, Container, Button, Grid, Paper, Card, CardContent, CardMedia } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// Background image URL (replace with your preferred image)
const backgroundImage = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80';

const HeroSection = styled(Box)(({ theme }) => ({
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: 'white',
  padding: theme.spacing(15, 2),
  textAlign: 'center',
  position: 'relative',
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(6),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 4),
  margin: theme.spacing(1),
  fontWeight: 600,
  textTransform: 'none',
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[10],
  },
}));

const CardImage = styled(CardMedia)(({ theme }) => ({
  height: 180,
}));

const HomePage = () => {
  const features = [
    {
      title: 'Vehicle Management',
      description: 'Comprehensive vehicle registration, tracking, and management with detailed history records.',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80',
    },
    {
      title: 'Incident Reporting',
      description: 'Document and track vehicle incidents with detailed information for investigation purposes.',
      image: 'https://images.unsplash.com/photo-1504239310552-b0b7a5d5a89c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80',
    },
    {
      title: 'Document Management',
      description: 'Secure storage and quick access to all vehicle-related documents and certificates.',
      image: 'https://images.unsplash.com/photo-1568219656418-15c329312bf1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            InvestiCar Platform
          </Typography>
          <Typography
            variant="h5"
            sx={{
              mb: 5,
              maxWidth: '800px',
              mx: 'auto',
              opacity: 0.9,
              textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
            }}
          >
            A comprehensive platform for managing vehicle registrations, tracking incidents,
            and storing important documents for law enforcement and investigation purposes.
          </Typography>
          <Box>
            <StyledButton
              variant="contained"
              color="primary"
              size="large"
              component={RouterLink}
              to="/login"
              state={{ from: { pathname: "/" } }}
            >
              Login
            </StyledButton>
            <StyledButton
              variant="outlined"
              color="secondary"
              size="large"
              component={RouterLink}
              to="/register"
              sx={{ color: 'white', borderColor: 'white' }}
            >
              Sign Up
            </StyledButton>
          </Box>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          align="center"
          sx={{ mb: 6, fontWeight: 600 }}
        >
          Key Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <FeatureCard elevation={4}>
                <CardImage image={feature.image} title={feature.title} />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* About Section */}
      <Container maxWidth="lg">
        <Paper
          elevation={3}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            mb: 8,
            bgcolor: theme => theme.palette.mode === 'dark' ? 'background.paper' : '#f8f9fa',
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
                About Our System
              </Typography>
              <Typography variant="body1" paragraph>
                The Vehicle Investigation System is designed to assist law enforcement agencies and
                investigation departments in managing vehicle-related cases efficiently. Our platform
                streamlines the entire investigation workflow from initial registration to case resolution.
              </Typography>
              <Typography variant="body1" paragraph>
                With powerful search capabilities, document management, and incident tracking, our system
                provides all the tools needed to conduct thorough vehicle investigations and maintain
                comprehensive records.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <StyledButton
                  variant="contained"
                  color="primary"
                  component={RouterLink}
                  to="/login"
                  state={{ from: { pathname: "/" } }}
                  sx={{ mt: 2 }}
                >
                  Get Started
                </StyledButton>
                <StyledButton
                  variant="outlined"
                  color="primary"
                  component={RouterLink}
                  to="/about"
                  sx={{ mt: 2 }}
                >
                  Learn More
                </StyledButton>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80"
                alt="About our system"
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 4,
                  boxShadow: 6,
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 6,
          bgcolor: theme => theme.palette.mode === 'dark' ? 'background.paper' : '#212529',
          color: theme => theme.palette.mode === 'dark' ? 'text.primary' : 'white',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                InvestiCar Platform
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Providing cutting-edge technology solutions for vehicle investigation management.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick Links
              </Typography>
              <Typography variant="body2" component={RouterLink} to="/login" state={{ from: { pathname: "/" } }} sx={{ display: 'block', mb: 1, color: 'inherit', textDecoration: 'none' }}>
                Login
              </Typography>
              <Typography variant="body2" component={RouterLink} to="/register" sx={{ display: 'block', mb: 1, color: 'inherit', textDecoration: 'none' }}>
                Sign Up
              </Typography>
              <Typography variant="body2" component={RouterLink} to="/about" sx={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
                About
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Contact Us
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Email: contact@visinvestigation.com
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Phone: +1 (123) 456-7890
              </Typography>
              <Typography variant="body2">
                Address: 123 Investigation Ave, Delhi, India
              </Typography>
            </Grid>
          </Grid>
          <Typography variant="body2" align="center" sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            © {new Date().getFullYear()} InvestiCar Platform. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage; 