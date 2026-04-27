import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
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
  Stack,
  Divider,
} from "@mui/material";
import People from "@mui/icons-material/People";
import Place from "@mui/icons-material/Place";
import EventNote from "@mui/icons-material/EventNote";
import CampaignIcon from "@mui/icons-material/Campaign";
import ViewQuilt from "@mui/icons-material/ViewQuilt";
import Store from "@mui/icons-material/Store";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import dayjs from "dayjs";
import PageHeading from "../../components/PageHeading";

export default function AdminDashboardHome() {
  useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get("admin/dashboard")
      .then((res) => {
        if (res.data.success) setStats(res.data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <Box sx={{ py: 2 }}>
      <PageHeading
        title="Admin Dashboard"
      />

      {stats && (
        <>
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {[
              {
                label: 'Ad Services',
                value: stats.adServicesCount,
                icon: <ViewQuilt sx={{ fontSize: '1.8rem' }} />,
                color: (theme) => theme.palette.info.main,
                bgcolor: (theme) => `${theme.palette.info.main}15`,
                path: "/admin/ad-center",
                state: { tab: 0 }
              },
              {
                label: 'Service Bookings',
                value: stats.confirmedAdServiceBookingsCount,
                pending: stats.pendingAdServiceBookingsCount,
                icon: <CampaignIcon sx={{ fontSize: '1.8rem' }} />,
                color: (theme) => theme.palette.primary.main,
                bgcolor: (theme) => `${theme.palette.primary.main}15`,
                path: "/admin/ad-center",
                state: { tab: 1 }
              },
              {
                label: 'Advertisers',
                value: stats.advertisersCount,
                icon: <People sx={{ fontSize: '1.8rem' }} />,
                color: (theme) => theme.palette.secondary.main,
                bgcolor: (theme) => `${theme.palette.secondary.main}15`,
                path: "/admin/users"
              },
              {
                label: 'Vendors',
                value: stats.verifiedVendorsCount,
                pending: stats.pendingVendorsCount,
                icon: <Store sx={{ fontSize: '1.8rem' }} />,
                color: (theme) => theme.palette.success.main,
                bgcolor: (theme) => `${theme.palette.success.main}15`,
                path: "/admin/vendor-management"
              },
              {
                label: 'Ad Spaces',
                value: stats.verifiedAdSpacesCount,
                pending: stats.pendingAdSpacesCount,
                icon: <Place sx={{ fontSize: '1.8rem' }} />,
                color: (theme) => theme.palette.warning.main,
                bgcolor: (theme) => `${theme.palette.warning.main}15`,
                path: "/admin/adspaces"
              },
              {
                label: 'Local Bookings',
                value: stats.confirmedBookingsCount,
                pending: stats.pendingBookingsCount,
                icon: <EventNote sx={{ fontSize: '1.8rem' }} />,
                color: (theme) => theme.palette.error.main,
                bgcolor: (theme) => `${theme.palette.error.main}15`,
                path: "/admin/bookings"
              },
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Link to={stat.path} state={stat.state} style={{ textDecoration: "none" }}>
                  <Card sx={{
                    height: '100%',
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
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
                            {stat.value}
                          </Typography>
                          {stat.pending > 0 && (
                            <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 800, mt: 0.5, display: 'block', letterSpacing: 0.5 }}>
                              {stat.pending} PENDING
                            </Typography>
                          )}
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
                </Link>
              </Grid>
            ))}
          </Grid>
      

        <Box sx={{ mt: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CampaignIcon color="primary" /> Ad Service Inquiries
            </Typography>
            <Button 
              component={Link} 
              to="/admin/ad-center" 
              state={{ tab: 1 }}
              variant="outlined" 
              size="small"
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Manage All Inquiries
            </Button>
          </Stack>
          
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Advertiser</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Service</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Budget/Amount</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.recentInquiries && stats.recentInquiries.length > 0 ? (
                  <>
                    {stats.recentInquiries.slice(0, 5).map((inq) => (
                      <TableRow key={inq.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell variant="body2" sx={{ fontWeight: 600 }}>
                          {dayjs(inq.createdAt).format('DD MMM YYYY')}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>{inq.User?.name || 'Unknown'}</Typography>
                          <Typography variant="caption" color="text.secondary">{inq.User?.email}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{inq.serviceTitle || 'N/A'}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>
                          ₹{Number(inq.totalAmount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={inq.status?.toUpperCase()} 
                            size="small" 
                            color={
                              inq.status === 'confirmed' || inq.status === 'completed' ? 'success' : 
                              inq.status === 'pending' ? 'warning' : 'error'
                            }
                            sx={{ fontWeight: 800, borderRadius: 1.5, fontSize: '0.65rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {stats.recentInquiries.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 1.5, bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                            + {stats.recentInquiries.length - 5} MORE INQUIRIES AWAITING REVIEW
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        No recent inquiries found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          </Box>
        </>
      )}
    </Box>
  );
}
