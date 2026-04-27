import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { DISPLAY_DATE_FORMAT } from '../utils/dateConstants';
import { Link } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, Alert, Dialog, DialogTitle, DialogContent, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Add from '@mui/icons-material/Add';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { resolveUploadUrl } from '../utils/mediaUrl';

export default function SpaceOwnerDashboard() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', description: '', city: '', location: '', adType: 'billboard', width: '', height: '', pricePerDay: '', imageUrl: '' });
  const [addLoading, setAddLoading] = useState(false);

  const loadData = () => {
    if (!user?.id) return;
    Promise.all([
      api.get('ad-spaces/owner', { params: { ownerId: user.id } }),
      api.get('bookings', { params: { userId: user.id, role: 'space_owner' } }),
    ])
      .then(([sRes, bRes]) => {
        if (sRes.data.success) setSpaces(sRes.data.data || []);
        if (bRes.data.success) setBookings(bRes.data.data || []);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const handleAddSpace = (e) => {
    e.preventDefault();
    setAddLoading(true);
    api.post('ad-spaces', { ownerId: user.id, ...addForm, pricePerDay: Number(addForm.pricePerDay) || 0, width: addForm.width ? Number(addForm.width) : null, height: addForm.height ? Number(addForm.height) : null })
      .then((res) => { if (res.data.success) { setOpenAdd(false); setAddForm({ title: '', description: '', city: '', location: '', adType: 'billboard', width: '', height: '', pricePerDay: '', imageUrl: '' }); loadData(); } })
      .catch(() => setError('Failed to add space'))
      .finally(() => setAddLoading(false));
  };

  const handleConfirmBooking = (id) => {
    api.patch(`bookings/${id}/status`, { status: 'confirmed' })
      .then((res) => res.data.success && setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'confirmed' } : b)))
      .catch(() => {});
  };

  const handleRejectBooking = (id) => {
    api.patch(`bookings/${id}/status`, { status: 'rejected' })
      .then((res) => res.data.success && setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'rejected' } : b)))
      .catch(() => {});
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Space Owner Dashboard</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Welcome, {user?.name || user?.email}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>My Ad Spaces</Typography>
      {loading ? (
        <Typography>Loading…</Typography>
      ) : (
        <Grid container spacing={2}>
          {spaces.map((s) => (
            <Grid item xs={12} md={4} key={s.id}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1">{s.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.city || s.location || '—'} · {s.adType || '—'}</Typography>
                  <Chip size="small" label={s.verified ? 'Verified' : 'Pending'} color={s.verified ? 'success' : 'default'} sx={{ mt: 1 }} />
                  <Typography variant="body2">₹{s.pricePerDay}/day</Typography>
                  <Button size="small" component={Link} to={`/ad-space/${s.id}`}>View</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
          <Grid item xs={12} md={4}>
            <Card sx={{ minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Button startIcon={<Add />} onClick={() => setOpenAdd(true)}>Add ad space</Button>
            </Card>
          </Grid>
        </Grid>
      )}

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Ad Space</DialogTitle>
        <DialogContent>
          <form onSubmit={handleAddSpace}>
            <TextField fullWidth label="Title" value={addForm.title} onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))} required margin="normal" />
            <TextField fullWidth label="Description" value={addForm.description} onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))} multiline rows={2} margin="normal" />
            <TextField fullWidth label="City" value={addForm.city} onChange={(e) => setAddForm((f) => ({ ...f, city: e.target.value }))} margin="normal" />
            <TextField fullWidth label="Location / Address" value={addForm.location} onChange={(e) => setAddForm((f) => ({ ...f, location: e.target.value }))} margin="normal" />
            <FormControl fullWidth margin="normal">
              <InputLabel>Ad type</InputLabel>
              <Select value={addForm.adType} label="Ad type" onChange={(e) => setAddForm((f) => ({ ...f, adType: e.target.value }))}>
                <MenuItem value="billboard">Billboard</MenuItem>
                <MenuItem value="hoarding">Hoarding</MenuItem>
                <MenuItem value="digital_screen">Digital Screen</MenuItem>
                <MenuItem value="wall_painting">Wall Painting</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth type="number" label="Width (m)" value={addForm.width} onChange={(e) => setAddForm((f) => ({ ...f, width: e.target.value }))} margin="normal" inputProps={{ min: 0, step: 0.01 }} />
            <TextField fullWidth type="number" label="Height (m)" value={addForm.height} onChange={(e) => setAddForm((f) => ({ ...f, height: e.target.value }))} margin="normal" inputProps={{ min: 0, step: 0.01 }} />
            <TextField fullWidth label="Image URL" value={addForm.imageUrl} onChange={(e) => setAddForm((f) => ({ ...f, imageUrl: e.target.value }))} margin="normal" />
            <TextField fullWidth type="number" label="Price per day (₹)" value={addForm.pricePerDay} onChange={(e) => setAddForm((f) => ({ ...f, pricePerDay: e.target.value }))} margin="normal" inputProps={{ min: 0 }} />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={addLoading}>{addLoading ? 'Adding…' : 'Add space'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Booking Requests</Typography>
      {!loading && (
        <Grid container spacing={2}>
          {bookings.filter((b) => b.status === 'pending').map((b) => (
            <Grid item xs={12} key={b.id}>
              <Card>
                <CardContent>
                  <Typography>{b.AdSpace?.title} – {b.User?.name}</Typography>
                  <Typography variant="body2">{dayjs(b.startDate).format(DISPLAY_DATE_FORMAT)} – {dayjs(b.endDate).format(DISPLAY_DATE_FORMAT)} · ₹{b.totalAmount}</Typography>
                  {b.totalSeconds != null && Number(b.totalSeconds) > 0 && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Airtime: {Number(b.totalSeconds).toLocaleString()} sec
                    </Typography>
                  )}
                  {b.creativeVideoUrl && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Advertiser creative
                      </Typography>
                      <Box
                        component="video"
                        src={resolveUploadUrl(b.creativeVideoUrl)}
                        controls
                        playsInline
                        preload="metadata"
                        sx={{ width: '100%', maxWidth: 360, maxHeight: 200, borderRadius: 1, bgcolor: 'black' }}
                      />
                      <Button
                        component="a"
                        size="small"
                        href={resolveUploadUrl(b.creativeVideoUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ mt: 0.5 }}
                      >
                        Open video
                      </Button>
                    </Box>
                  )}
                  <Box sx={{ mt: 1 }}>
                    <Button size="small" color="primary" onClick={() => handleConfirmBooking(b.id)}>Confirm</Button>
                    <Button size="small" color="error" onClick={() => handleRejectBooking(b.id)}>Reject</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {bookings.filter((b) => b.status === 'pending').length === 0 && (
            <Typography color="text.secondary">No pending requests.</Typography>
          )}
        </Grid>
      )}
    </Box>
  );
}
