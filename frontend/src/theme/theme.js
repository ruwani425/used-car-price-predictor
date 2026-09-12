import { createTheme } from '@mui/material/styles';

/**
 * Modern Dark Luxury Automotive Theme for AutoValuate AI.
 * Palette inspired by carbon fibre, electric cyan highlights, and gold asset valuation accents.
 */
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00E5FF', // Electric Cyan
      light: '#6EFFFF',
      dark: '#00B4D8',
      contrastText: '#0A1128',
    },
    secondary: {
      main: '#FFB703', // Amber Gold (Valuation & Price badge)
      light: '#FFD166',
      dark: '#FB8500',
      contrastText: '#0A1128',
    },
    background: {
      default: '#0B0F19', // Deep Midnight Navy
      paper: '#131C2E',   // Glassmorphism Card Surface
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    action: {
      hover: 'rgba(0, 229, 255, 0.08)',
      selected: 'rgba(0, 229, 255, 0.16)',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.025em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.015em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 22px',
          fontWeight: 600,
          fontSize: '0.95rem',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00E5FF 0%, #0077B6 100%)',
          color: '#031024',
          boxShadow: '0 4px 20px rgba(0, 229, 255, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #33E9FF 0%, #0096C7 100%)',
            boxShadow: '0 6px 28px rgba(0, 229, 255, 0.5)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, rgba(19, 28, 46, 0.85) 0%, rgba(13, 20, 36, 0.95) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: 'rgba(11, 15, 25, 0.6)',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 229, 255, 0.4)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#00E5FF',
            boxShadow: '0 0 0 3px rgba(0, 229, 255, 0.15)',
          },
        },
        notchedOutline: {
          borderColor: 'rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
  },
});
