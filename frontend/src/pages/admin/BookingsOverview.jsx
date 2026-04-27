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
  TablePagination,
  Chip,
  Button 
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Search from '@mui/icons-material/Search';
import Visibility from '@mui/icons-material/Visibility';
import api from '../../api/axios';

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];
const statusColor = { pending: 'warning', confirmed: 'success', rejected: 'error', cancelled: 'default', completed: 'success' };

export default function BookingsOverview() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    api.get('admin/bookings')
      .then((res) => setBookings(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter(
    (b) =>
      !search ||
      (b.AdSpace?.title && b.AdSpace.title.toLowerCase().includes(search.toLowerCase())) ||
      (b.User?.email && b.User.email.toLowerCase().includes(search.toLowerCase())) ||
      (b.User?.name && b.User.name?.toLowerCase().includes(search.toLowerCase())) ||
      (b.status && b.status.toLowerCase().includes(search.toLowerCase()))
  );
  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ py: 2 }}>
      <Button component={Link} to="/admin" startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        Back to dashboard
      </Button>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Bookings Overview
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        View all bookings. Search by ad space, advertiser, or status.
      </Typography>

      <TextField
        size="small"
        placeholder="Search bookings..."
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
              <TableCell sx={{ fontWeight: 800 }}>Ad space</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Advertiser</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Dates</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7}>Loading…</TableCell></TableRow>
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={7}>No bookings found.</TableCell></TableRow>
            ) : (
              paged.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.id}</TableCell>
                  <TableCell>{b.AdSpace?.title || '—'}</TableCell>
                  <TableCell>{b.User?.email || b.User?.name || '—'}</TableCell>
                  <TableCell>{b.startDate} – {b.endDate}</TableCell>
                  <TableCell>₹{Number(b.totalAmount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip size="small" label={b.status} color={statusColor[b.status] || 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" component={Link} to={`/ad-space/${b.adSpaceId}`} startIcon={<Visibility />}>
                      View space
                    </Button>
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
    </Box>
  );
}
