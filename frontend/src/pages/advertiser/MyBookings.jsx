import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { DISPLAY_DATE_FORMAT } from '../../utils/dateConstants';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
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
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import EventAvailable from '@mui/icons-material/EventAvailable';
import Visibility from '@mui/icons-material/Visibility';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { resolveUploadUrl } from '../../utils/mediaUrl';

const statusConfig = {
  pending: { label: 'Pending', color: 'warning' },
  confirmed: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
  cancelled: { label: 'Cancelled', color: 'default' },
  completed: { label: 'Completed', color: 'success' },
};

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!user?.id) return;
    api.get(`bookings/user/${user.id}`)
      .then((res) => setBookings(res.data.data || []))
      .catch(() => setSnackbar({ open: true, message: 'Failed to load bookings', severity: 'error' }))
      .finally(() => setLoading(false));
  }, [user?.id]);


  return (
    <Box sx={{ py: 2 }}>
      <Button component={Link} to="/advertiser" startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        Back to dashboard
      </Button>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        My Bookings
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Track the status of your booking requests. If a request is rejected, you can apply again with new dates.
      </Typography>

      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : bookings.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary" gutterBottom>
            You have no bookings yet.
          </Typography>
          <Button component={Link} to="/advertiser/marketplace" variant="contained" startIcon={<EventAvailable />}>
            Browse ad spaces
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Booking Title</TableCell>
                <TableCell>Ad space</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1,
                          bgcolor: 'grey.100',
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {b.creativeUrl ? (
                          b.creativeUrl.match(/\.(mp4|webm|ogg|mov)$/i) || b.creativeUrl.includes('video') ? (
                            <Box component="video" src={resolveUploadUrl(b.creativeUrl)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Box component="img" src={resolveUploadUrl(b.creativeUrl)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )
                        ) : (
                          <Typography variant="caption" color="text.disabled">No media</Typography>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{b.title || 'Untitled Campaign'}</Typography>
                        {b.description && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 200 }}>
                            {b.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{b.AdSpace?.title || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{b.AdSpace?.city || b.AdSpace?.location || ''}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{dayjs(b.startDate).format('DD MMM')}</Typography>
                    <Typography variant="caption" color="text.secondary">{dayjs(b.endDate).format(DISPLAY_DATE_FORMAT)}</Typography>
                  </TableCell>
                  <TableCell>₹{Number(b.totalAmount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={statusConfig[b.status]?.label || b.status}
                      color={statusConfig[b.status]?.color || 'default'}
                    />
                    {b.status === 'rejected' && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5, lineHeight: 1.2, maxWidth: 120 }}>
                        Refund will be processed in 24hr - 7 working days.
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      component={Link}
                      to={`/advertiser/ad-space/${b.adSpaceId}`}
                      startIcon={<Visibility />}
                      sx={{ mr: 1 }}
                    >
                      View space
                    </Button>
                    {b.status === 'rejected' && (
                      <Button
                        size="small"
                        variant="contained"
                        component={Link}
                        to={`/advertiser/book/${b.adSpaceId}`}
                        startIcon={<EventAvailable />}
                      >
                        Apply again
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
