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
import Add from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import Person from '@mui/icons-material/Person';

const DRAWER_WIDTH = 260;

const navItems = [
  { path: '/owner', label: 'Dashboard', icon: <Dashboard /> },
  { path: '/owner/add', label: 'Add Ad Space', icon: <Add /> },
  { path: '/owner/listings', label: 'My Ad Spaces', icon: <ListIcon /> },
  { path: '/owner/profile', label: 'Profile', icon: <Person /> },
];

export default function OwnerLayout({ children }) {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawer = (
    <Box sx={{ py: 2, px: 1.5 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ px: 2, mb: 2, color: 'text.primary' }}>
        Vendor
      </Typography>
      <List disablePadding>
        {navItems.map(({ path, label, icon }) => {
          const isActive = location.pathname === path || (path !== '/' && path !== '/owner' && location.pathname.startsWith(path));
          return (
            <ListItemButton
              key={path}
              component={Link}
              to={path}
              selected={isActive}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: 'inherit' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'inherit' : 'action.active' }}>
                {icon}
              </ListItemIcon>
              <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100%' }}>
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
            borderRight: 1,
            borderColor: 'divider',
            top: { xs: 0, md: 64 },
            height: { xs: '100vh', md: 'calc(100vh - 64px)' },
            backgroundColor: 'rgba(11, 14, 20, 0.4)',
            backdropFilter: 'none',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100%',
        }}
      >
        {isMobile && (
          <IconButton
            color="inherit"
            onClick={() => setMobileOpen(true)}
            sx={{ mb: 1, color: 'text.primary' }}
            aria-label="open renter menu"
          >
            <MenuIcon />
          </IconButton>
        )}
        {children}
      </Box>
    </Box>
  );
}
