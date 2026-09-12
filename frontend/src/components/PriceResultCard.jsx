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
function useAnimatedCount(targetValue = 0, duration = 800) {
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

  // Convert to active currency
  const converted = convertFromLKR(rawLkr, selectedCurrency);
  const animatedAmount = useAnimatedCount(converted.amount, 600);

  if (!result) return null;

  // Confidence interval values
  const minLakhs = result.confidence_interval?.min_lkr_lakhs || (lakhs * 0.95);
  const maxLakhs = result.confidence_interval?.max_lkr_lakhs || (lakhs * 1.05);

  const minConverted = convertFromLKR(minLakhs * 100000, selectedCurrency);
  const maxConverted = convertFromLKR(maxLakhs * 100000, selectedCurrency);

  const vehicle = result.requested_vehicle || result.vehicle_summary || {};
  const modelUsed = result.model_used || 'Gradient Boosting';

  // Copy valuation summary to clipboard
  const handleCopy = () => {
    const summaryText = `🚗 Used Car Valuation (${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.yom || ''})
💰 Estimated Value: ${converted.formatted} (Rs. ${lakhs.toFixed(2)} Lakhs)
📊 95% Confidence Range: ${minConverted.formatted} – ${maxConverted.formatted}
🤖 AI Model: ${modelUsed}
Powered by AutoValuate AI`;

    navigator.clipboard.writeText(summaryText).then(() => {
      if (onCopyNotice) {
        onCopyNotice('Valuation summary copied to clipboard!');
      }
    });
  };

  return (
    <Card
      className="glass-panel form-card-enter glow-cyan"
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid rgba(0, 229, 255, 0.3)',
      }}
    >
      {/* Header Banner */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.18) 0%, rgba(19, 28, 46, 0.9) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          p: { xs: 2.5, sm: 3 },
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
              width: 38,
              height: 38,
              borderRadius: '50%',
              bgcolor: 'rgba(0, 229, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircleIcon sx={{ color: '#00E5FF', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
              Valuation Result
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Verified by {modelUsed} Regressor
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: 14, color: '#FFB703 !important' }} />}
            label="AI Verified"
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: 'rgba(255, 183, 3, 0.15)',
              color: '#FFB703',
              border: '1px solid rgba(255, 183, 3, 0.3)',
            }}
          />
          <Tooltip title="Copy Valuation Summary">
            <IconButton onClick={handleCopy} size="small" sx={{ color: '#00E5FF', bgcolor: 'rgba(0, 229, 255, 0.1)' }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        {/* Currency Quick-Switcher Tabs */}
        <Box mb={2.5}>
          <Typography variant="caption" color="text.secondary" fontWeight="700" letterSpacing="0.08em" mb={1} display="block">
            SELECT DISPLAY CURRENCY
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
                    fontSize: '0.8rem',
                    bgcolor: active ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    color: active ? '#00E5FF' : '#94A3B8',
                    border: active ? '1px solid #00E5FF' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: active ? '0 0 12px rgba(0, 229, 255, 0.3)' : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: active ? 'rgba(0, 229, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        {/* Huge Animated Price Ticker Box */}
        <Box
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3.5,
            backgroundColor: 'rgba(11, 15, 25, 0.8)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            boxShadow: 'inset 0 0 24px rgba(0, 229, 255, 0.08), 0 8px 32px rgba(0, 0, 0, 0.35)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            mb: 3,
          }}
        >
          {/* Subtle decorative glow dot */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 120,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(0, 229, 255, 0.35)',
              filter: 'blur(20px)',
              pointerEvents: 'none',
            }}
          />

          <Typography variant="caption" color="text.secondary" fontWeight="700" letterSpacing="0.1em">
            FAIR MARKET VALUATION ({selectedCurrency})
          </Typography>

          {/* Animated Primary Price */}
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              my: 1,
              letterSpacing: '-0.03em',
              fontSize: { xs: '2.4rem', sm: '3.2rem' },
              background: 'linear-gradient(90deg, #FFFFFF 20%, #00E5FF 70%, #FFB703 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(0, 229, 255, 0.25)',
            }}
          >
            {converted.symbol}{' '}
            {animatedAmount.toLocaleString('en-US', {
              minimumFractionDigits: CURRENCY_CONFIG[selectedCurrency]?.decimals || 0,
              maximumFractionDigits: CURRENCY_CONFIG[selectedCurrency]?.decimals || 0,
            })}
          </Typography>

          {/* Dual Currency Sub-Display */}
          {selectedCurrency !== 'LKR' && (
            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
              <Typography variant="body1" fontWeight="700" color="#94A3B8">
                Equivalent: <span style={{ color: '#F8FAFC' }}>Rs. {lakhs.toFixed(2)} Lakhs</span>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (Rs. {Math.round(rawLkr).toLocaleString()} LKR)
              </Typography>
            </Box>
          )}

          {selectedCurrency === 'LKR' && (
            <Typography variant="body2" color="text.secondary">
              Raw Value: Rs. {Math.round(rawLkr).toLocaleString()} LKR (Rs. {lakhs.toFixed(2)} Lakhs)
            </Typography>
          )}
        </Box>

        {/* Confidence Interval (95% CI) */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            mb: 3,
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <SecurityIcon sx={{ color: '#00E5FF', fontSize: 20 }} />
              <Typography variant="caption" fontWeight="700" color="text.secondary" letterSpacing="0.05em">
                STATISTICAL CONFIDENCE RANGE (95% CI)
              </Typography>
            </Box>
            <Typography variant="caption" fontWeight="700" color="#00E5FF">
              ± 5% Margin
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box textAlign="left">
              <Typography variant="caption" color="text.secondary" display="block">
                Lower Bound (Min)
              </Typography>
              <Typography variant="body2" fontWeight="800" color="#94A3B8">
                {minConverted.formatted}
              </Typography>
            </Box>

            <Box textAlign="center">
              <Typography variant="caption" color="#00E5FF" fontWeight="700" display="block">
                Expected Value
              </Typography>
              <Typography variant="body1" fontWeight="900" color="#FFFFFF">
                {converted.formatted}
              </Typography>
            </Box>

            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary" display="block">
                Upper Bound (Max)
              </Typography>
              <Typography variant="body2" fontWeight="800" color="#94A3B8">
                {maxConverted.formatted}
              </Typography>
            </Box>
          </Box>

          {/* Visual Confidence Bar */}
          <LinearProgress
            variant="determinate"
            value={50}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #0077B6 0%, #00E5FF 50%, #FFB703 100%)',
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Vehicle Snapshot Details */}
        {vehicle && (
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight="700" letterSpacing="0.08em" mb={1.2} display="block">
              VALUATED VEHICLE CONFIGURATION
            </Typography>
            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
              <Chip
                label={`${vehicle.brand || ''} ${vehicle.model || ''}`.trim() || 'Vehicle'}
                size="small"
                sx={{ bgcolor: 'rgba(0, 229, 255, 0.1)', color: '#00E5FF', fontWeight: 700, border: '1px solid rgba(0, 229, 255, 0.2)' }}
              />
              <Chip label={`Year: ${vehicle.yom || '-'}`} size="small" variant="outlined" />
              <Chip label={`${Number(vehicle.mileage_km || 0).toLocaleString()} KM`} size="small" variant="outlined" />
              <Chip label={vehicle.fuel_type || 'Petrol'} size="small" variant="outlined" />
              <Chip label={vehicle.gear || 'Automatic'} size="small" variant="outlined" />
              {vehicle.engine_cc && <Chip label={`${vehicle.engine_cc} cc`} size="small" variant="outlined" />}
              {vehicle.town && <Chip label={`📍 ${vehicle.town}`} size="small" variant="outlined" />}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
