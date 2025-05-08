import React from 'react';
import { Box, Typography, Container, Grid, Paper, Button, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { styled } from '@mui/material/styles';

// Background image for the header
const headerBackgroundImage = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80';

const HeaderSection = styled(Box)(({ theme }) => ({
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url(${headerBackgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: 'white',
  padding: theme.spacing(10, 2),
  marginBottom: theme.spacing(6),
  borderRadius: theme.spacing(1),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 4),
  margin: theme.spacing(1),
  fontWeight: 600,
  textTransform: 'none',
}));

const AboutPage = () => {
  const teamMembers = [
    {
      name: 'Muneeb Awan',
      role: 'Lead Developer',
      bio: 'Expert in vehicle tracking systems with over 8 years of experience in law enforcement software.',
    },
    {
      name: 'Sarah Johnson',
      role: 'UX Designer',
      bio: 'Specialized in creating intuitive interfaces for government agencies and investigation departments.',
    },
    {
      name: 'Rajiv Patel',
      role: 'Security Specialist',
      bio: 'Former cybersecurity consultant for police departments with expertise in data protection.',
    },
    {
      name: 'Arun Singh',
      role: 'Project Lead',
      bio: 'Oversees the development and implementation of the Vehicle Investigation System.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header Section */}
      <HeaderSection>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            component="h1"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            About Us
          </Typography>
          <Typography
            variant="h5"
            align="center"
            sx={{
              mb: 5,
              maxWidth: '800px',
              mx: 'auto',
              opacity: 0.9,
              textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
            }}
          >
            Learn more about the Vehicle Investigation System and our mission to improve
            law enforcement efficiency and vehicle tracking capabilities.
          </Typography>
        </Container>
      </HeaderSection>

      {/* Mission Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          align="center"
          sx={{ mb: 6, fontWeight: 600 }}
        >
          Our Mission
        </Typography>
        <Paper
          elevation={2}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            mb: 6,
          }}
        >
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
            The Vehicle Investigation System (VIS) was developed with a clear mission: to provide law
            enforcement agencies with a comprehensive solution for tracking, managing, and investigating
            vehicle-related cases efficiently and effectively.
          </Typography>
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
            Our system streamlines the entire investigation workflow, from initial vehicle registration
            to incident tracking and final case resolution. By centralizing all vehicle-related data,
            we enable investigators to make connections and solve cases faster than ever before.
          </Typography>
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
            We are committed to constant improvement and innovation, ensuring that our system always
            meets the evolving needs of modern law enforcement agencies and investigation departments.
          </Typography>
        </Paper>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? 'background.paper' : '#f5f7fa', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            sx={{ mb: 6, fontWeight: 600 }}
          >
            Key Features
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <Typography variant="h5" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                  Vehicle Management
                </Typography>
                <Typography variant="body1">
                  Our system offers comprehensive vehicle registration, tracking, and management capabilities.
                  Store detailed vehicle information, ownership history, registration status, and technical
                  specifications in a centralized database.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <Typography variant="h5" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                  Incident Tracking
                </Typography>
                <Typography variant="body1">
                  Document and track all vehicle-related incidents, from minor infractions to major
                  crimes. Link incidents to specific vehicles, track investigation progress, and maintain
                  detailed records of all case-related activities.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <Typography variant="h5" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                  Document Management
                </Typography>
                <Typography variant="body1">
                  Securely store and organize all vehicle-related documents, including registration
                  certificates, ownership papers, and investigation reports. Our system ensures quick
                  access to critical documents when they're needed most.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Team Section */}
      <Container maxWidth="lg" sx={{ my: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          align="center"
          sx={{ mb: 6, fontWeight: 600 }}
        >
          Our Team
        </Typography>
        <Grid container spacing={4}>
          {teamMembers.map((member, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                }}
              >
                <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                  {member.name}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2, color: 'primary.main', fontWeight: 500 }}
                >
                  {member.role}
                </Typography>
                <Typography variant="body1">{member.bio}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* History Section */}
      <Box sx={{ bgcolor: theme => theme.palette.mode === 'dark' ? 'background.paper' : '#f5f7fa', py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            component="h2"
            align="center"
            sx={{ mb: 6, fontWeight: 600 }}
          >
            Our History
          </Typography>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 3,
            }}
          >
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
              The Vehicle Investigation System was founded in 2021 in response to the growing need for
              better vehicle tracking and management tools in law enforcement. What started as a small
              project for a local police department has since grown into a comprehensive system used by
              multiple agencies across the country.
            </Typography>
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
              Our team of developers, security specialists, and law enforcement consultants has worked
              tirelessly to create a system that addresses the real-world challenges faced by investigation
              departments. We've continuously refined our platform based on user feedback and evolving
              needs in the field.
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
              Today, we're proud to offer one of the most advanced vehicle investigation systems available,
              helping law enforcement agencies work more efficiently and solve cases faster than ever before.
            </Typography>
          </Paper>
        </Container>
      </Box>

      {/* Contact Section */}
      <Container maxWidth="lg" sx={{ my: 8 }}>
        <Typography
          variant="h3"
          component="h2"
          align="center"
          sx={{ mb: 6, fontWeight: 600 }}
        >
          Contact Us
        </Typography>
        <Paper
          elevation={2}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
            Have questions about the Vehicle Investigation System? We're here to help!
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Email:</strong> contact@visinvestigation.com
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Phone:</strong> +1 (123) 456-7890
          </Typography>
          <Typography variant="body1">
            <strong>Address:</strong> 123 Investigation Ave, Delhi, India
          </Typography>
          <Divider sx={{ my: 4 }} />
          <StyledButton
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/home"
            sx={{ mt: 2 }}
          >
            Return to Home
          </StyledButton>
        </Paper>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          bgcolor: theme => theme.palette.mode === 'dark' ? 'background.paper' : '#212529',
          color: theme => theme.palette.mode === 'dark' ? 'text.primary' : 'white',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} Vehicle Investigation System. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default AboutPage; 