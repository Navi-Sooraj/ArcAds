import { Box, Container, Grid, Typography, Stack, Divider, IconButton, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';
import Facebook from '@mui/icons-material/Facebook';
import Instagram from '@mui/icons-material/Instagram';
import LinkedIn from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import logo from '../assets/logo.png';

export default function Footer() {
  return (
    <Box component="footer" sx={{ mt: 'auto', px: 2, py: { xs: 5, md: 6 }, bgcolor: 'rgba(11, 14, 20, 0.4)', color: 'white' }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            mb: 3,
            p: { xs: 2.5, md: 3 },
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.18)',
            bgcolor: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(3px)',
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
                    {/* ------------------ Logo + Name ------------------ */}
          <Box 
            sx={{ fontSize: '13px', color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'flex-end', m: '0 0 .5em -.3em'}}> 
                
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

          <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 580, mx: { xs: 'auto', md: 0 } }}>
            Digitalizing the unorganized local advertising economy. Connect, list, and book ad spaces in one place.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                height: '100%',
                p: 2.5,
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.16)',
                bgcolor: 'rgba(255,255,255,0.05)',
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Product
              </Typography>
              <Stack spacing={0.8} alignItems={{ xs: 'center', md: 'flex-start' }}>
                <MuiLink component={Link} to="/ad-services" color="inherit" underline="hover" variant="body2">
                  Ad Services
                </MuiLink>
                <MuiLink component={Link} to="/marketplace" color="inherit" underline="hover" variant="body2">
                  Marketplace
                </MuiLink>
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box
              sx={{
                height: '100%',
                p: 2.5,
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.16)',
                bgcolor: 'rgba(255,255,255,0.05)',
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Company
              </Typography>
              <Stack spacing={0.8} alignItems={{ xs: 'center', md: 'flex-start' }}>
                <MuiLink component={Link} to="/about" color="inherit" underline="hover" variant="body2">
                  About Us
                </MuiLink>
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box
              sx={{
                height: '100%',
                p: 2.5,
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.16)',
                bgcolor: 'rgba(255,255,255,0.05)',
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Contact
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }} sx={{ mb: 1.5 }}>
                <EmailIcon fontSize="small" sx={{ opacity: 0.85 }} />
                <MuiLink href="mailto:hello@arcads.com" color="inherit" underline="hover" variant="body2">
                  hello@arcads.com
                </MuiLink>
              </Stack>

              <Stack direction="row" spacing={0.5} justifyContent={{ xs: 'center', md: 'flex-start' }}>
                <IconButton 
                  component="a" 
                  href="https://www.facebook.com/navi.sooraj/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small" 
                  sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }} 
                  aria-label="Facebook"
                >
                  <Facebook fontSize="small" />
                </IconButton>
                <IconButton 
                  component="a" 
                  href="https://www.instagram.com/n.av_i/#" 
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small" 
                  sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }} 
                  aria-label="Instagram"
                >
                  <Instagram fontSize="small" />
                </IconButton>
                <IconButton 
                  component="a" 
                  href="https://in.linkedin.com/in/navi-sooraj" 
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small" 
                  sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }} 
                  aria-label="LinkedIn"
                >
                  <LinkedIn fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 3 }} />
        <Typography variant="body2" align="center" sx={{ opacity: 0.75 }}>
          © {new Date().getFullYear()} ArcAds. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};
