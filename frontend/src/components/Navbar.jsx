import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Container,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import InsightsIcon from '@mui/icons-material/Insights';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const CURRENCIES = [
  { code: 'LKR', label: 'LKR (Rs.)', symbol: 'Rs.' },
  { code: 'USD', label: 'USD ($)', symbol: '$' },
  { code: 'EUR', label: 'EUR (€)', symbol: '€' },
  { code: 'GBP', label: 'GBP (£)', symbol: '£' },
  { code: 'JPY', label: 'JPY (¥)', symbol: '¥' },
];

export default function Navbar({
  activeTab = 0,
  onTabChange,
  selectedCurrency = 'LKR',
  onCurrencyChange,
  apiStatus = 'online', // 'online' | 'offline' | 'checking'
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* Logo & Branding */}
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #00E5FF 0%, #0077B6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 18px rgba(0, 229, 255, 0.35)',
              }}
            >
              <DirectionsCarFilledIcon sx={{ color: '#031024', fontSize: 26 }} />
            </Box>
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(90deg, #FFFFFF 30%, #00E5FF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2,
                  }}
                >
                  AutoValuate AI
                </Typography>
                <Chip
                  label="PRO ML"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    backgroundColor: 'rgba(0, 229, 255, 0.15)',
                    color: '#00E5FF',
                    border: '1px solid rgba(0, 229, 255, 0.3)',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                Sri Lankan Vehicle Valuation & Market Predictor
              </Typography>
            </Box>
          </Box>

          {/* Desktop Navigation Tabs */}
          {!isMobile && (
            <Tabs
              value={activeTab}
              onChange={(e, val) => onTabChange && onTabChange(val)}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 48,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#94A3B8',
                  '&.Mui-selected': {
                    color: '#00E5FF',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#00E5FF',
                  height: 3,
                  borderRadius: 2,
                  boxShadow: '0 0 12px #00E5FF',
                },
              }}
            >
              <Tab icon={<SpeedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Valuation Predictor" />
              <Tab icon={<InsightsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Market Intelligence" />
              <Tab icon={<CompareArrowsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Compare Cars" />
            </Tabs>
          )}

          {/* Controls: Currency Toggle & API Health Pill */}
          <Box display="flex" alignItems="center" gap={1.5}>
            {/* Currency Selector */}
            <Box display="flex" alignItems="center" gap={0.8}>
              <CurrencyExchangeIcon sx={{ color: '#00E5FF', fontSize: 20, display: { xs: 'none', sm: 'block' } }} />
              <FormControl size="small">
                <Select
                  value={selectedCurrency}
                  onChange={(e) => onCurrencyChange && onCurrencyChange(e.target.value)}
                  sx={{
                    height: 36,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#F8FAFC',
                    backgroundColor: 'rgba(19, 28, 46, 0.9)',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 229, 255, 0.25)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00E5FF',
                    },
                  }}
                >
                  {CURRENCIES.map((curr) => (
                    <MenuItem key={curr.code} value={curr.code} sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {curr.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* API Status Badge */}
            <Tooltip title={apiStatus === 'online' ? 'All Microservices Operational (Port 5000 & 8000)' : 'Connecting to API Gateway...'}>
              <Chip
                icon={
                  apiStatus === 'online' ? (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#22C55E',
                        ml: 1,
                      }}
                      className="pulsing-status"
                    />
                  ) : (
                    <WarningAmberIcon sx={{ fontSize: '14px !important', color: '#F59E0B' }} />
                  )
                }
                label={apiStatus === 'online' ? 'Live ML API' : 'Reconnecting...'}
                size="small"
                sx={{
                  backgroundColor: apiStatus === 'online' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: apiStatus === 'online' ? '#4ADE80' : '#FBBF24',
                  border: `1px solid ${apiStatus === 'online' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  display: { xs: 'none', sm: 'flex' },
                }}
              />
            </Tooltip>
          </Box>
        </Toolbar>

        {/* Mobile Navigation Tabs */}
        {isMobile && (
          <Tabs
            value={activeTab}
            onChange={(e, val) => onTabChange && onTabChange(val)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              '& .MuiTab-root': {
                minHeight: 44,
                fontSize: '0.8rem',
                fontWeight: 600,
              },
            }}
          >
            <Tab icon={<SpeedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Predictor" />
            <Tab icon={<InsightsIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Intelligence" />
            <Tab icon={<CompareArrowsIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Compare" />
          </Tabs>
        )}
      </Container>
    </AppBar>
  );
}
