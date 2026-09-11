import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
  },
});

function App() {
  const [formData, setFormData] = useState({
    brand: 'Toyota',
    year: 2018,
    mileage: 65000,
    fuel_type: 'Petrol',
    transmission: 'Automatic'
  });

  const [predictedPrice, setPredictedPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const brands = ['Toyota', 'Honda', 'Nissan', 'Suzuki', 'Hyundai', 'BMW', 'Mercedes'];
  const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
  const transmissions = ['Automatic', 'Manual'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPredictedPrice(null);

    try {
      const response = await axios.post('http://localhost:5000/api/predict', {
        brand: formData.brand,
        year: Number(formData.year),
        mileage: Number(formData.mileage),
        fuel_type: formData.fuel_type,
        transmission: formData.transmission
      });

      setPredictedPrice(response.data.estimated_price);
    } catch (err) {
      setError('Prediction failed. Backend API server එක run වෙනවද බලන්න.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
        <Card sx={{ width: '100%', borderRadius: 3, boxShadow: 6, p: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <DirectionsCarIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h5" component="h1" fontWeight="bold">
                  Car Valuation AI
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Estimate market price using Machine Learning
                </Typography>
              </Box>
            </Box>
        
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="brand-label">Vehicle Brand</InputLabel>
                    <Select
                      labelId="brand-label"
                      name="brand"
                      value={formData.brand}
                      label="Vehicle Brand"
                      onChange={handleChange}
                    >
                      {brands.map((b) => (
                        <MenuItem key={b} value={b}>{b}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Manufacture Year"
                    name="year"
                    type="number"
                    value={formData.year}
                    onChange={handleChange}
                    inputProps={{ min: 1995, max: new Date().getFullYear() }}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Mileage (km)"
                    name="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={handleChange}
                    inputProps={{ min: 0 }}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="fuel-label">Fuel Type</InputLabel>
                    <Select
                      labelId="fuel-label"
                      name="fuel_type"
                      value={formData.fuel_type}
                      label="Fuel Type"
                      onChange={handleChange}
                    >
                      {fuelTypes.map((f) => (
                        <MenuItem key={f} value={f}>{f}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="transmission-label">Transmission</InputLabel>
                    <Select
                      labelId="transmission-label"
                      name="transmission"
                      value={formData.transmission}
                      label="Transmission"
                      onChange={handleChange}
                    >
                      {transmissions.map((t) => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                    sx={{ mt: 1, py: 1.2, fontWeight: 'bold' }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Calculate Valuation'}
                  </Button>
                </Grid>
              </Grid>
            </form>

            {predictedPrice && (
              <Paper
                elevation={3}
                sx={{
                  mt: 3,
                  p: 2.5,
                  textAlign: 'center',
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10b981'
                }}
              >
                <Typography variant="overline" color="#10b981" fontWeight="bold">
                  Estimated Market Value
                </Typography>
                <Box display="flex" justifyContent="center" alignItems="center">
                  <AttachMoneyIcon sx={{ fontSize: 32, color: '#10b981' }} />
                  <Typography variant="h4" fontWeight="bold" color="#fff">
                    {Number(predictedPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Paper>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
}

export default App;