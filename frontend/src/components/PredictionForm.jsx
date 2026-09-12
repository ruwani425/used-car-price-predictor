import { useState } from 'react';
import {
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
  Divider,
  Switch,
  Chip,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SpeedIcon from '@mui/icons-material/Speed';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import WindowIcon from '@mui/icons-material/Window';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

// Default fallback metadata in case backend is loading
const FALLBACK_BRANDS = ['TOYOTA', 'SUZUKI', 'NISSAN', 'HONDA', 'MITSUBISHI', 'HYUNDAI', 'MAZDA', 'MERCEDES-BENZ', 'BMW', 'AUDI'];
const FALLBACK_MODELS = {
  TOYOTA: ['AXIO', 'PREMIO', 'VITZ', 'ALLION', 'COROLLA', 'AQUA', 'YARIS', 'PRIUS', 'LAND CRUISER PRADO', 'PASSO', 'RUSH'],
  SUZUKI: ['WAGON R', 'ALTO', 'SWIFT', 'SPACIA', 'CELERIO', 'EVERY', 'HUSTLER', 'BALENO'],
  NISSAN: ['SUNNY', 'LEAF', 'X-TRAIL', 'MARCH', 'DAYZ', 'BLUEBIRD', 'TIIDA', 'NAVARA'],
  HONDA: ['CIVIC', 'FIT', 'VEZEL', 'GRACE', 'INSIGHT', 'CR-V', 'ACCORD', 'SHUTTLE'],
};
const FALLBACK_TOWNS = ['Colombo', 'Gampaha', 'Kandy', 'Kurunegala', 'Kalutara', 'Negombo', 'Galle', 'Matara', 'Ratnapura', 'Anuradhapura'];

export default function PredictionForm({
  metadata = {},
  onSubmit,
  loading = false,
  selectedCurrency = 'LKR',
}) {
  const brands = metadata?.unique_brands?.length ? metadata.unique_brands : FALLBACK_BRANDS;
  const brandModelsMap = metadata?.brand_models_map || FALLBACK_MODELS;
  const towns = metadata?.unique_towns?.length ? metadata.unique_towns : FALLBACK_TOWNS;
  const fuelTypes = metadata?.unique_fuel_types?.length ? metadata.unique_fuel_types : ['Petrol', 'Hybrid', 'Diesel', 'Electric'];
  const gears = metadata?.unique_gears?.length ? metadata.unique_gears : ['Automatic', 'Manual'];

  // Form State
  const [formData, setFormData] = useState({
    brand: 'TOYOTA',
    model: 'AXIO',
    yom: 2017,
    engine_cc: 1500,
    gear: 'Automatic',
    fuel_type: 'Hybrid',
    mileage_km: 75000,
    town: 'Colombo',
    condition: 'USED',
    leasing: 'No Leasing',
    air_condition: true,
    power_steering: true,
    power_mirror: true,
    power_window: true,
  });

  // Dynamically derive available models based on selected brand
  const brandKey = formData.brand.toUpperCase();
  const availableModels =
    brandModelsMap[brandKey] && brandModelsMap[brandKey].length > 0
      ? brandModelsMap[brandKey]
      : ['OTHER'];

  // Compute live Luxury Score (0 to 4)
  const luxuryScore = (formData.air_condition ? 1 : 0) +
                      (formData.power_steering ? 1 : 0) +
                      (formData.power_mirror ? 1 : 0) +
                      (formData.power_window ? 1 : 0);

  const handleInputChange = (field, value) => {
    if (field === 'brand') {
      const bKey = String(value).toUpperCase();
      const modelsForBrand = brandModelsMap[bKey] || [];
      const defaultModel = modelsForBrand.length > 0 ? modelsForBrand[0] : 'OTHER';
      setFormData((prev) => ({
        ...prev,
        brand: value,
        model: defaultModel,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      const payload = {
        ...formData,
        yom: Number(formData.yom),
        engine_cc: Number(formData.engine_cc),
        mileage_km: Number(formData.mileage_km),
        air_condition: formData.air_condition ? 'Available' : 'Not_Available',
        power_steering: formData.power_steering ? 'Available' : 'Not_Available',
        power_mirror: formData.power_mirror ? 'Available' : 'Not_Available',
        power_window: formData.power_window ? 'Available' : 'Not_Available',
        target_currency: selectedCurrency,
      };
      onSubmit(payload);
    }
  };

  const handleReset = () => {
    setFormData({
      brand: 'TOYOTA',
      model: 'AXIO',
      yom: 2017,
      engine_cc: 1500,
      gear: 'Automatic',
      fuel_type: 'Hybrid',
      mileage_km: 75000,
      town: 'Colombo',
      condition: 'USED',
      leasing: 'No Leasing',
      air_condition: true,
      power_steering: true,
      power_mirror: true,
      power_window: true,
    });
  };

  return (
    <Card className="glass-panel form-card-enter" sx={{ borderRadius: 4, overflow: 'hidden' }}>
      {/* Header Banner */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.12) 0%, rgba(19, 28, 46, 0.4) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          p: 3,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                backgroundColor: 'rgba(0, 229, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DirectionsCarIcon sx={{ color: '#00E5FF' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Vehicle Specifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter car details to generate AI valuation with ML regression pipeline
              </Typography>
            </Box>
          </Box>

          {/* Quick Stats Pill */}
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: '#FFB703' }} />}
            label={`Luxury Amenity Index: ${luxuryScore} / 4`}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 183, 3, 0.12)',
              color: '#FFB703',
              border: '1px solid rgba(255, 183, 3, 0.3)',
              fontWeight: 700,
            }}
          />
        </Box>
      </Box>

      {/* Form Content */}
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2.5}>
            {/* 1. Brand (Cascading Parent) */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="brand-select-label">Vehicle Brand</InputLabel>
                <Select
                  labelId="brand-select-label"
                  label="Vehicle Brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {brands.map((b) => (
                    <MenuItem key={b} value={b}>
                      {b}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 2. Model (Cascading Child) */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="model-select-label">Vehicle Model</InputLabel>
                <Select
                  labelId="model-select-label"
                  label="Vehicle Model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {availableModels.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 3. Year of Manufacture (YOM) */}
            <Grid item xs={12} sm={6}>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" fontWeight="600" color="text.secondary">
                    Year of Manufacture (YOM)
                  </Typography>
                  <Typography variant="caption" fontWeight="700" color="#00E5FF">
                    {formData.yom} ({2025 - formData.yom} Years Old)
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ min: 1960, max: 2026 }}
                  value={formData.yom}
                  onChange={(e) => handleInputChange('yom', Number(e.target.value))}
                />
                {/* Quick Year Chips */}
                <Box display="flex" gap={0.8} mt={1} flexWrap="wrap">
                  {[2023, 2020, 2018, 2015, 2012, 2008].map((yr) => (
                    <Chip
                      key={yr}
                      label={yr}
                      size="small"
                      clickable
                      onClick={() => handleInputChange('yom', yr)}
                      color={formData.yom === yr ? 'primary' : 'default'}
                      variant={formData.yom === yr ? 'filled' : 'outlined'}
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* 4. Mileage (KM) */}
            <Grid item xs={12} sm={6}>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" fontWeight="600" color="text.secondary">
                    Total Mileage (KM)
                  </Typography>
                  <Typography variant="caption" fontWeight="700" color="#00E5FF">
                    {Number(formData.mileage_km).toLocaleString()} KM
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  inputProps={{ min: 0, step: 1000 }}
                  value={formData.mileage_km}
                  onChange={(e) => handleInputChange('mileage_km', Number(e.target.value))}
                />
                {/* Quick Mileage Chips */}
                <Box display="flex" gap={0.8} mt={1} flexWrap="wrap">
                  {[25000, 50000, 75000, 100000, 150000].map((km) => (
                    <Chip
                      key={km}
                      label={`${km / 1000}k`}
                      size="small"
                      clickable
                      onClick={() => handleInputChange('mileage_km', km)}
                      color={formData.mileage_km === km ? 'primary' : 'default'}
                      variant={formData.mileage_km === km ? 'filled' : 'outlined'}
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* 5. Engine Capacity (cc) */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="engine-cc-label">Engine (cc)</InputLabel>
                <Select
                  labelId="engine-cc-label"
                  label="Engine (cc)"
                  value={formData.engine_cc}
                  onChange={(e) => handleInputChange('engine_cc', Number(e.target.value))}
                >
                  {[660, 990, 1000, 1200, 1300, 1500, 1800, 2000, 2500, 3000].map((cc) => (
                    <MenuItem key={cc} value={cc}>
                      {cc} cc
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 6. Gear / Transmission */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="gear-select-label">Transmission</InputLabel>
                <Select
                  labelId="gear-select-label"
                  label="Transmission"
                  value={formData.gear}
                  onChange={(e) => handleInputChange('gear', e.target.value)}
                >
                  {gears.map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 7. Fuel Type */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel id="fuel-select-label">Fuel Type</InputLabel>
                <Select
                  labelId="fuel-select-label"
                  label="Fuel Type"
                  value={formData.fuel_type}
                  onChange={(e) => handleInputChange('fuel_type', e.target.value)}
                >
                  {fuelTypes.map((ft) => (
                    <MenuItem key={ft} value={ft}>
                      {ft}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 8. Location / Town */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="town-select-label">Town / City</InputLabel>
                <Select
                  labelId="town-select-label"
                  label="Town / City"
                  value={formData.town}
                  onChange={(e) => handleInputChange('town', e.target.value)}
                >
                  {towns.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 9. Condition & Leasing Status */}
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="condition-select-label">Condition</InputLabel>
                <Select
                  labelId="condition-select-label"
                  label="Condition"
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                >
                  <MenuItem value="USED">USED</MenuItem>
                  <MenuItem value="NEW">BRAND NEW</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="leasing-select-label">Leasing</InputLabel>
                <Select
                  labelId="leasing-select-label"
                  label="Leasing"
                  value={formData.leasing}
                  onChange={(e) => handleInputChange('leasing', e.target.value)}
                >
                  <MenuItem value="No Leasing">No Leasing</MenuItem>
                  <MenuItem value="Ongoing Lease">Ongoing Lease</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Divider for Luxury Options */}
            <Grid item xs={12}>
              <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
                <Typography variant="caption" color="text.secondary" fontWeight="600">
                  FACTORY LUXURY & POWER OPTIONS
                </Typography>
              </Divider>
            </Grid>

            {/* 10. Luxury Feature Toggles */}
            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  backgroundColor: formData.air_condition ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${formData.air_condition ? 'rgba(0, 229, 255, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <AcUnitIcon sx={{ fontSize: 18, color: formData.air_condition ? '#00E5FF' : 'text.disabled' }} />
                  <Typography variant="body2" fontWeight="600" fontSize="0.85rem">
                    Air Condition
                  </Typography>
                </Box>
                <Switch
                  size="small"
                  checked={formData.air_condition}
                  onChange={(e) => handleInputChange('air_condition', e.target.checked)}
                />
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  backgroundColor: formData.power_steering ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${formData.power_steering ? 'rgba(0, 229, 255, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <SpeedIcon sx={{ fontSize: 18, color: formData.power_steering ? '#00E5FF' : 'text.disabled' }} />
                  <Typography variant="body2" fontWeight="600" fontSize="0.85rem">
                    Power Steering
                  </Typography>
                </Box>
                <Switch
                  size="small"
                  checked={formData.power_steering}
                  onChange={(e) => handleInputChange('power_steering', e.target.checked)}
                />
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  backgroundColor: formData.power_mirror ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${formData.power_mirror ? 'rgba(0, 229, 255, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <FlipCameraAndroidIcon sx={{ fontSize: 18, color: formData.power_mirror ? '#00E5FF' : 'text.disabled' }} />
                  <Typography variant="body2" fontWeight="600" fontSize="0.85rem">
                    Power Mirrors
                  </Typography>
                </Box>
                <Switch
                  size="small"
                  checked={formData.power_mirror}
                  onChange={(e) => handleInputChange('power_mirror', e.target.checked)}
                />
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  backgroundColor: formData.power_window ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${formData.power_window ? 'rgba(0, 229, 255, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <WindowIcon sx={{ fontSize: 18, color: formData.power_window ? '#00E5FF' : 'text.disabled' }} />
                  <Typography variant="body2" fontWeight="600" fontSize="0.85rem">
                    Power Windows
                  </Typography>
                </Box>
                <Switch
                  size="small"
                  checked={formData.power_window}
                  onChange={(e) => handleInputChange('power_window', e.target.checked)}
                />
              </Box>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12} display="flex" gap={2} mt={1}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                sx={{ py: 1.5, fontSize: '1rem' }}
              >
                {loading ? 'Evaluating Market Valuation...' : 'Calculate Fair Market Valuation'}
              </Button>

              <Button
                variant="outlined"
                color="inherit"
                onClick={handleReset}
                disabled={loading}
                startIcon={<RestartAltIcon />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  px: 3,
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
}
