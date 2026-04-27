import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Paper, Alert,
  Avatar, Chip, Divider, Stack, InputAdornment, IconButton,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import BadgeIcon from '@mui/icons-material/Badge';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const roleColors = {
  advertiser: 'primary',
  space_owner: 'success',
  admin: 'error',
};

const roleLabels = {
  advertiser: 'Advertiser',
  space_owner: 'Space Owner',
  admin: 'Admin',
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: 'info' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = () => {
    setMessage({ text: '', type: 'info' });
    setSaving(true);
    api.put('auth/profile', { name, phone })
      .then((res) => {
        if (res.data.success && res.data.user) {
          setMessage({ text: 'Profile updated successfully!', type: 'success' });
          updateUser(res.data.user);
        }
      })
      .catch(() => setMessage({ text: 'Update failed. Please try again.', type: 'error' }))
      .finally(() => setSaving(false));
  };

  const handleChangePassword = () => {
    setPasswordMessage({ text: '', type: 'info' });
    setChangingPassword(true);
    api.post('auth/change-password', { currentPassword, newPassword })
      .then((res) => {
        if (res.data.success) {
          setPasswordMessage({ text: res.data.message || 'Password updated successfully!', type: 'success' });
          setCurrentPassword('');
          setNewPassword('');
        }
      })
      .catch((err) =>
        setPasswordMessage({ text: err.response?.data?.message || 'Password update failed.', type: 'error' })
      )
      .finally(() => setChangingPassword(false));
  };

  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <Box sx={{ py: 4, px: 2, maxWidth: 600, mx: 'auto' }}>

      {/* Profile Header Card */}
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 3,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main}18 0%, ${theme.palette.primary.dark}10 100%)`,
          border: (theme) => `1.5px solid ${theme.palette.primary.main}30`,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
          <Avatar
            sx={{
              width: 88,
              height: 88,
              bgcolor: 'primary.main',
              fontSize: '2rem',
              fontWeight: 700,
              boxShadow: 3,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {name || 'Your Name'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {user?.email}
            </Typography>
            <Chip
              icon={<BadgeIcon sx={{ fontSize: 16 }} />}
              label={roleLabels[user?.role] || user?.role}
              color={roleColors[user?.role] || 'default'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Edit Profile Card */}
      <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <EditIcon color="primary" fontSize="small" />
          <Typography variant="h6" fontWeight={700}>Edit Profile</Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />

        {message.text && (
          <Alert severity={message.type} sx={{ mb: 2, borderRadius: 2 }}>
            {message.text}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Email address"
            value={user?.email || ''}
            disabled
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="disabled" fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={<SaveIcon />}
          sx={{ mt: 3, px: 3, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </Paper>

      {/* Change Password Card */}
      <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <LockIcon color="primary" fontSize="small" />
          <Typography variant="h6" fontWeight={700}>Change Password</Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />

        {passwordMessage.text && (
          <Alert severity={passwordMessage.type} sx={{ mb: 2, borderRadius: 2 }}>
            {passwordMessage.text}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Current password"
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowCurrent((p) => !p)} edge="end" size="small">
                    {showCurrent ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="New password"
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNew((p) => !p)} edge="end" size="small">
                    {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleChangePassword}
          disabled={changingPassword || !currentPassword || !newPassword}
          startIcon={<LockIcon />}
          sx={{ mt: 3, px: 3, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          {changingPassword ? 'Updating…' : 'Update Password'}
        </Button>
      </Paper>
    </Box>
  );
}
