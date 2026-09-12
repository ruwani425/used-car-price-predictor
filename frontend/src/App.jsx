import { useState, useEffect } from 'react';
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
  Chip,
} from '@mui/material';
import { darkTheme } from './theme/theme';
import Navbar from './components/Navbar';
import PredictionForm from './components/PredictionForm';
import PriceResultCard from './components/PriceResultCard';
import DepreciationChart from './components/DepreciationChart';

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

              {/* Right Column: Prediction Result Card & Depreciation Chart */}
              {predictionResult && (
                <Grid item xs={12} lg={5}>
                  <PriceResultCard
                    result={predictionResult}
                    selectedCurrency={selectedCurrency}
                    onCurrencyChange={setSelectedCurrency}
                    onCopyNotice={(msg) =>
                      setNotification({ open: true, message: msg, severity: 'info' })
                    }
                  />
                  <DepreciationChart
                    depreciationData={predictionResult.depreciation_projection}
                    initialLakhs={predictionResult.predicted_price_lkr_lakhs}
                    selectedCurrency={selectedCurrency}
                  />
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