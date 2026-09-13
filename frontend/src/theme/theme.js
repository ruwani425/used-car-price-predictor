import { createTheme } from '@mui/material/styles';

/**
 * Modern Minimalist Light SaaS Theme (Blue & White) for AutoValuate.
 * Inspired by clean Dribbble product dashboards: Crisp white cards, 
 * slate-900 typography, subtle 1px slate-200 borders, and royal indigo accents.
 */
export const darkTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4F46E5', // Royal Indigo / Blue
      light: '#6366F1',
      dark: '#4338CA',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0284C7', // Sky / Cyan Accent
      light: '#38BDF8',
      dark: '#0369A1',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC', // Slate 50 Soft Clean Canvas
      paper: '#FFFFFF',   // Pure White Surface
    },
    text: {
      primary: '#0F172A',   // Slate 900 Crisp Black
      secondary: '#475569', // Slate 600 Subtle Gray
    },
    divider: '#E2E8F0',     // Slate 200 Clean Border
    action: {
      hover: '#F1F5F9',
      selected: '#EEF2FF',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.025em', color: '#0F172A' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em', color: '#0F172A' },
    h3: { fontWeight: 700, letterSpacing: '-0.015em', color: '#0F172A' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em', color: '#0F172A' },
    h5: { fontWeight: 600, color: '#0F172A' },
    h6: { fontWeight: 600, color: '#0F172A' },
    subtitle1: { fontWeight: 500, color: '#475569' },
    subtitle2: { fontWeight: 500, color: '#64748B' },
    body1: { color: '#1E293B' },
    body2: { color: '#475569' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '9px 20px',
          fontWeight: 600,
          fontSize: '0.9rem',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
            transform: 'translateY(-1px)',
          },
        },
        containedPrimary: {
          backgroundColor: '#4F46E5',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#4338CA',
          },
        },
        outlinedPrimary: {
          borderColor: '#CBD5E1',
          color: '#1E293B',
          '&:hover': {
            borderColor: '#4F46E5',
            backgroundColor: '#F8FAFC',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            borderColor: '#CBD5E1',
            boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94A3B8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#4F46E5',
            borderWidth: '1.5px',
            boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.12)',
          },
        },
        notchedOutline: {
          borderColor: '#E2E8F0',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#64748B',
          fontWeight: 500,
          '&.Mui-focused': {
            color: '#4F46E5',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
          backgroundColor: '#F1F5F9',
          color: '#1E293B',
          border: '1px solid #E2E8F0',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F8FAFC',
          '& .MuiTableCell-head': {
            color: '#475569',
            fontWeight: 700,
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid #E2E8F0',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #F1F5F9',
          color: '#1E293B',
        },
      },
    },
  },
});
