import { Box, Typography } from '@mui/material';

/**
 * Consistent page heading for dashboard and management pages.
 * Use at the top of every page that has the sidebar.
 */
export default function PageHeading({ title, subtitle, action }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" variant="body1">
          {subtitle}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
