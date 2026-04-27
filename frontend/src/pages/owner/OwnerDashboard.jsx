import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { DISPLAY_DATE_FORMAT } from '../../utils/dateConstants';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  Grid,
  IconButton,
} from '@mui/material';
import { resolveUploadUrl } from '../../utils/mediaUrl';
import Add from '@mui/icons-material/Add';
import List from '@mui/icons-material/List';
import Visibility from '@mui/icons-material/Visibility';
import Check from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import Campaign from '@mui/icons-material/Campaign';
import Paid from '@mui/icons-material/Paid';
import CreditCard from '@mui/icons-material/CreditCard';
import Download from '@mui/icons-material/Download';
import OpenInNew from '@mui/icons-material/OpenInNew';
import Store from '@mui/icons-material/Store';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import AccessTime from '@mui/icons-material/AccessTime';
import Verified from '@mui/icons-material/Verified';
import Pending from '@mui/icons-material/Pending';
import Cancel from '@mui/icons-material/Cancel';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import PageHeading from '../../components/PageHeading';

function BookingCreativeCell({ booking }) {
  const raw = booking?.creativeUrl;
  const url = raw ? resolveUploadUrl(raw) : '';
  const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('video');

  if (!url) {
    return (
      <Typography variant="caption" color="text.secondary">
        No creative uploaded
      </Typography>
    );
  }
  return (
    <Box sx={{ maxWidth: 280 }}>
      {booking.title && (
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
          {booking.title}
        </Typography>
      )}
      {booking.description && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
          {booking.description}
        </Typography>
      )}
      {booking?.totalSeconds != null && Number(booking.totalSeconds) > 0 && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Airtime: {Number(booking.totalSeconds).toLocaleString()} sec
        </Typography>
      )}
      
      <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', bgcolor: 'rgba(0,0,0,0.2)', border: '1px solid', borderColor: 'divider' }}>
        {isVideo ? (
          <Box
            component="video"
            src={url}
            controls
            playsInline
            preload="metadata"
            sx={{ width: '100%', display: 'block', maxHeight: 160, bgcolor: 'black' }}
          />
        ) : (
          <Box
            component="img"
            src={url}
            alt="Creative"
            sx={{ width: '100%', display: 'block', maxHeight: 160, objectFit: 'contain' }}
          />
        )}
      </Box>
      <Button
        component="a"
        size="small"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ mt: 0.5, textTransform: 'none' }}
      >
        View full size
      </Button>
    </Box>
  );
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState('');

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'Creative_Media';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const loadData = () => {
    if (!user?.id) return;
    Promise.all([
      api.get(`adspaces/owner/${user.id}`),
      api.get(`bookings/owner/${user.id}`),
    ])
      .then(([sRes, bRes]) => {
        if (sRes.data.success) setSpaces(sRes.data.data || []);
        if (bRes.data.success) setBookings(bRes.data.data || []);
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const handleConfirmBooking = (id) => {
    api.put(`bookings/${id}/approve`)
      .then((res) => {
        if (res.data.success) {
          setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'confirmed' } : b)));
          setSnackbar({ open: true, message: 'Booking approved', severity: 'success' });
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to approve', severity: 'error' }));
  };

  const handleRejectBooking = (id) => {
    api.put(`bookings/${id}/reject`)
      .then((res) => {
        if (res.data.success) {
          setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'rejected' } : b)));
          setSnackbar({ open: true, message: 'Booking rejected', severity: 'success' });
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to reject', severity: 'error' }));
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const decidedBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'rejected').slice(0, 10);

  return (
    <Box sx={{ py: 2 }}>
      <PageHeading
        title={user?.name || user?.email ? `${user.name || user.email} - Dashboard` : undefined}
      />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
        <Button component={Link} to="/owner/add" variant="contained" startIcon={<Add />}>
          Add new Ad Space
        </Button>
        <Button component={Link} to="/owner/listings" variant="outlined" startIcon={<List />}>
          My listings
        </Button>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {[
          { 
            label: 'Total Listings', 
            value: spaces.length, 
            icon: <Store sx={{ fontSize: '1.8rem' }} />, 
            color: (theme) => theme.palette.primary.main,
            bgcolor: (theme) => `${theme.palette.primary.main}15`
          },
          { 
            label: 'Total Bookings', 
            value: bookings.length, 
            icon: <AssignmentOutlined sx={{ fontSize: '1.8rem' }} />, 
            color: (theme) => theme.palette.secondary.main,
            bgcolor: (theme) => `${theme.palette.secondary.main}15`
          },
          { 
            label: 'Pending Requests', 
            value: pendingBookings.length, 
            icon: <AccessTime sx={{ fontSize: '1.8rem' }} />, 
            color: (theme) => theme.palette.warning.main,
            bgcolor: (theme) => `${theme.palette.warning.main}15`
          },
          { 
            label: 'Accepted Bookings', 
            value: bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length, 
            icon: <Verified sx={{ fontSize: '1.8rem' }} />, 
            color: (theme) => theme.palette.success.main,
            bgcolor: (theme) => `${theme.palette.success.main}15`
          },
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{
              height: '100%',
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
              borderRadius: 4,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-4px)',
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                boxShadow: (theme) => `0 12px 30px rgba(0,0,0,0.4), 0 0 0 1px ${typeof stat.color === 'function' ? stat.color(theme) : stat.color}40`,
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                bgcolor: stat.color,
                opacity: 0.6
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 1.2, display: 'block', mb: 0.5 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: 'text.primary' }}>
                      {loading ? '—' : stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 3, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: stat.bgcolor,
                    color: stat.color,
                    boxShadow: (theme) => `0 8px 16px ${typeof stat.color === 'function' ? stat.color(theme) : stat.color}15`,
                  }}>
                    {stat.icon}
                  </Box>
                </Box>
                
                {/* Subtle decoration */}
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: -20, 
                  right: -20, 
                  opacity: 0.05,
                  transform: 'rotate(-15deg)',
                  pointerEvents: 'none',
                  '& svg': { fontSize: '6rem' }
                }}>
                  {stat.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Booking Requests</Typography>
      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : pendingBookings.length === 0 ? (
        <Typography color="text.secondary">No pending booking requests. When users book your spaces, they appear here for you to accept or reject.</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Ad Space</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Advertiser</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Submission Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingBookings.map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{b.AdSpace?.title || '—'}</TableCell>
                  <TableCell>{b.User?.name || b.User?.email || '—'}</TableCell>
                  <TableCell>{dayjs(b.createdAt).format(DISPLAY_DATE_FORMAT)}</TableCell>
                  <TableCell>
                    <Chip
                      icon={<Pending style={{ fontSize: '1rem' }} />}
                      label="PENDING"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255, 152, 0, 0.1)',
                        color: '#ff9800',
                        fontWeight: 800,
                        fontSize: '0.65rem',
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
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      size="small" 
                      onClick={() => { setSelectedBooking(b); setBookingOpen(true); }}
                      startIcon={<Visibility sx={{ fontSize: '1.1rem' }} />}
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {decidedBookings.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Confirmed Bookings</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Ad Space</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Advertiser</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Submission Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {decidedBookings.map((b) => (
                  <TableRow key={b.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{b.AdSpace?.title || '—'}</TableCell>
                    <TableCell>{b.User?.name || b.User?.email || '—'}</TableCell>
                    <TableCell>{dayjs(b.createdAt).format(DISPLAY_DATE_FORMAT)}</TableCell>
                    <TableCell>
                      {b.status === 'confirmed' ? (
                        <Chip
                          icon={<Verified style={{ fontSize: '1rem' }} />}
                          label="ACCEPTED"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(76, 175, 80, 0.1)',
                            color: '#4caf50',
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(76, 175, 80, 0.2)',
                            '& .MuiChip-icon': { color: '#4caf50' }
                          }}
                        />
                      ) : (
                        <Chip
                          icon={<Cancel style={{ fontSize: '1rem' }} />}
                          label="REJECTED"
                          size="small"
                          sx={{
                            bgcolor: 'rgba(244, 67, 54, 0.1)',
                            color: '#f44336',
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(244, 67, 54, 0.2)',
                            '& .MuiChip-icon': { color: '#f44336' }
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                      size="small" 
                      onClick={() => { setSelectedBooking(b); setBookingOpen(true); }}
                      startIcon={<Visibility sx={{ fontSize: '1.1rem' }} />}
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* ── Booking Detail Dialog (for Owners) ── */}
      <Dialog open={bookingOpen} onClose={() => setBookingOpen(false)} maxWidth="sm" fullWidth>
        {selectedBooking && (
          <>
            <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Booking Request Details
              <Chip
                icon={
                  selectedBooking.status === 'confirmed' ? <Verified style={{ fontSize: '1rem' }} /> :
                  selectedBooking.status === 'pending' ? <Pending style={{ fontSize: '1rem' }} /> :
                  <Cancel style={{ fontSize: '1rem' }} />
                }
                label={selectedBooking.status.toUpperCase()}
                size="small"
                sx={{
                  fontWeight: 700,
                  bgcolor: selectedBooking.status === 'confirmed' ? 'rgba(76, 175, 80, 0.1)' : 
                           selectedBooking.status === 'pending' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                  color: selectedBooking.status === 'confirmed' ? '#4caf50' : 
                         selectedBooking.status === 'pending' ? '#ff9800' : '#f44336',
                  border: '1px solid',
                  borderColor: selectedBooking.status === 'confirmed' ? 'rgba(76, 175, 80, 0.2)' : 
                               selectedBooking.status === 'pending' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                  '@keyframes pulse-dlg': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.6 },
                    '100%': { opacity: 1 },
                  },
                  animation: selectedBooking.status === 'pending' ? 'pulse-dlg 2s infinite ease-in-out' : 'none',
                  '& .MuiChip-icon': { color: 'inherit' }
                }}
              />
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2.5}>
                {/* Section: Space & Advertiser */}
                <Box>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>AD SPACE</Typography>
                  <Typography variant="h6" fontWeight={900} color="primary.main">{selectedBooking.AdSpace?.title || '—'}</Typography>
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">Advertiser:</Typography>
                    <Typography variant="body2" fontWeight={700}>{selectedBooking.User?.name || selectedBooking.User?.email || '—'}</Typography>
                  </Box>
                </Box>

                <Divider />

                {/* Section: Campaign Details */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoOutlined fontSize="small" color="primary" />
                    Campaign Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(255, 255, 255, 0.03)' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>Campaign Title:</Typography>
                        <Typography variant="body2" fontWeight={600}>{selectedBooking.title || '—'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>Start Date:</Typography>
                        <Typography variant="body2" fontWeight={600}>{dayjs(selectedBooking.startDate).format(DISPLAY_DATE_FORMAT)}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase' }}>End Date:</Typography>
                        <Typography variant="body2" fontWeight={600}>{dayjs(selectedBooking.endDate).format(DISPLAY_DATE_FORMAT)}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                         <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 1.5, color: 'white', textAlign: 'center' }}>
                          <Typography variant="body2" fontWeight={800}>
                            {dayjs(selectedBooking.endDate).diff(dayjs(selectedBooking.startDate), 'day') + 1} Days Booking
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>

                {/* Section: Ad Creative */}
                {selectedBooking.creativeUrl && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Campaign fontSize="small" color="primary" />
                      Ad Creative (Click to preview)
                    </Typography>
                    <Box 
                      onClick={() => {
                        setLightboxUrl(selectedBooking.creativeUrl);
                        setLightboxOpen(true);
                      }}
                      sx={{ 
                        position: 'relative', 
                        borderRadius: 2.5, 
                        overflow: 'hidden', 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        bgcolor: 'black',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.02)',
                        }
                      }}
                    >
                      {selectedBooking.creativeUrl.match(/\.(mp4|webm|ogg|mov)$/i) || selectedBooking.creativeUrl.includes('video') ? (
                        <video src={resolveUploadUrl(selectedBooking.creativeUrl)} style={{ width: '100%', maxHeight: 240, display: 'block' }} />
                      ) : (
                        <img src={resolveUploadUrl(selectedBooking.creativeUrl)} alt="Creative" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', display: 'block' }} />
                      )}
                    </Box>
                    <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Download />}
                        onClick={() => {
                          const url = resolveUploadUrl(selectedBooking.creativeUrl);
                          const ext = url.split('.').pop().split('?')[0] || (url.includes('video') ? 'mp4' : 'jpg');
                          handleDownload(url, `ArcAds_Booking_${selectedBooking.id}_Creative.${ext}`);
                        }}
                        sx={{ 
                          borderRadius: 2, 
                          textTransform: 'none', 
                          fontWeight: 700,
                          boxShadow: 'none',
                          '&:hover': { boxShadow: 'none' }
                        }}
                      >
                        Download Media
                      </Button>
                    </Stack>
                  </Box>
                )}

                {/* Section: Payment Summary */}
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
                      <Paid sx={{ fontSize: 18 }} />
                      Payment Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={7}>
                        {(() => {
                           const payInfo = selectedBooking.Payments?.[0] || {};
                           const isUpi = payInfo.paymentMethod === 'upi';
                           return (
                             <>
                               <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                 {isUpi ? <Paid sx={{ fontSize: 14 }} /> : <CreditCard sx={{ fontSize: 14 }} />} 
                                 {isUpi ? 'UPI PAYMENT' : 'CARD PAYMENT'}
                               </Typography>
                               <Typography variant="body2" fontWeight={700}>
                                 UTR: {payInfo.transactionId || '—'}
                               </Typography>
                               {!isUpi && payInfo.cardLast4 && (
                                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                    xxxx xxxx xxxx {payInfo.cardLast4}
                                  </Typography>
                               )}
                             </>
                           );
                        })()}
                      </Grid>
                      <Grid item xs={12} sm={5} sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>TOTAL AMOUNT</Typography>
                        <Typography variant="h6" fontWeight={900} color="secondary.main">
                          ₹{Number(selectedBooking.totalAmount || 0).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, gap: 1 }}>
              <Button onClick={() => setBookingOpen(false)} variant="outlined" sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
                Close
              </Button>
              {['pending', 'confirmed'].includes(selectedBooking.status) && (
                <>
                  {selectedBooking.status === 'pending' && (
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => { handleConfirmBooking(selectedBooking.id); setBookingOpen(false); }}
                      sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      Accept Booking
                    </Button>
                  )}
                  <Button 
                    variant="outlined" 
                    color="error" 
                    onClick={() => { handleRejectBooking(selectedBooking.id); setBookingOpen(false); }}
                    sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                  >
                    Reject {selectedBooking.status === 'confirmed' ? 'Booking' : ''}
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Lightbox Dialog for Media Preview ── */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            bgcolor: 'black',
            backgroundImage: 'none',
            boxShadow: 'none',
            overflow: 'hidden',
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setLightboxOpen(false)}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.5)',
              zIndex: 1,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
            }}
          >
            <CloseIcon />
          </IconButton>
          {lightboxUrl && (
            lightboxUrl.match(/\.(mp4|webm|ogg|mov)$/i) || lightboxUrl.includes('video') ? (
              <video
                src={resolveUploadUrl(lightboxUrl)}
                controls
                autoPlay
                style={{ width: '100%', maxHeight: '90vh', display: 'block' }}
              />
            ) : (
              <img
                src={resolveUploadUrl(lightboxUrl)}
                alt="Full Preview"
                style={{ width: '100%', maxHeight: '90vh', objectFit: 'contain', display: 'block' }}
              />
            )
          )}
        </Box>
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
    </Box>
  );
}
