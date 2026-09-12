import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InsightsIcon from '@mui/icons-material/Insights';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import FunctionsIcon from '@mui/icons-material/Functions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BarChartIcon from '@mui/icons-material/BarChart';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';

const API_BASE = 'http://localhost:5000';

// Fallback metrics in case backend is offline
const FALLBACK_METRICS = {
  best_model: 'Gradient Boosting',
  benchmark_leaderboard: [
    {
      model_name: 'Gradient Boosting',
      cv_r2_mean: 0.9063,
      cv_r2_std: 0.005,
      test_r2_score: 0.7001,
      test_rmse_lakhs: 26.69,
      test_mae_lakhs: 7.9,
      test_mape_percent: 14.75,
      training_time_seconds: 13.56,
    },
    {
      model_name: 'Random Forest',
      cv_r2_mean: 0.9026,
      cv_r2_std: 0.0043,
      test_r2_score: 0.6908,
      test_rmse_lakhs: 27.1,
      test_mae_lakhs: 7.14,
      test_mape_percent: 13.85,
      training_time_seconds: 22.06,
    },
    {
      model_name: 'Decision Tree',
      cv_r2_mean: 0.8619,
      cv_r2_std: 0.0064,
      test_r2_score: 0.6782,
      test_rmse_lakhs: 27.65,
      test_mae_lakhs: 8.09,
      test_mape_percent: 16.81,
      training_time_seconds: 1.15,
    },
    {
      model_name: 'Linear Regression',
      cv_r2_mean: 0.8742,
      cv_r2_std: 0.0089,
      test_r2_score: 0.5588,
      test_rmse_lakhs: 32.37,
      test_mae_lakhs: 9.6,
      test_mape_percent: 18.49,
      training_time_seconds: 0.38,
    },
    {
      model_name: 'Ridge Regression',
      cv_r2_mean: 0.8739,
      cv_r2_std: 0.0085,
      test_r2_score: 0.5583,
      test_rmse_lakhs: 32.39,
      test_mae_lakhs: 9.61,
      test_mape_percent: 18.48,
      training_time_seconds: 0.82,
    },
  ],
  top_feature_importances: [
    { feature: 'gear_Manual (Transmission)', importance: 0.2655, importance_percent: 26.55 },
    { feature: 'gear_Automatic (Transmission)', importance: 0.2228, importance_percent: 22.28 },
    { feature: 'car_age (Derived: 2025 - YOM)', importance: 0.1483, importance_percent: 14.83 },
    { feature: 'mileage_km (Odometer Distance)', importance: 0.1236, importance_percent: 12.36 },
    { feature: 'engine_cc (Engine Capacity)', importance: 0.0701, importance_percent: 7.01 },
    { feature: 'brand_freq (Brand Market Demand)', importance: 0.0586, importance_percent: 5.86 },
    { feature: 'luxury_score (Composite Amenities: 0-4)', importance: 0.0199, importance_percent: 1.99 },
    { feature: 'mileage_per_year (Usage Intensity)', importance: 0.0196, importance_percent: 1.96 },
  ],
  evaluation_summary: {
    test_r2_score: 0.7001,
    training_samples: 7816,
    test_samples: 1954,
    total_features: 273,
  },
};

const FEATURE_ENGINEERING_TECHNIQUES = [
  {
    num: 1,
    title: 'Domain Derived Features',
    desc: 'Car_Age (2025 - YOM), Mileage_Per_Year (KM / Age), and Luxury_Score (0 to 4 amenity sum).',
    badge: 'Feature Extraction',
    color: '#00E5FF',
  },
  {
    num: 2,
    title: 'Irrelevant Feature Removal',
    desc: 'Dropped raw index Unnamed: 0 and transient listing Date.',
    badge: 'Dimensionality',
    color: '#94A3B8',
  },
  {
    num: 3,
    title: 'Binary Feature Encoding',
    desc: 'Mapped AC, Power Steering, Mirrors, Windows (Available/Not) and Condition/Lease to 0/1.',
    badge: 'Binary Encoding',
    color: '#22C55E',
  },
  {
    num: 4,
    title: 'High-Cardinality Grouping',
    desc: 'Clustered rare models (<5 frequency) into "OTHER" and applied Frequency Encoding on Brand & Town.',
    badge: 'Cardinality Mgmt',
    color: '#A855F7',
  },
  {
    num: 5,
    title: 'IQR Winsorization & Capping',
    desc: 'Treated extreme outliers in Mileage (>500k km) and Price (Q3 + 2.5×IQR) to prevent weight distortion.',
    badge: 'Outlier Treatment',
    color: '#EF4444',
  },
  {
    num: 6,
    title: 'Target Log Transformation',
    desc: 'Applied np.log1p(Price) to normalize right-skewed price distribution (skewness 3.46 → -0.37).',
    badge: 'Log Normalization',
    color: '#FFB703',
  },
  {
    num: 7,
    title: 'StandardScaler Pipeline',
    desc: 'Standardized continuous variables (Age, Mileage, CC, Mileage/Year) inside Scikit-learn Pipeline.',
    badge: 'Feature Scaling',
    color: '#3B82F6',
  },
];

