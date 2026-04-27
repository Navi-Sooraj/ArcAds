import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  Paper,
  Stack,
  Divider,
  Skeleton,
  Avatar,
  useTheme,
} from '@mui/material';
import { IconButton } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ArrowBackIosNew from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import Place from '@mui/icons-material/Place';
import Straighten from '@mui/icons-material/Straighten';
import Book from '@mui/icons-material/Book';
import EventBusy from '@mui/icons-material/EventBusy';
import Verified from '@mui/icons-material/Verified';
import PersonOutline from '@mui/icons-material/PersonOutline';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import BookingDialog from '../components/BookingDialog';
import { formatSpaceRateLabel, isDigitalScreenPerSecond } from '../utils/adSpacePricing';
import { resolveUploadUrl, checkIfVideo } from '../utils/mediaUrl';



const DEFAULT_ADSPACE_DETAIL_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600">
    <rect width="100%" height="100%" fill="#e0f2f1"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#00695c" font-family="system-ui,sans-serif" font-size="36">Listing preview</text>
  </svg>`
)}`;

const AD_TYPE_LABELS = {
  billboard: 'Billboard',
  hoarding: 'Hoarding',
  digital_screen: 'Digital screen',
  wall_painting: 'Wall painting',
  other: 'Other',
};

function adTypeLabel(adType) {
  if (!adType) return null;
  return AD_TYPE_LABELS[adType] || String(adType).replace(/_/g, ' ');
}

