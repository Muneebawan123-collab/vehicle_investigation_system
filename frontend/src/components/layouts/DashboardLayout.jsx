import { useState, useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Tooltip,
  Badge,
  CircularProgress,
  Switch,
  Container,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { formatFileUrl } from '../../utils/imageUtils';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import HomeIcon from '@mui/icons-material/Home';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Psychology from '@mui/icons-material/Psychology';
import FindInPage from '@mui/icons-material/FindInPage';
import BrokenImage from '@mui/icons-material/BrokenImage';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ReportIcon from '@mui/icons-material/Report';
import {
  Dashboard as DashboardIcon,
  DirectionsCar as CarsIcon,
  Assignment as IncidentsIcon,
  Description as DocumentsIcon,
  People as UsersIcon,
  BarChart as StatsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon2,
  Person as PersonIcon,
  Notifications as NotificationsIcon2,
  Search as SearchIcon2,
  ChatBubbleOutline as ChatIcon2,
  DarkMode as DarkModeIcon2,
  LightMode as LightModeIcon2,
  Psychology as AIIcon,
  FindInPage as FraudDetectionIcon,
  BrokenImage as DamageAnalysisIcon
} from '@mui/icons-material';

// Context
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationBell from '../notifications/NotificationBell';

// Constants
const drawerWidth = 260;

// Styled components
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(4),
    paddingTop: theme.spacing(10),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    position: 'relative',
    zIndex: 1,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  minHeight: '64px',
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const StyledAppBar = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    position: 'fixed',
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }),
);

// Menu Items
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Vehicles', icon: <CarsIcon />, path: '/vehicles' },
  { text: 'Incidents', icon: <ReportIcon />, path: '/incidents' },
  { text: 'Documents', icon: <DescriptionIcon />, path: '/documents' },
  { text: 'Messages', icon: <ChatIcon2 />, path: '/messages' },
  { text: 'AI Tools', icon: <AIIcon />, path: '/ai' },
  { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
];

const adminMenuItems = [
  { text: 'User Management', icon: <PeopleIcon />, path: '/admin/users' },
  { text: 'Manage Users', icon: <PeopleIcon />, path: '/admin/manage-users' },
  { text: 'Promote Muneeb', icon: <PersonIcon />, path: '/admin/promote-muneeb' },
  { text: 'System Logs', icon: <DescriptionIcon />, path: '/admin/logs' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
  { text: 'Test Notifications', icon: <NotificationsIcon2 />, path: '/admin/test-notifications' },
];

const officerMenuItems = [
  { text: 'Pending Reviews', icon: <CheckCircleOutlineIcon />, path: '/incidents/officer-review' },
];

// Navigation items for different user roles
const navigationItems = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <DashboardIcon />,
    roles: ['Admin', 'Officer', 'Investigator', 'Viewer'],
  },
  {
    title: 'Vehicles',
    path: '/vehicles',
    icon: <CarsIcon />,
    roles: ['Admin', 'Officer', 'Investigator', 'Viewer'],
    children: [
      {
        title: 'All Vehicles',
        path: '/vehicles',
        roles: ['Admin', 'Officer', 'Investigator', 'Viewer'],
      },
      {
        title: 'Register Vehicle',
        path: '/vehicles/register',
        roles: ['Admin', 'Officer'],
      },
    ],
  },
  {
    title: 'Incidents',
    path: '/incidents',
    icon: <IncidentsIcon />,
    roles: ['Admin', 'Officer', 'Investigator', 'Viewer'],
    children: [
      {
        title: 'All Incidents',
        path: '/incidents',
        roles: ['Admin', 'Officer', 'Investigator', 'Viewer'],
      },
      {
        title: 'Create Incident',
        path: '/incidents/create',
        roles: ['Admin', 'Officer', 'Investigator'],
      },
      {
        title: 'Officer Review',
        path: '/incidents/officer-review',
        roles: ['Admin', 'Officer'],
      },
    ],
  },
  {
    title: 'Documents',
    path: '/documents',
    icon: <DocumentsIcon />,
    roles: ['Admin', 'Officer', 'Investigator', 'Viewer'],
    children: [
      {
        title: 'All Documents',
        path: '/documents',
        roles: ['Admin', 'Officer', 'Investigator', 'Viewer'],
      },
      {
        title: 'Upload Document',
        path: '/documents/upload',
        roles: ['Admin', 'Officer', 'Investigator'],
      },
    ],
  },
  {
    title: 'Messages',
    path: '/messages',
    icon: <ChatIcon2 />,
    roles: ['Admin', 'Officer', 'Investigator'],
  },
  {
    title: 'AI Tools',
    path: '/ai',
    icon: <AIIcon />,
    roles: ['Admin', 'Officer', 'Investigator'],
    children: [
      {
        title: 'Fraud Detection',
        path: '/ai/fraud-detection',
        icon: <FraudDetectionIcon />,
        roles: ['Admin', 'Officer', 'Investigator'],
      },
      {
        title: 'Damage Analysis',
        path: '/ai/damage-analysis',
        icon: <DamageAnalysisIcon />,
        roles: ['Admin', 'Officer', 'Investigator'],
      },
    ],
  },
  {
    title: 'Admin',
    path: '/admin',
    icon: <SettingsIcon />,
    roles: ['Admin'],
    children: [
      {
        title: 'Manage Users',
        path: '/admin/users',
        roles: ['Admin'],
      },
      {
        title: 'All Users',
        path: '/admin/manage-users',
        roles: ['Admin'],
      },
      {
        title: 'System Logs',
        path: '/admin/logs',
        roles: ['Admin'],
      },
      {
        title: 'Settings',
        path: '/admin/settings',
        roles: ['Admin'],
      },
    ],
  },
];

