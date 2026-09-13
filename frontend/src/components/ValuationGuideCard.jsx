import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import InsightsIcon from '@mui/icons-material/Insights';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DirectionsCarFilledIcon from '@mui/icons-material/DirectionsCarFilled';

const SAMPLE_PRESETS = [
  {
    name: 'Toyota Axio Hybrid',
    badge: 'Popular Sedan',
    data: {
      brand: 'TOYOTA',
      model: 'AXIO',
      yom: 2017,
      engine_cc: 1500,
      gear: 'Automatic',
      fuel_type: 'Hybrid',
      mileage_km: 75000,
      town: 'Colombo',
      condition: 'USED',
      leasing: 'No Leasing',
      air_condition: true,
      power_steering: true,
      power_mirror: true,
      power_window: true,
    },
  },
  {
    name: 'Suzuki Wagon R FX',
    badge: 'Fuel Efficient',
    data: {
      brand: 'SUZUKI',
      model: 'WAGON R',
      yom: 2018,
      engine_cc: 660,
      gear: 'Automatic',
      fuel_type: 'Hybrid',
      mileage_km: 55000,
      town: 'Gampaha',
      condition: 'USED',
      leasing: 'No Leasing',
      air_condition: true,
      power_steering: true,
      power_mirror: true,
      power_window: true,
    },
  },
  {
    name: 'Honda Vezel Hybrid',
    badge: 'Top SUV',
    data: {
      brand: 'HONDA',
      model: 'VEZEL',
      yom: 2016,
      engine_cc: 1500,
      gear: 'Automatic',
      fuel_type: 'Hybrid',
      mileage_km: 85000,
      town: 'Kandy',
      condition: 'USED',
      leasing: 'No Leasing',
      air_condition: true,
      power_steering: true,
      power_mirror: true,
      power_window: true,
    },
  },
];

export default function ValuationGuideCard({ selectedCurrency = 'LKR', onSelectPreset }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        backgroundColor: '#FFFFFF',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.2}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              backgroundColor: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <InsightsIcon sx={{ color: '#4F46E5', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
              Valuation & Market Intelligence
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem' }}>
              Real-time machine learning prediction engine
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<CurrencyExchangeIcon sx={{ fontSize: '13px !important', color: '#059669' }} />}
          label={`Live ${selectedCurrency} Conversion`}
          size="small"
          sx={{
            backgroundColor: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #A7F3D0',
            fontWeight: 700,
            fontSize: '0.72rem',
          }}
        />
      </Box>

      {/* Body Content */}
      <CardContent sx={{ p: { xs: 2.5, sm: 3 }, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Quick-Start Presets */}
        <Box>
          <Typography
            variant="caption"
            sx={{ color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', mb: 1, display: 'block' }}
          >
            QUICK PRESETS (1-CLICK FILL & TEST)
          </Typography>
          <Box display="flex" flexDirection="column" gap={1.2}>
            {SAMPLE_PRESETS.map((preset) => (
              <Box
                key={preset.name}
                onClick={() => onSelectPreset && onSelectPreset(preset.data)}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    backgroundColor: '#EEF2FF',
                    borderColor: '#C7D2FE',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={1.2}>
                  <DirectionsCarFilledIcon sx={{ color: '#4F46E5', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
                      {preset.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
                      {preset.data.yom} · {preset.data.fuel_type} · {preset.data.mileage_km.toLocaleString()} KM · {preset.data.town}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={preset.badge}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    border: '1px solid #CBD5E1',
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        <Divider />

        {/* AI Valuation Pillars */}
        <Box>
          <Typography
            variant="caption"
            sx={{ color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', mb: 1.2, display: 'block' }}
          >
            HOW AUTOVALUATE CALCULATES FAIR MARKET VALUE
          </Typography>

          <Box display="flex" flexDirection="column" gap={1.5}>
            <Box display="flex" alignItems="flex-start" gap={1.2}>
              <CheckCircleIcon sx={{ color: '#4F46E5', fontSize: 18, mt: 0.2 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.84rem' }}>
                  Authentic Sri Lankan Market Pricing
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.4, display: 'block' }}>
                  Derived from thousands of verified used car sales and listings across all districts and towns.
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="flex-start" gap={1.2}>
              <TrendingUpIcon sx={{ color: '#4F46E5', fontSize: 18, mt: 0.2 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.84rem' }}>
                  5-Year Future Value & Depreciation Trends
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.4, display: 'block' }}>
                  Projects how your car value holds up year over year to help you time buying or selling.
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="flex-start" gap={1.2}>
              <SecurityIcon sx={{ color: '#4F46E5', fontSize: 18, mt: 0.2 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.84rem' }}>
                  Fair Negotiation Price Window
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.4, display: 'block' }}>
                  Provides expected low and high market pricing bounds to help with realistic negotiations.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Footer info box */}
        <Box
          sx={{
            mt: 'auto',
            p: 1.5,
            borderRadius: 2,
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <AutoAwesomeIcon sx={{ color: '#4F46E5', fontSize: 18 }} />
          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
            Fill the vehicle specifications on the left and click <b>Calculate Fair Market Valuation</b> to see instant live results.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
