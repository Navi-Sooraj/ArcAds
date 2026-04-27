import { useState, useEffect, useCallback } from 'react';
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
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Divider,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Block from '@mui/icons-material/Block';
import Search from '@mui/icons-material/Search';
import Delete from '@mui/icons-material/Delete';
import Info from '@mui/icons-material/Info';
import Person from '@mui/icons-material/Person';
import Email from '@mui/icons-material/Email';
import Phone from '@mui/icons-material/Phone';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import api from '../../api/axios';

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

export default function PendingUsers() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [detailsDialog, setDetailsDialog] = useState({ open: false, user: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadUsers = useCallback(() => {
    setLoading(true);
    api.get('admin/users')
      .then((res) => {
        const list = res.data.data || [];
        // Only show vendors (space owners)
        setVendors(list.filter((u) => u.role === 'space_owner'));
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to load vendors', severity: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = vendors.filter(u => 
    !search || 
    (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleToggleStatus = (u) => {
    if (!u?.id) return;
    const newStatus = !u.isActive;
    api.put(`admin/users/${u.id}`, { isActive: newStatus })
      .then((res) => {
        if (res.data.success) {
          setVendors((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: newStatus } : x)));
          setSnackbar({ 
            open: true, 
            message: `Vendor ${newStatus ? 'Activated' : 'Deactivated'} successfully`, 
            severity: newStatus ? 'success' : 'warning' 
          });
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to update vendor status', severity: 'error' }));
  };

  const handleDelete = () => {
    const u = deleteDialog.user;
    if (!u?.id) return;
    api.delete(`admin/users/${u.id}`)
      .then((res) => {
        if (res.data.success) {
          setVendors((prev) => prev.filter((x) => x.id !== u.id));
          setDeleteDialog({ open: false, user: null });
          setSnackbar({ open: true, message: 'Vendor account permanently removed', severity: 'success' });
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to delete vendor', severity: 'error' }));
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try {
      const date = new Date(d);
      return date.toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return '—';
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      <Button component={Link} to="/admin" startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        Back to dashboard
      </Button>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} letterSpacing="-0.5px" gutterBottom>
          Vendor Management
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Manage vendor accounts, track their status, and review registration details.
        </Typography>
      </Box>
      
      <TextField
        size="small"
        placeholder="Search vendors..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
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
              <TableCell sx={{ fontWeight: 800 }}>Vendor Name</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Email Address</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Registered</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>Loading internal data...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>No vendors match your search.</TableCell></TableRow>
            ) : (
              paged.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{u.name || '—'}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={u.isActive ? 'Active' : 'Deactivated'} 
                      size="small"
                      color={u.isActive ? 'success' : 'error'}
                      sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                    {new Date(u.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          color="info" 
                          onClick={() => setDetailsDialog({ open: true, user: u })}
                        >
                          <Info fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={u.isActive ? "Deactivate Vendor" : "Activate Vendor"}>
                        <Button
                          size="small"
                          variant="outlined"
                          color={u.isActive ? 'error' : 'success'}
                          startIcon={u.isActive ? <Block /> : <CheckCircle />}
                          onClick={() => handleToggleStatus(u)}
                          sx={{ fontWeight: 700, borderRadius: 2 }}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </Tooltip>

                      <Tooltip title="Delete Account">
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => setDeleteDialog({ open: true, user: u })}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {filtered.length > 0 && (
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          />
        )}
      </TableContainer>

      {/* Details Dialog */}
      <Dialog 
        open={detailsDialog.open} 
        onClose={() => setDetailsDialog({ open: false, user: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Vendor Registration Details</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ py: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, fontWeight: 700 }}>
                <Person sx={{ fontSize: 16 }} /> FULL NAME
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {detailsDialog.user?.name || 'Not Provided'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, fontWeight: 700 }}>
                <Email sx={{ fontSize: 16 }} /> EMAIL ADDRESS
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {detailsDialog.user?.email}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, fontWeight: 700 }}>
                <Phone sx={{ fontSize: 16 }} /> CONTACT NUMBER
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {detailsDialog.user?.phone || 'Not Provided'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, fontWeight: 700 }}>
                <CalendarMonth sx={{ fontSize: 16 }} /> REGISTRATION DATE
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {formatDate(detailsDialog.user?.createdAt)}
              </Typography>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                ACCOUNT STATUS
              </Typography>
              <Chip 
                label={detailsDialog.user?.isActive ? 'ACTIVE' : 'DEACTIVATED'} 
                size="small"
                color={detailsDialog.user?.isActive ? 'success' : 'error'}
                sx={{ fontWeight: 800, borderRadius: 1.5 }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailsDialog({ open: false, user: null })} variant="contained" sx={{ borderRadius: 2, px: 3 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => setDeleteDialog({ open: false, user: null })}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Vendor Account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently remove <strong>{deleteDialog.user?.email}</strong> and all associated data from the platform. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, user: null })} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" startIcon={<Delete />} sx={{ borderRadius: 2 }}>
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2, fontWeight: 600 }} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