const DashboardLayout = ({ darkMode, setDarkMode }) => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  
  const { user, loading, logout, hasRole } = useAuth();
  const { unreadCount: chatUnreadCount } = useChat();
  const { unreadCount: notificationUnreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isMenuOpen = Boolean(anchorEl);
  const isNotificationsOpen = Boolean(notificationsAnchorEl);
  
  // Get current path segments
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Handle mobile drawer toggle
  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };
  
  // Handle profile menu open
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Handle notifications menu open
  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle notifications close
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  // Handle logout
  const handleLogout = () => {
    handleMenuClose();
    logout();
  };
  
  // Handle profile click
  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };
  
  // Handle settings click
  const handleSettingsClick = () => {
    handleMenuClose();
    navigate('/admin/settings');
  };
  
  // Handle theme toggle
  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };
  
  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const crumbs = [];
    let path = '';
    
    crumbs.push({
      text: 'Home',
      path: '/home',
      icon: <HomeIcon fontSize="small" sx={{ mr: 0.5 }} />,
      isHomeIcon: true,
    });
    
    pathSegments.forEach((segment, index) => {
      path += `/${segment}`;
      
      // Format segment text (capitalize, replace hyphens with spaces)
      let text = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Handle IDs in the path
      if (segment.match(/^[0-9a-f]{24}$/i)) {
        text = 'Details';
      }
      
      crumbs.push({
        text: text,
        path: path,
      });
    });
    
    return crumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  // Handle home icon click
  const handleHomeClick = () => {
    // Logout the user
    logout();
    // Navigate to home page with proper redirect state
    navigate('/home', { state: { from: { pathname: "/" } } });
  };
  
  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  const drawer = (
    <>
      <DrawerHeader>
        <Typography variant="h6" sx={{ flexGrow: 1, ml: 2, fontWeight: 700 }}>
          VIS
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: (theme) => theme.palette.primary.main + '20',
                  borderRight: (theme) => `3px solid ${theme.palette.primary.main}`,
                  '&:hover': {
                    backgroundColor: (theme) => theme.palette.primary.main + '30',
                  },
                },
              }}
            >
              <ListItemIcon>
                {item.text === 'Messages' ? (
                  <Badge color="error" badgeContent={chatUnreadCount} invisible={!chatUnreadCount}>
                    <ChatIcon2 />
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      {hasRole('admin') && (
        <>
          <Typography variant="caption" sx={{ ml: 2, mt: 2, color: 'text.secondary' }}>
            ADMINISTRATION
          </Typography>
          <List>
            {adminMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: (theme) => theme.palette.primary.main + '20',
                      borderRight: (theme) => `3px solid ${theme.palette.primary.main}`,
                      '&:hover': {
                        backgroundColor: (theme) => theme.palette.primary.main + '30',
                      },
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
      
      {hasRole('officer') && (
        <>
          <Typography variant="caption" sx={{ ml: 2, mt: 2, color: 'text.secondary' }}>
            OFFICER TOOLS
          </Typography>
          <List>
            {officerMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: (theme) => theme.palette.primary.main + '20',
                      borderRight: (theme) => `3px solid ${theme.palette.primary.main}`,
                      '&:hover': {
                        backgroundColor: (theme) => theme.palette.primary.main + '30',
                      },
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
      
      {/* AI Tools Section */}
      <>
        <Typography variant="caption" sx={{ ml: 2, mt: 2, color: 'text.secondary' }}>
          AI TOOLS
        </Typography>
        <List>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/ai/fraud-detection'}
              onClick={() => navigate('/ai/fraud-detection')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: (theme) => theme.palette.primary.main + '20',
                  borderRight: (theme) => `3px solid ${theme.palette.primary.main}`,
                  '&:hover': {
                    backgroundColor: (theme) => theme.palette.primary.main + '30',
                  },
                },
              }}
            >
              <ListItemIcon><FraudDetectionIcon /></ListItemIcon>
              <ListItemText primary="Fraud Detection" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/ai/damage-analysis'}
              onClick={() => navigate('/ai/damage-analysis')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: (theme) => theme.palette.primary.main + '20',
                  borderRight: (theme) => `3px solid ${theme.palette.primary.main}`,
                  '&:hover': {
                    backgroundColor: (theme) => theme.palette.primary.main + '30',
                  },
                },
              }}
            >
              <ListItemIcon><DamageAnalysisIcon /></ListItemIcon>
              <ListItemText primary="Damage Analysis" />
            </ListItemButton>
          </ListItem>
        </List>
      </>
      <Divider />
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
          <Typography variant="body2">Dark Mode</Typography>
          <Switch
            checked={darkMode}
            onChange={handleThemeToggle}
            icon={<LightModeIcon2 />}
            checkedIcon={<DarkModeIcon2 />}
          />
        </Box>
      </Box>
    </>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <StyledAppBar position="fixed" open={drawerOpen} elevation={1}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2, ...(drawerOpen && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
            InvestiCar Platform
          </Typography>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Theme Toggle */}
            <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              <IconButton
                color="inherit"
                onClick={handleThemeToggle}
                size="large"
              >
                {darkMode ? <LightModeIcon2 /> : <DarkModeIcon2 />}
              </IconButton>
            </Tooltip>
            
            {/* Messages */}
            <Tooltip title="Messages">
              <IconButton 
                color="inherit" 
                onClick={() => navigate('/messages')}
                size="large"
              >
                <Badge badgeContent={chatUnreadCount} color="error">
                  <ChatIcon2 />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* Notifications */}
            <NotificationBell />
            
            {/* Profile */}
            <Tooltip title="Account">
              <IconButton
                edge="end"
                aria-label="account of current user"
                aria-controls="primary-account-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
                size="large"
              >
                <Avatar 
                  alt={user?.name || 'User'} 
                  src={user?.profileImage}
                  sx={{ width: 32, height: 32 }}
                >
                  {(user?.name || 'U').charAt(0)}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </StyledAppBar>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={isNotificationsOpen}
        onClose={handleNotificationsClose}
        PaperProps={{
          sx: { width: 320, maxHeight: '70vh' },
        }}
      >
        <MenuItem onClick={handleNotificationsClose}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>New vehicle registered</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleNotificationsClose}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Document expiring soon</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleNotificationsClose}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>New incident report assigned</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleNotificationsClose}>
          <Typography variant="body2" sx={{ color: 'primary.main' }}>View all notifications</Typography>
        </MenuItem>
      </Menu>
      
      {/* User Menu */}
      <Menu
        id="primary-account-menu"
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        
        <MenuItem onClick={() => navigate('/profile/notifications')}>
          <ListItemIcon>
            <NotificationsIcon2 fontSize="small" />
          </ListItemIcon>
          Notifications
        </MenuItem>
        
        <MenuItem onClick={handleSettingsClick}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon2 fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      {/* Drawer - Desktop */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
          display: { xs: 'none', md: 'block' },
        }}
        variant="persistent"
        anchor="left"
        open={drawerOpen}
      >
        {drawer}
      </Drawer>
      
      {/* Drawer - Mobile */}
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={handleMobileDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Main Content */}
      <Main open={drawerOpen}>
        <Box sx={{ height: theme => theme.spacing(6) }} />
        
        {/* Breadcrumbs */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 3, mt: 2 }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            if (crumb.isHomeIcon) {
              return (
                <Link 
                  key={crumb.path}
                  color="inherit" 
                  sx={{ display: 'flex', alignItems: 'center' }}
                  component="button"
                  variant="body1"
                  onClick={handleHomeClick}
                >
                  {crumb.icon}
                  {crumb.text}
                </Link>
              );
            }
            
            return isLast ? (
              <Typography 
                key={crumb.path}
                color="text.primary" 
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {crumb.icon}
                {crumb.text}
              </Typography>
            ) : (
              <Link 
                key={crumb.path}
                color="inherit" 
                sx={{ display: 'flex', alignItems: 'center' }}
                component="button"
                variant="body1"
                onClick={() => navigate(crumb.path)}
              >
                {crumb.icon}
                {crumb.text}
              </Link>
            );
          })}
        </Breadcrumbs>
        
        {/* Page Content */}
        <Container 
          maxWidth="xl" 
          disableGutters
          sx={{ 
            pt: 2, 
            position: 'relative',
            zIndex: 1
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            style={{ paddingTop: '10px' }}
          >
            <Outlet />
          </motion.div>
        </Container>
      </Main>
    </Box>
  );
};

export default DashboardLayout; 