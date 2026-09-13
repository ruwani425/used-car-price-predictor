import { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { convertFromLKR } from '../utils/currencyUtils';

/**
 * Clean Minimalist SVG Depreciation Chart (Blue & White SaaS Theme).
 */
export default function DepreciationChart({
  depreciationData = [],
  initialLakhs = 0,
  selectedCurrency = 'LKR',
}) {
  const [viewMode, setViewMode] = useState('currency'); // 'currency' | 'percent'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!depreciationData || depreciationData.length === 0) {
    return null;
  }

  // Process data points
  const points = depreciationData.map((item) => {
    const lakhs = item.projected_price_lkr_lakhs || item.projected_price_lkr || 0;
    const lkrRaw = lakhs * 100000;
    const converted = convertFromLKR(lkrRaw, selectedCurrency);
    const dropPercent = initialLakhs > 0 ? Math.max(0, ((initialLakhs - lakhs) / initialLakhs) * 100) : 0;
    const retainedPercent = Math.max(0, 100 - dropPercent);

    return {
      year: item.year,
      lakhs,
      lkrRaw,
      convertedValue: converted.amount,
      formattedPrice: converted.formatted,
      dropPercent,
      retainedPercent,
    };
  });

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  // Chart coordinates calculation
  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 25, bottom: 30, left: 35 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...points.map((p) => (viewMode === 'currency' ? p.convertedValue : 100))) * 1.05;
  const minVal = Math.min(...points.map((p) => (viewMode === 'currency' ? p.convertedValue : p.retainedPercent))) * 0.95;
  const range = maxVal - minVal || 1;

  const getX = (idx) => padding.left + (idx / (points.length - 1)) * chartW;
  const getY = (val) => padding.top + chartH - ((val - minVal) / range) * chartH;

  // Generate SVG Path
  const linePoints = points.map((p, idx) => {
    const val = viewMode === 'currency' ? p.convertedValue : p.retainedPercent;
    return `${getX(idx)},${getY(val)}`;
  });

  const pathD = `M ${linePoints.join(' L ')}`;
  const areaD = `M ${getX(0)},${padding.top + chartH} L ${linePoints.join(' L ')} L ${getX(points.length - 1)},${padding.top + chartH} Z`;

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.2,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <TrendingDownIcon sx={{ color: '#4F46E5', fontSize: 20 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
              5-Year Forecasted Depreciation Curve
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
              Projected asset value retention over time
            </Typography>
          </Box>
        </Box>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          size="small"
          onChange={(e, val) => val && setViewMode(val)}
          sx={{
            height: 26,
            '& .MuiToggleButton-root': {
              px: 1.2,
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#64748B',
              borderColor: '#E2E8F0',
              textTransform: 'none',
              '&.Mui-selected': {
                color: '#4F46E5',
                backgroundColor: '#EEF2FF',
                borderColor: '#C7D2FE',
              },
            },
          }}
        >
          <ToggleButton value="currency">{selectedCurrency}</ToggleButton>
          <ToggleButton value="percent">% Retained</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* SVG Line & Area Chart */}
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ width: '100%', position: 'relative' }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="indigoAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.33, 0.66, 1].map((ratio, i) => {
              const yPos = padding.top + chartH * ratio;
              return (
                <line
                  key={i}
                  x1={padding.left}
                  y1={yPos}
                  x2={width - padding.right}
                  y2={yPos}
                  stroke="#F1F5F9"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Area Fill */}
            <path d={areaD} fill="url(#indigoAreaGradient)" />

            {/* Line Path */}
            <path
              d={pathD}
              fill="none"
              stroke="#4F46E5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Circles on each Year point */}
            {points.map((p, idx) => {
              const val = viewMode === 'currency' ? p.convertedValue : p.retainedPercent;
              const cx = getX(idx);
              const cy = getY(val);
              const isHovered = hoveredIndex === idx;

              return (
                <g
                  key={p.year}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Hover circle */}
                  {isHovered && (
                    <circle cx={cx} cy={cy} r="10" fill="rgba(79, 70, 229, 0.15)" />
                  )}

                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5.5 : 4}
                    fill="#FFFFFF"
                    stroke="#4F46E5"
                    strokeWidth="2.5"
                  />

                  {/* X-Axis Year Labels */}
                  <text
                    x={cx}
                    y={height - 8}
                    textAnchor="middle"
                    fill={isHovered ? '#4F46E5' : '#64748B'}
                    fontSize="11"
                    fontWeight={isHovered ? '700' : '500'}
                  >
                    {p.year}
                  </text>
                </g>
              );
            })}
          </svg>
        </Box>

        {/* Dynamic Tooltip Bar */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 1.2,
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
              Projected Value ({activePoint.year})
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.85rem' }}>
              {activePoint.formattedPrice} (Rs. {activePoint.lakhs.toFixed(2)} Lakhs)
            </Typography>
          </Box>

          <Box textAlign="right">
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
              Retained Ratio
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#059669', fontSize: '0.85rem' }}>
              {activePoint.retainedPercent.toFixed(1)}% (↓ {activePoint.dropPercent.toFixed(1)}%)
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
