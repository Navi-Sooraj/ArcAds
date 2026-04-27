import { useState, useEffect, useRef } from 'react';
import { Box, Container, Typography, Button, Grid, AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, useTheme, useMediaQuery, Divider, Stack, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import MenuIcon from '@mui/icons-material/Menu';
import Storefront from '@mui/icons-material/Storefront';
import AddBusiness from '@mui/icons-material/AddBusiness';
import Campaign from '@mui/icons-material/Campaign';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ArrowForward from '@mui/icons-material/ArrowForward';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Footer from '../components/Footer';
import logo from '../assets/logo.png';
import api from '../api/axios';
const navLinks = [
  { label: 'Features', to: 'features' },
  { label: 'How it works', to: 'how-it-works' }
];

export default function LandingPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [stats, setStats] = useState({ adSpaces: 0, advertisers: 0, cities: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    api.get('public/landing-stats')
      .then((res) => {
        if (res.data.success) {
          setStats(res.data.data);
        }
      })
      .catch((err) => console.error("Could not load stats", err));
  }, []);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Header / Navbar */}
      <AppBar 
        position={isScrolled ? "fixed" : "absolute"} 
        elevation={isScrolled ? 4 : 0} 
        sx={{ 
          bgcolor: isScrolled ? 'rgba(11, 14, 20, 0.72)' : 'transparent', 
          backdropFilter: isScrolled ? 'blur(12px) saturate(180%)' : 'none',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: 'all .4s cubic-bezier(0.4, 0, 0.2, 1)',
          ...(isScrolled && {
            animation: 'slideNavbarDown 0.5s ease-out forwards',
            '@keyframes slideNavbarDown': {
              from: { transform: 'translateY(-100%)' },
              to: { transform: 'translateY(0)' }
            }
          })
        }}
      >
        <Toolbar>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              display: 'inline-flex',
              alignItems: 'flex-end',
              textDecoration: 'none',
              color: 'inherit',
            }}
            >

            <Box sx={{ fontSize: '18px', display: 'flex', alignItems: 'flex-end' }}> 
                            
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

          </Box>
          {isMobile ? (
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)} aria-label="menu">
              <MenuIcon />
            </IconButton>
          ) : (
            <Stack direction="row" spacing={2} alignItems="center">
              {navLinks.map((item) => (
                <Button
                  key={item.label}
                  color="inherit"
                  component={ScrollLink}
                  to={item.to}
                  smooth
                  duration={500}
                  offset={-80}
                  sx={{ textTransform: 'none', cursor: 'pointer' }}
                >
                  {item.label}
                </Button>
              ))}
              <Button color="inherit" variant="outlined" component={RouterLink} to="/login" sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}>
                Login
              </Button>
              <Button variant="contained" color="secondary" component={RouterLink} to="/signup">
                Get Started
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }}>
          <List>
            {navLinks.map((item) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton
                  component={ScrollLink}
                  to={item.to}
                  smooth
                  duration={500}
                  offset={-80}
                  spy
                  onClick={() => setDrawerOpen(false)}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/login" onClick={() => setDrawerOpen(false)}>
                <ListItemText primary="Login" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/signup" onClick={() => setDrawerOpen(false)}>
                <ListItemText primary="Get Started" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: 'transparent',
          color: 'white',
          pt: { xs: 6, md: 0 },
        }}
      >

        
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2, py: { xs: 7, md: 4 } }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid item xs={12} md={4.5}  sx={{ display: 'flex', ml: '15em' }}>
              <Stack 
                spacing={3} 
                sx={{ 
                  textAlign: { xs: 'center', md: 'left' }, 
                  maxWidth: 620,
                  '@keyframes heroFadeUp': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } }
                }}
              >

                <Typography
                  variant="h1"
                  fontWeight={800}
                  sx={{
                    fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.6rem' },
                    lineHeight: 1.1,
                    opacity: 0,
                    animation: 'heroFadeUp 0.55s ease-out 0.2s forwards',
                  }}
                >
                  CREATIVE
                  <Box component="span" 
                    sx={{ 
                      display: 'block', 
                      color: 'secondary.light', 
                      fontFamily: "'Segoe UI', sans-serif",
                      animation: 'heroFadeUp 0.55s ease-out 0.2s forwards'
                    }}
                  >
                     ADVERTISING.
                  </Box>
                </Typography>
                <Typography
                  // variant="h6"
                  sx={{
                    maxWidth: 560,
                    mx: { xs: 'auto', md: 0 },
                    opacity: 0.95,
                    fontWeight: 400,
                    lineHeight: 1.6,
                    animation: 'heroFadeUp 0.55s ease-out 0.3s forwards',
                  }}
                >
                  Brands built for the bold
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent={{ xs: 'center', md: 'flex-start' }}
                  sx={{ opacity: 0, animation: 'heroFadeUp 0.55s ease-out 0.4s forwards', position: 'relative' }}
                >
                  <Button component={RouterLink} to="/signup" variant="contained" color="secondary" size="large" endIcon={<ArrowForward />}>
                    Start Free
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/login"
                    variant="outlined"
                    size="large"
                    sx={{ borderColor: 'rgba(255,255,255,0.8)', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}
                  >
                    Login
                  </Button>
                </Stack>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.2}
                  justifyContent={{ xs: 'center', md: 'flex-start' }}
                  sx={{ opacity: 0, animation: 'heroFadeUp 0.55s ease-out 0.5s forwards' }}
                >
                  {['Verified listings', 'Transparent pricing', 'Fast approvals'].map((item) => (
                    <Paper
                      key={item}
                      sx={{
                        px: 1.6,
                        py: 0.7,
                        borderRadius: 999,
                        bgcolor: 'rgba(255,255,255,0.12)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.22)',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {item}
                    </Paper>
                  ))}
                </Stack>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ position: 'relative', maxWidth: 520, mx: 'auto', height: { xs: 360, sm: 420, md: 450 } }}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    position: 'absolute',
                    inset: { xs: '40px 12px 20px 12px', md: '28px 16px 24px 16px' },
                    boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
                    opacity: 0,
                    animation: 'heroFloatIn 0.6s ease-out 0.35s forwards',
                    '@keyframes heroFloatIn': { from: { opacity: 0, transform: 'translateY(24px) scale(0.96)' }, to: { opacity: 1, transform: 'translateY(0) scale(1)' } },
                  }}
                >
                  <Typography variant="subtitle2" sx={{ opacity: 0.85, mb: 1 }}>
                    Campaign Activity
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ mb: 2.5 }}>
                    Smarter bookings, better visibility
                  </Typography>
                  <Stack spacing={1.5}>
                    {[
                      { Icon: Storefront, title: 'Billboards', text: 'High-impact roadside placements' },
                      { Icon: AddBusiness, title: 'Hoardings', text: 'Prime local visibility zones' },
                      { Icon: Campaign, title: 'Digital screens', text: 'Dynamic creatives with flexibility' },
                    ].map(({ Icon, title, text }) => (
                      <Box
                        key={title}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.4,
                          p: 1.4,
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.10)',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon sx={{ fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{title}</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.9 }}>{text}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Box id="features" sx={{ py: { xs: 6, md: 10 }, px: 2, bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight="bold" align="center" color="primary" gutterBottom>
            Built for Everyone
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ maxWidth: 560, mx: 'auto', mb: 6 }}>
            Whether you want to advertise locally or monetize your ad space, ArcAds brings both sides together with transparent pricing and verified listings.
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 3,
                  height: '100%',
                  opacity: 0,
                  animation: 'slideUp 0.5s ease-out 0.1s forwards',
                  '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                }}
              >
                <Box sx={{ width: 72, height: 72, borderRadius: 2, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <Storefront sx={{ fontSize: 40, color: 'primary.contrastText' }} />
                </Box>
                <Typography variant="h6" fontWeight="600" gutterBottom>Advertisers</Typography>
                <Typography variant="body2" color="text.secondary">
                  Find and book ad spaces by location, type, and budget. Manage all your campaigns in one dashboard and reach local audiences effectively.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 3,
                  height: '100%',
                  opacity: 0,
                  animation: 'slideUp 0.5s ease-out 0.2s forwards',
                  '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                }}
              >
                <Box sx={{ width: 72, height: 72, borderRadius: 2, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <AddBusiness sx={{ fontSize: 40, color: 'primary.contrastText' }} />
                </Box>
                <Typography variant="h6" fontWeight="600" gutterBottom>Space Owners</Typography>
                <Typography variant="body2" color="text.secondary">
                  List your billboards, hoardings, and digital screens. Get discovered by brands and earn from inventory that was sitting idle.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 3,
                  height: '100%',
                  opacity: 0,
                  animation: 'slideUp 0.5s ease-out 0.3s forwards',
                  '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                }}
              >
                <Box sx={{ width: 72, height: 72, borderRadius: 2, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <Campaign sx={{ fontSize: 40, color: 'primary.contrastText' }} />
                </Box>
                <Typography variant="h6" fontWeight="600" gutterBottom>Local Reach</Typography>
                <Typography variant="body2" color="text.secondary">
                  Target hyper-local audiences with transparent pricing, verified listings, and support for multiple ad formats.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* How it works */}
      <Box id="how-it-works" sx={{ py: { xs: 6, md: 10 }, px: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)' }}>
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight="bold" align="center" color="primary" gutterBottom>
            How it works
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
            Three simple steps to get started
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {[
              { step: '1', title: 'Sign up', text: 'Create a free account as an advertiser or space owner in under a minute.' },
              { step: '2', title: 'List or browse', text: 'Space owners list their inventory; advertisers browse by location and type.' },
              { step: '3', title: 'Book & earn', text: 'Advertisers book dates; space owners approve and get paid. Simple.' },
            ].map((item, i) => (
              <Grid item xs={12} sm={4} key={item.step}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 2,
                    opacity: 0,
                    animation: `slideUp 0.5s ease-out ${0.15 + i * 0.1}s forwards`,
                    '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                  }}
                >
                  <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5, typography: 'h6' }}>
                    {item.step}
                  </Box>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom>{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.text}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Stats / Value */}
      <Box
        sx={{
          py: { xs: 6, md: 8 },
          px: 2,
          bgcolor: 'primary.main',
          color: 'white',
          opacity: 0,
          animation: 'fadeIn 0.6s ease-out 0.2s forwards',
          '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
        }}
      >
        <Container maxWidth="md">
          <Grid container spacing={4} justifyContent="center" textAlign="center">
            <Grid item xs={6} md={3}>
              <Typography variant="h4" fontWeight="bold">{stats.adSpaces || 0}+</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Ad spaces</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="h4" fontWeight="bold">{stats.advertisers || 0}+</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Advertisers</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="h4" fontWeight="bold">{stats.cities || 0}+</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Cities</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="h4" fontWeight="bold">24/7</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Support</Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Why choose us */}
      <Box sx={{ py: { xs: 6, md: 10 }, px: 2 }}>
        <Container maxWidth="sm">
          <Typography variant="h4" fontWeight="bold" align="center" color="primary" gutterBottom>
            Why ArcAds?
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            We bring trust and simplicity to local outdoor advertising.
          </Typography>
          <Stack spacing={2} alignItems="center">
            {['Transparent pricing — no hidden fees', 'Verified space owners and listings', 'Easy booking and calendar management', 'Dedicated support for advertisers and owners'].map((text) => (
              <Stack key={text} direction="row" spacing={2} alignItems="center" sx={{ width: '100%', maxWidth: 400 }}>
                <CheckCircle color="primary" />
                <Typography variant="body1" textAlign="center">{text}</Typography>
              </Stack>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Testimonials */}
      {/* <Box sx={{ py: { xs: 6, md: 8 }, px: 2 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight="bold" align="center" color="primary" gutterBottom>
            What customers say
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {[
              { quote: 'ArcAds helped us launch city-wise campaigns in just 2 days.', name: 'Marketing Lead, CityMart' },
              { quote: 'Listing our hoardings was simple and we started getting bookings quickly.', name: 'Space Owner, Hyderabad' },
              { quote: 'The platform made local outdoor advertising transparent and fast.', name: 'Founder, Nova Fitness' },
            ].map((t) => (
              <Grid item xs={12} md={4} key={t.name}>
                <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>&quot;{t.quote}&quot;</Typography>
                  <Typography variant="body2" color="text.secondary">{t.name}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box> */}

      {/* FAQ */}
      <Box sx={{ py: { xs: 4, md: 6 }, px: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)' }}>
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight="bold" align="center" color="primary" gutterBottom>
            Frequently asked questions
          </Typography>
          {[
            {
              q: 'Can vendors list spaces directly?',
              a: 'Vendors can submit listings, and admin reviews and manages approvals to maintain quality.',
            },
            {
              q: 'Do advertisers need technical knowledge?',
              a: 'No. Advertisers can browse, compare, and book spaces through a simple UI and AI design canvas.',
            },
            {
              q: 'How are templates managed?',
              a: 'Templates are controlled by admin and are available in the AI Design Canvas for users and vendors.',
            },
          ].map((f) => (
            <Accordion key={f.q} disableGutters>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight={600}>{f.q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{f.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>

      {/* CTA */}
      <Box
        sx={{
          py: { xs: 6, md: 8 },
          px: 2,
          bgcolor: 'rgba(255, 255, 255, 0.01)',
          textAlign: 'center',
          opacity: 0,
          animation: 'slideUp 0.5s ease-out 0.15s forwards',
          '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
            Ready to get started?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Join thousands of advertisers and space owners on ArcAds.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center">
            <Button component={RouterLink} to="/signup" variant="contained" color="primary" size="large">
              Create free account
            </Button>
            <Button component={RouterLink} to="/login" variant="outlined" color="primary" size="large">
              Login
            </Button>
          </Stack>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
