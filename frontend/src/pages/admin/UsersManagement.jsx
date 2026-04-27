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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Search from '@mui/icons-material/Search';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import api from '../../api/axios';

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];
const ROLES = ['advertiser', 'space_owner', 'admin'];

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: 'advertiser', isActive: true, password: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadUsers = () => {
    setLoading(true);
    api.get('admin/users')
      .then((res) => setUsers(res.data.data || []))
      .catch(() => setSnackbar({ open: true, message: 'Failed to load users', severity: 'error' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter(
    (u) =>
      u.role === 'advertiser' &&
      (
        !search ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
        (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
        (u.role && u.role.toLowerCase().includes(search.toLowerCase()))
      )
  );
  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleDelete = () => {
    const { user: u } = deleteDialog;
    if (!u?.id) return;
    api.delete(`admin/users/${u.id}`)
      .then((res) => {
        if (res.data.success) {
          setUsers((prev) => prev.filter((x) => x.id !== u.id));
          setDeleteDialog({ open: false, user: null });
          setSnackbar({ open: true, message: 'User deleted', severity: 'success' });
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to delete user', severity: 'error' }));
  };

  const handleOpenEdit = (u) => {
    setEditDialog({ open: true, user: u });
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'advertiser',
      isActive: u.isActive !== false,
      password: '',
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const { user: u } = editDialog;
    if (!u?.id) return;
    setSaveLoading(true);
    const payload = {
      name: editForm.name.trim() || null,
      email: editForm.email.trim(),
      phone: editForm.phone.trim() || null,
      role: editForm.role,
      isActive: editForm.isActive,
    };
    if (editForm.password.trim()) payload.password = editForm.password;
    api.put(`admin/users/${u.id}`, payload)
      .then((res) => {
        if (res.data.success) {
          setUsers((prev) => prev.map((x) => (x.id === u.id ? res.data.data : x)));
          setEditDialog({ open: false, user: null });
          setSnackbar({ open: true, message: 'User updated', severity: 'success' });
        }
      })
      .catch((err) => setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to update user', severity: 'error' }))
      .finally(() => setSaveLoading(false));
  };

  return (
    <Box sx={{ py: 2 }}>
      <Button component={Link} to="/admin" startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        Back to Dashboard
      </Button>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Advertiser Management
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        View and manage advertiser accounts.
      </Typography>

      <TextField
        size="small"
        placeholder="Search users..."
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
              <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Active</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={6}>No users found.</TableCell></TableRow>
            ) : (
              paged.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.name || '—'}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.isActive !== false ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEdit(u)} title="Edit">
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, user: u })} title="Delete">
                      <Delete />
                    </IconButton>
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

      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, user: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Edit user</DialogTitle>
        <DialogContent>
          <form id="edit-user-form" onSubmit={handleSaveEdit}>
            <TextField
              fullWidth
              label="Name"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              required
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone"
              value={editForm.phone}
              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={editForm.role}
                label="Role"
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
              >
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              }
              label="Active"
              sx={{ display: 'block', mt: 1 }}
            />
            <TextField
              fullWidth
              label="New password"
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Leave blank to keep current"
              margin="normal"
              autoComplete="new-password"
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button onClick={() => setEditDialog({ open: false, user: null })}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={saveLoading} form="edit-user-form">
                {saveLoading ? 'Saving…' : 'Save'}
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, user: null })}>
        <DialogTitle>Delete user?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{deleteDialog.user?.email}&quot;? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, user: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
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
