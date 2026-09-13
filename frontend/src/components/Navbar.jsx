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
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HistoryIcon from '@mui/icons-material/History';

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
  onOpenHistory,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 0.8 }}>
          {/* Logo & Branding */}
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                backgroundColor: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
              }}
            >
              <DirectionsCarFilledIcon sx={{ color: '#FFFFFF', fontSize: 22 }} />
            </Box>
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    letterSpacing: '-0.02em',
                    color: '#0F172A',
                    lineHeight: 1.2,
                  }}
                >
                  AutoValuate
                </Typography>
                <Chip
                  label="PRO ML"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    backgroundColor: '#EEF2FF',
                    color: '#4F46E5',
                    border: '1px solid #C7D2FE',
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748B', display: { xs: 'none', sm: 'block' }, fontSize: '0.75rem' }}>
                Sri Lankan Automotive Valuation & Intelligence
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
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#64748B',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    color: '#4F46E5',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#4F46E5',
                  height: 2.5,
                  borderRadius: 1,
                },
              }}
            >
              <Tab icon={<SpeedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Valuation Predictor" />
              <Tab icon={<InsightsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Market Intelligence" />
              <Tab icon={<CompareArrowsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Compare Cars" />
            </Tabs>
          )}

          {/* Controls: Currency Toggle & API Health Pill */}
          <Box display="flex" alignItems="center" gap={1.2}>
            {/* Currency Selector */}
            <Box display="flex" alignItems="center" gap={0.8}>
              <CurrencyExchangeIcon sx={{ color: '#64748B', fontSize: 18, display: { xs: 'none', sm: 'block' } }} />
              <FormControl size="small">
                <Select
                  value={selectedCurrency}
                  onChange={(e) => onCurrencyChange && onCurrencyChange(e.target.value)}
                  sx={{
                    height: 34,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    backgroundColor: '#F8FAFC',
                    borderRadius: 1.5,
                    border: '1px solid #E2E8F0',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    '&:hover': {
                      backgroundColor: '#F1F5F9',
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

            {/* History Toggle Button */}
            {onOpenHistory && (
              <Tooltip title="View Past Valuations">
                <IconButton
                  size="small"
                  onClick={onOpenHistory}
                  sx={{
                    color: '#475569',
                    border: '1px solid #E2E8F0',
                    borderRadius: 1.5,
                    p: 0.8,
                    '&:hover': { color: '#4F46E5', backgroundColor: '#F8FAFC' },
                  }}
                >
                  <HistoryIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}

            {/* API Status Badge */}
            <Tooltip title={apiStatus === 'online' ? 'All Microservices Operational' : 'Connecting to API Gateway...'}>
              <Chip
                icon={
                  apiStatus === 'online' ? (
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        ml: 1,
                      }}
                      className="pulsing-status"
                    />
                  ) : (
                    <WarningAmberIcon sx={{ fontSize: '13px !important', color: '#D97706' }} />
                  )
                }
                label={apiStatus === 'online' ? 'Live ML API' : 'Connecting...'}
                size="small"
                sx={{
                  backgroundColor: apiStatus === 'online' ? '#ECFDF5' : '#FFFBEB',
                  color: apiStatus === 'online' ? '#059669' : '#D97706',
                  border: `1px solid ${apiStatus === 'online' ? '#A7F3D0' : '#FDE68A'}`,
                  fontWeight: 600,
                  fontSize: '0.72rem',
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
              borderTop: '1px solid #E2E8F0',
              '& .MuiTab-root': {
                minHeight: 40,
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'none',
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
