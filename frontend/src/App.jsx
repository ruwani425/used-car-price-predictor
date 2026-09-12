import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  Typography,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import { darkTheme } from './theme/theme';
import Navbar from './components/Navbar';
import PredictionForm from './components/PredictionForm';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const API_BASE = 'http://localhost:5000';

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState('LKR');
  const [apiStatus, setApiStatus] = useState('checking');
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Check Backend and ML Service Health & Fetch Dropdown Metadata on Load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // 1. Health check
        const healthRes = await axios.get(`${API_BASE}/api/health`, { timeout: 4000 });
        if (healthRes.data?.status === 'online') {
          setApiStatus('online');
        } else {
          setApiStatus('offline');
        }
      } catch (err) {
        console.warn('Backend health check failed:', err.message);
        setApiStatus('offline');
      }

      try {
        // 2. Metadata fetch
        const metaRes = await axios.get(`${API_BASE}/api/metadata`, { timeout: 6000 });
        setMetadata(metaRes.data);
      } catch (err) {
        console.warn('Could not load metadata from API, using defaults:', err.message);
      }
    };

    fetchInitialData();
  }, []);

  // Handle Prediction Submission
  const handleValuationSubmit = async (formData) => {
    setLoading(true);
    setPredictionResult(null);

    try {
      const response = await axios.post(`${API_BASE}/api/predict`, {
        ...formData,
        target_currency: selectedCurrency,
      });

      setPredictionResult(response.data);
      setNotification({
        open: true,
        message: `Valuation calculated successfully: ${response.data.formatted_lakhs || 'Success'}`,
        severity: 'success',
      });
    } catch (err) {
      console.error('Valuation error:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.detail || 'Prediction failed. Check backend connection.';
      setNotification({
        open: true,
        message: errMsg,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
          apiStatus={apiStatus}
        />

        {/* Main Content Area */}
        <Container maxWidth="xl" sx={{ flexGrow: 1, py: { xs: 3, md: 5 } }}>
          {activeTab === 0 && (
            <Grid container spacing={3.5}>
              {/* Left Column: Vehicle Valuation Input Form */}
              <Grid item xs={12} lg={predictionResult ? 7 : 12}>
                <PredictionForm
                  metadata={metadata}
                  onSubmit={handleValuationSubmit}
                  loading={loading}
                  selectedCurrency={selectedCurrency}
                />
              </Grid>

              {/* Right Column: Prediction Result & Valuation Card */}
              {predictionResult && (
                <Grid item xs={12} lg={5}>
                  <Card className="glass-panel form-card-enter glow-cyan" sx={{ borderRadius: 4, height: '100%' }}>
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(19, 28, 46, 0.6) 100%)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        p: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <CheckCircleIcon sx={{ color: '#00E5FF', fontSize: 28 }} />
                        <Typography variant="h6" fontWeight="bold">
                          Estimated Valuation
                        </Typography>
                      </Box>
                      <Chip label="AI ML Verified" color="primary" size="small" sx={{ fontWeight: 700 }} />
                    </Box>

                    <CardContent sx={{ p: 3.5 }}>
                      {/* Price Ticker Banner */}
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          backgroundColor: 'rgba(11, 15, 25, 0.7)',
                          border: '1px solid rgba(0, 229, 255, 0.25)',
                          textAlign: 'center',
                          mb: 3,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight="700" letterSpacing="0.08em">
                          FAIR MARKET VALUATION ({selectedCurrency})
                        </Typography>

                        {/* Converted Currency Display */}
                        {predictionResult.converted_price && predictionResult.converted_price.currency !== 'LKR' ? (
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 800,
                              my: 1,
                              background: 'linear-gradient(90deg, #00E5FF 0%, #FFB703 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}
                          >
                            {predictionResult.converted_price.symbol}{' '}
                            {Number(predictionResult.converted_price.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        ) : null}

                        {/* Primary LKR Valuation */}
                        <Typography
                          variant={predictionResult.converted_price?.currency !== 'LKR' ? 'h5' : 'h3'}
                          sx={{
                            fontWeight: 800,
                            my: 1,
                            color: predictionResult.converted_price?.currency !== 'LKR' ? '#94A3B8' : '#00E5FF',
                          }}
                        >
                          {predictionResult.formatted_lakhs || `Rs. ${predictionResult.predicted_price_lkr_lakhs} Lakhs`}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Approx. {predictionResult.formatted_lkr || `Rs. ${(predictionResult.predicted_price_lkr_lakhs * 100000).toLocaleString()} LKR`}
                        </Typography>
                      </Box>

                      {/* Confidence Range */}
                      {predictionResult.confidence_interval && (
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          p={2}
                          borderRadius={2}
                          bgcolor="rgba(255, 255, 255, 0.03)"
                          border="1px solid rgba(255, 255, 255, 0.06)"
                          mb={2.5}
                        >
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Estimated Range (95% CI)
                            </Typography>
                            <Typography variant="body2" fontWeight="700" color="#F8FAFC">
                              Rs. {predictionResult.confidence_interval.min_lkr_lakhs} Lakhs – Rs.{' '}
                              {predictionResult.confidence_interval.max_lkr_lakhs} Lakhs
                            </Typography>
                          </Box>
                          <SecurityIcon sx={{ color: '#00E5FF' }} />
                        </Box>
                      )}

                      {/* Vehicle Specs Summary Pill */}
                      {predictionResult.requested_vehicle && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight="600" mb={1} display="block">
                            EVALUATED CONFIGURATION
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.8}>
                            <Chip
                              label={`${predictionResult.requested_vehicle.brand} ${predictionResult.requested_vehicle.model}`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip label={`YOM: ${predictionResult.requested_vehicle.yom}`} size="small" variant="outlined" />
                            <Chip
                              label={`${Number(predictionResult.requested_vehicle.mileage_km).toLocaleString()} KM`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip label={predictionResult.requested_vehicle.fuel_type} size="small" variant="outlined" />
                            <Chip label={predictionResult.requested_vehicle.gear} size="small" variant="outlined" />
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}

          {/* Tab 1: Market Intelligence Placeholder */}
          {activeTab === 1 && (
            <Card className="glass-panel" sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom color="#00E5FF">
                Market Intelligence & ML Performance Leaderboard
              </Typography>
              <Typography variant="body2" color="text.secondary" maxWidth="md" mx="auto" mb={3}>
                Visual analytics, 5-model benchmark comparisons ($R^2$, RMSE, MAE), and Scikit-Learn Feature Importance rankings are prepared for Step 8.
              </Typography>
              <Chip label="Scheduled for Step 8" color="secondary" sx={{ fontWeight: 700 }} />
            </Card>
          )}

          {/* Tab 2: Compare Cars Placeholder */}
          {activeTab === 2 && (
            <Card className="glass-panel" sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom color="#FFB703">
                Side-by-Side Car Valuation Comparison
              </Typography>
              <Typography variant="body2" color="text.secondary" maxWidth="md" mx="auto" mb={3}>
                Compare 2 different vehicle specs and inspect depreciation rates side-by-side.
              </Typography>
              <Chip label="Scheduled for Step 8" color="primary" sx={{ fontWeight: 700 }} />
            </Card>
          )}
        </Container>

        {/* Global Toast Notification */}
        <Snackbar
          open={notification.open}
          autoHideDuration={5000}
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={notification.severity}
            onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
            sx={{ borderRadius: 3, fontWeight: 600 }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;