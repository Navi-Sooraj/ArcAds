import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { DISPLAY_DATE_FORMAT } from '../utils/dateConstants';
import { Link as RouterLink } from 'react-router-dom';
import { Link as ScrollLink, Element } from 'react-scroll';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Paper,
  CircularProgress,
} from '@mui/material';
import RocketLaunch from '@mui/icons-material/RocketLaunch';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ArrowForward from '@mui/icons-material/ArrowForward';
import Storefront from '@mui/icons-material/Storefront';
import AddBusiness from '@mui/icons-material/AddBusiness';
import Campaign from '@mui/icons-material/Campaign';
import bgImage from '../assets/bg.jpeg';
import { AD_SERVICES } from '../data/adServices';
import { categoryTitleToSlug } from '../data/adServicesStore';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function formatInrBookings(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) return '₹0';
  return `₹${Math.round(x).toLocaleString('en-IN')}`;
}

export default function AdvertiserDashboard() {
  const { user } = useAuth();
  const [statsLoading, setStatsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    bookingsCount: 0,
    spacesCount: 0,
    totalBookedValue: 0,
    memberSinceLabel: '—',
  });

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'smooth';
    return () => { html.style.scrollBehavior = prev; };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setStatsLoading(false);
      return;
    }
    let cancelled = false;
    setStatsLoading(true);

    (async () => {
      try {
        const [bookingsRes, meRes] = await Promise.all([
          api.get(`bookings/user/${user.id}`),
          api.get('auth/me'),
        ]);
        if (cancelled) return;
        const bookings = bookingsRes?.data?.data || [];
        const me = meRes?.data?.user;
        const createdAt = me?.createdAt || user?.createdAt;
        let memberSinceLabel = '—';
        if (createdAt) {
          memberSinceLabel = dayjs(createdAt).format(DISPLAY_DATE_FORMAT);
        }
        const spaceIds = new Set(bookings.map((b) => b.adSpaceId).filter((id) => id != null));
        const totalBookedValue = bookings.reduce((acc, b) => acc + Number(b.totalAmount || 0), 0);
        setDashboardStats({
          bookingsCount: bookings.length,
          spacesCount: spaceIds.size,
          totalBookedValue,
          memberSinceLabel,
        });
      } catch {
        if (!cancelled) {
          setDashboardStats({
            bookingsCount: 0,
            spacesCount: 0,
            totalBookedValue: 0,
            memberSinceLabel: '—',
          });
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <Box
      sx={{
        background: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        color: 'text.primary',
        pb: 4,
        position: 'relative',
      }}
    >
      {/* Global Glossy Sheen Overlay */}
      <Box 
        sx={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.1) 100%)', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 1,
          pointerEvents: 'none',
        }} 
      />

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

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, py: { xs: 7, md: 4 } }}>
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
                  sx={{ opacity: 0, animation: 'heroFadeUp 0.55s ease-out 0.4s forwards' }}
                >
                  <Button
                    component={ScrollLink}
                    to="ad-services-section"
                    smooth={true}
                    duration={500}
                    offset={-70}
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: 'rgba(255,255,255,0.8)',
                      color: 'white',
                      bgcolor: 'rgba(38, 38, 38, 0.72)',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(134, 105, 71, 0.08)'
                      },
                      cursor: 'pointer'
                    }}
                  >
                    Services
                  </Button>
                </Stack>

              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* ArcAds ad service categories (same catalog as /ad-services) */}
      <Element name="ad-services-section">
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
          <Typography variant="h4" fontWeight={800}>Ad Services</Typography>
          <Button component={RouterLink} to="/ad-services" variant="outlined" size="small" endIcon={<ArrowForward />}>
            All categories
          </Button>
        </Stack>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
          Online Advertising, Product-Based Advertising, Transportation Advertising, Digital Screens & Mall Advertising,
          TV Channel Advertising, and Event & Sponsorship Advertising—open a category to see bookable packages.
        </Typography>
        <Grid container spacing={2.5} sx={{ mb: 8 }}>
          {AD_SERVICES.map((cat) => (
            <Grid item xs={12} sm={6} md={4} key={cat.id}>
              <Card
                component={RouterLink}
                to={`/ad-services/${categoryTitleToSlug(cat.title)}`}
                sx={{
                  height: '100%',
                  textDecoration: 'none',
                  color: 'inherit',
                  borderRadius: 2.5,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all .25s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: 4,
                    borderColor: cat.color,
                  },
                }}
              >
                <CardMedia component="img" height={120} image={cat.image} alt="" sx={{ objectFit: 'cover' }} />
                <Box sx={{ height: 4, bgcolor: cat.color }} />
                <CardContent sx={{ pt: 2, pb: 2 }}>
                  <Typography fontWeight={800} variant="h6" sx={{ lineHeight: 1.3 }}>
                    {cat.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    {cat.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Element>

        {/* STATS — from your bookings + account (no placeholder numbers) */}
        <Paper
          sx={{
            bgcolor: 'background.paper',
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2.5, md: 3 },
            borderRadius: 2.5,
            mb: 8,
            position: 'relative',
          }}
        >
          {statsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120 }}>
              <CircularProgress size={36} />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
                columnGap: { xs: 2, sm: 3, md: 4 },
                rowGap: { xs: 3, md: 2 },
                alignItems: 'center',
              }}
            >
              {[
                { value: String(dashboardStats.bookingsCount), label: 'Bookings' },
                { value: String(dashboardStats.spacesCount), label: 'Spaces booked' },
                { value: dashboardStats.memberSinceLabel, label: 'Member since' },
              ].map((stat) => (
                <Box
                  key={stat.label}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: 0.75,
                    minWidth: 0,
                    py: { xs: 0.5, md: 0 },
                  }}
                >
                  <Typography
                    component="div"
                    fontWeight={800}
                    sx={{
                      fontSize: { xs: 'clamp(1.5rem, 4vw, 1.85rem)', md: 'clamp(1.65rem, 2.2vw, 2.35rem)' },
                      lineHeight: 1.2,
                      minHeight: { xs: '2.4rem', md: '2.85rem' },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      wordBreak: 'break-word',
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontWeight: 500,
                      lineHeight: 1.35,
                      px: 0.5,
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        {/* ABOUT — text-only, no imagery */}
        <Paper
          elevation={0}
          sx={{
            mb: 8,
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => `${theme.palette.primary.main}08`,
            boxShadow: 'none',
          }}
        >
          <Box
            sx={{
              px: { xs: 2.5, sm: 4, md: 6 },
              py: { xs: 4, md: 5.5 },
              p: { xs: 4, md: 6 },
              borderRadius: 6,
              background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h4"
              component="h2"
              fontWeight={800}
              sx={{ fontSize: { xs: '1.65rem', sm: '2rem' }, lineHeight: 1.25 }}
            >
              About Us
            </Typography>
            <Typography
              variant="body1"
              color="white"
              sx={{
                mt: 2.5,
                lineHeight: 1.85,
                fontSize: { xs: '1rem', sm: '1.05rem' },
                maxWidth: 640,
                mx: 'auto',
              }}
            >
              Our mission is to streamline the advertising economy by providing exclusive, partner-managed inventory through our direct collaborations. 
              We further enhance this by digitalizing local ad spaces, making them transparent and accessible for every brand.
            </Typography>
          </Box>
        </Paper>
      </Container>

    </Box>
  );
}
