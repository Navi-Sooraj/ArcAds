import { Box } from '@mui/material';

export default function MarketplaceLayout({ children }) {
  return (
    <Box sx={{ width: '100%', minHeight: '100%' }}>
      {children}
    </Box>
  );
}