export default function AdSpaceDetails() {
  const theme = useTheme();
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const isAdvertiserFlow = location.pathname.startsWith('/advertiser');
  const marketplaceLink = isAdvertiserFlow ? '/advertiser/marketplace' : '/marketplace';
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [userBookingStatus, setUserBookingStatus] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(0);

  const getMediaArray = (m) => {
    if (!m) return [];
    if (Array.isArray(m)) return m;
    try {
      let parsed = typeof m === 'string' ? JSON.parse(m) : m;
      while (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };

  useEffect(() => {
    api.get(`adspaces/${id}`)
      .then((res) => setSpace(res.data.data))
      .catch(() => setSpace(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user?.id || !id) return;
    api.get(`bookings/user/${user.id}`)
      .then((res) => {
        const list = res.data.data || [];
        const forThisSpace = list.find((b) => Number(b.adSpaceId) === Number(id));
        setUserBookingStatus(forThisSpace ? forThisSpace.status : null);
      })
      .catch(() => setUserBookingStatus(null));
  }, [user?.id, id]);

  const handleBookingSuccess = () => {
    setUserBookingStatus('pending');
  };

  const fullyBooked = space?.hasActiveBooking === true;
  const bookDisabled = user && fullyBooked;

  const bookLabel = !user
    ? 'Login to book'
    : fullyBooked
      ? 'Fully booked'
      : 'Book this space';

  if (loading) {
    return (
      <Box sx={{ py: 2, maxWidth: 1200, mx: 'auto' }}>
        <Skeleton variant="rounded" height={48} width={200} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3, mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={280} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!space) {
    return (
      <Box sx={{ py: 6, textAlign: 'center', maxWidth: 480, mx: 'auto' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Ad space not found
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          This listing may have been removed or the link is incorrect.
        </Typography>
        <Button component={Link} to={marketplaceLink} variant="contained" startIcon={<ArrowBack />}>
          Back to marketplace
        </Button>
      </Box>
    );
  }

  const primary = theme.palette.primary.main;
  const primaryDark = theme.palette.primary.dark;

  const mediaList = getMediaArray(space.mediaUrls);
  const allMedia = mediaList.length > 0 ? mediaList : [space.imageUrl || DEFAULT_ADSPACE_DETAIL_IMAGE];
  if (space.videoUrl && !allMedia.includes(space.videoUrl)) {
    // Avoid double adding if it was already in mediaUrls
    const isVideoInList = allMedia.some(m => checkIfVideo(m));
    if (!isVideoInList) allMedia.push(space.videoUrl);
  }

  const handleSlide = (direction) => {
    setSlideDirection(direction);
    setSlideIndex((prev) => {
      if (direction === 1) return (prev + 1) % allMedia.length;
      return (prev - 1 + allMedia.length) % allMedia.length;
    });
  };

  return (
    <Box
      sx={{
        py: { xs: 2, md: 3 },
        maxWidth: 1200,
        mx: 'auto',
        px: { xs: 0, sm: 0 },
      }}
    >
      <Button
        component={Link}
        to={marketplaceLink}
        startIcon={<ArrowBack />}
        sx={{
          mb: 2,
          color: 'text.secondary',
          textTransform: 'none',
          fontWeight: 600,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        Marketplace
      </Button>

      <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start">
        {/* Media Column */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                aspectRatio: '16 / 9',
                maxHeight: { xs: 280, sm: 400, md: 520 },
                bgcolor: 'grey.900',
                overflow: 'hidden'
              }}
            >
              <AnimatePresence initial={false} custom={slideDirection}>
                <motion.div
                  key={slideIndex}
                  custom={slideDirection}
                  initial={{ x: slideDirection > 0 ? '100%' : '-100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: slideDirection > 0 ? '-100%' : '100%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {checkIfVideo(allMedia[slideIndex]) ? (
                    <Box
                      component="video"
                      src={resolveUploadUrl(allMedia[slideIndex])}
                      controls
                      autoPlay
                      muted
                      playsInline
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        bgcolor: '#000'
                      }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={resolveUploadUrl(allMedia[slideIndex])}
                      alt={`${space.title} - ${slideIndex + 1}`}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {allMedia.length > 1 && (
                <>
                  <IconButton
                    onClick={() => handleSlide(-1)}
                    sx={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(8px)',
                      color: '#fff',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
                      zIndex: 10
                    }}
                  >
                    <ArrowBackIosNew sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    onClick={() => handleSlide(1)}
                    sx={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(8px)',
                      color: '#fff',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' },
                      zIndex: 10
                    }}
                  >
                    <ArrowForwardIos sx={{ fontSize: 18 }} />
                  </IconButton>

                  {/* Indicators / Dots */}
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      position: 'absolute',
                      bottom: 20,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 10,
                      bgcolor: 'rgba(0,0,0,0.3)',
                      px: 1.5,
                      py: 0.8,
                      borderRadius: 10,
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    {allMedia.map((_, idx) => (
                      <Box
                        key={idx}
                        onClick={() => {
                          setSlideDirection(idx > slideIndex ? 1 : -1);
                          setSlideIndex(idx);
                        }}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: idx === slideIndex ? 'primary.main' : 'rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: idx === slideIndex ? 'primary.main' : 'rgba(255,255,255,0.7)' }
                        }}
                      />
                    ))}
                  </Stack>
                </>
              )}

              {/* Status Chips Overlay */}
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={1}
                sx={{ 
                  position: 'absolute', 
                  top: 20, 
                  left: 20, 
                  right: 20, 
                  zIndex: 11 
                }}
              >
                {space.adType && (
                  <Chip
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        {space.adType === 'digital_screen' && (
                          <Box sx={{ 
                            width: 6, height: 6, borderRadius: '50%', bgcolor: '#44ff44',
                            '@keyframes pulse-green': { '0%': { opacity: 1 }, '50%': { opacity: 0.4 }, '100%': { opacity: 1 } },
                            animation: 'pulse-green 1.5s infinite'
                          }} />
                        )}
                        {adTypeLabel(space.adType)}
                      </Box>
                    }
                    size="small"
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(10px)',
                      color: '#fff',
                      fontWeight: 700,
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      height: 28,
                      '& .MuiChip-label': { px: 1.5 }
                    }}
                  />
                )}
                {space.verified && (
                  <Chip
                    icon={<Verified sx={{ '&&': { color: '#4caf50', fontSize: 16 } }} />}
                    label="Verified"
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(10px)',
                      color: '#fff',
                      fontWeight: 700,
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      height: 28
                    }}
                  />
                )}
                <Chip
                  size="small"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Box sx={{ 
                        width: 6, height: 6, borderRadius: '50%', 
                        bgcolor: space.hasActiveBooking === true ? '#ff9800' : '#4caf50'
                      }} />
                      {space.hasActiveBooking === true
                        ? space.bookedUntil
                          ? `Booked until ${space.bookedUntil}`
                          : 'Fully booked'
                        : 'Available'}
                    </Box>
                  }
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)',
                    color: '#fff',
                    fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    height: 28
                  }}
                />
              </Stack>

              {/* Title Section Overlay */}
              <Box 
                sx={{ 
                  position: 'absolute', 
                  bottom: allMedia.length > 1 ? 50 : 0, 
                  left: 0, 
                  right: 0, 
                  p: { xs: 2, sm: 3 },
                  background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                  zIndex: 5
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    color: '#fff',
                    textShadow: '0 2px 12px rgba(0,0,0,0.35)',
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                    lineHeight: 1.2,
                  }}
                >
                  {space.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.88)', mt: 0.5 }}>
                  {formatSpaceRateLabel(space)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar Column */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              position: { lg: 'sticky' },
              top: { lg: 96 },
              background: (t) =>
                t.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : `linear-gradient(160deg, ${t.palette.background.paper} 0%, ${t.palette.grey[50]} 100%)`,
              backdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: (t) => t.palette.mode === 'dark' 
                ? '0 12px 40px rgba(0,0,0,0.4)' 
                : '0 12px 40px rgba(0,0,0,0.12)',
            }}
          >
            <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1}>
              Your rate
            </Typography>
            <Typography
              variant="h4"
              fontWeight={800}
              color="primary"
              sx={{ mt: 0.5, lineHeight: 1.15 }}
            >
              {formatSpaceRateLabel(space)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {space.hasActiveBooking === true
                ? space.bookedUntil
                  ? `Unavailable until ${space.bookedUntil}.`
                  : 'This slot is currently booked.'
                : 'Open for booking — choose dates in the next step.'}
            </Typography>

            <Divider color='white' sx={{ my: 2}} />

            <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1}>
              Listed by
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1.5 }}>
              <Avatar
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: 'primary.main',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                }}
              >
                {(space.User?.name || space.User?.email || '?').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <PersonOutline sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {space.User?.name || space.User?.email || 'Space owner'}
                  </Typography>
                </Stack>
                {space.User?.phone && (
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                    <PhoneOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {space.User.phone}
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Stack>

            {user?.role !== 'space_owner' && user?.role !== 'admin' && (
              <Button
                onClick={() =>
                  user && !fullyBooked && setBookingDialogOpen(true)
                }
                component={user ? undefined : Link}
                to={user ? undefined : '/login'}
                variant="contained"
                size="large"
                fullWidth
                startIcon={<Book />}
                disabled={bookDisabled}
                sx={{
                  mt: 3,
                  py: 1.4,
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: 'none',
                  boxShadow: `0 8px 24px ${primary}40`,
                }}
              >
                {bookLabel}
              </Button>
            )}

            <BookingDialog
              open={bookingDialogOpen}
              onClose={() => setBookingDialogOpen(false)}
              adSpace={space}
              onSuccess={handleBookingSuccess}
            />

            <Button
              component={Link}
              to={marketplaceLink}
              variant="outlined"
              fullWidth
              sx={{ mt: 1.5, py: 1.2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Browse more spaces
            </Button>
          </Paper>
        </Grid>

        {/* Full-width About Section */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'background.paper',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            }}
          >
            <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={1.2}>
              About this space
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1, lineHeight: 1.7, color: 'text.primary' }}>
              {space.description || 'No description provided for this listing.'}
            </Typography>

            {space.notes && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1.2}>
                  Additional Notes
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1, color: 'text.secondary', lineHeight: 1.6 }}>
                  {space.notes}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* Specs Grid at the bottom */}
        <Grid item xs={12}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={space.adType === 'digital_screen' ? 4 : 6}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  height: '100%',
                  borderColor: 'divider',
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                }}
              >
                <Stack direction="row" alignItems="flex-start" spacing={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: `${primary}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: primary,
                    }}
                  >
                    <Place />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={1}>
                      Location
                    </Typography>
                    <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                      {space.city && space.location && space.city !== space.location
                        ? `${space.city}, ${space.location}`
                        : space.city || space.location || '—'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {(space.width != null || space.height != null) && (
              <Grid item xs={12} sm={space.adType === 'digital_screen' ? 4 : 6}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    height: '100%',
                    borderColor: 'divider',
                    whiteSpace: 'pre-wrap',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" spacing={2}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: `${primaryDark}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: primaryDark,
                      }}
                    >
                      <Straighten />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={1}>
                        Dimensions
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                        {space.width != null && space.height != null
                          ? `${Number(space.width).toFixed(2)}m (W) × ${Number(space.height).toFixed(2)}m (H)`
                          : space.width != null
                            ? `${Number(space.width).toFixed(2)}m (W)`
                            : `${Number(space.height).toFixed(2)}m (H)`}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            )}

            {space.adType === 'digital_screen' && space.slotDuration && (
              <Grid item xs={12} sm={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    height: '100%',
                    borderColor: 'divider',
                    whiteSpace: 'pre-wrap',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" spacing={2}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: '#00695c15',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#00695c',
                      }}
                    >
                      <Box component="span" sx={{ fontWeight: 800, fontSize: '1rem' }}>SEC</Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={1}>
                        Slot Duration
                      </Typography>
                      <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                        {space.slotDuration}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Grid>       
      </Grid>
    </Box>
  );
}
