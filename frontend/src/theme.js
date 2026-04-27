/**
 * Material UI theme for ArcAds.
 */
import { createTheme } from '@mui/material/styles';

const baseThemeOptions = {
  typography: {
    fontFamily: '"Poppins", "Helvetica Neue", Helvetica, Arial, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
};

// Existing Light Theme (Teal/Greenish)
export const lightTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#00796b',
      light: '#48a999',
      dark: '#004d40',
      contrastText: '#fff',
    },
    secondary: {
      main: '#ff6f00',
      light: '#ff9e40',
      dark: '#c43e00',
      contrastText: '#fff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
});

// New User Dark Theme (Public Side)
export const userDarkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#0A84FF', // Electric Blue
      light: '#40A0FF',
      dark: '#0066CC',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF9F40', // Amber
      light: '#FFB870',
      dark: '#CC7A00',
      contrastText: '#fff',
    },
    background: {
      default: '#0B0E14', 
      paper: '#141921',   
    },
    text: {
      primary: '#F5F5F7',
      secondary: '#8E95A1',
    },
    divider: '#1F2631',
  },
  components: {
    ...baseThemeOptions.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#141921',
          border: '1px solid #1F2631',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
          },
        },
      },
    },
  },
});

// Admin Dark Theme (already exists, but kept for clarity)
export const adminDarkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#0A84FF', 
      light: '#40A0FF',
      dark: '#0066CC',
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF9F40', 
      light: '#FFB870',
      dark: '#CC7A00',
      contrastText: '#fff',
    },
    background: {
      default: '#0B0E14', 
      paper: '#141921',   
    },
    text: {
      primary: '#F5F5F7',
      secondary: '#8E95A1',
    },
    divider: '#1F2631',
  },
  components: {
    ...baseThemeOptions.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#141921',
          border: '1px solid #1F2631',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
          },
        },
      },
    },
  },
});

// Default export is the light theme for backward compatibility
export default lightTheme;
