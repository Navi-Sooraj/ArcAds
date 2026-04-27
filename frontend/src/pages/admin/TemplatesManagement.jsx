import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import api from '../../api/axios';

const initialForm = {
  name: '',
  description: '',
  width: 24,
  height: 36,
  category: 'billboard',
};

export default function TemplatesManagement() {
  const [templates, setTemplates] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadTemplates = () => {
    api.get('admin/templates')
      .then((res) => setTemplates(res.data.data || []))
      .catch(() => setSnackbar({ open: true, message: 'Failed to load templates', severity: 'error' }));
  };

  useEffect(() => { loadTemplates(); }, []);

  const handleCreate = () => {
    api.post('admin/templates', form)
      .then((res) => {
        if (res.data.success) {
          setTemplates((prev) => [res.data.data, ...prev]);
          setDialogOpen(false);
          setForm(initialForm);
          setSnackbar({ open: true, message: 'Template added', severity: 'success' });
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to add template', severity: 'error' }));
  };

  const toggleActive = (t) => {
    api.put(`admin/templates/${t.id}`, { isActive: !t.isActive })
      .then((res) => {
        if (res.data.success) {
          setTemplates((prev) => prev.map((x) => (x.id === t.id ? res.data.data : x)));
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to update template', severity: 'error' }));
  };

  const handleDelete = (id) => {
    api.delete(`admin/templates/${id}`)
      .then((res) => {
        if (res.data.success) {
          setTemplates((prev) => prev.filter((x) => x.id !== id));
          setSnackbar({ open: true, message: 'Template deleted', severity: 'success' });
        }
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to delete template', severity: 'error' }));
  };

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Template Management</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Add and manage AI design templates used in user/vendor canvas.
      </Typography>
      <Button variant="contained" onClick={() => setDialogOpen(true)} sx={{ mb: 2 }}>Add template</Button>

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.category || 'General'}</TableCell>
                <TableCell>{Number(t.width)}" x {Number(t.height)}"</TableCell>
                <TableCell><Switch checked={!!t.isActive} onChange={() => toggleActive(t)} /></TableCell>
                <TableCell align="right">
                  <Button color="error" size="small" onClick={() => handleDelete(t.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add template</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="normal" label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <TextField fullWidth margin="normal" label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <TextField fullWidth margin="normal" label="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          <TextField fullWidth margin="normal" label="Width" type="number" value={form.width} onChange={(e) => setForm((f) => ({ ...f, width: Number(e.target.value) }))} />
          <TextField fullWidth margin="normal" label="Height" type="number" value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: Number(e.target.value) }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Save</Button>
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