export default function AnalyticsDashboard({ metadata = null }) {
  const [metricsData, setMetricsData] = useState(FALLBACK_METRICS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/analytics`, { timeout: 5000 });
      if (res.data?.benchmark_leaderboard) {
        setMetricsData(res.data);
      }
    } catch (err) {
      console.warn('Could not load live analytics from API, showing cached benchmark metrics:', err.message);
      // keep fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const leaderboard = metricsData.benchmark_leaderboard || FALLBACK_METRICS.benchmark_leaderboard;
  const featureImportances = metricsData.top_feature_importances || FALLBACK_METRICS.top_feature_importances;
  const bestModel = metricsData.best_model || 'Gradient Boosting';
  const summary = metricsData.evaluation_summary || FALLBACK_METRICS.evaluation_summary;

  return (
    <Box className="form-card-enter">
      {/* Top Header Banner */}
      <Card className="glass-panel" sx={{ borderRadius: 4, mb: 3.5, overflow: 'hidden' }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(19, 28, 46, 0.7) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            p: { xs: 2.5, md: 3.5 },
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #00E5FF 0%, #0077B6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0, 229, 255, 0.3)',
                }}
              >
                <InsightsIcon sx={{ color: '#031024', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="800" letterSpacing="-0.02em">
                  Machine Learning Model Intelligence & Benchmarking
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  5-Algorithm Regression Comparison, Cross-Validation Scores, and Explainable Feature Importances
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              onClick={fetchMetrics}
              disabled={loading}
              sx={{
                borderColor: 'rgba(0, 229, 255, 0.3)',
                color: '#00E5FF',
                '&:hover': {
                  borderColor: '#00E5FF',
                  backgroundColor: 'rgba(0, 229, 255, 0.08)',
                },
              }}
            >
              Refresh Metrics
            </Button>
          </Box>
        </Box>
      </Card>

      {/* 4 Metric Summary Cards */}
      <Grid container spacing={2.5} mb={3.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-panel" sx={{ borderRadius: 3, p: 2.5 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary" fontWeight="700">
                WINNING ALGORITHM
              </Typography>
              <EmojiEventsIcon sx={{ color: '#FFB703', fontSize: 24 }} />
            </Box>
            <Typography variant="h5" fontWeight="800" color="#F8FAFC">
              {bestModel}
            </Typography>
            <Typography variant="caption" color="#22C55E" fontWeight="600" display="flex" alignItems="center" gap={0.5} mt={0.5}>
              <CheckCircleIcon sx={{ fontSize: 14 }} /> Top Generalization R²
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-panel" sx={{ borderRadius: 3, p: 2.5 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary" fontWeight="700">
                CROSS-VALIDATION R² (5-FOLD)
              </Typography>
              <SpeedIcon sx={{ color: '#00E5FF', fontSize: 24 }} />
            </Box>
            <Typography variant="h5" fontWeight="800" color="#00E5FF">
              {(leaderboard[0]?.cv_r2_mean || 0.9063).toFixed(4)}
            </Typography>
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
              ± {(leaderboard[0]?.cv_r2_std || 0.005).toFixed(4)} Variance
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-panel" sx={{ borderRadius: 3, p: 2.5 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary" fontWeight="700">
                TRAINED DATASET SIZE
              </Typography>
              <StorageIcon sx={{ color: '#A855F7', fontSize: 24 }} />
            </Box>
            <Typography variant="h5" fontWeight="800" color="#F8FAFC">
              9,770 Cars
            </Typography>
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
              80/20 Train (7,816) / Test (1,954)
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="glass-panel" sx={{ borderRadius: 3, p: 2.5 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary" fontWeight="700">
                TRANSFORMED FEATURES
              </Typography>
              <FunctionsIcon sx={{ color: '#FFB703', fontSize: 24 }} />
            </Box>
            <Typography variant="h5" fontWeight="800" color="#FFB703">
              {summary.total_features || 273} Features
            </Typography>
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
              7 Feature Engineering Pipelines
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Row 2: 5-Model Benchmark Leaderboard Table & Feature Importances */}
      <Grid container spacing={3.5} mb={3.5}>
        {/* Left: Model Leaderboard */}
        <Grid item xs={12} lg={7}>
          <Card className="glass-panel" sx={{ borderRadius: 4, height: '100%' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <BarChartIcon sx={{ color: '#00E5FF' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Model Benchmark Leaderboard
                  </Typography>
                </Box>
                <Chip label="Evaluated on Holdout Test Set" size="small" variant="outlined" sx={{ color: '#94A3B8' }} />
              </Box>
            </Box>

            <CardContent sx={{ p: 0 }}>
              <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                      <TableCell sx={{ color: '#94A3B8', fontWeight: 700, py: 1.5 }}>Model Algorithm</TableCell>
                      <TableCell align="right" sx={{ color: '#94A3B8', fontWeight: 700 }}>5-Fold CV R²</TableCell>
                      <TableCell align="right" sx={{ color: '#94A3B8', fontWeight: 700 }}>Test R² Score</TableCell>
                      <TableCell align="right" sx={{ color: '#94A3B8', fontWeight: 700 }}>RMSE (Lakhs)</TableCell>
                      <TableCell align="right" sx={{ color: '#94A3B8', fontWeight: 700 }}>MAE (Lakhs)</TableCell>
                      <TableCell align="right" sx={{ color: '#94A3B8', fontWeight: 700 }}>MAPE (%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaderboard.map((row, idx) => {
                      const isWinner = idx === 0 || row.model_name === bestModel;
                      return (
                        <TableRow
                          key={row.model_name}
                          sx={{
                            backgroundColor: isWinner ? 'rgba(0, 229, 255, 0.06)' : 'transparent',
                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <TableCell sx={{ fontWeight: isWinner ? 700 : 500, color: '#F8FAFC', py: 2 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              {isWinner ? (
                                <EmojiEventsIcon sx={{ color: '#FFB703', fontSize: 18 }} />
                              ) : (
                                <Typography variant="caption" color="text.secondary" fontWeight="700">
                                  #{idx + 1}
                                </Typography>
                              )}
                              {row.model_name}
                              {isWinner && (
                                <Chip label="BEST" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(0, 229, 255, 0.2)', color: '#00E5FF' }} />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#00E5FF', fontWeight: 600 }}>
                            {row.cv_r2_mean.toFixed(4)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: isWinner ? '#22C55E' : '#F8FAFC' }}>
                            {row.test_r2_score.toFixed(4)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'text.secondary' }}>
                            Rs. {row.test_rmse_lakhs} L
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'text.secondary' }}>
                            Rs. {row.test_mae_lakhs} L
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {row.test_mape_percent}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Feature Importances Bar Chart */}
        <Grid item xs={12} lg={5}>
          <Card className="glass-panel" sx={{ borderRadius: 4, height: '100%' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <AutoAwesomeIcon sx={{ color: '#FFB703' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Key Valuation Drivers
                  </Typography>
                </Box>
                <Chip label="Feature Importance (%)" size="small" variant="outlined" sx={{ color: '#FFB703', borderColor: 'rgba(255, 183, 3, 0.3)' }} />
              </Box>
            </Box>

            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" mb={2.5}>
                Relative influence of vehicle specifications on market pricing from the ensemble model:
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                {featureImportances.slice(0, 7).map((feat, index) => (
                  <Box key={feat.feature}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="body2" fontWeight="600" color="#F8FAFC">
                        {feat.feature.replace(/_/g, ' ').replace('gear ', 'Transmission: ')}
                      </Typography>
                      <Typography variant="body2" fontWeight="700" color={index < 2 ? '#00E5FF' : '#FFB703'}>
                        {feat.importance_percent.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(feat.importance_percent * 2, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: index < 2
                            ? 'linear-gradient(90deg, #00E5FF 0%, #0077B6 100%)'
                            : 'linear-gradient(90deg, #FFB703 0%, #FB8500 100%)',
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 3: Mandatory 7 Feature Engineering Summary for Viva Voce Presentation */}
      <Card className="glass-panel" sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Typography variant="h6" fontWeight="bold" color="#00E5FF">
            7 Mandatory Feature Engineering Techniques Implemented
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Domain-specific data transformations satisfying Assignment Specification Section 5:
          </Typography>
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {FEATURE_ENGINEERING_TECHNIQUES.map((tech) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={tech.num}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    backgroundColor: 'rgba(11, 15, 25, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Chip
                        label={`Technique ${tech.num}`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          backgroundColor: `${tech.color}15`,
                          color: tech.color,
                          border: `1px solid ${tech.color}40`,
                        }}
                      />
                      <Chip label={tech.badge} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                    </Box>
                    <Typography variant="subtitle2" fontWeight="700" color="#F8FAFC" mb={0.5}>
                      {tech.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" lineHeight={1.4}>
                      {tech.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
