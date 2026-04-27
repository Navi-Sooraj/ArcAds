import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Stack,
  Divider,
  Container,
} from '@mui/material';
import Search from '@mui/icons-material/Search';
import Place from '@mui/icons-material/Place';
import Visibility from '@mui/icons-material/Visibility';
import EventBusy from '@mui/icons-material/EventBusy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import api from '../api/axios';
import { formatSpaceRateLabel } from '../utils/adSpacePricing';



const DEFAULT_ADSPACE_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400">
    <rect width="100%" height="100%" fill="#e0f2f1"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#00695c" font-family="system-ui,sans-serif" font-size="24">No photo</text>
  </svg>`
)}`;

function SpaceCard({ s, spaceDetailsPath, itemVariants }) {
  const navigate = useNavigate();
  const [flipped, setFlipped] = useState(false);
  const details = [
    s.adType && { label: 'Type', value: s.adType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) },
    (s.width || s.height) && { label: 'Size', value: `${s.width || '?'} × ${s.height || '?'} ft` },
    s.location && { label: 'Location', value: s.location },
  ].filter(Boolean);

  return (
    <Grid
      item xs={12} sm={6} md={4}
      component={motion.div}
      variants={itemVariants}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      <Box sx={{ perspective: '1200px', height: 310 }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.55s cubic-bezier(0.4,0.2,0.2,1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRONT */}
          <Card
            component={motion.div}
            whileTap={{ scale: 0.995 }}
            onClick={() => navigate(spaceDetailsPath(s.id))}
            elevation={0}
            sx={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              display: 'flex', flexDirection: 'column',
              borderRadius: 2,
              overflow: 'hidden',
              cursor: 'pointer',
              visibility: flipped ? 'hidden' : 'visible',
              '&:hover': {
                boxShadow: (theme) => `0 14px 40px ${theme.palette.primary.main}15`,
                transform: 'none',
              }
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height="160"
                image={s.imageUrl || DEFAULT_ADSPACE_IMAGE}
                alt={s.title}
                sx={{ objectFit: 'cover' }}
              />
              <Box
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setFlipped(true); 
                }}
                sx={{
                  position: 'absolute', top: 8, right: 8,
                  bgcolor: 'rgba(255,255,255,0.92)', borderRadius: '50%',
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: 2,
                  '&:hover': { bgcolor: 'white', transform: 'scale(1.12)' },
                  transition: 'all 0.2s',
                  zIndex: 2
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              </Box>
            </Box>
            <CardContent sx={{ flexGrow: 1, pb: 2 }}>
              <Typography variant="h6" component="h2" gutterBottom noWrap sx={{ fontWeight: 700 }}>
                {s.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <Place fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {s.city && s.location && s.city !== s.location 
                    ? `${s.city}, ${s.location}` 
                    : s.city || s.location || '—'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                <Chip
                  size="small"
                  icon={s.hasActiveBooking === true ? <EventBusy /> : undefined}
                  label={s.hasActiveBooking === true
                    ? (s.bookedUntil ? `Until ${dayjs(s.bookedUntil).format('DD MMM')}` : 'Booked')
                    : 'Available'}
                  color={s.hasActiveBooking === true ? 'warning' : 'success'}
                  variant="filled"
                  sx={{ fontWeight: 600, height: 24 }}
                />
              </Box>
              <Typography variant="h6" color="primary.main" fontWeight="800">
                {formatSpaceRateLabel(s)}
              </Typography>
            </CardContent>
          </Card>

          {/* BACK */}
          <Card
            elevation={0}
            onClick={() => navigate(spaceDetailsPath(s.id))}
            sx={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderRadius: 2, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              bgcolor: 'background.paper',
              borderColor: 'divider',
              '&:hover': { transform: 'rotateY(180deg)' },
            }}
          >
            <Box sx={{ height: 4, bgcolor: 'primary.main' }} />
            <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.2 }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.3, pr: 1 }}>{s.title}</Typography>
                <Box
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setFlipped(false); 
                  }}
                  sx={{ 
                    cursor: 'pointer', 
                    color: 'text.secondary', 
                    fontSize: 20, 
                    lineHeight: 1, 
                    flexShrink: 0, 
                    '&:hover': { color: 'text.primary' },
                    p: 0.5
                  }}
                >✕</Box>
              </Stack>
              {String(s.description || '').trim() && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.2 }}>{s.description}</Typography>
              )}
              <Divider sx={{ mb: 1.2 }} />
              <Stack spacing={0.8}>
                {details.map((d) => (
                  <Box key={d.label} sx={{ display: 'flex', gap: 0.8 }}>
                    <Typography variant="caption" fontWeight={700} sx={{ minWidth: 72 }}>{d.label}:</Typography>
                    <Typography variant="caption" color="text.secondary">{d.value}</Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', gap: 0.8 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ minWidth: 72 }}>Rate:</Typography>
                  <Typography variant="caption" color="text.secondary">{formatSpaceRateLabel(s)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center' }}>
                  <Typography variant="caption" fontWeight={700} sx={{ minWidth: 72 }}>Status:</Typography>
                  <Chip
                    size="small"
                    label={s.hasActiveBooking === true ? 'Booked' : 'Available'}
                    color={s.hasActiveBooking === true ? 'warning' : 'success'}
                    variant="outlined"
                    sx={{ height: 20, fontSize: 11 }}
                  />
                </Box>
              </Stack>
            </Box>
            <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
               <Typography variant="caption" color="primary" fontWeight={700}>Click for full details</Typography>
            </Box>
          </Card>
        </Box>
      </Box>
    </Grid>
  );
}

export default function Marketplace() {
  const location = useLocation();
  const isAdvertiserFlow = location.pathname.startsWith('/advertiser');
  const spaceDetailsPath = (id) => (isAdvertiserFlow ? `/advertiser/ad-space/${id}` : `/ad-space/${id}`);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 },
  };

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (maxPrice !== '') params.max_price = maxPrice;
    api.get('adspaces', { params })
      .then((res) => setSpaces(res.data.data || []))
      .catch(() => setSpaces([]))
      .finally(() => setLoading(false));
  }, [search, maxPrice]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box
        sx={{
          py: { xs: 3, md: 4 },
          px: 3,
          mb: 4,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          borderRadius: { xs: 0, md: 3 },
          mx: { xs: -2, md: 0 },
        }}
      >
      <Typography
        component={motion.h1}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        variant='h5'
        fontWeight="800"
        gutterBottom
      >
        Ad Space Marketplace
      </Typography>
      <Typography
        component={motion.p}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        variant='body2'
      >
        Discover and book premium listings verified by our platform
      </Typography>
      </Box>

      <Divider component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, delay: 0.12 }} sx={{ mb: 3 }}>
        <Chip label="Traditional Ad Spaces" size="small" />
      </Divider>

      <Box
        component={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}
      >
        <Box component={motion.div} variants={itemVariants}>
          <TextField
            size="small"
            placeholder="Search by title, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 240 }}
          />
        </Box>

        <Box component={motion.div} variants={itemVariants}>
          <TextField
            size="small"
            type="number"
            placeholder="Max ₹/day"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            sx={{ minWidth: 120 }}
          />
        </Box>

        <Box component={motion.div} variants={itemVariants}>
          <Button
            variant="outlined"
            onClick={() => {
              setSearch('');
              setMaxPrice('');
            }}
            sx={{ height: 40 }}
          >
            Clear
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Typography
          component={motion.p}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          color="text.secondary"
        >
          Loading…
        </Typography>
      ) : spaces.length === 0 ? (
        <Typography
          component={motion.p}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          color="text.secondary"
        >
          No ad spaces found. Try adjusting filters.
        </Typography>
      ) : (
        <Grid
          component={motion.div}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          container
          spacing={3}
        >
          {spaces.map((s) => (
            <SpaceCard key={s.id} s={s} spaceDetailsPath={spaceDetailsPath} itemVariants={itemVariants} />
          ))}
        </Grid>
      )}
    </Container>
  );
}
