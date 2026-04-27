import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  InputAdornment,
  Divider,
  Stack,
  Tooltip,
} from '@mui/material';
import dayjs from 'dayjs';
import { DISPLAY_DATE_FORMAT } from '../../utils/dateConstants';
import ArrowBack from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { resolveUploadUrl, checkIfVideo } from '../../utils/mediaUrl';
import { formatSpaceRateLabel } from '../../utils/adSpacePricing';
import digitalImg from '../../assets/categories/digital_screens.png';
import billboardImg from '../../assets/categories/billboards.png';

const initialForm = {
  title: '',
  description: '',
  city: '',
  adType: 'billboard',
  width: '',
  height: '',
  pricePerDay: '',
  mediaFiles: [],
  existingMediaUrls: [],
  availableFrom: '',
  availableTo: '',
  notes: '',
  slotDuration: '10',
};


function VendorSpaceCard({ space, onEdit, onDelete, setPreviewImages, setPreviewImageIdx, setPreviewImage }) {
  const [flipped, setFlipped] = useState(false);
  // Helper to ensure mediaUrls is always a clean array of strings
  const getMediaArray = (m) => {
    if (!m) return [];
    if (Array.isArray(m)) return m;
    try {
      let parsed = typeof m === 'string' ? JSON.parse(m) : m;
      while (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const imageUrl = space.imageUrl || getMediaArray(space.mediaUrls)[0] || 'https://via.placeholder.com/300x160?text=No+Image';
  const mediaList = getMediaArray(space.mediaUrls);
  const isVid = checkIfVideo(imageUrl);

  return (
    <Box sx={{ perspective: '1200px' }}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4,0.2,0.2,1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRONT */}
        <Card
          elevation={0}
          variant="outlined"
          sx={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            borderColor: 'divider',
            transition: 'box-shadow 0.2s',
            visibility: flipped ? 'hidden' : 'visible',
            '&:hover': { boxShadow: 6, transform: 'none' },
          }}
        >
          <Box 
            sx={{ 
              position: 'relative', 
              cursor: 'pointer',
              overflow: 'hidden',
              '&:hover img': { transform: 'scale(1.05)' },
              '&:hover video': { transform: 'scale(1.05)' },
            }}
            onClick={() => {
              const urls = mediaList.length > 0 ? mediaList : [imageUrl];
              setPreviewImages(urls);
              setPreviewImageIdx(0);
              setPreviewImage(urls[0]);
            }}
          >
            {isVid ? (
              <Box
                component="video"
                src={resolveUploadUrl(imageUrl)}
                preload="metadata"
                onLoadedMetadata={(e) => {
                  e.target.currentTime = 0.5;
                }}
                sx={{ 
                  width: '100%', 
                  height: 160, 
                  objectFit: 'cover', 
                  bgcolor: '#000', 
                  display: 'block',
                  transition: 'transform 0.3s ease-in-out'
                }}
                muted
              />
            ) : (
              <CardMedia 
                component="img" 
                height="160" 
                image={resolveUploadUrl(imageUrl)} 
                alt={space.title} 
                sx={{ 
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease-in-out'
                }} 
              />
            )}
            <Box
              onClick={(e) => {
                e.stopPropagation();
                setFlipped(true);
              }}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                bgcolor: 'rgba(255,255,255,0.92)',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 2,
                zIndex: 2,
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'white', transform: 'scale(1.1)' },
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            </Box>
          </Box>
          <Box sx={{ height: 4, bgcolor: space.adType === 'digital_screen' ? '#00695c' : '#1565c0' }} />
          <CardContent sx={{ p: 2, flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="800" noWrap sx={{ lineHeight: 1.25, mb: 0.5 }}>
              {space.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1.5 }}>
              {space.city && space.location && space.city !== space.location 
                ? `${space.city}, ${space.location}` 
                : space.city || space.location || 'Location not specified'}
            </Typography>

            <Stack direction="row" gap={0.8} flexWrap="wrap" sx={{ mt: 0.8 }}>
              <Chip
                size="small"
                label={`Pricing: ${formatSpaceRateLabel(space)}`}
                sx={{
                  bgcolor: (theme) => `${theme.palette.primary.main}15`,
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              />
            </Stack>

            {space.availableFrom && space.availableTo && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.2 }}>
                Available: {dayjs(space.availableFrom).format(DISPLAY_DATE_FORMAT)} → {dayjs(space.availableTo).format(DISPLAY_DATE_FORMAT)}
              </Typography>
            )}
          </CardContent>
          <Divider />
          <CardActions sx={{ px: 2, py: 1.5, gap: 1 }}>
            <Button
              fullWidth
              size="small"
              startIcon={<EditIcon />}
              variant="contained"
              onClick={() => onEdit(space)}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
            >
              Edit Listing
            </Button>
            <Tooltip title="Delete listing">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(space)}
                sx={{
                  border: '1px solid',
                  borderColor: 'error.main',
                  borderRadius: 1.5,
                  p: 0.7,
                  '&:hover': { bgcolor: 'error.main', color: 'white' },
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </CardActions>
        </Card>

        {/* BACK */}
        <Card
          elevation={0}
          variant="outlined"
          sx={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            borderColor: 'divider',
            '&:hover': { transform: 'rotateY(180deg)' },
          }}
        >
          <Box sx={{ height: 4, bgcolor: space.adType === 'digital_screen' ? '#00695c' : '#1565c0' }} />
          <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.3 }}>{space.title}</Typography>
              <IconButton size="small" onClick={() => setFlipped(false)} sx={{ flexShrink: 0 }}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
            
            {space.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.825rem' }}>
                {space.description}
              </Typography>
            )}

            <Divider sx={{ mb: 1.5 }} />

            <Stack spacing={1}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="caption" fontWeight={800} sx={{ minWidth: 80, textTransform: 'uppercase' }}>Dimensions:</Typography>
                <Typography variant="caption">{space.width}m (W) × {space.height}m (H)</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="caption" fontWeight={800} sx={{ minWidth: 80, textTransform: 'uppercase' }}>Type:</Typography>
                <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{space.adType?.replace('_', ' ')}</Typography>
              </Box>
              {space.slotDuration && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="caption" fontWeight={800} sx={{ minWidth: 80, textTransform: 'uppercase' }}>Slot:</Typography>
                  <Typography variant="caption">{space.slotDuration}</Typography>
                </Box>
              )}
            </Stack>

            {space.notes && (
              <Box sx={{ mt: 2, p: 1.2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase' }}>
                  Additional Notes
                </Typography>
                <Typography variant="caption" sx={{ lineHeight: 1.4 }}>{space.notes}</Typography>
              </Box>
            )}
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

export default function AddAdSpacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [existingSpaces, setExistingSpaces] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [originalAvailableFrom, setOriginalAvailableFrom] = useState('');

  const isDigitalScreen = form.adType === 'digital_screen';

  const [newMediaPreviews, setNewMediaPreviews] = useState([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewImages, setPreviewImages] = useState([]);
  const [previewImageIdx, setPreviewImageIdx] = useState(0);

  const loadData = () => {
    if (!user?.id) return;
    api.get(`adspaces/owner/${user.id}`)
      .then((res) => {
        if (res.data.success) {
          setExistingSpaces(res.data.data || []);
        }
      })
      .catch(() => {});
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const digitalCount = existingSpaces.filter(s => s.adType === 'digital_screen').length;
  const billboardCount = existingSpaces.filter(s => s.adType === 'billboard' || s.adType === 'hoarding').length;

  const CATEGORIES = [
    {
      id: 'digital_screen',
      title: 'Digital Screens',
      image: digitalImg,
      count: digitalCount,
      adType: 'digital_screen',
      description: 'LED screens, Mall displays, Elevator screens, etc.'
    },
    {
      id: 'billboard',
      title: 'Billboards',
      image: billboardImg,
      count: billboardCount,
      adType: 'billboard',
      description: 'Traditional billboards, Hoardings, Wall paintings, etc.'
    }
  ];

  const filteredListings = existingSpaces.filter((s) => {
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    if (!cat) return false;
    const matchesCategory = cat.adType === 'billboard' 
      ? (s.adType === 'billboard' || s.adType === 'hoarding')
      : s.adType === cat.adType;
    const matchesSearch = s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.city?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    // Revoke old URLs and create new ones for only current selected files
    const urls = form.mediaFiles.map((f) => ({ 
      url: URL.createObjectURL(f), 
      isVideo: f.type.startsWith('video/'), 
      name: f.name 
    }));
    setNewMediaPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u.url));
  }, [form.mediaFiles]);

  // COMBINED PREVIEWS FOR RENDERING
  const allMediaPreviews = [
    ...(form.existingMediaUrls || []).map(url => ({
      url: resolveUploadUrl(url),
      originalUrl: url,
      isExisting: true,
      isVideo: checkIfVideo(url)
    })),
    ...newMediaPreviews
  ];

  const handleRemoveMedia = (idx) => {
    const existingCount = (form.existingMediaUrls || []).length;
    if (idx < existingCount) {
      // Deleting an existing (published) media
      const targetUrl = form.existingMediaUrls[idx];
      setForm(f => ({
        ...f,
        existingMediaUrls: f.existingMediaUrls.filter(u => u !== targetUrl)
      }));
    } else {
      // Deleting a newly picked file
      const newFileIdx = idx - existingCount;
      setForm(f => ({
        ...f,
        mediaFiles: f.mediaFiles.filter((_, i) => i !== newFileIdx)
      }));
    }
  };

  useEffect(() => {
    setSubmitAttempted(false);
  }, [form, isEditing, selectedCategory]);

  const getMinDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };

  const getNextDayStr = (dateString) => {
    if (!dateString) return getMinDateStr();
    const [y, m, d] = dateString.split('-');
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    const nd = String(date.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  };

  const getFormError = () => {
    if (!form.title || !form.title.trim()) return 'Title is required.';
    if (!form.city || !form.city.trim()) return 'City / Location is required.';
    
    const w = Number(form.width);
    if (!w || w <= 0) return 'Width must be greater than 0.';
    
    const h = Number(form.height);
    if (!h || h <= 0) return 'Height must be greater than 0.';
    
    if (!form.availableFrom) return 'Available From date is required.';
    // Only block past dates if it's a NEW listing or if the date was changed from its existing value
    if (!isEditing && form.availableFrom < getMinDateStr()) {
      return '"Available From" date must be at least the day after tomorrow.';
    }
    if (isEditing && form.availableFrom !== originalAvailableFrom && form.availableFrom < getMinDateStr()) {
      return '"Available From" date must be at least the day after tomorrow.';
    }
    
    if (!form.availableTo) return 'Available To date is required.';
    if (form.availableTo < getMinDateStr()) {
      return '"Available To" date must be at least the day after tomorrow.';
    }
    if (form.availableFrom && form.availableTo && form.availableTo <= form.availableFrom) {
      return '"Available To" date must be at least one day after "Available From".';
    }
    
    const totalMedia = (form.mediaFiles?.length || 0) + (form.existingMediaUrls?.length || 0);
    if (totalMedia === 0) return 'At least one Media Image is required.';

    const price = Number(form.pricePerDay);
    if (!price || price <= 0) return 'Please enter a valid price per day.';

    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user?.id) return;

    const errorMsg = getFormError();
    if (errorMsg) {
      setSubmitAttempted(true);
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('ownerId', user.id);
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('city', form.city);
    formData.append('location', form.city);
    formData.append('adType', form.adType);
    
    // Always use pricePerDay as the source for backend pricePerDay
    const dailyPrice = Number(form.pricePerDay) || 0;
    formData.append('pricePerDay', dailyPrice);
    formData.append('pricePerSecond', null);

    formData.append('width', Number(form.width));
    formData.append('height', Number(form.height));
    
    // Send the list of existing media we want to KEEP
    formData.append('existingMediaUrls', JSON.stringify(form.existingMediaUrls || []));
    
    form.mediaFiles.forEach((file) => formData.append('media', file));
    formData.append('availableFrom', form.availableFrom || '');
    formData.append('availableTo', form.availableTo || '');
    formData.append('notes', form.notes || '');
    if (isDigitalScreen) {
      formData.append('slotDuration', form.slotDuration ? `${form.slotDuration} sec` : '10 sec');
    }
    
    if (isEditing && editingId) {
      api.put(`adspaces/${editingId}`, formData)
        .then((res) => {
          if (res.data.success) {
            setSnackbar({ open: true, message: 'Ad space updated successfully', severity: 'success' });
            setAddDialogOpen(false);
            loadData();
          }
        })
        .catch((err) => setSnackbar({ open: true, message: err.response?.data?.message || 'Update failed', severity: 'error' }))
        .finally(() => setLoading(false));
      return;
    }

    api.post('adspaces', formData)
      .then((res) => {
        if (res.data.success) {
          setSnackbar({ open: true, message: 'Ad space added successfully', severity: 'success' });
          setAddDialogOpen(false);
          setForm(initialForm);
          loadData();
        }
      })
      .catch((err) =>
        setSnackbar({
          open: true,
          message: err.response?.data?.message || 'Failed to add ad space',
          severity: 'error',
        })
      )
      .finally(() => setLoading(false));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    api.delete(`adspaces/${id}`)
      .then(res => {
        if (res.data.success) {
          setSnackbar({ open: true, message: 'Listing deleted', severity: 'success' });
          loadData();
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Delete failed', severity: 'error' }));
  };

  const handleEditOpen = (space) => {
    setIsEditing(true);
    setEditingId(space.id);

    const getMediaArray = (m) => {
      if (!m) return [];
      if (Array.isArray(m)) return m;
      try {
        let parsed = typeof m === 'string' ? JSON.parse(m) : m;
        while (typeof parsed === 'string') parsed = JSON.parse(parsed);
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    };

    const mediaList = getMediaArray(space.mediaUrls);
    const price = space.pricePerDay || space.price_per_day || '';

    setForm({
      title: space.title || '',
      description: space.description || '',
      city: space.city || '',
      adType: space.adType || '',
      width: space.width || '',
      height: space.height || '',
      pricePerDay: price,
      mediaFiles: [],
      existingMediaUrls: mediaList.length > 0 ? mediaList : [space.imageUrl, space.videoUrl].filter(Boolean),
      availableFrom: space.availableFrom ? space.availableFrom.split('T')[0] : '',
      availableTo: space.availableTo ? space.availableTo.split('T')[0] : '',
      notes: space.notes || '',
      slotDuration: space.slotDuration ? String(space.slotDuration).replace(/[^0-9]/g, '') : '10',
    });
    setOriginalAvailableFrom(space.availableFrom ? space.availableFrom.split('T')[0] : '');

    setSubmitAttempted(false);
    setAddDialogOpen(true);
  };

  return (
    <Box sx={{ py: 4, maxWidth: 1200, mx: 'auto', px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.02em' }}>
          My Ad Listings
        </Typography>
        <Button component={Link} to="/owner" startIcon={<ArrowBack />} color="inherit">
          Dashboard
        </Button>
      </Box>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        {CATEGORIES.map((cat) => (
          <Grid item xs={12} sm={6} md={4} key={cat.id}>
            <Card
              onClick={() => {
                setSelectedCategory(cat.id);
                // Scroll logic
                setTimeout(() => {
                  const el = document.getElementById('category-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }}
              sx={{
                cursor: 'pointer',
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: selectedCategory === cat.id ? '0 0 0 3px #00695c' : '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.12)',
                },
              }}
            >
              <CardMedia component="img" height="160" image={cat.image} sx={{ objectFit: 'cover' }} />
              <Box sx={{ height: 6, bgcolor: '#00695c' }} />
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="800" sx={{ mb: 1 }}>
                  {cat.title}
                </Typography>
                <Chip
                  label={`${cat.count} added`}
                  size="small"
                  sx={{
                    bgcolor: '#00695c',
                    color: 'white',
                    fontWeight: 700,
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {selectedCategory && (
        <Box id="category-section" sx={{ mt: 4, pt: 2 }}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              p: 4,
              borderRadius: 4,
              bgcolor: 'background.paper',
              borderWidth: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight="900" sx={{ mb: 1 }}>
                  {CATEGORIES.find((c) => c.id === selectedCategory)?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {CATEGORIES.find((c) => c.id === selectedCategory)?.description}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => {
                  setIsEditing(false);
                  setForm(f => ({ ...f, adType: CATEGORIES.find(c => c.id === selectedCategory)?.adType }));
                  setAddDialogOpen(true);
                }}
                sx={{ borderRadius: 2, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
              >
                Add in this Category
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search added services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: 400 }}
              />
            </Box>

            <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 2 }}>
              Added Spaces
            </Typography>

            {filteredListings.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                <Typography color="text.secondary">No listings found in this category.</Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredListings.map((space) => (
                  <Grid item xs={12} sm={6} md={4} key={space.id}>
                    <VendorSpaceCard 
                      space={space} 
                      onEdit={handleEditOpen}
                      onDelete={() => handleDelete(space.id)}
                      setPreviewImages={setPreviewImages}
                      setPreviewImageIdx={setPreviewImageIdx}
                      setPreviewImage={setPreviewImage}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Box>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {isEditing ? 'Edit Listing' : 'Add in Category'}: {CATEGORIES.find((c) => c.id === selectedCategory)?.title}
        </DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              multiline
              rows={3}
              margin="normal"
            />
            <TextField
              fullWidth
              label="City / Location"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              margin="normal"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                type="number"
                label="Width (m)"
                value={form.width}
                onChange={(e) => setForm((f) => ({ ...f, width: e.target.value }))}
                margin="normal"
                inputProps={{ min: 0.01, step: 0.01 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Height (m)"
                value={form.height}
                onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
                margin="normal"
                inputProps={{ min: 0.01, step: 0.01 }}
              />
            </Box>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2.5, 
                borderRadius: 3, 
                bgcolor: 'rgba(255, 255, 255, 0.04)', 
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                mb: 1.5,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle accent glow */}
              <Box sx={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, bgcolor: 'primary.main', opacity: 0.05, filter: 'blur(30px)', borderRadius: '50%' }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography 
                  variant="caption" 
                  fontWeight={800} 
                  color="primary.main" 
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1.2, textTransform: 'uppercase' }}
                >
                  <CalendarMonthIcon sx={{ fontSize: 18 }} /> Availability Period
                </Typography>
                
                {form.availableFrom && form.availableTo && !dayjs(form.availableTo).isBefore(dayjs(form.availableFrom)) && (
                  <Chip 
                    label={`${dayjs(form.availableTo).diff(dayjs(form.availableFrom), 'day') + 1} Days Duration`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 800, borderRadius: 1.5, height: 24, fontSize: '0.65rem', bgcolor: (theme) => `${theme.palette.primary.main}10` }}
                  />
                )}
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                <TextField
                  fullWidth
                  type="date"
                  label="Starting From"
                  value={form.availableFrom}
                  onChange={(e) => setForm((f) => ({ ...f, availableFrom: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: getMinDateStr() }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><EventIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
                    sx: { borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)' }
                  }}
                />

                <Box sx={{ display: { xs: 'none', md: 'flex' }, color: 'text.disabled', opacity: 0.5 }}>
                  <ArrowForwardIcon sx={{ fontSize: 20 }} />
                </Box>

                <TextField
                  fullWidth
                  type="date"
                  label="Ending On"
                  value={form.availableTo}
                  onChange={(e) => setForm((f) => ({ ...f, availableTo: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ 
                    min: (form.availableFrom && form.availableFrom > getMinDateStr()) 
                      ? getNextDayStr(form.availableFrom) 
                      : getMinDateStr() 
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><EventIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
                    sx: { borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)' }
                  }}
                />
              </Stack>
            </Paper>

            {isDigitalScreen && (
              <TextField
                fullWidth
                type="number"
                label="Ad Slot Duration"
                value={form.slotDuration}
                onChange={(e) => setForm(f => ({ ...f, slotDuration: e.target.value }))}
                margin="normal"
                placeholder="e.g. 30"
                inputProps={{ min: 1 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">sec</InputAdornment>
                }}
              />
            )}

            <TextField
              fullWidth
              label="Additional Notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              multiline
              rows={2}
              margin="normal"
              placeholder="e.g. Footfall target, creative requirements, specific timing..."
            />


            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>
              Media *
            </Typography>

            {/* Multi-file media grid — now ABOVE the upload button for better visibility during edit */}
            {allMediaPreviews.length > 0 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 1, mt: 1.5, mb: 1.5 }}>
                {allMediaPreviews.map((p, idx) => (
                  <Box 
                    key={idx} 
                    onClick={() => {
                      const urls = allMediaPreviews.map(m => m.url);
                      setPreviewImages(urls);
                      setPreviewImageIdx(idx);
                      setPreviewImage(p.url);
                    }}
                    sx={{ 
                      position: 'relative', 
                      borderRadius: 1.5, 
                      overflow: 'hidden', 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      bgcolor: '#000',
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.9 }
                    }}
                  >
                    {p.isVideo ? (
                      <video
                        src={p.url}
                        muted
                        preload="metadata"
                        onLoadedMetadata={(e) => { e.target.currentTime = 0.5; }}
                        style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <Box
                        component="img"
                        src={p.url}
                        alt={`media-${idx}`}
                        sx={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }}
                      />
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMedia(idx);
                      }}
                      sx={{ position: 'absolute', top: 2, right: 2, p: 0.3, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' } }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            <Button variant="outlined" component="label" fullWidth sx={{ mt: 0.5 }}>
              {form.mediaFiles.length > 0 ? 'Add More Media' : 'Upload Image / Video'}
              <input
                type="file"
                hidden
                multiple
                accept="image/*,video/*"
                onChange={(e) => {
                  const picked = Array.from(e.target.files || []);
                  if (picked.length) {
                    setForm((f) => ({ ...f, mediaFiles: [...f.mediaFiles, ...picked] }));
                  }
                  e.target.value = '';
                }}
              />
            </Button>


            {/* Pricing — separate box at the bottom */}
            <Paper
              variant="outlined"
              sx={{ mt: 3, p: 2, borderRadius: 2, borderColor: 'primary.main', borderWidth: 1.5 }}
            >
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Pricing *
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Price per day (₹)"
                value={form.pricePerDay}
                onChange={(e) => setForm((f) => ({ ...f, pricePerDay: e.target.value, pricePerSecond: '' }))}
                inputProps={{ min: 0.01, step: 0.01 }}
              />
            </Paper>

            <Box sx={{ mt: 3 }}>
              {submitAttempted && getFormError() && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{getFormError()}</Alert>
              )}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={loading || (submitAttempted && !!getFormError())}>
                  {loading ? 'Saving…' : (isEditing ? 'Update Listing' : 'Publish listing')}
                </Button>
              </Box>
            </Box>
          </form>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Media Preview Dialog */}
      <Dialog 
        open={Boolean(previewImage)} 
        onClose={() => { setPreviewImage(''); setPreviewImages([]); setPreviewImageIdx(0); }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogContent sx={{ p: 1, bgcolor: '#000' }}>
          {previewImage && (
            <>
              {checkIfVideo(previewImage) ? (
                <Box 
                  component="video" 
                  src={resolveUploadUrl(previewImage)} 
                  controls 
                  autoPlay 
                  sx={{ width: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 1, display: 'block' }} 
                />
              ) : (
                <Box 
                  component="img" 
                  src={resolveUploadUrl(previewImage)} 
                  alt="Preview" 
                  sx={{ width: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: 1, display: 'block' }} 
                />
              )}
              {previewImages.length > 1 && (
                <Stack direction="row" spacing={1} sx={{ mt: 1.2, overflowX: 'auto', pb: 1 }}>
                  {previewImages.map((img, idx) => (
                    <Box
                      key={`preview-thumb-${idx}`}
                      onClick={() => { setPreviewImageIdx(idx); setPreviewImage(img); }}
                      sx={{
                        width: 80,
                        height: 60,
                        flexShrink: 0,
                        borderRadius: 1,
                        cursor: 'pointer',
                        overflow: 'hidden',
                        border: '2px solid',
                        borderColor: idx === previewImageIdx ? 'primary.main' : 'transparent',
                        opacity: idx === previewImageIdx ? 1 : 0.6,
                        transition: '0.2s',
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      {checkIfVideo(img) ? (
                        <video src={resolveUploadUrl(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={resolveUploadUrl(img)} alt={`Thumb ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
