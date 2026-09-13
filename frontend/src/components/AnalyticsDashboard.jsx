import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
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

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
    { feature: 'car_age (Derived: 2026 - YOM)', importance: 0.1483, importance_percent: 14.83 },
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
    desc: 'Car_Age (2026 - YOM), Mileage_Per_Year (KM / Age), and Luxury_Score (0 to 4 amenity sum).',
    badge: 'Feature Extraction',
    color: '#4F46E5',
  },
  {
    num: 2,
    title: 'Irrelevant Feature Removal',
    desc: 'Dropped raw index Unnamed: 0 and transient web scraping timestamps.',
    badge: 'Dimensionality',
    color: '#64748B',
  },
  {
    num: 3,
    title: 'Binary Feature Encoding',
    desc: 'Mapped AC, Power Steering, Mirrors, Windows (Available/Not) and Condition/Lease to 0/1 integers.',
    badge: 'Binary Encoding',
    color: '#059669',
  },
  {
    num: 4,
    title: 'High-Cardinality Grouping',
    desc: 'Clustered rare models (<25 listings) into "OTHER" and applied Empirical Frequency Encoding.',
    badge: 'Cardinality Mgmt',
    color: '#7C3AED',
  },
  {
    num: 5,
    title: 'IQR Outlier Truncation',
    desc: 'Bounded continuous variables (Mileage, Engine CC) with Interquartile Range boundaries.',
    badge: 'Outlier Treatment',
    color: '#DC2626',
  },
  {
    num: 6,
    title: 'Target Log Transformation',
    desc: 'Applied log(1 + y) on Price to normalize heavy positive skewness before model fitting.',
    badge: 'Log Normalization',
    color: '#D97706',
  },
  {
    num: 7,
    title: 'StandardScaler Pipeline',
    desc: 'Standardized continuous columns in a Scikit-Learn reproducible inference pipeline.',
    badge: 'Feature Scaling',
    color: '#0284C7',
  },
];

