import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Dashboard from '@mui/icons-material/Dashboard';
import People from '@mui/icons-material/People';
import Store from '@mui/icons-material/Store';
import Place from '@mui/icons-material/Place';
import EventNote from '@mui/icons-material/EventNote';
import Person from '@mui/icons-material/Person';
import ViewQuilt from '@mui/icons-material/ViewQuilt';
import CampaignIcon from '@mui/icons-material/Campaign';
import bgImage from '../assets/Bg2.png';

const DRAWER_WIDTH = 260;

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: <Dashboard /> },
  { path: '/admin/ad-center', label: 'Ad Services', icon: <CampaignIcon /> },
  { path: '/admin/vendor-management', label: 'Vendors', icon: <Store /> },
  { path: '/admin/users', label: 'Advertisers', icon: <People /> },
  { path: '/admin/adspaces', label: 'Ad Spaces', icon: <Place /> },
  { path: '/admin/bookings', label: 'Ad Space Bookings', icon: <EventNote /> },
  { path: '/admin/profile', label: 'Profile', icon: <Person /> },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawer = (
    <Box sx={{ py: 2, px: 1.5 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ px: 2, mb: 2, color: 'text.primary' }}>
        Admin
      </Typography>
      <List disablePadding>
        {navItems.map(({ path, label, icon }) => {
          const isActive = location.pathname === path || (path !== '/' && path !== '/admin' && location.pathname.startsWith(path));
          return (
            <ListItemButton
              key={path}
              component={Link}
              to={path}
              selected={isActive}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 1,
                mx: 1, // Add space from sidebar edges
                py: 1.2,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  boxShadow: '0 4px 12px rgba(10, 132, 255, 0.3)', // Electric blue glow
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: 'inherit' },
                },
                '&:hover:not(.Mui-selected)': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'inherit' : 'text.secondary' }}>
                {icon}
              </ListItemIcon>
              <ListItemText 
                primary={label} 
                primaryTypographyProps={{ 
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem'
                }} 
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        width: '100%', 
        minHeight: '100vh',
        position: 'relative',
        backgroundColor: 'transparent',
      }}
    >
      {/* Sidebar - permanent on desktop */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            top: { xs: 0, md: 72 },
            height: { xs: '100vh', md: 'calc(100vh - 72px)' },
            backgroundColor: 'rgba(11, 14, 20, 0.4)', 
            backdropFilter: 'none',
            backgroundImage: 'none',
            borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 }, // More padding on desktop
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100%',
        }}
      >
        {isMobile && (
          <IconButton
            color="inherit"
            onClick={() => setMobileOpen(true)}
            sx={{ mb: 1, color: 'text.primary' }}
            aria-label="open admin menu"
          >
            <MenuIcon />
          </IconButton>
        )}
        {children}
      </Box>
    </Box>
  );
}
