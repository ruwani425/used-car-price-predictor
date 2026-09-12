import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Switch,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SecurityIcon from '@mui/icons-material/Security';
import { convertFromLKR } from '../utils/currencyUtils';

const API_BASE = 'http://localhost:5000';

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

  const [car1Models, setCar1Models] = useState([]);
  const [car2Models, setCar2Models] = useState([]);

  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cascading Models for Car 1
  useEffect(() => {
    const list = brandModelsMap[car1.brand.toUpperCase()] || [];
    setCar1Models(list.length > 0 ? list : ['OTHER']);
    if (list.length > 0 && !list.includes(car1.model.toUpperCase())) {
      setCar1((prev) => ({ ...prev, model: list[0] }));
    }
  }, [car1.brand, metadata]);

  // Cascading Models for Car 2
  useEffect(() => {
    const list = brandModelsMap[car2.brand.toUpperCase()] || [];
    setCar2Models(list.length > 0 ? list : ['OTHER']);
    if (list.length > 0 && !list.includes(car2.model.toUpperCase())) {
      setCar2((prev) => ({ ...prev, model: list[0] }));
    }
  }, [car2.brand, metadata]);

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
                  <Select value={car1.brand} label="Brand" onChange={(e) => setCar1({ ...car1, brand: e.target.value })}>
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
                <FormControl fullWidth size="small">
                  <InputLabel>Engine (cc)</InputLabel>
                  <Select value={car1.engine_cc} label="Engine (cc)" onChange={(e) => setCar1({ ...car1, engine_cc: Number(e.target.value) })}>
                    {[660, 1000, 1300, 1500, 1800, 2000, 2500].map((cc) => (
                      <MenuItem key={cc} value={cc}>{cc} cc</MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                  <Select value={car2.brand} label="Brand" onChange={(e) => setCar2({ ...car2, brand: e.target.value })}>
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
                <FormControl fullWidth size="small">
                  <InputLabel>Engine (cc)</InputLabel>
                  <Select value={car2.engine_cc} label="Engine (cc)" onChange={(e) => setCar2({ ...car2, engine_cc: Number(e.target.value) })}>
                    {[660, 1000, 1300, 1500, 1800, 2000, 2500].map((cc) => (
                      <MenuItem key={cc} value={cc}>{cc} cc</MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
            <Typography variant="h5" fontWeight="800" color="#F8FAFC" mb={0.5}>
              {rawDiff > 0
                ? `${car1.brand} ${car1.model} is valued ${diffConverted.formatted} higher (+${percentDiff}%)`
                : rawDiff < 0
                ? `${car2.brand} ${car2.model} is valued ${diffConverted.formatted} higher (+${Math.abs(percentDiff)}%)`
                : 'Both vehicles have identical estimated market values'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comparison generated based on Sri Lankan used vehicle secondary market regression pipeline
            </Typography>
          </Box>

          {/* Comparison Table */}
          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                  <TableCell sx={{ color: '#94A3B8', fontWeight: 700 }}>Comparison Attribute</TableCell>
                  <TableCell align="center" sx={{ color: '#00E5FF', fontWeight: 800 }}>
                    Vehicle A ({car1.brand} {car1.model})
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#FFB703', fontWeight: 800 }}>
                    Vehicle B ({car2.brand} {car2.model})
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Price Row */}
                <TableRow sx={{ backgroundColor: 'rgba(0, 229, 255, 0.04)' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#F8FAFC' }}>Estimated Market Valuation</TableCell>
                  <TableCell align="center">
                    <Typography variant="h6" fontWeight="800" color="#00E5FF">
                      {price1.formatted}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Rs. {result1.predicted_price_lkr_lakhs} Lakhs
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="h6" fontWeight="800" color="#FFB703">
                      {price2.formatted}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Rs. {result2.predicted_price_lkr_lakhs} Lakhs
                    </Typography>
                  </TableCell>
                </TableRow>

                {/* YOM & Age */}
                <TableRow>
                  <TableCell sx={{ color: '#94A3B8' }}>Manufacture Year & Age</TableCell>
                  <TableCell align="center" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
                    {car1.yom} ({2025 - car1.yom} Years Old)
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
                    {car2.yom} ({2025 - car2.yom} Years Old)
                  </TableCell>
                </TableRow>

                {/* Mileage */}
                <TableRow>
                  <TableCell sx={{ color: '#94A3B8' }}>Odometer Mileage</TableCell>
                  <TableCell align="center" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
                    {Number(car1.mileage_km).toLocaleString()} KM
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
                    {Number(car2.mileage_km).toLocaleString()} KM
                  </TableCell>
                </TableRow>

                {/* Engine CC */}
                <TableRow>
                  <TableCell sx={{ color: '#94A3B8' }}>Engine Capacity & Fuel</TableCell>
                  <TableCell align="center" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
                    {car1.engine_cc} cc ({car1.fuel_type})
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
                    {car2.engine_cc} cc ({car2.fuel_type})
                  </TableCell>
                </TableRow>

                {/* Transmission */}
                <TableRow>
                  <TableCell sx={{ color: '#94A3B8' }}>Transmission</TableCell>
                  <TableCell align="center" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
                    {car1.gear}
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#F8FAFC', fontWeight: 600 }}>
                    {car2.gear}
                  </TableCell>
                </TableRow>

                {/* 5-Year Projected Depreciation */}
                <TableRow sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#F8FAFC' }}>5-Year Projected Value (2029)</TableCell>
                  <TableCell align="center">
                    <Typography variant="body1" fontWeight="700" color="#00E5FF">
                      Rs. {result1.depreciation_projection?.[4]?.projected_price_lkr_lakhs || '—'} Lakhs
                    </Typography>
                    <Typography variant="caption" color="#EF4444">
                      -{(
                        ((result1.predicted_price_lkr_lakhs -
                          (result1.depreciation_projection?.[4]?.projected_price_lkr_lakhs || result1.predicted_price_lkr_lakhs)) /
                          result1.predicted_price_lkr_lakhs) *
                        100
                      ).toFixed(1)}% Depreciation
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body1" fontWeight="700" color="#FFB703">
                      Rs. {result2.depreciation_projection?.[4]?.projected_price_lkr_lakhs || '—'} Lakhs
                    </Typography>
                    <Typography variant="caption" color="#EF4444">
                      -{(
                        ((result2.predicted_price_lkr_lakhs -
                          (result2.depreciation_projection?.[4]?.projected_price_lkr_lakhs || result2.predicted_price_lkr_lakhs)) /
                          result2.predicted_price_lkr_lakhs) *
                        100
                      ).toFixed(1)}% Depreciation
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
