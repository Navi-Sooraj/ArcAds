import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { DISPLAY_DATE_FORMAT } from '../utils/dateConstants';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  ListItemIcon,
  ListItemText,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip as MuiChip,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Dashboard from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import Storefront from '@mui/icons-material/Storefront';
import Notifications from '@mui/icons-material/Notifications';
// import EventNote from '@mui/icons-material/EventNote'; // Replaced by type-specific icons
import BookOnline from '@mui/icons-material/BookOnline';
// import BrushIcon from '@mui/icons-material/Brush'; /* AI Canvas (advertiser / owner nav) — re-enable with ai-canvas routes */
import Campaign from '@mui/icons-material/Campaign';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import Star from '@mui/icons-material/Star';
import Info from '@mui/icons-material/Info';
import ConfirmationNumber from '@mui/icons-material/ConfirmationNumber';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Footer from './Footer';
import logo from '../assets/logo.png';
import globalBg from '../assets/Bg2.png';

export default function Layout({ children }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdvertiserHome = location.pathname === '/advertiser';
  const [isScrolled, setIsScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileAnchor, setMobileAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);

  useEffect(() => {
    if (!isAdvertiserHome) {
      setIsScrolled(false);
      return;
    }
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 400); 
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAdvertiserHome]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    api.get('notifications')
      .then((res) => { if (res.data.success) setNotifications(res.data.data || []); })
      .catch(() => {});
  }, [isAuthenticated, user?.id]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotifClick = (n) => {
    if (!n.isRead && n.id) {
      api.patch(`notifications/${n.id}/read`).then(() => {
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      }).catch(() => {});
    }
    setNotifAnchor(null);
    setSelectedNotif(n);
  };
  
  const handleRemoveNotif = (e, n) => {
    e.stopPropagation();
    if (!n.id) return;
    api.delete(`notifications/${n.id}`)
      .then(() => {
        setNotifications((prev) => prev.filter((x) => x.id !== n.id));
      })
      .catch(() => {});
  };

  const handleMarkAllRead = () => {
    if (!user?.id) return;
    api.patch('notifications/read-all', { userId: user.id })
      .then(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      })
      .catch(() => {});
  };

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => { setAnchorEl(null); setMobileAnchor(null); };
  const handleLogout = () => { logout(); handleClose(); navigate('/'); };
  const openNotif = (e) => setNotifAnchor(e.currentTarget);
  const closeNotif = () => setNotifAnchor(null);

  const navLinks = (
    <>
      {/* Advertiser nav items */}
      {user?.role === 'advertiser' && (
        <>
          <Button color="inherit" component={Link} to="/advertiser" startIcon={<HomeIcon />}>
            Home
          </Button>
          <Button color="inherit" component={Link} to="/ad-services" startIcon={<Campaign />}>
            Ad Services
          </Button>
          <Button color="inherit" component={Link} to="/marketplace" startIcon={<Storefront />}>
            Marketplace
          </Button>
          <Button color="inherit" component={Link} to="/advertiser/dashboard" startIcon={<SmartphoneIcon />}>
            Dashboard
          </Button>
          {/* <Button color="inherit" component={Link} to="/advertiser/ai-canvas" startIcon={<BrushIcon />}>
            AI Canvas
          </Button> */}
        </>
      )}

      {/* Space Owner nav items */}
      {user?.role === 'space_owner' && (
        <>
          <Button color="inherit" component={Link} to="/marketplace" startIcon={<Storefront />}>
            Marketplace
          </Button>
          <Button color="inherit" component={Link} to="/owner" startIcon={<Dashboard />}>
            My Spaces
          </Button>
          {/* <Button color="inherit" component={Link} to="/ai-canvas" startIcon={<BrushIcon />}>
            AI Canvas
          </Button> */}
        </>
      )}

      {/* Admin nav items */}
      {user?.role === 'admin' && (
        <>
          <Button color="inherit" component={Link} to="/ad-services" startIcon={<Campaign />}>
            Ad Services
          </Button>
          <Button color="inherit" component={Link} to="/marketplace" startIcon={<Storefront />}>
            Marketplace
          </Button>
          <Button color="inherit" component={Link} to="/admin" startIcon={<Dashboard />}>
            Dashboard
          </Button> 
        </>
      )}

      {/* Guest / unauthenticated nav items */}
      {!user && (
        <>
          <Button color="inherit" href="/#features" sx={{ textTransform: 'none' }}>
            Features
          </Button>
          <Button color="inherit" href="/#how-it-works" sx={{ textTransform: 'none' }}>
            How it works
          </Button>
        </>
      )}
    </>
  );

  const btnSx = {
    borderRadius: 2,
    px: 1.5,
    '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
  };

  return (
    <>
      <AppBar
        position={isAdvertiserHome ? (isScrolled ? 'fixed' : 'absolute') : 'sticky'}
        elevation={isScrolled ? 4 : 0}
        sx={{
          background: 'rgba(11, 14, 20, 0.4)', 
          backdropFilter: 'none',
          color: '#fff',
          borderBottom: (isAdvertiserHome && !isScrolled) ? 'none' : '1px solid rgba(255,255,255,0.12)',
          boxShadow: 'none',
          zIndex: 1100,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          ...(isScrolled && isAdvertiserHome && {
            animation: 'slideNavbarDown 0.5s ease-out forwards',
            '@keyframes slideNavbarDown': {
              from: { transform: 'translateY(-100%)' },
              to: { transform: 'translateY(0)' }
            }
          })
        }}
      >
        <Container maxWidth={false}>
          <Toolbar sx={{ minHeight: 72 }}>
            <Box
              component={Link}
              to={
                user?.role === 'advertiser' ? '/advertiser'
                : user?.role === 'space_owner' ? '/owner'
                : user?.role === 'admin' ? '/admin'
                : '/'
              }
              aria-label="ArcAds home"
              sx={{
                flexGrow: 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.2,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              
              {/* ------------------ Logo + Name ------------------ */}
              <Box 
                sx={{ fontSize: '18px', color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'flex-end'}}> 
                    
                <Box
                  component="img"
                  src={logo}
                  alt="ArcAds"
                  sx={{
                    height: '2.25em',      
                    padding: '0.25em', 
                    width: 'auto',
                    display: 'block',
                    mr: '-0.2em', 
                  }}
                />
                
                <Typography sx={{ fontSize: '2em', fontWeight: 600, letterSpacing: -1, lineHeight: 1 }}>
                  rcAds 
                </Typography>
                
              </Box>
              {/* ------------------------------------------------- */}
              
            </Box>

            {/* Desktop nav links */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                gap: 0.5,
                alignItems: 'center',
                '& .MuiButton-root': btnSx,
              }}
            >
              {navLinks}
            </Box>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <IconButton color="inherit" onClick={openNotif} aria-label="notifications" sx={{ ml: 0.5 }}>
                  <Badge badgeContent={unreadCount} color="secondary">
                    <Notifications />
                  </Badge>
                </IconButton>
                <Menu
                  anchorEl={notifAnchor}
                  open={Boolean(notifAnchor)}
                  onClose={closeNotif}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  sx={{ mt: 1.5 }}
                  PaperProps={{
                    sx: {
                      width: { xs: 'calc(100vw - 32px)', sm: 400 },
                      maxHeight: 520,
                      borderRadius: 4,
                      mt: 1.5,
                      background: 'rgba(23, 28, 41, 0.90)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                      overflow: 'hidden',
                      '& .MuiList-root': { py: 0 }
                    }
                  }}
                >
                  {/* Header Section */}
                  <Box sx={{ 
                    px: 2.5, 
                    py: 2.5, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.05), transparent)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" fontWeight="900" sx={{ color: '#fff', fontSize: '1.1rem' }}>
                        Inbox
                      </Typography>
                      {unreadCount > 0 && (
                        <MuiChip 
                          label={unreadCount} 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            bgcolor: 'secondary.main', 
                            color: 'white', 
                            fontWeight: 800, 
                            fontSize: '0.7rem' 
                          }} 
                        />
                      )}
                    </Box>
                    {unreadCount > 0 && (
                      <Button 
                        size="small" 
                        onClick={handleMarkAllRead}
                        startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
                        sx={{ 
                          textTransform: 'none', 
                          fontWeight: 700, 
                          color: 'secondary.main',
                          fontSize: '0.8rem',
                          '&:hover': { background: 'rgba(0, 188, 212, 0.1)' }
                        }}
                      >
                        Clear All
                      </Button>
                    )}
                  </Box>

                  {/* Feed Section */}
                  <Box sx={{ 
                    p: 1.5,
                    maxHeight: 420, 
                    overflowY: 'auto', 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.2,
                    '&::-webkit-scrollbar': { width: 6 }, 
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 10 } 
                  }}>
                    {notifications.length === 0 ? (
                      <Box sx={{ py: 8, textAlign: 'center' }}>
                        <Notifications sx={{ fontSize: 60, color: 'rgba(255,255,255,0.08)', mb: 2 }} />
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                          Everything is clear!
                        </Typography>
                      </Box>
                    ) : (
                      notifications.slice(0, 15).map((n) => {
                        const NotifIcon = n.type === 'booking' ? ConfirmationNumber : (n.type === 'review' ? Star : Info);
                        return (
                          <Box 
                            key={n.id}
                            onClick={() => handleNotifClick(n)}
                            sx={{ 
                              p: 2,
                              borderRadius: 3,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 2,
                              cursor: 'pointer',
                              background: !n.isRead ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                              border: '1px solid',
                              borderColor: !n.isRead ? 'rgba(0, 188, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              boxShadow: !n.isRead ? '0 4px 20px rgba(0, 188, 212, 0.1)' : 'none',
                              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              position: 'relative',
                              '&:hover': {
                                background: 'rgba(255, 255, 255, 0.08)',
                                transform: 'translateY(-2px)',
                                borderColor: 'rgba(255, 255, 255, 0.12)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                              }
                            }}
                          >
                            <Box 
                              sx={{ 
                                width: 44, 
                                height: 44, 
                                borderRadius: '14px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                flexShrink: 0,
                                background: !n.isRead ? 'linear-gradient(135deg, rgba(0, 188, 212, 0.2) 0%, rgba(0, 188, 212, 0.1) 100%)' : 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid',
                                borderColor: !n.isRead ? 'rgba(0, 188, 212, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                              }}
                            >
                              <NotifIcon sx={{ fontSize: 20, color: !n.isRead ? 'secondary.main' : 'rgba(255,255,255,0.3)' }} />
                            </Box>
                            
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <MuiChip 
                                  label={n.type || 'System'} 
                                  size="small" 
                                  variant="outlined" 
                                  sx={{ 
                                    height: 16, 
                                    fontSize: '0.6rem', 
                                    textTransform: 'uppercase', 
                                    fontWeight: 800,
                                    borderColor: !n.isRead ? 'secondary.main' : 'rgba(255,255,255,0.1)',
                                    color: !n.isRead ? 'secondary.main' : 'rgba(255,255,255,0.3)',
                                    borderWidth: 1,
                                  }} 
                                />
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>
                                  {dayjs(n.createdAt).fromNow()}
                                </Typography>
                              </Box>

                              <Typography 
                                variant="body2" 
                                fontWeight={n.isRead ? 600 : 800} 
                                sx={{ color: !n.isRead ? '#fff' : 'rgba(255,255,255,0.7)', lineHeight: 1.3, mb: 0.2, pr: 2 }}
                              >
                                {n.title}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: 'rgba(255,255,255,0.45)', 
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.4,
                                  fontSize: '0.75rem'
                                }}
                              >
                                {n.message}
                              </Typography>
                            </Box>

                            <IconButton 
                              size="small" 
                              onClick={(e) => handleRemoveNotif(e, n)}
                              sx={{ 
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                p: 0.5,
                                color: 'rgba(255,255,255,0.2)',
                                '&:hover': { color: 'error.main', background: 'rgba(211, 47, 47, 0.1)' },
                                transition: 'all 0.2s'
                              }}
                            >
                              <CloseIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        );
                      })
                    )}
                  </Box>
                </Menu>

                {/* Profile icon (desktop) - Premium Design */}
                <Box
                  onClick={handleMenu}
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    gap: 1.2,
                    ml: 1.5,
                    cursor: 'pointer',
                    px: 1.8,
                    py: 0.6,
                    borderRadius: '50px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.15)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    }
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: 'white',
                      letterSpacing: 0.3,
                      fontSize: '0.875rem',
                      userSelect: 'none'
                    }}
                  >
                    {user?.name || user?.email || 'User'}
                  </Typography>
                  <AccountCircle sx={{ fontSize: 28, color: 'rgba(255, 255, 255, 0.9)' }} />
                </Box>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                  <MenuItem
                    component={Link}
                    to={
                      user?.role === 'advertiser' ? '/advertiser/profile'
                      : user?.role === 'space_owner' ? '/owner/profile'
                      : user?.role === 'admin' ? '/admin/profile'
                      : '/profile'
                    }
                    onClick={handleClose}
                  >
                    Profile
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>


                {/* Mobile hamburger */}
                <IconButton sx={{ display: { xs: 'flex', md: 'none' } }} color="inherit" onClick={(e) => setMobileAnchor(e.currentTarget)}>
                  <MenuIcon />
                </IconButton>
                <Menu anchorEl={mobileAnchor} open={Boolean(mobileAnchor)} onClose={handleClose}>
                  {isAuthenticated && (
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', mb: 1, minWidth: 200 }}>
                      <Typography variant="subtitle2" fontWeight="bold" noWrap>
                        {user?.name || user?.email || 'User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {user?.role?.replace('_', ' ')}
                      </Typography>
                    </Box>
                  )}
                  {user?.role === 'advertiser' && [
                    <MenuItem key="home" component={Link} to="/advertiser" onClick={handleClose}>Home</MenuItem>,
                    <MenuItem key="mkt" component={Link} to="/marketplace" onClick={handleClose}>Marketplace</MenuItem>,
                    <MenuItem key="services" component={Link} to="/ad-services" onClick={handleClose}>Ad Services</MenuItem>,
                    <MenuItem key="book" component={Link} to="/advertiser/dashboard" onClick={handleClose}>Dashboard</MenuItem>,
                    /* <MenuItem key="ai" component={Link} to="/advertiser/ai-canvas" onClick={handleClose}>AI Canvas</MenuItem>, */
                  ]}
                  {user?.role === 'space_owner' && [
                    <MenuItem key="mkt" component={Link} to="/marketplace" onClick={handleClose}>Marketplace</MenuItem>,
                    <MenuItem key="spaces" component={Link} to="/owner" onClick={handleClose}>My Spaces</MenuItem>,
                    /* <MenuItem key="ai" component={Link} to="/ai-canvas" onClick={handleClose}>AI Canvas</MenuItem>, */
                  ]}
                  {user?.role === 'admin' && [
                    <MenuItem key="dash" component={Link} to="/admin" onClick={handleClose}>Dashboard</MenuItem>,
                    <MenuItem key="services" component={Link} to="/ad-services" onClick={handleClose}>Ad Services</MenuItem>,
                    <MenuItem key="mkt" component={Link} to="/marketplace" onClick={handleClose}>Marketplace</MenuItem>,
                  ]}
                  {!user?.role && [
                    <MenuItem key="features" component="a" href="/#features" onClick={handleClose}>Features</MenuItem>,
                    <MenuItem key="how" component="a" href="/#how-it-works" onClick={handleClose}>How it works</MenuItem>,
                    <MenuItem key="login" component={Link} to="/login" onClick={handleClose}>Login</MenuItem>,
                    <MenuItem key="signup" component={Link} to="/signup" onClick={handleClose}>Get Started</MenuItem>,
                  ]}
                  <MenuItem
                    component={Link}
                    to={
                      user?.role === 'advertiser' ? '/advertiser/profile'
                      : user?.role === 'space_owner' ? '/owner/profile'
                      : user?.role === 'admin' ? '/admin/profile'
                      : '/profile'
                    }
                    onClick={handleClose}
                  >
                    Profile
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button color="inherit" variant="outlined" component={Link} to="/login"
                  sx={{ ...btnSx, borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}>
                  Login
                </Button>
                <Button variant="contained" color="secondary" component={Link} to="/signup" sx={{ ...btnSx, ml: 2 }}>
                  Get Started
                </Button>
              </>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      <Box 
        component="main" 
        sx={{ 
          minHeight: 'calc(100vh - 64px)',
          background: `url(${globalBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {children}
      </Box>
      {(user?.role === 'advertiser' || !isAuthenticated) && <Footer />}

      {/* Notification Detail Modal */}
      <Dialog
        open={Boolean(selectedNotif)}
        onClose={() => setSelectedNotif(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight="800" color="primary.main">
              Notification Details
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedNotif && dayjs(selectedNotif.createdAt).format(`${DISPLAY_DATE_FORMAT}, hh:mm A`)}
            </Typography>
          </Box>
          <IconButton onClick={() => setSelectedNotif(null)} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="subtitle1" fontWeight="700" gutterBottom>
            {selectedNotif?.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {selectedNotif?.message}
          </Typography>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setSelectedNotif(null)} 
            variant="outlined" 
            sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
          >
            Close
          </Button>
          {selectedNotif?.link && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                const state = selectedNotif.link === '/admin/ad-center' ? { tab: 1 } : undefined;
                navigate(selectedNotif.link, { state });
                setSelectedNotif(null);
              }}
              sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
            >
              Go to Page
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
