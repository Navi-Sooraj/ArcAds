import { Card, CardContent, Typography, Box, Skeleton, Stack, Divider } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

/**
 * Premium Stat Card for Dashboards.
 * Displays a value, label, icon, and optional trend with a glassy aesthetic.
 * Supports 'isDual' mode to show multiple related stats.
 */
export default function StatCard({ label, value, icon, color, trend, loading, isDual, values, pendingValue }) {
  return (
    <Card 
      sx={{ 
        height: '100%',
        bgcolor: 'rgba(20, 25, 33, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: (theme) => `linear-gradient(90deg, ${color || theme.palette.primary.main}, transparent)`,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 3,
              bgcolor: (theme) => `${color || theme.palette.primary.main}15`,
              color: color || 'primary.main',
            }}
          >
            {icon}
          </Box>
          {trend && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5, 
                px: 1.2, 
                py: 0.5, 
                borderRadius: 50, 
                bgcolor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 14, color: 'success.main' }} />
              <Typography variant="caption" fontWeight={700} sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>
                {trend}
              </Typography>
            </Box>
          )}
        </Box>

        {loading ? (
          <Box sx={{ pt: 1 }}>
            <Skeleton variant="text" width="60%" height={32} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
          </Box>
        ) : isDual ? (
          <Stack spacing={2}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
              {label}
            </Typography>
            <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />}>
              {(values || []).map((v, i) => (
                <Box key={i} sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={800} sx={{ color: 'white', mb: 0.2 }}>
                    {v.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, display: 'block', fontSize: '0.65rem' }}>
                    {v.label}
                  </Typography>
                  {v.pending > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <HourglassEmptyIcon sx={{ fontSize: 10, color: 'warning.main' }} />
                      <Typography variant="caption" fontWeight={700} color="warning.main" sx={{ fontSize: '0.65rem' }}>
                        {v.pending} Pending
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          </Stack>
        ) : (
          <>
            <Typography variant="h4" fontWeight={800} sx={{ color: 'white', mb: 0.5, letterSpacing: -1 }}>
              {value}
            </Typography>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
                {label}
              </Typography>
              {pendingValue > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, bgcolor: 'warning.main', borderRadius: 1 }}>
                   <Typography variant="caption" fontWeight={900} sx={{ color: 'black', fontSize: '0.6rem' }}>
                    {pendingValue} PENDING
                  </Typography>
                </Box>
              )}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}
