import { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
} from '@mui/material';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { convertFromLKR, CURRENCY_CONFIG } from '../utils/currencyUtils';

/**
 * Custom Tooltip for Recharts
 */
function CustomTooltip({ active, payload, label, selectedCurrency }) {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0].payload;
  const currencyInfo = CURRENCY_CONFIG[selectedCurrency] || CURRENCY_CONFIG.LKR;

  return (
    <Box
      sx={{
        backgroundColor: 'rgba(11, 15, 25, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0, 229, 255, 0.4)',
        borderRadius: 2.5,
        p: 2,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" color="#00E5FF" mb={0.5}>
        Forecast Year: {label}
      </Typography>
      <Typography variant="body2" fontWeight="800" color="#FFFFFF">
        Value ({selectedCurrency}): {currencyInfo.symbol}{' '}
        {dataPoint.convertedValue.toLocaleString('en-US', {
          minimumFractionDigits: currencyInfo.decimals,
          maximumFractionDigits: currencyInfo.decimals,
        })}
      </Typography>
      <Typography variant="caption" color="#94A3B8" display="block">
        LKR Valuation: Rs. {dataPoint.lakhs.toFixed(2)} Lakhs
      </Typography>
      {dataPoint.dropPercent !== undefined && (
        <Typography variant="caption" color="#FFB703" fontWeight="700">
          Retained: {(100 - dataPoint.dropPercent).toFixed(1)}% of initial
        </Typography>
      )}
    </Box>
  );
}

export default function DepreciationChart({
  depreciationData = [],
  initialLakhs = 0,
  selectedCurrency = 'LKR',
}) {
  const [chartMetric, setChartMetric] = useState('currency'); // 'currency' | 'lakhs'

  if (!depreciationData || depreciationData.length === 0) {
    return null;
  }

  const currencyInfo = CURRENCY_CONFIG[selectedCurrency] || CURRENCY_CONFIG.LKR;

  // Transform depreciation points for Recharts
  const chartData = depreciationData.map((point) => {
    const lakhs = point.projected_price_lkr_lakhs || point.projected_price_lkr || 0;
    const rawLkr = point.projected_price_lkr_raw || lakhs * 100000;
    const conv = convertFromLKR(rawLkr, selectedCurrency);

    const baseLakhs = initialLakhs || (depreciationData[0]?.projected_price_lkr_lakhs || lakhs);
    const dropPercent = baseLakhs > 0 ? ((baseLakhs - lakhs) / baseLakhs) * 100 : 0;

    return {
      year: point.year,
      lakhs: Number(lakhs.toFixed(2)),
      convertedValue: conv.amount,
      rawLkr,
      dropPercent: Math.max(0, dropPercent),
    };
  });

  // Calculate Key Insights
  const startVal = chartData[0]?.convertedValue || 1;
  const endVal = chartData[chartData.length - 1]?.convertedValue || 1;
  const year1Val = chartData[1]?.convertedValue || startVal;

  const year1DropPercent = startVal > 0 ? (((startVal - year1Val) / startVal) * 100).toFixed(1) : '7.0';
  const fiveYearRetainedPercent = startVal > 0 ? (((endVal) / startVal) * 100).toFixed(1) : '74.8';
  const totalLoss = Math.max(0, startVal - endVal);
  const formattedLoss = `${currencyInfo.symbol} ${totalLoss.toLocaleString('en-US', {
    minimumFractionDigits: currencyInfo.decimals,
    maximumFractionDigits: currencyInfo.decimals,
  })}`;

  return (
    <Card
      className="glass-panel form-card-enter glow-cyan"
      sx={{
        borderRadius: 4,
        border: '1px solid rgba(0, 229, 255, 0.25)',
        mt: 3.5,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.12) 0%, rgba(19, 28, 46, 0.8) 100%)',
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
              bgcolor: 'rgba(255, 183, 3, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingDownIcon sx={{ color: '#FFB703', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
              5-Year Depreciation Projection
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Predictive asset valuation decay model (~7% annual decay)
            </Typography>
          </Box>
        </Box>

        {/* Axis Unit Toggle */}
        <ToggleButtonGroup
          value={chartMetric}
          exclusive
          onChange={(e, val) => val && setChartMetric(val)}
          size="small"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            '& .MuiToggleButton-root': {
              color: '#94A3B8',
              fontWeight: 700,
              fontSize: '0.75rem',
              px: 1.5,
              '&.Mui-selected': {
                color: '#00E5FF',
                bgcolor: 'rgba(0, 229, 255, 0.2)',
              },
            },
          }}
        >
          <ToggleButton value="currency">{currencyInfo.code}</ToggleButton>
          <ToggleButton value="lakhs">LKR Lakhs</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        {/* Recharts Area Container */}
        <Box sx={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="deprGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
              <XAxis
                dataKey="year"
                stroke="#94A3B8"
                tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              />
              <YAxis
                stroke="#94A3B8"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tickFormatter={(val) => {
                  if (chartMetric === 'lakhs') return `${val}L`;
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                  return val;
                }}
              />
              <Tooltip
                content={<CustomTooltip selectedCurrency={selectedCurrency} />}
              />
              <Area
                type="monotone"
                dataKey={chartMetric === 'currency' ? 'convertedValue' : 'lakhs'}
                stroke="#00E5FF"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#deprGradient)"
                activeDot={{ r: 6, fill: '#FFB703', stroke: '#00E5FF', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>

        {/* Key Financial Insights Metrics Bar */}
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight="600" display="block">
                1-Year Forecasted Drop
              </Typography>
              <Typography variant="h6" fontWeight="800" color="#FFB703" my={0.5}>
                -{year1DropPercent}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Standard annual decay
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight="600" display="block">
                5-Year Value Retained
              </Typography>
              <Typography variant="h6" fontWeight="800" color="#00E5FF" my={0.5}>
                {fiveYearRetainedPercent}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Residual equity after 5 yrs
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight="600" display="block">
                Total 5-Year Loss
              </Typography>
              <Typography variant="h6" fontWeight="800" color="#F8FAFC" my={0.5}>
                {formattedLoss}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cumulative depreciation
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