export default function AnalyticsDashboard() {
  const [metricsData, setMetricsData] = useState(FALLBACK_METRICS);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/analytics`, { timeout: 5000 });
      if (res.data?.benchmark_leaderboard) {
        setMetricsData(res.data);
      }
    } catch (err) {
      console.warn('Could not load live analytics from API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/analytics`, { timeout: 5000 });
        if (isMounted && res.data?.benchmark_leaderboard) {
          setMetricsData(res.data);
        }
      } catch (err) {
        console.warn('Could not load live analytics from API:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const leaderboard = metricsData.benchmark_leaderboard || FALLBACK_METRICS.benchmark_leaderboard;
  const featureImportances = metricsData.top_feature_importances || FALLBACK_METRICS.top_feature_importances;
  const bestModel = metricsData.best_model || 'Gradient Boosting';
  const summary = metricsData.evaluation_summary || FALLBACK_METRICS.evaluation_summary;

  return (
    <Box className="form-card-enter">
      {/* Top Header Banner */}
      <Card sx={{ borderRadius: 3, mb: 3, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <Box
          sx={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            p: { xs: 2, md: 3 },
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  backgroundColor: '#EEF2FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <InsightsIcon sx={{ color: '#4F46E5', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Machine Learning Model Benchmark & Intelligence
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem' }}>
                  5-Algorithm Regression Comparison, 5-Fold Cross-Validation, and Explainable Feature Importances
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
              onClick={fetchMetrics}
              disabled={loading}
              sx={{
                borderColor: '#E2E8F0',
                color: '#475569',
                fontSize: '0.8rem',
                '&:hover': {
                  borderColor: '#CBD5E1',
                  backgroundColor: '#F8FAFC',
                },
              }}
            >
              Refresh Metrics
            </Button>
          </Box>
        </Box>
      </Card>

      {/* 4 Metric Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2.5, p: 2, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.8}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.72rem' }}>
                CHAMPION ALGORITHM
              </Typography>
              <EmojiEventsIcon sx={{ color: '#D97706', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              {bestModel}
            </Typography>
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
              <CheckCircleIcon sx={{ fontSize: 13 }} /> Top Generalization R²
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2.5, p: 2, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.8}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.72rem' }}>
                5-FOLD CROSS-VALIDATION R²
              </Typography>
              <SpeedIcon sx={{ color: '#4F46E5', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#4F46E5' }}>
              {(leaderboard[0]?.cv_r2_mean || 0.9063).toFixed(4)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', mt: 0.4, display: 'block', fontSize: '0.72rem' }}>
              ± {(leaderboard[0]?.cv_r2_std || 0.005).toFixed(4)} Variance
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2.5, p: 2, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.8}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.72rem' }}>
                TRAINED OBSERVATIONS
              </Typography>
              <StorageIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              9,770 Cars
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', mt: 0.4, display: 'block', fontSize: '0.72rem' }}>
              80/20 Train (7,816) / Test (1,954)
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2.5, p: 2, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.8}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.72rem' }}>
                ENGINEERED MATRIX
              </Typography>
              <FunctionsIcon sx={{ color: '#0284C7', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0284C7' }}>
              {summary.total_features || 273} Features
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', mt: 0.4, display: 'block', fontSize: '0.72rem' }}>
              7 Preprocessing Pipelines
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Row 2: Model Benchmark Table & Feature Importances */}
      <Grid container spacing={3} mb={3}>
        {/* Left: Model Leaderboard */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ borderRadius: 3, height: '100%', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <BarChartIcon sx={{ color: '#4F46E5', fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.98rem', color: '#0F172A' }}>
                    Model Benchmark Leaderboard
                  </Typography>
                </Box>
                <Chip label="Holdout 20% Test Split" size="small" sx={{ color: '#64748B', fontSize: '0.72rem', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }} />
              </Box>
            </Box>

            <CardContent sx={{ p: 0 }}>
              <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                      <TableCell sx={{ color: '#475569', fontWeight: 700, py: 1.2, fontSize: '0.75rem' }}>Model Algorithm</TableCell>
                      <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>5-Fold CV R²</TableCell>
                      <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>Test R² Score</TableCell>
                      <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>RMSE (Lakhs)</TableCell>
                      <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>MAE (Lakhs)</TableCell>
                      <TableCell align="right" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem' }}>MAPE (%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaderboard.map((row, idx) => {
                      const isWinner = idx === 0 || row.model_name === bestModel;
                      return (
                        <TableRow
                          key={row.model_name}
                          sx={{
                            backgroundColor: isWinner ? '#EEF2FF' : 'transparent',
                            '&:hover': { backgroundColor: isWinner ? '#E0E7FF' : '#F8FAFC' },
                            borderBottom: '1px solid #F1F5F9',
                          }}
                        >
                          <TableCell sx={{ fontWeight: isWinner ? 700 : 500, color: '#0F172A', py: 1.5 }}>
                            <Box display="flex" alignItems="center" gap={0.8}>
                              {isWinner ? (
                                <EmojiEventsIcon sx={{ color: '#D97706', fontSize: 16 }} />
                              ) : (
                                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                                  #{idx + 1}
                                </Typography>
                              )}
                              {row.model_name}
                              {isWinner && (
                                <Chip label="BEST" size="small" sx={{ height: 16, fontSize: '0.62rem', fontWeight: 800, bgcolor: '#C7D2FE', color: '#3730A3' }} />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#4F46E5', fontWeight: 600 }}>
                            {row.cv_r2_mean.toFixed(4)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: isWinner ? '#059669' : '#0F172A' }}>
                            {row.test_r2_score.toFixed(4)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#475569' }}>
                            Rs. {row.test_rmse_lakhs} L
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#475569' }}>
                            Rs. {row.test_mae_lakhs} L
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#475569', fontWeight: 600 }}>
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

        {/* Right: Feature Importances */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ borderRadius: 3, height: '100%', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <AutoAwesomeIcon sx={{ color: '#4F46E5', fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.98rem', color: '#0F172A' }}>
                    Key Valuation Drivers
                  </Typography>
                </Box>
                <Chip label="Feature Importance (%)" size="small" sx={{ color: '#4F46E5', bgcolor: '#EEF2FF', border: '1px solid #C7D2FE', fontSize: '0.72rem' }} />
              </Box>
            </Box>

            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="body2" sx={{ color: '#64748B', mb: 2, fontSize: '0.8rem' }}>
                Relative predictive importance of vehicle attributes from Champion Gradient Boosting model:
              </Typography>

              <Box display="flex" flexDirection="column" gap={1.8}>
                {featureImportances.slice(0, 7).map((feat, index) => (
                  <Box key={feat.feature}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.4}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.82rem' }}>
                        {feat.feature.replace(/_/g, ' ').replace('gear ', 'Transmission: ')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: index < 2 ? '#4F46E5' : '#475569', fontSize: '0.82rem' }}>
                        {feat.importance_percent.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(feat.importance_percent * 2, 100)}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#F1F5F9',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 3,
                          backgroundColor: index < 2 ? '#4F46E5' : '#0284C7',
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

      {/* Row 3: 7 Feature Engineering Summary */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
            7 Mandatory Feature Engineering Techniques
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem' }}>
            Domain-specific mathematical transformations implemented for the Sri Lankan automotive market:
          </Typography>
        </Box>

        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
            {FEATURE_ENGINEERING_TECHNIQUES.map((tech) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={tech.num}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
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
                          height: 18,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          backgroundColor: '#EEF2FF',
                          color: '#4F46E5',
                          border: '1px solid #C7D2FE',
                        }}
                      />
                      <Chip label={tech.badge} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0', color: '#64748B' }} />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5, fontSize: '0.85rem' }}>
                      {tech.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.4, fontSize: '0.75rem', display: 'block' }}>
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
