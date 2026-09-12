import { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Card,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { convertFromLKR } from '../utils/currencyUtils';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const FALLBACK_BRANDS = ['TOYOTA', 'SUZUKI', 'NISSAN', 'HONDA', 'MITSUBISHI', 'HYUNDAI', 'MAZDA', 'MERCEDES-BENZ', 'BMW', 'AUDI'];
const FALLBACK_MODELS = {
  TOYOTA: ['AXIO', 'PREMIO', 'VITZ', 'ALLION', 'COROLLA', 'AQUA', 'YARIS', 'PRIUS'],
  HONDA: ['CIVIC', 'FIT', 'VEZEL', 'GRACE', 'INSIGHT', 'CR-V', 'ACCORD'],
  SUZUKI: ['WAGON R', 'ALTO', 'SWIFT', 'SPACIA', 'CELERIO', 'EVERY'],
  NISSAN: ['SUNNY', 'LEAF', 'X-TRAIL', 'MARCH', 'DAYZ', 'BLUEBIRD'],
};

export default function CarComparison({ metadata = null, selectedCurrency = 'LKR' }) {
  const brands = metadata?.unique_brands?.length ? metadata.unique_brands : FALLBACK_BRANDS;
  const brandModelsMap = metadata?.brand_models_map || FALLBACK_MODELS;
  const fuelTypes = metadata?.unique_fuel_types?.length ? metadata.unique_fuel_types : ['Petrol', 'Hybrid', 'Diesel', 'Electric'];
  const gears = metadata?.unique_gears?.length ? metadata.unique_gears : ['Automatic', 'Manual'];

  // Car 1 State
  const [car1, setCar1] = useState({
    brand: 'TOYOTA',
    model: 'AXIO',
    yom: 2018,
    engine_cc: 1500,
    gear: 'Automatic',
    fuel_type: 'Hybrid',
    mileage_km: 65000,
    town: 'Colombo',
    condition: 'USED',
    leasing: 'No Leasing',
    air_condition: true,
    power_steering: true,
    power_mirror: true,
    power_window: true,
  });

  // Car 2 State
  const [car2, setCar2] = useState({
    brand: 'HONDA',
    model: 'GRACE',
    yom: 2017,
    engine_cc: 1500,
    gear: 'Automatic',
    fuel_type: 'Hybrid',
    mileage_km: 78000,
    town: 'Colombo',
    condition: 'USED',
    leasing: 'No Leasing',
    air_condition: true,
    power_steering: true,
    power_mirror: true,
    power_window: true,
  });

  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Derived models for Car 1 and Car 2
  const car1Models = brandModelsMap[car1.brand.toUpperCase()] || ['OTHER'];
  const car2Models = brandModelsMap[car2.brand.toUpperCase()] || ['OTHER'];

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload1 = {
        ...car1,
        yom: Number(car1.yom),
        engine_cc: Number(car1.engine_cc),
        mileage_km: Number(car1.mileage_km),
        air_condition: car1.air_condition ? 'Available' : 'Not_Available',
        power_steering: car1.power_steering ? 'Available' : 'Not_Available',
        power_mirror: car1.power_mirror ? 'Available' : 'Not_Available',
        power_window: car1.power_window ? 'Available' : 'Not_Available',
        target_currency: selectedCurrency,
      };

      const payload2 = {
        ...car2,
        yom: Number(car2.yom),
        engine_cc: Number(car2.engine_cc),
        mileage_km: Number(car2.mileage_km),
        air_condition: car2.air_condition ? 'Available' : 'Not_Available',
        power_steering: car2.power_steering ? 'Available' : 'Not_Available',
        power_mirror: car2.power_mirror ? 'Available' : 'Not_Available',
        power_window: car2.power_window ? 'Available' : 'Not_Available',
        target_currency: selectedCurrency,
      };

      // Run parallel valuation queries
      const [res1, res2] = await Promise.all([
        axios.post(`${API_BASE}/api/predict`, payload1),
        axios.post(`${API_BASE}/api/predict`, payload2),
      ]);

      setResult1(res1.data);
      setResult2(res2.data);
    } catch (err) {
      console.error('Comparison error:', err);
      setError(err.response?.data?.message || 'Could not fetch comparisons. Please check API server.');
    } finally {
      setLoading(false);
    }
  };

  // Convert prices for display
  const price1 = result1 ? convertFromLKR(result1.predicted_price_lkr_raw || result1.predicted_price_lkr_lakhs * 100000, selectedCurrency) : null;
  const price2 = result2 ? convertFromLKR(result2.predicted_price_lkr_raw || result2.predicted_price_lkr_lakhs * 100000, selectedCurrency) : null;

  const rawDiff = result1 && result2 ? (result1.predicted_price_lkr_raw || result1.predicted_price_lkr_lakhs * 100000) - (result2.predicted_price_lkr_raw || result2.predicted_price_lkr_lakhs * 100000) : 0;
  const diffConverted = convertFromLKR(Math.abs(rawDiff), selectedCurrency);
  const percentDiff = result2 && result2.predicted_price_lkr_lakhs > 0 ? ((rawDiff / (result2.predicted_price_lkr_raw || result2.predicted_price_lkr_lakhs * 100000)) * 100).toFixed(1) : 0;

  return (
    <Box className="form-card-enter">
      {/* Header */}
      <Card className="glass-panel" sx={{ borderRadius: 4, mb: 3.5 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #FFB703 0%, #FB8500 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 18px rgba(255, 183, 3, 0.35)',
              }}
            >
              <CompareArrowsIcon sx={{ color: '#031024', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="800">
                Side-by-Side Vehicle Valuation Comparator
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure two cars to evaluate valuation differences, depreciation curves, and feature premiums
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Dual Vehicle Form Cards */}
      <Grid container spacing={3.5} mb={3.5}>
        {/* Car 1 Config */}
        <Grid item xs={12} md={6}>
          <Card className="glass-panel" sx={{ borderRadius: 3, p: 3, border: '1px solid rgba(0, 229, 255, 0.25)' }}>
            <Box display="flex" alignItems="center" gap={1} mb={2.5}>
              <Chip label="VEHICLE A" color="primary" sx={{ fontWeight: 800 }} />
              <Typography variant="h6" fontWeight="bold">
                {car1.brand} {car1.model} ({car1.yom})
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Brand</InputLabel>
                  <Select
                    value={car1.brand}
                    label="Brand"
                    onChange={(e) => {
                      const val = e.target.value;
                      const mList = brandModelsMap[val.toUpperCase()] || [];
                      setCar1({ ...car1, brand: val, model: mList[0] || 'OTHER' });
                    }}
                  >
                    {brands.map((b) => (
                      <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Model</InputLabel>
                  <Select value={car1.model} label="Model" onChange={(e) => setCar1({ ...car1, model: e.target.value })}>
                    {car1Models.map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Year (YOM)"
                  value={car1.yom}
                  onChange={(e) => setCar1({ ...car1, yom: Number(e.target.value) })}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Mileage (KM)"
                  value={car1.mileage_km}
                  onChange={(e) => setCar1({ ...car1, mileage_km: Number(e.target.value) })}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Engine (CC)"
                  value={car1.engine_cc}
                  onChange={(e) => setCar1({ ...car1, engine_cc: Number(e.target.value) })}
                />
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Fuel Type</InputLabel>
                  <Select value={car1.fuel_type} label="Fuel Type" onChange={(e) => setCar1({ ...car1, fuel_type: e.target.value })}>
                    {fuelTypes.map((f) => (
                      <MenuItem key={f} value={f}>{f}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Transmission</InputLabel>
                  <Select value={car1.gear} label="Transmission" onChange={(e) => setCar1({ ...car1, gear: e.target.value })}>
                    {gears.map((g) => (
                      <MenuItem key={g} value={g}>{g}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Car 2 Config */}
        <Grid item xs={12} md={6}>
          <Card className="glass-panel" sx={{ borderRadius: 3, p: 3, border: '1px solid rgba(255, 183, 3, 0.25)' }}>
            <Box display="flex" alignItems="center" gap={1} mb={2.5}>
              <Chip label="VEHICLE B" color="secondary" sx={{ fontWeight: 800 }} />
              <Typography variant="h6" fontWeight="bold">
                {car2.brand} {car2.model} ({car2.yom})
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Brand</InputLabel>
                  <Select
                    value={car2.brand}
                    label="Brand"
                    onChange={(e) => {
                      const val = e.target.value;
                      const mList = brandModelsMap[val.toUpperCase()] || [];
                      setCar2({ ...car2, brand: val, model: mList[0] || 'OTHER' });
                    }}
                  >
                    {brands.map((b) => (
                      <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Model</InputLabel>
                  <Select value={car2.model} label="Model" onChange={(e) => setCar2({ ...car2, model: e.target.value })}>
                    {car2Models.map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Year (YOM)"
                  value={car2.yom}
                  onChange={(e) => setCar2({ ...car2, yom: Number(e.target.value) })}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Mileage (KM)"
                  value={car2.mileage_km}
                  onChange={(e) => setCar2({ ...car2, mileage_km: Number(e.target.value) })}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Engine (CC)"
                  value={car2.engine_cc}
                  onChange={(e) => setCar2({ ...car2, engine_cc: Number(e.target.value) })}
                />
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Fuel Type</InputLabel>
                  <Select value={car2.fuel_type} label="Fuel Type" onChange={(e) => setCar2({ ...car2, fuel_type: e.target.value })}>
                    {fuelTypes.map((f) => (
                      <MenuItem key={f} value={f}>{f}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Transmission</InputLabel>
                  <Select value={car2.gear} label="Transmission" onChange={(e) => setCar2({ ...car2, gear: e.target.value })}>
                    {gears.map((g) => (
                      <MenuItem key={g} value={g}>{g}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Error Notice if any */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Action Button */}
        <Grid item xs={12} textAlign="center">
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleCompare}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CompareArrowsIcon />}
            sx={{ px: 5, py: 1.5, fontSize: '1.05rem' }}
          >
            {loading ? 'Evaluating Dual Valuations...' : 'Compare Market Valuations'}
          </Button>
        </Grid>
      </Grid>

      {/* Comparison Results Card */}
      {result1 && result2 && (
        <Card className="glass-panel form-card-enter" sx={{ borderRadius: 4, p: 3.5, mb: 3 }}>
          {/* Comparison Banner */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: 3,
              backgroundColor: 'rgba(11, 15, 25, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mb: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight="700" letterSpacing="0.08em">
              VALUATION DELTA ({selectedCurrency})
            </Typography>
            <Typography variant="h4" fontWeight="900" sx={{ color: rawDiff >= 0 ? '#00E5FF' : '#FFB703', my: 1 }}>
              {rawDiff >= 0 ? `Vehicle A is ${diffConverted.formatted} higher` : `Vehicle B is ${diffConverted.formatted} higher`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Difference of {Math.abs(percentDiff)}% between configurations
            </Typography>
          </Box>

          {/* Side by Side Valuation Table */}
          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#94A3B8', fontWeight: 'bold' }}>Parameter</TableCell>
                  <TableCell sx={{ color: '#00E5FF', fontWeight: 'bold' }}>Vehicle A ({car1.brand} {car1.model})</TableCell>
                  <TableCell sx={{ color: '#FFB703', fontWeight: 'bold' }}>Vehicle B ({car2.brand} {car2.model})</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ color: '#F8FAFC', fontWeight: 600 }}>Estimated Valuation ({selectedCurrency})</TableCell>
                  <TableCell sx={{ color: '#00E5FF', fontWeight: 800, fontSize: '1.15rem' }}>{price1?.formatted}</TableCell>
                  <TableCell sx={{ color: '#FFB703', fontWeight: 800, fontSize: '1.15rem' }}>{price2?.formatted}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#94A3B8' }}>LKR Base Valuation</TableCell>
                  <TableCell sx={{ color: '#F8FAFC' }}>Rs. {result1.predicted_price_lkr_lakhs} Lakhs</TableCell>
                  <TableCell sx={{ color: '#F8FAFC' }}>Rs. {result2.predicted_price_lkr_lakhs} Lakhs</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#94A3B8' }}>95% Confidence Range</TableCell>
                  <TableCell sx={{ color: '#F8FAFC' }}>
                    Rs. {result1.confidence_interval?.min_lkr_lakhs}L – {result1.confidence_interval?.max_lkr_lakhs}L
                  </TableCell>
                  <TableCell sx={{ color: '#F8FAFC' }}>
                    Rs. {result2.confidence_interval?.min_lkr_lakhs}L – {result2.confidence_interval?.max_lkr_lakhs}L
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#94A3B8' }}>Year of Manufacture</TableCell>
                  <TableCell sx={{ color: '#F8FAFC' }}>{car1.yom}</TableCell>
                  <TableCell sx={{ color: '#F8FAFC' }}>{car2.yom}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#94A3B8' }}>Mileage</TableCell>
                  <TableCell sx={{ color: '#F8FAFC' }}>{Number(car1.mileage_km).toLocaleString()} KM</TableCell>
                  <TableCell sx={{ color: '#F8FAFC' }}>{Number(car2.mileage_km).toLocaleString()} KM</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#94A3B8' }}>Engine Capacity</TableCell>
                  <TableCell sx={{ color: '#F8FAFC' }}>{car1.engine_cc} cc</TableCell>
                  <TableCell sx={{ color: '#F8FAFC' }}>{car2.engine_cc} cc</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#94A3B8' }}>Powertrain & Gear</TableCell>
                  <TableCell sx={{ color: '#F8FAFC' }}>{car1.fuel_type} / {car1.gear}</TableCell>
                  <TableCell sx={{ color: '#F8FAFC' }}>{car2.fuel_type} / {car2.gear}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ color: '#94A3B8' }}>5-Year Retained Value</TableCell>
                  <TableCell sx={{ color: '#00E5FF', fontWeight: 700 }}>~74.8%</TableCell>
                  <TableCell sx={{ color: '#FFB703', fontWeight: 700 }}>~74.8%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
