import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { DISPLAY_DATE_FORMAT } from '../../utils/dateConstants';
import { Link } from 'react-router-dom';
import {
  Box, Typography, Grid, Paper, Stack, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Avatar, Divider, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CampaignIcon from '@mui/icons-material/Campaign';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaidIcon from '@mui/icons-material/Paid';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReplayIcon from '@mui/icons-material/Replay';
import StatCard from '../../components/StatCard';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { checkIfVideo } from '../../utils/mediaUrl';


const statusConfig = {
  pending:   { label: 'Pending',   color: 'warning', icon: <HourglassEmptyIcon sx={{ fontSize: 14 }} /> },
  confirmed: { label: 'Approved',  color: 'success', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
  rejected:  { label: 'Rejected',  color: 'error',   icon: <CancelOutlinedIcon sx={{ fontSize: 14 }} /> },
  cancelled: { label: 'Cancelled', color: 'default', icon: <CancelOutlinedIcon sx={{ fontSize: 14 }} /> },
  completed: { label: 'Completed', color: 'success', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
};



export default function UserDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberSince, setMemberSince] = useState('—');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const fetchData = () => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;

    Promise.all([
      api.get(`bookings/user/${user.id}`),
      api.get(`ad-service-inquiries?userId=${user.id}`),
      api.get('auth/me'),
    ])
      .then(([bookingsRes, inquiriesRes, meRes]) => {
        if (cancelled) return;
        setBookings(bookingsRes?.data?.data || []);
        setInquiries(inquiriesRes?.data?.data || []);
        const createdAt = meRes?.data?.user?.createdAt || user?.createdAt;
        if (createdAt) {
          setMemberSince(dayjs(createdAt).format(DISPLAY_DATE_FORMAT));
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  };

  useEffect(() => {
    return fetchData();
  }, [user?.id]);

  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [resubmitType, setResubmitType] = useState('inquiry'); // 'inquiry' | 'booking'
  const [resubmitItem, setResubmitItem] = useState(null);
  const [resubmitUtr, setResubmitUtr] = useState('');
  const [resubmitFile, setResubmitFile] = useState(null);
  const [resubmitting, setResubmitting] = useState(false);

  const handleOpenResubmit = (item, type) => {
    setResubmitItem(item);
    setResubmitType(type);
    
    // Prefill UTR if possible
    let existingUtr = '';
    if (type === 'inquiry') {
      existingUtr = item.formData?.upiId || '';
    } else {
      existingUtr = item.Payments?.[0]?.transactionId || item.transactionId || '';
    }
    setResubmitUtr(existingUtr);
    setResubmitFile(null);
    setResubmitOpen(true);
  };

  const handleResubmit = async () => {
    setResubmitting(true);
    try {
      const formData = new FormData();
      if (resubmitUtr) formData.append('utr', resubmitUtr);
      if (resubmitFile) formData.append('media', resubmitFile);

      const endpoint = resubmitType === 'inquiry' 
        ? `ad-service-inquiries/${resubmitItem.id}/resubmit`
        : `bookings/${resubmitItem.id}/resubmit`;

      const res = await api.patch(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setResubmitOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error('Re-submission failed:', err);
      alert('Failed to re-submit. Please try again.');
    } finally {
      setResubmitting(false);
    }
  };
  
  const handleCancel = async (id, type) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      const endpoint = type === 'inquiry' 
        ? `ad-service-inquiries/${id}/cancel`
        : `bookings/${id}/cancel`;
        
      const res = await api.patch(endpoint);
      console.log('Cancellation response:', res.data);
      
      if (res.data.success) {
        fetchData();
        alert('Booking cancelled successfully.');
      } else {
        alert('Could not cancel: ' + (res.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Cancellation failed:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to cancel booking.';
      alert('Error: ' + msg);
    }
  };



  const totalInquiriesSpent = inquiries.reduce((acc, i) => acc + Number(i.totalAmount || 0), 0);
  const totalSpent = bookings.reduce((acc, b) => acc + Number(b.totalAmount || 0), 0) + totalInquiriesSpent;
  const pendingServicesCount = inquiries.filter((i) => i.status === 'pending').length;
  const pendingSpacesCount = bookings.filter((b) => b.status === 'pending').length;
  const pendingCount = pendingServicesCount + pendingSpacesCount;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed').length + inquiries.filter((i) => i.status === 'confirmed' || i.status === 'completed').length;
  const uniqueSpaces = new Set(bookings.map((b) => b.adSpaceId).filter(Boolean)).size;
  const totalBookingsCount = bookings.length + inquiries.length;

  const stats = [
    {
      icon: <ReceiptLongIcon sx={{ fontSize: 20 }} />,
      label: 'Total Bookings',
      value: totalBookingsCount,
      pendingValue: pendingCount,
      color: '#6C63FF',
    },
    {
      icon: <HourglassEmptyIcon sx={{ fontSize: 20 }} />,
      label: 'Pending Requests',
      value: pendingCount,
      color: '#FF9800',
    },
    {
      icon: <CheckCircleOutlineIcon sx={{ fontSize: 20 }} />,
      label: 'Confirmed',
      value: confirmedCount,
      color: '#4CAF50',
    },
    {
      icon: <StorefrontIcon sx={{ fontSize: 20 }} />,
      label: 'Bookings Summary',
      isDual: true,
      values: [
        { label: 'Ad Services', value: inquiries.length, pending: pendingServicesCount },
        { label: 'Ad Spaces', value: uniqueSpaces, pending: pendingSpacesCount }
      ],
      color: '#2196F3',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 20 }} />,
      label: 'Total Spent',
      value: `₹${Math.round(totalSpent).toLocaleString('en-IN')}`,
      color: '#E91E63',
    },
    {
      icon: <CalendarMonthIcon sx={{ fontSize: 20 }} />,
      label: 'Member Since',
      value: memberSince,
      color: '#009688',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, pb: { xs: 6, md: 6 } }}>
      {/* ── Header ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 0.5 }}>
            <DashboardIcon color="primary" sx={{ fontSize: 30 }} />
            <Typography variant="h5" fontWeight={800}>
              My Dashboard
            </Typography>
          </Stack>
        </Box>
      </Stack>

      {/* ── Stat Cards ── */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {stats.map((s) => (
          <Grid item xs={12} sm={6} md={4} key={s.label}>
            <StatCard {...s} loading={loading} />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 4 }} />

      {/* ── Section 1: Ad Service Bookings ── */}
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 2 }}>
        <CampaignIcon color="primary" />
        <Typography variant="h6" fontWeight={800}>
          Ad Service Bookings
        </Typography>
        {!loading && inquiries.length > 0 && (
          <Chip size="small" label={`${inquiries.length} total`} color="primary" variant="outlined" />
        )}
      </Stack>

      {!loading && inquiries.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 6, pl: 4.5 }}>
          No direct service bookings found. You can browse our catalog to find premium advertising packages.
        </Typography>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            mb: 6,
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ background: (theme) => `linear-gradient(90deg, ${theme.palette.secondary.main}14, ${theme.palette.secondary.light}0a)` }}>
                {['Service', 'Submission Date', 'Total Amount', 'Status', 'Actions'].map((h) => (
                  <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'} sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {inquiries.map((inq, idx) => {
                const sc = statusConfig[inq.status] || { label: inq.status, color: 'default' };
                return (
                  <TableRow key={inq.id} sx={{ bgcolor: idx % 2 === 0 ? 'background.paper' : 'background.default', '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell sx={{ fontWeight: 600 }}>{inq.serviceTitle || inq.serviceId}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{dayjs(inq.createdAt).format(DISPLAY_DATE_FORMAT)}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>₹{Number(inq.totalAmount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip size="small" label={sc.label} color={sc.color} icon={sc.icon} sx={{ fontWeight: 600 }} />
                        {inq.status === 'rejected' && (
                          <Button
                            size="small"
                            color="secondary"
                            onClick={() => handleOpenResubmit(inq, 'inquiry')}
                            startIcon={<ReplayIcon sx={{ fontSize: '1rem' }} />}
                            sx={{ 
                              textTransform: 'none', 
                              fontWeight: 800,
                              borderRadius: 1.5,
                              minWidth: 'auto',
                              px: 1.2,
                              py: 0.3,
                              fontSize: '0.7rem',
                              bgcolor: (theme) => `${theme.palette.secondary.main}10`,
                              '&:hover': { bgcolor: 'secondary.main', color: 'white' }
                            }}
                          >
                            Re-submit
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedInquiry(inq);
                            setInquiryOpen(true);
                          }}
                          startIcon={<VisibilityIcon sx={{ fontSize: '1.1rem' }} />}
                          sx={{ 
                            textTransform: 'none', 
                            fontWeight: 800,
                            borderRadius: 2,
                            px: 2,
                            py: 0.8,
                            bgcolor: (theme) => `${theme.palette.primary.main}10`,
                            color: 'primary.main',
                            border: '1px solid transparent',
                            '&:hover': {
                              bgcolor: 'primary.main',
                              color: 'white',
                              boxShadow: (theme) => `0 4px 12px ${theme.palette.primary.main}40`,
                              transform: 'translateY(-1px)'
                            },
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          View Details
                        </Button>
                        {inq.status === 'pending' && (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleCancel(inq.id, 'inquiry')}
                            sx={{
                              minWidth: 'auto',
                              borderRadius: 2,
                              fontWeight: 800,
                              textTransform: 'none',
                              px: 2,
                              py: 0.8,
                              '&:hover': { bgcolor: 'error.main', color: 'white' }
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Section 2: Ad Space Bookings ── */}
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 2 }}>
        <StorefrontIcon color="primary" />
        <Typography variant="h6" fontWeight={800}>
          Marketplace Bookings
        </Typography>
        {!loading && bookings.length > 0 && (
          <Chip size="small" label={`${bookings.length} total`} color="primary" variant="outlined" />
        )}
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : bookings.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 5, textAlign: 'center', borderRadius: 3,
            borderStyle: 'dashed', bgcolor: 'background.default',
          }}
        >
          <EventAvailableIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            No bookings yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            Start by browsing our marketplace or ad services and make your first booking request.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
            <Button
              component={Link}
              to="/marketplace"
              variant="contained"
              startIcon={<StorefrontIcon />}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Browse Marketplace
            </Button>
            <Button
              component={Link}
              to="/ad-services"
              variant="outlined"
              startIcon={<CampaignIcon />}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              View Ad Services
            </Button>
          </Stack>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  background: (theme) =>
                    `linear-gradient(90deg, ${theme.palette.primary.main}14, ${theme.palette.primary.light}0a)`,
                }}
              >
                {['Ad Space', 'Submission Date', 'Total Amount', 'Status', 'Actions'].map((h) => (
                  <TableCell
                    key={h}
                    align={h === 'Actions' ? 'right' : 'left'}
                    sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((b, idx) => {
                const sc = statusConfig[b.status] || { label: b.status, color: 'default' };
                return (
                  <TableRow
                    key={b.id}
                    sx={{
                      bgcolor: idx % 2 === 0 ? 'background.paper' : 'background.default',
                      '&:hover': { bgcolor: 'action.hover' },
                      transition: 'background 0.15s',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{b.AdSpace?.title || '—'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{dayjs(b.createdAt).format(DISPLAY_DATE_FORMAT)}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>₹{Number(b.totalAmount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Chip
                          size="small"
                          label={sc.label}
                          color={sc.color}
                          icon={sc.icon}
                          sx={{ fontWeight: 600 }}
                        />
                        {b.status === 'rejected' && (
                          <Button
                            size="small"
                            color="secondary"
                            onClick={() => handleOpenResubmit(b, 'booking')}
                            startIcon={<ReplayIcon sx={{ fontSize: '1rem' }} />}
                            sx={{ 
                              textTransform: 'none', 
                              fontWeight: 800,
                              borderRadius: 1.5,
                              minWidth: 'auto',
                              px: 1.2,
                              py: 0.3,
                              fontSize: '0.7rem',
                              bgcolor: (theme) => `${theme.palette.secondary.main}10`,
                              '&:hover': { bgcolor: 'secondary.main', color: 'white' }
                            }}
                          >
                            Re-submit
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedBooking(b);
                            setBookingOpen(true);
                          }}
                          startIcon={<VisibilityIcon />}
                          sx={{ 
                            textTransform: 'none',
                            fontWeight: 800,
                            borderRadius: 2,
                            px: 2,
                            py: 0.8,
                            bgcolor: (theme) => `${theme.palette.primary.main}10`,
                            color: 'primary.main',
                            border: '1px solid transparent',
                            '&:hover': {
                              bgcolor: 'primary.main',
                              color: 'white',
                              boxShadow: (theme) => `0 4px 12px ${theme.palette.primary.main}40`,
                              transform: 'translateY(-1px)'
                            },
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          View Details
                        </Button>
                        {b.status === 'pending' && (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleCancel(b.id, 'booking')}
                            sx={{
                              minWidth: 'auto',
                              borderRadius: 2,
                              fontWeight: 800,
                              textTransform: 'none',
                              px: 2,
                              py: 0.8,
                              '&:hover': { bgcolor: 'error.main', color: 'white' }
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Inquiry Detail Dialog ── */}
      <Dialog open={inquiryOpen} onClose={() => setInquiryOpen(false)} maxWidth="sm" fullWidth>
        {selectedInquiry && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>Booking Details</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2.5}>
                
                {/* Section: Service Name (Optional for User but good for context) */}
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>SERVICE</Typography>
                  <Typography variant="h6" fontWeight={900} color="primary.main">{selectedInquiry.serviceTitle || selectedInquiry.serviceId}</Typography>
                </Box>

                <Divider />

                {/* Section: Submitted Information */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoOutlinedIcon fontSize="small" color="primary" />
                    Submitted Information
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      borderRadius: 3, 
                      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      border: '1px solid',
                      borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Stack spacing={2}>
                      {(() => {
                        const excludeKeys = ['mediaUrl', 'paymentMethod', 'upiId', 'status', 'totalAmount', 'cardNumber', 'cardExpiry', 'cardCvv', 'cardHolder'];
                        const formData = selectedInquiry.formData || {};
                        const fieldLabels = {
                          adTitle: 'Ad Title',
                          title: 'Ad Title',
                          campaignDescription: 'Description',
                          description: 'Description',
                          additionalNotes: 'Additional Notes',
                          platform: 'Platform',
                          targetAudience: 'Target Audience',
                          adType: 'Ad Type',
                          startDate: 'Start Date',
                          endDate: 'End Date',
                          timing: 'Timing Option',
                          bookingMode: 'Booking Mode',
                          duration: 'Duration',
                          venueType: 'Venue Type',
                          cityLocation: 'City / Location',
                          slotDuration: 'Slot Duration',
                          dimensions: 'Dimensions',
                          tier: 'Sponsorship Tier',
                          eventDates: 'Event Dates',
                          travelFrom: 'Travel From',
                          travelTo: 'Travel To',
                        };

                        const keyOrder = [
                          'adTitle', 'title',
                          'campaignDescription', 'description', 'additionalNotes',
                          'platform', 'targetAudience', 'adType', 
                          'venueType', 'cityLocation', 'timing', 'tier',
                          'travelFrom', 'travelTo',
                          'bookingMode', 'eventDates',
                          'startDate', 'endDate', 'duration',
                          'slotDuration', 'dimensions'
                        ];

                        const entries = Object.entries(formData)
                          .filter(([k]) => !excludeKeys.includes(k))
                          .sort(([a], [b]) => {
                            const idxA = keyOrder.indexOf(a);
                            const idxB = keyOrder.indexOf(b);
                            if (idxA === -1 && idxB === -1) return a.localeCompare(b);
                            if (idxA === -1) return 1;
                            if (idxB === -1) return -1;
                            return idxA - idxB;
                          });
                        
                        if (entries.length === 0) return (
                          <Typography variant="body2" color="text.secondary">No additional information provided.</Typography>
                        );

                        return entries.map(([key, val]) => {
                          if (!val) return null;
                          const label = fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim();
                          let displayVal = String(val);
                          
                          if (key.toLowerCase().includes('date') && val && dayjs(val).isValid()) {
                            displayVal = dayjs(val).format(DISPLAY_DATE_FORMAT);
                          }

                          return (
                            <Box key={key}>
                              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.2 }}>{label}:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{displayVal}</Typography>
                            </Box>
                          );
                        });
                      })()}

                      {/* Duration Calculation */}
                      {selectedInquiry.formData?.startDate && selectedInquiry.formData?.endDate && (
                        <Box sx={{ 
                          mt: 1, 
                          p: 1.2, 
                          bgcolor: 'primary.main', 
                          borderRadius: 2, 
                          color: 'white',
                          boxShadow: (theme) => `0 4px 12px ${theme.palette.primary.main}40`,
                        }}>
                          <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Campaign Duration</Typography>
                          <Typography variant="body2" fontWeight={800}>
                            {dayjs(selectedInquiry.formData.endDate).diff(dayjs(selectedInquiry.formData.startDate), 'day') + 1} Days
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                </Box>

                {/* Section: Media */}
                {selectedInquiry.formData?.mediaUrl && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CampaignIcon fontSize="small" color="primary" />
                      Uploaded Media
                    </Typography>
                    <Box sx={{ position: 'relative', borderRadius: 2.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'black' }}>
                      {checkIfVideo(selectedInquiry.formData.mediaUrl) ? (
                        <video 
                          src={selectedInquiry.formData.mediaUrl} 
                          controls 
                          style={{ width: '100%', maxHeight: 200, display: 'block' }} 
                        />
                      ) : (
                        <img 
                          src={selectedInquiry.formData.mediaUrl} 
                          alt="Campaign"
                          style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }} 
                        />
                      )}
                    </Box>
                  </Box>
                )}

                {/* Section: Payment Details Summary Box */}
                <Box>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 3, 
                      background: (theme) => `linear-gradient(135deg, ${theme.palette.secondary.main}08, ${theme.palette.secondary.main}1a)`,
                      border: '2px solid',
                      borderColor: 'secondary.light'
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={900} color="secondary.dark" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaidIcon sx={{ fontSize: 18 }} />
                      Payment Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        { (selectedInquiry.formData?.paymentMethod === 'card' || selectedInquiry.formData?.cardNumber) ? (
                          <>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CreditCardIcon sx={{ fontSize: 14 }} /> CARD PAYMENT
                            </Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {selectedInquiry.formData?.cardHolder || selectedInquiry.formData?.cardHolderName || '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>
                              {selectedInquiry.formData?.cardNumber 
                                ? `xxxx xxxx xxxx ${selectedInquiry.formData.cardNumber.slice(-4)}` 
                                : 'xxxx xxxx xxxx —'
                              }
                            </Typography>
                          </>
                        ) : (
                          <>
                             <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>TRANSACTION ID (UTR)</Typography>
                             <Typography variant="body2" fontWeight={700}>{selectedInquiry.formData?.upiId || '—'}</Typography>
                          </>
                        )}
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>STATUS</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={String(selectedInquiry.status || 'pending').toUpperCase()}
                            size="small"
                            color={selectedInquiry.status === 'confirmed' ? 'success' : selectedInquiry.status === 'rejected' ? 'error' : 'warning'}
                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1, borderColor: 'secondary.light' }} />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '1rem' }}>TOTAL AMOUNT</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
        
                        <Typography variant="h6" fontWeight={900} color="secondary.main">
                          ₹{Number(selectedInquiry.totalAmount || 0).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setInquiryOpen(false)} variant="contained" fullWidth sx={{ borderRadius: 2, height: 44, fontWeight: 700 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      {/* ── Marketplace Booking Detail Dialog ── */}
      <Dialog open={bookingOpen} onClose={() => setBookingOpen(false)} maxWidth="sm" fullWidth>
        {selectedBooking && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>Booking Details</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2.5}>
                
                {/* Section: Space Name */}
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>AD SPACE</Typography>
                  <Typography variant="h6" fontWeight={900} color="primary.main">{selectedBooking.AdSpace?.title || '—'}</Typography>
                </Box>

                <Divider />

                {/* Section: Booking Information */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoOutlinedIcon fontSize="small" color="primary" />
                    Booking Information
                  </Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      borderRadius: 3, 
                      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      border: '1px solid',
                      borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Stack spacing={2}>
                      {(() => {
                        const baseFields = [
                          { key: 'title', label: 'Campaign Title' },
                          { key: 'description', label: 'Description' },
                          { key: 'venueType', label: 'Venue Type' },
                          { key: 'cityLocation', label: 'City' },
                          { key: 'travelFrom', label: 'Travel From' },
                          { key: 'travelTo', label: 'Travel To' },
                          { key: 'slotDuration', label: 'Slot Duration' },
                          { key: 'startDate', label: 'Start Date' },
                          { key: 'endDate', label: 'End Date' },
                        ];

                        return baseFields.map((f) => {
                          const val = selectedBooking[f.key];
                          if (!val) return null;
                          
                          let displayVal = String(val || '—');
                          if (f.key.toLowerCase().includes('date') && val && dayjs(val).isValid()) {
                            displayVal = dayjs(val).format(DISPLAY_DATE_FORMAT);
                          }

                          return (
                            <Box key={f.key}>
                              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', display: 'block', mb: 0.2 }}>{f.label}:</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{displayVal}</Typography>
                            </Box>
                          );
                        });
                      })()}

                      {/* Duration Calculation */}
                      {selectedBooking.startDate && selectedBooking.endDate && (
                        <Box sx={{ 
                          mt: 1, 
                          p: 1.2, 
                          bgcolor: 'primary.main', 
                          borderRadius: 2, 
                          color: 'white',
                          boxShadow: (theme) => `0 4px 12px ${theme.palette.primary.main}40`,
                        }}>
                          <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Booking Duration</Typography>
                          <Typography variant="body2" fontWeight={800}>
                            {dayjs(selectedBooking.endDate).diff(dayjs(selectedBooking.startDate), 'day') + 1} Days
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                </Box>

                {/* Section: Ad Creative */}
                {selectedBooking.creativeUrl && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CampaignIcon fontSize="small" color="primary" />
                      Ad Creative
                    </Typography>
                    <Box sx={{ position: 'relative', borderRadius: 2.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'black' }}>
                      {checkIfVideo(selectedBooking.creativeUrl) ? (
                        <video 
                          src={selectedBooking.creativeUrl} 
                          controls 
                          style={{ width: '100%', maxHeight: 200, display: 'block' }} 
                        />
                      ) : (
                        <img 
                          src={selectedBooking.creativeUrl} 
                          alt="Creative"
                          style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }} 
                        />
                      )}
                    </Box>
                  </Box>
                )}

                {/* Section: Payment Details Summary Box */}
                <Box>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 3, 
                      background: (theme) => `linear-gradient(135deg, ${theme.palette.secondary.main}08, ${theme.palette.secondary.main}1a)`,
                      border: '2px solid',
                      borderColor: 'secondary.light'
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={900} color="secondary.dark" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaidIcon sx={{ fontSize: 18 }} />
                      Payment Details
                    </Typography>
                    {(() => {
                      const payInfo = selectedBooking.Payments?.[0] || {};
                      const isCard = payInfo.paymentMethod === 'card';
                      
                      return (
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            { isCard ? (
                              <>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CreditCardIcon sx={{ fontSize: 14 }} /> CARD PAYMENT
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  {selectedBooking.payment?.cardHolderName || '—'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>
                                  {payInfo.cardLast4 
                                    ? `xxxx xxxx xxxx ${payInfo.cardLast4}` 
                                    : (selectedBooking.payment?.cardNumber 
                                        ? `xxxx xxxx xxxx ${selectedBooking.payment.cardNumber.slice(-4)}` 
                                        : 'xxxx xxxx xxxx —')
                                  }
                                </Typography>
                              </>
                            ) : (
                              <>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <PaidIcon sx={{ fontSize: 14 }} /> UPI PAYMENT
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  {user?.name || '—'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  UTR: <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>{payInfo.transactionId || selectedBooking.transactionId || '—'}</Box>
                                </Typography>
                              </>
                            )}
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>STATUS</Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Chip
                                label={String(payInfo.status || selectedBooking.status || 'pending').toUpperCase()}
                                size="small"
                                color={(payInfo.status === 'success' || selectedBooking.status === 'confirmed' || selectedBooking.status === 'completed') ? 'success' : selectedBooking.status === 'rejected' ? 'error' : 'warning'}
                                sx={{ fontWeight: 700, borderRadius: 1.5 }}
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Divider sx={{ my: 1, borderColor: 'secondary.light' }} />
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '1rem' }}>TOTAL AMOUNT</Typography>
                          </Grid>
                          <Grid item xs={6} sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" fontWeight={900} color="secondary.main">
                              ₹{Number(selectedBooking.totalAmount || 0).toLocaleString()}
                            </Typography>
                          </Grid>
                        </Grid>
                      );
                    })()}
                  </Paper>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setBookingOpen(false)} variant="contained" fullWidth sx={{ borderRadius: 2, height: 44, fontWeight: 700 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Re-submit Dialog ── */}
      <Dialog open={resubmitOpen} onClose={() => !resubmitting && setResubmitOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Re-submit {resubmitType === 'inquiry' ? 'Ad Service' : 'Booking'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Update your payment Transaction ID (UTR) or upload a new ad creative to resolve the rejection reason.
            </Typography>

            <TextField
              label="Transaction ID (UTR)"
              fullWidth
              value={resubmitUtr}
              onChange={(e) => setResubmitUtr(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="Enter 12-digit UTR"
              helperText="Only alphanumeric values allowed."
              inputProps={{ maxLength: 25 }}
            />

            <Box>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>
                New Ad Creative (Optional)
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<CloudUploadIcon />}
                sx={{ 
                  height: 56, 
                  borderRadius: 2, 
                  borderStyle: 'dashed',
                  borderColor: resubmitFile ? 'success.main' : 'divider',
                  bgcolor: resubmitFile ? 'success.main' + '08' : 'transparent'
                }}
              >
                {resubmitFile ? resubmitFile.name : 'Upload File'}
                <input
                  type="file"
                  hidden
                  accept="image/*,video/*"
                  onChange={(e) => setResubmitFile(e.target.files[0])}
                />
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={() => setResubmitOpen(false)} 
            disabled={resubmitting}
            sx={{ fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleResubmit}
            disabled={resubmitting || !resubmitUtr}
            sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
          >
            {resubmitting ? <CircularProgress size={24} color="inherit" /> : 'Re-submit Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
