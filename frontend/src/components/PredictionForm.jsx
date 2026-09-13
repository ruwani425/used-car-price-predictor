import { useState, useEffect } from 'react';
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

const FALLBACK_BRANDS = ['TOYOTA', 'SUZUKI', 'NISSAN', 'HONDA', 'MITSUBISHI', 'HYUNDAI', 'MAZDA', 'MERCEDES-BENZ', 'BMW', 'AUDI'];
const FALLBACK_MODELS = {
  TOYOTA: ['AXIO', 'PREMIO', 'VITZ', 'ALLION', 'COROLLA', 'AQUA', 'YARIS', 'PRIUS', 'LAND CRUISER PRADO', 'PASSO', 'RUSH'],
  SUZUKI: ['WAGON R', 'ALTO', 'SWIFT', 'SPACIA', 'CELERIO', 'EVERY', 'HUSTLER', 'BALENO'],
  NISSAN: ['SUNNY', 'LEAF', 'X-TRAIL', 'MARCH', 'DAYZ', 'BLUEBIRD', 'TIIDA', 'NAVARA'],
  HONDA: ['CIVIC', 'FIT', 'VEZEL', 'GRACE', 'INSIGHT', 'CR-V', 'ACCORD', 'SHUTTLE'],
};
const FALLBACK_TOWNS = ['Colombo', 'Gampaha', 'Kandy', 'Kurunegala', 'Kalutara', 'Negombo', 'Galle', 'Matara', 'Ratnapura', 'Anuradhapura'];

const INITIAL_STATE = {
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
};

