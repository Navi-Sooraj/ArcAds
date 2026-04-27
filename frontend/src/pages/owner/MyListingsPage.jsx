import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Switch,
  Tooltip,
  InputAdornment,
  Divider,
} from '@mui/material';
import dayjs from 'dayjs';
import { DISPLAY_DATE_FORMAT } from '../../utils/dateConstants';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import Verified from '@mui/icons-material/Verified';
import Pending from '@mui/icons-material/Pending';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { formatSpaceRateLabel } from '../../utils/adSpacePricing';
import { resolveUploadUrl, checkIfVideo } from '../../utils/mediaUrl';

const AD_TYPES = ['billboard', 'hoarding', 'digital_screen', 'wall_painting', 'other'];

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


export default function MyListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({ open: false, space: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, space: null });
  const [form, setForm] = useState(initialForm);
  const [saveLoading, setSaveLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [newMediaPreviews, setNewMediaPreviews] = useState([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewImages, setPreviewImages] = useState([]);
  const [previewImageIdx, setPreviewImageIdx] = useState(0);

  const isDigitalScreen = form.adType === 'digital_screen';

  const loadListings = () => {
    if (!user?.id) return;
    api.get(`adspaces/owner/${user.id}`)
      .then((res) => setListings(res.data.data || []))
      .catch(() => setSnackbar({ open: true, message: 'Failed to load listings', severity: 'error' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadListings(); }, [user?.id]);

  useEffect(() => {
    // Revoke old URLs and create new ones for only current selected files
    const urls = form.mediaFiles?.map((f) => ({ 
      url: URL.createObjectURL(f), 
      isVideo: f.type.startsWith('video/'), 
      name: f.name 
    })) || [];
    setNewMediaPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u.url));
  }, [form.mediaFiles]);

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
      const targetUrl = form.existingMediaUrls[idx];
      setForm(f => ({
        ...f,
        existingMediaUrls: f.existingMediaUrls.filter(u => u !== targetUrl)
      }));
    } else {
      const newFileIdx = idx - existingCount;
      setForm(f => ({
        ...f,
        mediaFiles: f.mediaFiles.filter((_, i) => i !== newFileIdx)
      }));
    }
  };

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
    // Since this is ONLY an Edit Dialog, we might want to be more lenient,
    // but the user requested this validation for creating/editing.
    // However, if we follow Option A, we only check if it's a new or modified date.
    // In MyListingsPage, it's ALWAYS an edit.
    // We'll only enforce the "day after tomorrow" if the current date in the form is different 
    // from the initial space date, but for simplicity we'll just check if it's < min date 
    // IF the user changed it. (Actually, for now, let's just stick to letting existing dates pass).
    if (form.availableFrom < getMinDateStr() && form.availableFrom !== editDialog.space?.availableFrom?.split('T')[0]) {
      return '"Available From" date must be at least the day after tomorrow.';
    }
    if (!form.availableTo) return 'Available To date is required.';
    if (form.availableFrom && form.availableTo && form.availableTo <= form.availableFrom) {
      return '"Available To" date must be at least one day after "Available From".';
    }
    const totalMedia = (form.mediaFiles?.length || 0) + (form.existingMediaUrls?.length || 0);
    if (totalMedia === 0) return 'At least one Media (Image/Video) is required.';
    const price = Number(form.pricePerDay);
    if (!price || price <= 0) return 'Please enter a valid price per day.';
    return null;
  };

  const handleOpenEdit = (space) => {
    setEditDialog({ open: true, space });
    
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
      adType: space.adType || 'billboard',
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

    setSubmitAttempted(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const { space } = editDialog;
    if (!space?.id) return;

    const errorMsg = getFormError();
    if (errorMsg) {
      setSubmitAttempted(true);
      return;
    }

    setSaveLoading(true);

    const formData = new FormData();
    formData.append('ownerId', user.id);
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('city', form.city);
    formData.append('location', form.city);
    formData.append('adType', form.adType);
    
    const dailyPrice = Number(form.pricePerDay) || 0;
    formData.append('pricePerDay', dailyPrice);
    formData.append('pricePerSecond', null);

    formData.append('width', Number(form.width));
    formData.append('height', Number(form.height));
    
    formData.append('existingMediaUrls', JSON.stringify(form.existingMediaUrls || []));
    
    form.mediaFiles.forEach((file) => formData.append('media', file));
    formData.append('availableFrom', form.availableFrom || '');
    formData.append('availableTo', form.availableTo || '');
    formData.append('notes', form.notes || '');
    if (isDigitalScreen) {
      formData.append('slotDuration', form.slotDuration ? `${form.slotDuration} sec` : '10 sec');
    }

    api.put(`adspaces/${space.id}`, formData)
      .then((res) => {
        if (res.data.success) {
          // Refresh the list to get updated data
          loadListings();
          setEditDialog({ open: false, space: null });
          setSnackbar({ open: true, message: 'Ad space updated successfully', severity: 'success' });
        }
      })
      .catch((err) => {
        setSnackbar({ 
          open: true, 
          message: err.response?.data?.message || 'Failed to update ad space', 
          severity: 'error' 
        });
      })
      .finally(() => setSaveLoading(false));
  };

  const handleToggleActive = (id, currentStatus) => {
    api.put(`adspaces/${id}/active`, { isActive: !currentStatus })
      .then((res) => {
        if (res.data.success) {
          setListings((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !currentStatus } : s)));
          setSnackbar({ open: true, message: `Listing ${!currentStatus ? 'activated' : 'deactivated'}`, severity: 'info' });
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to update status';
        alert(msg);
        loadData(); // Refresh to ensure toggle is in the correct state
      });
  };

  const handleRequestReactivation = (id) => {
    api.put(`adspaces/${id}/request-reactivation`)
      .then((res) => {
        if (res.data.success) {
          setListings((prev) => prev.map((s) => (s.id === id ? { ...s, reactivationRequested: true } : s)));
          setSnackbar({ open: true, message: 'Reactivation request sent to admins', severity: 'success' });
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to send request';
        setSnackbar({ open: true, message: msg, severity: 'error' });
      });
  };

  const handleResubmitVerification = (id) => {
    api.put(`adspaces/${id}/resubmit-verification`)
      .then((res) => {
        if (res.data.success) {
          setListings((prev) => prev.map((s) => (s.id === id ? { ...s, verificationStatus: 'pending', rejectionReason: null } : s)));
          setSnackbar({ open: true, message: 'Ad space re-submitted for verification', severity: 'success' });
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to re-submit';
        setSnackbar({ open: true, message: msg, severity: 'error' });
      });
  };

  const handleOpenDelete = (space) => setDeleteDialog({ open: true, space });
  const handleConfirmDelete = () => {
    const { space } = deleteDialog;
    if (!space?.id) return;
    api.delete(`adspaces/${space.id}`)
      .then((res) => {
        if (res.data.success) {
          setListings((prev) => prev.filter((s) => s.id !== space.id));
          setDeleteDialog({ open: false, space: null });
          setSnackbar({ open: true, message: 'Ad space deleted', severity: 'success' });
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' }));
  };

  return (
    <Box sx={{ py: 2 }}>
      <Button component={Link} to="/owner" startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        Back to dashboard
      </Button>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        My listings
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Manage your ad spaces. Edit or delete listings below.
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 4 }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <Box sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          minWidth: 140
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            Total Listings
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            {listings.length}
          </Typography>
        </Box>

        <Box sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: 'rgba(76, 175, 80, 0.05)',
          border: '1px solid rgba(76, 175, 80, 0.1)',
          minWidth: 140
        }}>
          <Typography variant="caption" sx={{ color: 'success.main', display: 'block', mb: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            Approved
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="success.main">
            {listings.filter((x) => x.verified).length}
          </Typography>
        </Box>

        <Box sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: 'rgba(255, 152, 0, 0.05)',
          border: '1px solid rgba(255, 152, 0, 0.1)',
          minWidth: 140
        }}>
          <Typography variant="caption" sx={{ color: 'warning.main', display: 'block', mb: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            Pending
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="warning.main">
            {listings.filter((x) => !x.verified).length}
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        
        <Button
          size="medium"
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadListings}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            borderColor: 'rgba(255,255,255,0.12)',
            '&:hover': { borderColor: 'rgba(255,255,255,0.2)' }
          }}
        >
          Refresh
        </Button>
      </Stack>

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : listings.length === 0 ? (
        <Typography color="text.secondary">You have no ad spaces yet. <Link to="/owner/add">Add one</Link>.</Typography>
      ) : (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>City</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Availability</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Active</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listings.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.city || '—'}</TableCell>
                  <TableCell>{row.adType || '—'}</TableCell>
                  <TableCell>{formatSpaceRateLabel(row)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.hasActiveBooking === true
                        ? (row.bookedUntil ? `Booked until ${row.bookedUntil}` : 'Booked')
                        : 'Available'}
                      color={row.hasActiveBooking === true ? 'warning' : 'success'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="column" spacing={0.5} alignItems="flex-start">
                      {row.verificationStatus === 'verified' || row.verified ? (
                        <Chip
                          icon={<Verified style={{ fontSize: '1.1rem' }} />}
                          label="Verified"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(76, 175, 80, 0.1)',
                            color: '#4caf50',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid rgba(76, 175, 80, 0.2)',
                            '& .MuiChip-icon': { color: '#4caf50' }
                          }}
                        />
                      ) : row.verificationStatus === 'rejected' ? (
                        <Stack spacing={0.5}>
                          <Tooltip title={`Reason: ${row.rejectionReason || 'No reason provided'}`}>
                            <Chip
                              icon={<CloseIcon style={{ fontSize: '1.1rem' }} />}
                              label="Rejected"
                              size="small"
                              sx={{
                                bgcolor: 'rgba(244, 67, 54, 0.1)',
                                color: '#f44336',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: '1px solid rgba(244, 67, 54, 0.2)',
                                cursor: 'help',
                                '& .MuiChip-icon': { color: '#f44336' }
                              }}
                            />
                          </Tooltip>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="primary"
                            startIcon={<RefreshIcon sx={{ fontSize: '0.8rem !important' }} />}
                            onClick={() => handleResubmitVerification(row.id)}
                            sx={{ fontSize: '0.65rem', height: 22, textTransform: 'none', borderRadius: 1.5 }}
                          >
                            Re-submit
                          </Button>
                        </Stack>
                      ) : (
                        <Chip
                          icon={<Pending style={{ fontSize: '1.1rem' }} />}
                          label="Pending"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 152, 0, 0.1)',
                            color: '#ff9800',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 152, 0, 0.2)',
                            '@keyframes pulse': {
                              '0%': { opacity: 1 },
                              '50%': { opacity: 0.6 },
                              '100%': { opacity: 1 },
                            },
                            animation: 'pulse 2s infinite ease-in-out',
                            '& .MuiChip-icon': { color: '#ff9800' }
                          }}
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        size="small"
                        checked={!!row.isActive}
                        onChange={() => handleToggleActive(row.id, row.isActive)}
                        color="primary"
                        disabled={row.adminDeactivated}
                      />
                      {row.adminDeactivated && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Tooltip title="This ad space has been deactivated by an administrator. You must request reactivation to enable it again.">
                            <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main', cursor: 'help' }}>
                              <InfoOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 9 }}>
                                DISABLED BY ADMIN
                              </Typography>
                            </Box>
                          </Tooltip>
                          
                          {row.reactivationRequested ? (
                            <Chip 
                              label="Reactivation Pending" 
                              size="small" 
                              color="warning" 
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 20, borderRadius: 1 }}
                            />
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              onClick={() => handleRequestReactivation(row.id)}
                              sx={{ fontSize: '0.65rem', py: 0, height: 20, textTransform: 'none' }}
                            >
                              Request Reactivation
                            </Button>
                          )}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton component={Link} to={`/ad-space/${row.id}`} size="small" title="View">
                      <Visibility />
                    </IconButton>
                    <IconButton onClick={() => handleOpenEdit(row)} size="small" title="Edit">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDelete(row)} size="small" color="error" title="Delete">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, space: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Edit Ad Listing: {editDialog.space?.title}
        </DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSaveEdit} noValidate>
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
                mt: 2,
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
                  inputProps={{ min: form.availableFrom ? getNextDayStr(form.availableFrom) : getMinDateStr() }}
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

            {/* Multi-file media grid */}
            {allMediaPreviews.length > 0 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 1, mt: 1.5, mb: 1.5 }}>
                {allMediaPreviews.map((p, idx) => (
                  <Box key={idx} sx={{ position: 'relative', borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: '#000' }}>
                    {p.isVideo ? (
                      <Box
                        component="video"
                        src={p.url}
                        muted
                        preload="metadata"
                        onLoadedMetadata={(e) => { e.target.currentTime = 0.5; }}
                        sx={{ width: '100%', height: 80, objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                        onClick={() => {
                          setPreviewImages(allMediaPreviews.map(m => m.originalUrl || m.url));
                          setPreviewImageIdx(idx);
                          setPreviewImage(p.originalUrl || p.url);
                        }}
                      />
                    ) : (
                      <Box
                        component="img"
                        src={p.url}
                        alt={`media-${idx}`}
                        sx={{ width: '100%', height: 80, objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                        onClick={() => {
                          setPreviewImages(allMediaPreviews.map(m => m.originalUrl || m.url));
                          setPreviewImageIdx(idx);
                          setPreviewImage(p.originalUrl || p.url);
                        }}
                      />
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveMedia(idx)}
                      sx={{ position: 'absolute', top: 2, right: 2, p: 0.3, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' } }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            <Button variant="outlined" component="label" fullWidth sx={{ mt: 0.5 }}>
              {form.mediaFiles.length > 0 ? 'Add More Media' : 'Upload Images / Videos'}
              <input
                type="file"
                hidden
                multiple
                accept="image/*,video/*"
                onChange={(e) => {
                  const picked = Array.from(e.target.files || []);
                  if (picked.length) setForm((f) => ({ ...f, mediaFiles: [...f.mediaFiles, ...picked] }));
                  e.target.value = '';
                }}
              />
            </Button>

            {/* Pricing */}
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
                onChange={(e) => setForm((f) => ({ ...f, pricePerDay: e.target.value }))}
                inputProps={{ min: 0.01, step: 0.01 }}
              />
            </Paper>

            <Box sx={{ mt: 3 }}>
              {submitAttempted && getFormError() && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{getFormError()}</Alert>
              )}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={() => setEditDialog({ open: false, space: null })}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={saveLoading || (submitAttempted && !!getFormError())}>
                  {saveLoading ? 'Saving…' : 'Update Listing'}
                </Button>
              </Box>
            </Box>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, space: null })}>
        <DialogTitle>Delete ad space?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete &quot;{deleteDialog.space?.title}&quot;? This cannot be undone.</Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => setDeleteDialog({ open: false, space: null })}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleConfirmDelete}>Delete</Button>
          </Box>
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
