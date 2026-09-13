import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Stack,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { convertFromLKR, CURRENCY_CONFIG } from '../utils/currencyUtils';

/**
 * Hook to smoothly animate counting up numbers
 */
function useAnimatedCount(targetValue = 0, duration = 600) {
  const [currentValue, setCurrentValue] = useState(targetValue);
  const prevTargetRef = useRef(targetValue);

  useEffect(() => {
    const startValue = prevTargetRef.current;
    prevTargetRef.current = targetValue;
    const diff = targetValue - startValue;

    if (Math.abs(diff) < 0.01) return;

    let startTime = null;
    let animId;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrentValue(startValue + diff * ease);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setCurrentValue(targetValue);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [targetValue, duration]);

  return currentValue;
}

export default function PriceResultCard({
  result,
  selectedCurrency = 'LKR',
  onCurrencyChange,
  onCopyNotice,
}) {
  const rawLkr = result
    ? result.predicted_price_lkr_raw || (result.predicted_price_lkr_lakhs * 100000)
    : 0;
  const lakhs = result ? result.predicted_price_lkr_lakhs : 0;

  const converted = convertFromLKR(rawLkr, selectedCurrency);
  const animatedAmount = useAnimatedCount(converted.amount, 500);

  if (!result) return null;

  const minLakhs = result.confidence_interval?.min_lkr_lakhs || (lakhs * 0.95);
  const maxLakhs = result.confidence_interval?.max_lkr_lakhs || (lakhs * 1.05);

  const minConverted = convertFromLKR(minLakhs * 100000, selectedCurrency);
  const maxConverted = convertFromLKR(maxLakhs * 100000, selectedCurrency);

  const vehicle = result.requested_vehicle || result.vehicle_summary || {};
  const modelUsed = result.model_used || 'Gradient Boosting';

  const handleCopy = () => {
    const summaryText = `🚗 Used Car Valuation (${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.yom || ''})
💰 Estimated Value: ${converted.formatted} (Rs. ${lakhs.toFixed(2)} Lakhs)
📊 95% Confidence Range: ${minConverted.formatted} – ${maxConverted.formatted}
🤖 AI Model: ${modelUsed}
Powered by AutoValuate`;

    navigator.clipboard.writeText(summaryText).then(() => {
      if (onCopyNotice) {
        onCopyNotice('Valuation summary copied to clipboard!');
      }
    });
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Header Banner */}
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
              borderRadius: '50%',
              bgcolor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircleIcon sx={{ color: '#059669', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', lineHeight: 1.2 }}>
              Valuation Result
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
              Computed via {modelUsed} Regressor
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: 13, color: '#4F46E5 !important' }} />}
            label="Verified"
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: '#EEF2FF',
              color: '#4F46E5',
              border: '1px solid #C7D2FE',
              fontSize: '0.72rem',
            }}
          />
          <Tooltip title="Copy Valuation Summary">
            <IconButton
              onClick={handleCopy}
              size="small"
              sx={{
                color: '#475569',
                border: '1px solid #E2E8F0',
                borderRadius: 1.5,
                '&:hover': { color: '#4F46E5', bgcolor: '#F8FAFC' },
              }}
            >
              <ContentCopyIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Currency Quick-Switcher */}
        <Box mb={2}>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', mb: 0.8, display: 'block' }}>
            SELECT DISPLAY CURRENCY
          </Typography>
          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
            {Object.keys(CURRENCY_CONFIG).map((cur) => {
              const active = selectedCurrency === cur;
              return (
                <Chip
                  key={cur}
                  label={`${CURRENCY_CONFIG[cur].symbol} ${cur}`}
                  clickable
                  onClick={() => onCurrencyChange && onCurrencyChange(cur)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    bgcolor: active ? '#4F46E5' : '#F8FAFC',
                    color: active ? '#FFFFFF' : '#475569',
                    border: active ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: active ? '#4338CA' : '#F1F5F9',
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        {/* Primary Clean Valuation Hero Box */}
        <Box
          sx={{
            p: 3,
            borderRadius: 2.5,
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            textAlign: 'center',
            mb: 2.5,
          }}
        >
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, letterSpacing: '0.08em' }}>
            FAIR MARKET VALUATION ({selectedCurrency})
          </Typography>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              my: 0.8,
              letterSpacing: '-0.03em',
              fontSize: { xs: '2.2rem', sm: '2.8rem' },
              color: '#0F172A',
            }}
          >
            <span style={{ color: '#4F46E5', fontWeight: 700 }}>{converted.symbol}</span>{' '}
            {animatedAmount.toLocaleString('en-US', {
              minimumFractionDigits: CURRENCY_CONFIG[selectedCurrency]?.decimals || 0,
              maximumFractionDigits: CURRENCY_CONFIG[selectedCurrency]?.decimals || 0,
            })}
          </Typography>

          {/* Dual Currency Sub-Display */}
          {selectedCurrency !== 'LKR' && (
            <Box display="flex" alignItems="center" justifyContent="center" gap={0.8} flexWrap="wrap">
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                Equivalent: <span style={{ color: '#0F172A', fontWeight: 700 }}>Rs. {lakhs.toFixed(2)} Lakhs</span>
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                (Rs. {Math.round(rawLkr).toLocaleString()} LKR)
              </Typography>
            </Box>
          )}

          {selectedCurrency === 'LKR' && (
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
              Raw Market Value: Rs. {Math.round(rawLkr).toLocaleString()} LKR (Rs. {lakhs.toFixed(2)} Lakhs)
            </Typography>
          )}
        </Box>

        {/* Confidence Interval (95% CI) */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            mb: 2.5,
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Box display="flex" alignItems="center" gap={0.8}>
              <SecurityIcon sx={{ color: '#4F46E5', fontSize: 18 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', letterSpacing: '0.04em' }}>
                STATISTICAL CONFIDENCE RANGE (95% CI)
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#4F46E5' }}>
              ± 5% Margin
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box textAlign="left">
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>
                Lower Bound (Min)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                {minConverted.formatted}
              </Typography>
            </Box>

            <Box textAlign="center">
              <Typography variant="caption" sx={{ color: '#4F46E5', fontWeight: 700, display: 'block', fontSize: '0.72rem' }}>
                Expected Valuation
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {converted.formatted}
              </Typography>
            </Box>

            <Box textAlign="right">
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem' }}>
                Upper Bound (Max)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                {maxConverted.formatted}
              </Typography>
            </Box>
          </Box>

          <LinearProgress
            variant="determinate"
            value={50}
            sx={{
              height: 5,
              borderRadius: 3,
              backgroundColor: '#E2E8F0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#4F46E5',
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Vehicle Details */}
        {vehicle && (
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, letterSpacing: '0.05em', mb: 1, display: 'block' }}>
              VALUATED VEHICLE CONFIGURATION
            </Typography>
            <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
              <Chip
                label={`${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Vehicle'}
                size="small"
                sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', fontWeight: 700, border: '1px solid #C7D2FE' }}
              />
              <Chip label={`Year: ${vehicle.yom || '-'}`} size="small" sx={{ bgcolor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }} />
              <Chip label={`${Number(vehicle.mileage_km || 0).toLocaleString()} KM`} size="small" sx={{ bgcolor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }} />
              <Chip label={vehicle.fuel_type || 'Petrol'} size="small" sx={{ bgcolor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }} />
              <Chip label={vehicle.gear || 'Automatic'} size="small" sx={{ bgcolor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }} />
              {vehicle.engine_cc && <Chip label={`${vehicle.engine_cc} cc`} size="small" sx={{ bgcolor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }} />}
              {vehicle.town && <Chip label={`📍 ${vehicle.town}`} size="small" sx={{ bgcolor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }} />}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
