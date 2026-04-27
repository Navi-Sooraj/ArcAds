import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonAdd from '@mui/icons-material/PersonAdd';
import AddBusiness from '@mui/icons-material/AddBusiness';
import Campaign from '@mui/icons-material/Campaign';
import logo from '../assets/logo.png';

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('advertiser');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('auth/signup', { email, password, name, phone, role });
      if (data.success && data.user) {
        if (data.pendingApproval) {
          setSuccessMessage('Registration successful. You can sign in after an admin approves your account.');
          return;
        }
        login(data.user);
        if (data.user.role === 'space_owner') navigate('/owner');
        else navigate('/advertiser');
      } else setError(data.message || 'Signup failed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          position: 'relative',
          zIndex: 1,
        }}
      >
      {/* Left panel - branding + project visuals */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '48%',
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          justifyContent: 'center',
          px: 6,
          background: `rgba(11, 14, 20, 0.4)`,
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          
          {/* ------------------ Logo + Name ------------------ */}
          <Box 
            component={Link}
            to="/"
            sx={{ fontSize: '18px', color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'flex-end'}}> 
                
            <Box
              component="img"
              src={logo}
              alt="ArcAds"
              sx={{
                height: '2.25em',      
                padding: '0.25em', 
                width: 'auto',
                display: 'block',
                mr: '-0.2em', 
              }}
            />
            
            <Typography sx={{ fontSize: '2em', fontWeight: 600, letterSpacing: -1, lineHeight: 1 }}>
              rcAds 
            </Typography>
            
          </Box>
          {/* ------------------------------------------------- */}

          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            sx={{
              opacity: 0,
              animation: 'slideUp 0.6s ease-out 0.2s forwards',
              '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
            }}
          >
            Join ArcAds today
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.95, mb: 4, maxWidth: 360 }}>
            Register as a <strong>Consumer</strong> to book ad spaces, or as a <strong>Renter</strong> to list your ad space (account active after admin approval).
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              opacity: 0,
              animation: 'fadeIn 0.6s ease-out 0.5s forwards',
              '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
            }}
          >
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Campaign sx={{ fontSize: 28 }} />
              <Typography variant="body2" fontWeight="600">Consumer</Typography>
            </Box>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddBusiness sx={{ fontSize: 28 }} />
              <Typography variant="body2" fontWeight="600">Renter</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right panel - form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 4 },
          minHeight: { xs: '100vh', md: 'auto' },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 440,
            opacity: 0,
            animation: 'scaleIn 0.5s ease-out 0.2s forwards',
            '@keyframes scaleIn': { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
          }}
        >
          {isMobile && (
            <Typography component={Link} to="/" variant="h6" fontWeight="bold" color="primary" sx={{ textDecoration: 'none', display: 'inline-block', mb: 3 }}>
              ArcAds
            </Typography>
          )}
          <Box
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 4,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom color="white">
              Create account
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}>
              Create an account. Fields match your profile: name, email, phone, password, and account type.
            </Typography>
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
                {successMessage}
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                margin="normal"
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                margin="normal"
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                margin="normal"
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                margin="normal"
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" aria-label="toggle password">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                margin="normal"
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                error={!!confirmPassword && password !== confirmPassword}
                helperText={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
              />
              <FormControl fullWidth margin="normal" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                <InputLabel>User type</InputLabel>
                <Select value={role} label="User type" onChange={(e) => setRole(e.target.value)}>
                  <MenuItem value="advertiser">Consumer</MenuItem>
                  <MenuItem value="space_owner">Renter</MenuItem>
                </Select>
              </FormControl>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
                sx={{
                  mt: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(0, 121, 107, 0.35)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 6px 20px rgba(0, 121, 107, 0.4)' },
                }}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
            <Typography sx={{ mt: 3, textAlign: 'center' }} variant="body2" color="rgba(255,255,255,0.7)">
              Already have an account?{' '}
              <Typography component={Link} to="/login" color="secondary.light" fontWeight="600" sx={{ textDecoration: 'none' }}>
                Sign in
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Box>
      </Box>
    </Box>
  );
}
