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
 * High-Performance Interactive SVG Depreciation Chart.
 * 100% React 19 compatible with glowing area gradient, hover nodes, and tooltips.
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
  const height = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 45 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...points.map((p) => (viewMode === 'currency' ? p.convertedValue : 100))) * 1.08;
  const minVal = Math.min(...points.map((p) => (viewMode === 'currency' ? p.convertedValue : p.retainedPercent))) * 0.92;
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
    <Card className="glass-panel" sx={{ borderRadius: 4, mt: 3, overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(19, 28, 46, 0.4) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.2}>
          <TrendingDownIcon sx={{ color: '#00E5FF' }} />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              5-Year Forecasted Depreciation Curve
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Predictive secondary market asset value decay
            </Typography>
          </Box>
        </Box>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          size="small"
          onChange={(e, val) => val && setViewMode(val)}
          sx={{
            height: 28,
            '& .MuiToggleButton-root': {
              px: 1.5,
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#94A3B8',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              '&.Mui-selected': {
                color: '#00E5FF',
                backgroundColor: 'rgba(0, 229, 255, 0.12)',
              },
            },
          }}
        >
          <ToggleButton value="currency">{selectedCurrency}</ToggleButton>
          <ToggleButton value="percent">% Retained</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* SVG Line & Area Chart */}
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ width: '100%', position: 'relative' }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          >
            <defs>
              {/* Glowing Gradient Area Fill */}
              <linearGradient id="cyanAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#00E5FF" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
              </linearGradient>

              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="glow" />
                <feComposite in="SourceGraphic" in2="glow" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.33, 0.66, 1].map((ratio, i) => {
              const yPos = padding.top + chartH * ratio;
              return (
                <line
                  key={i}
                  x1={padding.left}
                  y1={yPos}
                  x2={width - padding.right}
                  y2={yPos}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Area Fill */}
            <path d={areaD} fill="url(#cyanAreaGradient)" />

            {/* Line Path */}
            <path
              d={pathD}
              fill="none"
              stroke="#00E5FF"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
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
                  {/* Outer pulse circle when hovered */}
                  {isHovered && (
                    <circle cx={cx} cy={cy} r="12" fill="rgba(0, 229, 255, 0.25)" />
                  )}

                  {/* Point circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 4.5}
                    fill={isHovered ? '#FFFFFF' : '#00E5FF'}
                    stroke="#0B0F19"
                    strokeWidth="2"
                  />

                  {/* X-Axis Year Labels */}
                  <text
                    x={cx}
                    y={height - 10}
                    textAnchor="middle"
                    fill={isHovered ? '#00E5FF' : '#94A3B8'}
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
            p: 1.8,
            borderRadius: 2.5,
            backgroundColor: 'rgba(11, 15, 25, 0.8)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 1.5,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Projected Value ({activePoint.year})
            </Typography>
            <Typography variant="subtitle2" fontWeight="800" color="#00E5FF">
              {activePoint.formattedPrice} (Rs. {activePoint.lakhs.toFixed(2)} Lakhs)
            </Typography>
          </Box>

          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary">
              Retained Value
            </Typography>
            <Typography variant="subtitle2" fontWeight="800" color="#22C55E">
              {activePoint.retainedPercent.toFixed(1)}% ({activePoint.dropPercent.toFixed(1)}% decay)
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
