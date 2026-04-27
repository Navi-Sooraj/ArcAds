import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, Alert, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [pendingSpaces, setPendingSpaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('admin/dashboard'),
      api.get('admin/pending-spaces'),
      api.get('admin/users'),
    ])
      .then(([dRes, pRes, uRes]) => {
        if (dRes.data.success) setStats(dRes.data.data);
        if (pRes.data.success) setPendingSpaces(pRes.data.data || []);
        if (uRes.data.success) setUsers(uRes.data.data || []);
      })
      .catch(() => setError('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = (id) => {
    api.post(`admin/spaces/${id}/approve`).then((res) => {
      if (res.data.success) setPendingSpaces((prev) => prev.filter((s) => s.id !== id));
    });
  };

  const handleReject = (id) => {
    api.post(`admin/spaces/${id}/reject`).then((res) => {
      if (res.data.success) setPendingSpaces((prev) => prev.filter((s) => s.id !== id));
    });
  };

  if (loading) return <Typography>Loading…</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Welcome, {user?.name || user?.email}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} md={3}>
            <Card><CardContent><Typography color="text.secondary">Users</Typography><Typography variant="h4">{stats.usersCount}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card><CardContent><Typography color="text.secondary">Ad Spaces</Typography><Typography variant="h4">{stats.adSpacesCount}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card><CardContent><Typography color="text.secondary">Bookings</Typography><Typography variant="h4">{stats.bookingsCount}</Typography></CardContent></Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card><CardContent><Typography color="text.secondary">Pending Approval</Typography><Typography variant="h4">{stats.pendingSpaces}</Typography></CardContent></Card>
          </Grid>
        </Grid>
      )}

      <Typography variant="h6" gutterBottom>Pending Ad Spaces</Typography>
      {pendingSpaces.length === 0 ? (
        <Typography color="text.secondary">No pending spaces.</Typography>
      ) : (
        <Table size="small">
          <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Owner</TableCell><TableCell>Type</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {pendingSpaces.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.title}</TableCell>
                <TableCell>{s.User?.name || s.User?.email}</TableCell>
                <TableCell>{s.type}</TableCell>
                <TableCell>
                  <Button size="small" startIcon={<CheckCircle />} onClick={() => handleApprove(s.id)}>Approve</Button>
                  <Button size="small" color="error" startIcon={<Cancel />} onClick={() => handleReject(s.id)}>Reject</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Typography variant="h6" sx={{ mt: 4 }}>Users</Typography>
      <Table size="small">
        <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Email</TableCell><TableCell>Name</TableCell><TableCell>Role</TableCell></TableRow></TableHead>
        <TableBody>
          {users.slice(0, 20).map((u) => (
            <TableRow key={u.id}><TableCell>{u.id}</TableCell><TableCell>{u.email}</TableCell><TableCell>{u.name}</TableCell><TableCell>{u.role}</TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
