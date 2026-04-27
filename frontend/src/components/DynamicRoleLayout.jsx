import { useAuth } from '../context/AuthContext';
import AdminLayout from './AdminLayout';
import OwnerLayout from './OwnerLayout';
import AdvertiserLayout from './AdvertiserLayout';
import { Box } from '@mui/material';

/**
 * DynamicRoleLayout wraps children with the appropriate sidebar layout
 * based on the current user's role.
 */
export default function DynamicRoleLayout({ children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Box sx={{ width: '100%', minHeight: '100%' }}>{children}</Box>;
  }

  if (user.role === 'admin') {
    return <AdminLayout>{children}</AdminLayout>;
  }

  if (user.role === 'space_owner') {
    return <OwnerLayout>{children}</OwnerLayout>;
  }

  if (user.role === 'advertiser') {
    return <AdvertiserLayout>{children}</AdvertiserLayout>;
  }

  return <Box sx={{ width: '100%', minHeight: '100%' }}>{children}</Box>;
}