export default function PredictionForm({
  metadata = {},
  onSubmit,
  loading = false,
  selectedCurrency = 'LKR',
  presetData = null,
}) {
  const brands = metadata?.unique_brands?.length ? metadata.unique_brands : FALLBACK_BRANDS;
  const brandModelsMap = metadata?.brand_models_map || FALLBACK_MODELS;
  const towns = metadata?.unique_towns?.length ? metadata.unique_towns : FALLBACK_TOWNS;
  const fuelTypes = metadata?.unique_fuel_types?.length ? metadata.unique_fuel_types : ['Petrol', 'Hybrid', 'Diesel', 'Electric'];
  const gears = metadata?.unique_gears?.length ? metadata.unique_gears : ['Automatic', 'Manual'];

  const [formData, setFormData] = useState(INITIAL_STATE);

  // Sync external preset if provided
  useEffect(() => {
    if (presetData) {
      setFormData(presetData);
    }
  }, [presetData]);

  const brandKey = (formData.brand || 'TOYOTA').toUpperCase();
  const availableModels =
    brandModelsMap[brandKey] && brandModelsMap[brandKey].length > 0
      ? brandModelsMap[brandKey]
      : ['OTHER'];

  const luxuryScore =
    (formData.air_condition ? 1 : 0) +
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
    setFormData(INITIAL_STATE);
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Header Banner */}
      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.2}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              backgroundColor: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DirectionsCarIcon sx={{ color: '#4F46E5', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
              Vehicle Specifications
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem' }}>
              Enter vehicle parameters to calculate real-time ML market valuation
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<AutoAwesomeIcon sx={{ fontSize: '13px !important', color: '#B45309' }} />}
          label={`Luxury Index: ${luxuryScore} / 4`}
          size="small"
          sx={{
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #FDE68A',
            fontWeight: 700,
            fontSize: '0.75rem',
          }}
        />
      </Box>

      {/* Form Content */}
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2.2}>
            {/* 1. Brand */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="brand-select-label">Vehicle Brand</InputLabel>
                <Select
                  labelId="brand-select-label"
                  label="Vehicle Brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                >
                  {brands.map((b) => (
                    <MenuItem key={b} value={b}>
                      {b}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 2. Model */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="model-select-label">Vehicle Model</InputLabel>
                <Select
                  labelId="model-select-label"
                  label="Vehicle Model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                >
                  {availableModels.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 3. Year of Manufacture */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={0.4}>
                  <Typography variant="caption" fontWeight="600" color="#475569">
                    Manufacture Year (YOM)
                  </Typography>
                  <Typography variant="caption" fontWeight="700" color="#4F46E5">
                    {formData.yom} ({2026 - formData.yom} Yrs Old)
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
                <Box display="flex" gap={0.6} mt={0.8} flexWrap="wrap">
                  {[2023, 2020, 2018, 2015, 2012, 2008].map((yr) => (
                    <Chip
                      key={yr}
                      label={yr}
                      size="small"
                      clickable
                      onClick={() => handleInputChange('yom', yr)}
                      sx={{
                        height: 22,
                        fontSize: '0.72rem',
                        backgroundColor: formData.yom === yr ? '#EEF2FF' : '#F8FAFC',
                        color: formData.yom === yr ? '#4F46E5' : '#64748B',
                        border: formData.yom === yr ? '1px solid #C7D2FE' : '1px solid #E2E8F0',
                        fontWeight: formData.yom === yr ? 700 : 500,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* 4. Mileage */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={0.4}>
                  <Typography variant="caption" fontWeight="600" color="#475569">
                    Total Mileage (KM)
                  </Typography>
                  <Typography variant="caption" fontWeight="700" color="#4F46E5">
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
                <Box display="flex" gap={0.6} mt={0.8} flexWrap="wrap">
                  {[25000, 50000, 75000, 100000, 150000].map((km) => (
                    <Chip
                      key={km}
                      label={`${km / 1000}k`}
                      size="small"
                      clickable
                      onClick={() => handleInputChange('mileage_km', km)}
                      sx={{
                        height: 22,
                        fontSize: '0.72rem',
                        backgroundColor: formData.mileage_km === km ? '#EEF2FF' : '#F8FAFC',
                        color: formData.mileage_km === km ? '#4F46E5' : '#64748B',
                        border: formData.mileage_km === km ? '1px solid #C7D2FE' : '1px solid #E2E8F0',
                        fontWeight: formData.mileage_km === km ? 700 : 500,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* 5. Engine Capacity */}
            <Grid size={{ xs: 12, sm: 4 }}>
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

            {/* 6. Transmission */}
            <Grid size={{ xs: 12, sm: 4 }}>
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
            <Grid size={{ xs: 12, sm: 4 }}>
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

            {/* 8. Location */}
            <Grid size={{ xs: 12, sm: 6 }}>
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

            {/* 9. Condition */}
            <Grid size={{ xs: 6, sm: 3 }}>
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

            {/* 10. Leasing */}
            <Grid size={{ xs: 6, sm: 3 }}>
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

            {/* Luxury Options Divider */}
            <Grid size={12}>
              <Divider sx={{ my: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, letterSpacing: '0.04em' }}>
                  FACTORY POWER & COMFORT OPTIONS
                </Typography>
              </Divider>
            </Grid>

            {/* 11. Luxury Feature Toggles */}
            <Grid size={{ xs: 6, sm: 3 }}>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  backgroundColor: formData.air_condition ? '#EEF2FF' : '#F8FAFC',
                  border: `1px solid ${formData.air_condition ? '#C7D2FE' : '#E2E8F0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box display="flex" alignItems="center" gap={0.8}>
                  <AcUnitIcon sx={{ fontSize: 17, color: formData.air_condition ? '#4F46E5' : '#94A3B8' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1E293B' }}>
                    A/C
                  </Typography>
                </Box>
                <Switch
                  size="small"
                  checked={formData.air_condition}
                  onChange={(e) => handleInputChange('air_condition', e.target.checked)}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  backgroundColor: formData.power_steering ? '#EEF2FF' : '#F8FAFC',
                  border: `1px solid ${formData.power_steering ? '#C7D2FE' : '#E2E8F0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box display="flex" alignItems="center" gap={0.8}>
                  <SpeedIcon sx={{ fontSize: 17, color: formData.power_steering ? '#4F46E5' : '#94A3B8' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1E293B' }}>
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

            <Grid size={{ xs: 6, sm: 3 }}>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  backgroundColor: formData.power_mirror ? '#EEF2FF' : '#F8FAFC',
                  border: `1px solid ${formData.power_mirror ? '#C7D2FE' : '#E2E8F0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box display="flex" alignItems="center" gap={0.8}>
                  <FlipCameraAndroidIcon sx={{ fontSize: 17, color: formData.power_mirror ? '#4F46E5' : '#94A3B8' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1E293B' }}>
                    Power Mirror
                  </Typography>
                </Box>
                <Switch
                  size="small"
                  checked={formData.power_mirror}
                  onChange={(e) => handleInputChange('power_mirror', e.target.checked)}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  backgroundColor: formData.power_window ? '#EEF2FF' : '#F8FAFC',
                  border: `1px solid ${formData.power_window ? '#C7D2FE' : '#E2E8F0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box display="flex" alignItems="center" gap={0.8}>
                  <WindowIcon sx={{ fontSize: 17, color: formData.power_window ? '#4F46E5' : '#94A3B8' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1E293B' }}>
                    Power Window
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
            <Grid size={12} display="flex" gap={1.5} mt={0.5}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
                sx={{ py: 1.3, fontSize: '0.92rem', fontWeight: 700 }}
              >
                {loading ? 'Calculating Fair Valuation...' : 'Calculate Fair Market Valuation'}
              </Button>

              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={loading}
                startIcon={<RestartAltIcon />}
                sx={{
                  borderColor: '#E2E8F0',
                  color: '#475569',
                  px: 2.5,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#CBD5E1',
                    backgroundColor: '#F8FAFC',
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
