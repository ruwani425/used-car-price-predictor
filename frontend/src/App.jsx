import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  Alert,
  Snackbar,
  Grid,
} from '@mui/material';
import { darkTheme } from './theme/theme';
import Navbar from './components/Navbar';
import PredictionForm from './components/PredictionForm';
import PriceResultCard from './components/PriceResultCard';
import DepreciationChart from './components/DepreciationChart';
import ValuationGuideCard from './components/ValuationGuideCard';
import CarComparison from './components/CarComparison';
import HistoryDrawer from './components/HistoryDrawer';

import { updateCurrencyRates } from './utils/currencyUtils';

const API_BASE = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : (import.meta.env.PROD ? '' : 'http://localhost:5000');

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState('LKR');
  const [apiStatus, setApiStatus] = useState('checking');
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [presetData, setPresetData] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // Check Backend and ML Service Health, Fetch Dropdown Metadata & Live Currencies on Load
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

      try {
        // 3. Live Redis Currency Rates Fetch
        const currRes = await axios.get(`${API_BASE}/api/currencies`, { timeout: 4000 });
        if (currRes.data?.rates) {
          updateCurrencyRates(currRes.data.rates);
        }
      } catch (err) {
        console.warn('Could not load live currency rates:', err.message);
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

  // Handle Preset Click from Guide
  const handleSelectPreset = (preset) => {
    setPresetData(preset);
    // Automatically trigger valuation for preset for lightning UX
    handleValuationSubmit(preset);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
        {/* Navigation Bar with Multi-Currency Selector & History Button */}
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
          apiStatus={apiStatus}
          onOpenHistory={() => setHistoryOpen(true)}
        />

        {/* Main Content Area */}
        <Container maxWidth="xl" sx={{ flexGrow: 1, py: { xs: 3, md: 4 } }}>
          {/* Tab 0: Main Valuation Predictor (Balanced 2-Column SaaS Layout) */}
          {activeTab === 0 && (
            <Grid container spacing={3.5} alignItems="flex-start">
              {/* Left Column: Vehicle Valuation Input Form */}
              <Grid size={{ xs: 12, lg: 5 }}>
                <PredictionForm
                  metadata={metadata}
                  onSubmit={handleValuationSubmit}
                  loading={loading}
                  selectedCurrency={selectedCurrency}
                  presetData={presetData}
                />
              </Grid>

              {/* Right Column: Dynamic Valuation Result & Depreciation Chart OR Market Intelligence Guide */}
              <Grid size={{ xs: 12, lg: 7 }}>
                {predictionResult ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                  </Box>
                ) : (
                  <ValuationGuideCard
                    selectedCurrency={selectedCurrency}
                    onSelectPreset={handleSelectPreset}
                  />
                )}
              </Grid>
            </Grid>
          )}

          {/* Tab 1: Side-by-Side Car Valuation Comparison */}
          {activeTab === 1 && (
            <CarComparison metadata={metadata} selectedCurrency={selectedCurrency} />
          )}
        </Container>

        {/* Prediction History Drawer */}
        <HistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          selectedCurrency={selectedCurrency}
        />

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