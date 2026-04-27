import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
  Tooltip,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Search from '@mui/icons-material/Search';
import Delete from '@mui/icons-material/Delete';
import Verified from '@mui/icons-material/Verified';
import Visibility from '@mui/icons-material/Visibility';
import api from '../../api/axios';

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

export default function AdSpacesManagement() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, space: null });
  const [rejectDialog, setRejectDialog] = useState({ open: false, space: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadSpaces = () => {
    setLoading(true);
    api.get('admin/adspaces')
      .then((res) => setSpaces(res.data.data || []))
      .catch(() => setSnackbar({ open: true, message: 'Failed to load ad spaces', severity: 'error' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSpaces(); }, []);

  const filtered = spaces.filter(
    (s) =>
      !search ||
      (s.title && s.title.toLowerCase().includes(search.toLowerCase())) ||
      (s.city && s.city.toLowerCase().includes(search.toLowerCase())) ||
      (s.adType && s.adType.toLowerCase().includes(search.toLowerCase())) ||
      (s.User?.email && s.User.email.toLowerCase().includes(search.toLowerCase()))
  );
  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleVerify = (id) => {
    api.put(`admin/adspaces/${id}/verify`)
      .then((res) => {
        if (res.data.success) {
          setSpaces((prev) => prev.map((s) => (s.id === id ? { ...s, verified: true, verificationStatus: 'verified' } : s)));
          setSnackbar({ open: true, message: 'Ad space verified', severity: 'success' });
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to verify', severity: 'error' }));
  };

  const handleReject = () => {
    const { space } = rejectDialog;
    if (!space?.id) return;

    api.put(`admin/adspaces/${space.id}/reject`, { reason: rejectionReason })
      .then((res) => {
        if (res.data.success) {
          setSpaces((prev) => prev.map((s) => (s.id === space.id ? { ...s, verified: false, verificationStatus: 'rejected', rejectionReason } : s)));
          setRejectDialog({ open: false, space: null });
          setRejectionReason('');
          setSnackbar({ open: true, message: 'Ad space verification rejected', severity: 'info' });
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to reject', severity: 'error' }));
  };
  
  const handleToggleActive = (id, currentStatus) => {
    api.put(`admin/adspaces/${id}/active`, { isActive: !currentStatus })
      .then((res) => {
        if (res.data.success) {
          setSpaces((prev) => prev.map((s) => (s.id === id ? { ...s, ...res.data.data } : s)));
          setSnackbar({ open: true, message: `Ad space ${!currentStatus ? 'activated' : 'deactivated'}`, severity: 'info' });
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to update status';
        setSnackbar({ open: true, message: msg, severity: 'error' });
      });
  };

  const handleDelete = () => {
    const { space } = deleteDialog;
    if (!space?.id) return;
    api.delete(`admin/adspaces/${space.id}`)
      .then((res) => {
        if (res.data.success) {
          setSpaces((prev) => prev.filter((s) => s.id !== space.id));
          setDeleteDialog({ open: false, space: null });
          setSnackbar({ open: true, message: 'Ad space deleted', severity: 'success' });
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to delete ad space', severity: 'error' }));
  };


  return (
    <Box sx={{ py: 2 }}>
      <Button component={Link} to="/admin" startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        Back to dashboard
      </Button>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Ad Spaces Management
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        View, verify, and delete advertising spaces.
      </Typography>

      <TextField
        size="small"
        placeholder="Search ad spaces..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2, minWidth: 280 }}
      />

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>City</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Owner</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Active</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7}>Loading…</TableCell></TableRow>
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={7}>No ad spaces found.</TableCell></TableRow>
            ) : (
              paged.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.title}</TableCell>
                  <TableCell>{s.city || '—'}</TableCell>
                  <TableCell>{s.adType || '—'}</TableCell>
                  <TableCell>{s.User?.email || s.User?.name || '—'}</TableCell>
                  <TableCell>
                    <Stack direction="column" spacing={0.5}>
                      {s.verificationStatus === 'verified' || s.verified ? (
                        <Chip size="small" label="Verified" color="success" />
                      ) : s.verificationStatus === 'rejected' ? (
                        <Tooltip title={`Reason: ${s.rejectionReason || 'No reason provided'}`}>
                          <Chip size="small" label="Rejected" color="error" variant="outlined" sx={{ cursor: 'help' }} />
                        </Tooltip>
                      ) : (
                        <Chip size="small" label="Pending" color="warning" />
                      )}
                      {s.reactivationRequested && (
                        <Chip 
                          size="small" 
                          label="Reactivation Request" 
                          color="primary" 
                          variant="filled" 
                          sx={{ 
                            fontSize: '0.65rem', 
                            height: 20, 
                            fontWeight: 800,
                            boxShadow: '0 0 10px rgba(25, 118, 210, 0.5)',
                            animation: 'pulse 1.5s infinite'
                          }} 
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title={!s.isActive && !s.adminDeactivated ? "Deactivated by Vendor" : ""}>
                        <span>
                          <Switch
                            size="small"
                            checked={!!s.isActive}
                            onChange={() => handleToggleActive(s.id, s.isActive)}
                            color="primary"
                            disabled={!s.isActive && !s.adminDeactivated}
                          />
                        </span>
                      </Tooltip>
                      {!s.isActive && !s.adminDeactivated && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                          VENDOR OFF
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 320 }}>
                    <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
                      <Button
                        component={Link}
                        to={`/ad-space/${s.id}`}
                        size="small"
                        startIcon={<Visibility />}
                      >
                        View
                      </Button>
                      {!s.verified && s.verificationStatus !== 'verified' && (
                        <Stack direction="row" spacing={2}>
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="success" 
                            onClick={() => handleVerify(s.id)}
                            sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 700, px: 2 }}
                          >
                            Verify
                          </Button>
                          {s.verificationStatus !== 'rejected' && (
                            <Button 
                              size="small" 
                              variant="outlined" 
                              color="error"
                              onClick={() => setRejectDialog({ open: true, space: s })}
                              sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 700, px: 2 }}
                            >
                              Reject
                            </Button>
                          )}
                        </Stack>
                      )}
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, space: s })} title="Delete">
                        <Delete />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        />
      </TableContainer>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, space: null })}>
        <DialogTitle>Delete ad space?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{deleteDialog.space?.title}&quot;? This will also remove related bookings. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, space: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, space: null })} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Reject Verification</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a reason for rejecting &quot;{rejectDialog.space?.title}&quot;. This feedback will be shown to the vendor.
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            placeholder="e.g., Photos are not clear, location is incorrect..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setRejectDialog({ open: false, space: null })}>Cancel</Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            variant="contained" 
            disabled={!rejectionReason.trim()}
          >
            Confirm Reject
          </Button>
        </DialogActions>
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
