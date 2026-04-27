import { Box, Container, Typography, Grid, Stack, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import Campaign from '@mui/icons-material/Campaign';
import Storefront from '@mui/icons-material/Storefront';
import People from '@mui/icons-material/People';
import logo from '../assets/logo.png';

export default function AboutUs() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Hero */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          px: 2,
          textAlign: 'center',
          background: (theme) =>
            `linear-gradient(160deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
        }}
      >
        <Container maxWidth="md">
          
          {/* ------------------ About + Logo + Name ------------------ */}
          <Box 
            sx={{ fontSize: '20px', mb: 1, color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          > 
                
            <Typography sx={{ fontSize: '2em', fontWeight: 600, lineHeight: 1, mr: '0.2em' }}>
              About
            </Typography>

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

          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, maxWidth: 640, mx: 'auto' }}>
            Our mission is to streamline the advertising economy by providing exclusive, partner-managed inventory through our direct collaborations. We further enhance this by digitalizing local ad spaces, making them transparent and accessible for every brand.          </Typography>
        </Container>
      </Box>

      {/* Mission */}
      <Box sx={{ py: { xs: 6, md: 10 }, px: 2 }}>
        <Container maxWidth="md">
          <Typography variant="h4" fontWeight="bold" color="primary" align="center" gutterBottom>
            Our Mission
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
            ArcAds bridges the gap between local advertisers and space owners. Whether you own a billboard on a busy street or are a brand looking to reach local audiences, we make the connection simple, fast, and trustworthy.
          </Typography>
        </Container>
      </Box>

      <Divider />

      {/* Values */}
      <Box sx={{ py: { xs: 6, md: 10 }, px: 2, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight="bold" color="primary" align="center" gutterBottom>
            What We Stand For
          </Typography>
          <Grid container spacing={4} justifyContent="center" sx={{ mt: 2 }}>
            {[
              {
                Icon: Storefront,
                title: 'Transparency',
                desc: 'No hidden fees, no surprises. All pricing and availability is clearly listed so both parties always know what they are getting.',
              },
              {
                Icon: Campaign,
                title: 'Empowering Local Reach',
                desc: 'We believe local businesses deserve powerful advertising tools. ArcAds puts professional outdoor ad management in everyone\'s hands.',
              },
              {
                Icon: People,
                title: 'Community First',
                desc: 'We build trust between advertisers and space owners with verified listings, clear contracts, and dedicated support.',
              },
            ].map(({ Icon, title, desc }) => (
              <Grid item xs={12} md={4} key={title}>
                <Stack alignItems="center" textAlign="center" spacing={2}>
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: 2,
                      bgcolor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon sx={{ fontSize: 40, color: 'primary.contrastText' }} />
                  </Box>
                  <Typography variant="h6" fontWeight={600}>{title}</Typography>
                  <Typography variant="body2" color="text.secondary">{desc}</Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Contact callout */}
      <Box sx={{ py: { xs: 6, md: 8 }, px: 2, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>
            Get in Touch
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            Have questions or want to partner with us?
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            <a href="mailto:hello@arcads.com" style={{ color: 'inherit' }}>hello@arcads.com</a>
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
