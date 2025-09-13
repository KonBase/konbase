import { createTheme } from '@mui/material/styles';

// KonBase Design System Colors
const konbaseColors = {
  blue: '#0c2e62', // Primary brand color
  cherry: '#d84165', // Secondary accent
  lightBlue: '#0fb4ea', // Info color
  yellow: '#fce771', // Warning/highlight
  black: '#171716', // Text primary
  white: '#e6e6dc', // Background light
  furry: '#a2779c', // Tertiary
  gzdacz: '#ea8000', // Helper/warning
};

export const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: konbaseColors.blue,
          light: '#3a5a8a',
          dark: '#081b3d',
          contrastText: '#ffffff',
        },
        secondary: {
          main: konbaseColors.cherry,
          light: '#e06680',
          dark: '#b72d4a',
          contrastText: '#ffffff',
        },
        error: {
          main: '#d32f2f',
          light: '#ef5350',
          dark: '#c62828',
        },
        warning: {
          main: konbaseColors.gzdacz,
          light: '#ff9800',
          dark: '#e65100',
        },
        info: {
          main: konbaseColors.lightBlue,
          light: '#4fc3f7',
          dark: '#0277bd',
        },
        success: {
          main: '#2e7d32',
          light: '#4caf50',
          dark: '#1b5e20',
        },
        background: {
          default: '#fafafa',
          paper: '#ffffff',
        },
        text: {
          primary: konbaseColors.black,
          secondary: 'rgba(23, 23, 22, 0.6)',
        },
        grey: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#4a7bb7',
          light: '#7ba3d4',
          dark: '#2d5aa0',
          contrastText: '#ffffff',
        },
        secondary: {
          main: konbaseColors.cherry,
          light: '#e06680',
          dark: '#b72d4a',
          contrastText: '#ffffff',
        },
        error: {
          main: '#f44336',
          light: '#e57373',
          dark: '#d32f2f',
        },
        warning: {
          main: konbaseColors.yellow,
          light: '#fff176',
          dark: '#f57c00',
        },
        info: {
          main: konbaseColors.lightBlue,
          light: '#4fc3f7',
          dark: '#0277bd',
        },
        success: {
          main: '#4caf50',
          light: '#81c784',
          dark: '#388e3c',
        },
        background: {
          default: '#121212',
          paper: '#1e1e1e',
        },
        text: {
          primary: '#ffffff',
          secondary: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          '&:hover': {
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(0,0,0,0.02)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          marginBottom: 2,
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.02)',
          },
        },
      },
    },
  },
});

export default theme;
