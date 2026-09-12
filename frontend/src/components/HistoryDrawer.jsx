import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import RefreshIcon from '@mui/icons-material/Refresh';
import { convertFromLKR } from '../utils/currencyUtils';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function HistoryDrawer({
  open = false,
  onClose,
  selectedCurrency = 'LKR',
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/history`, { timeout: 4000 });
      if (res.data?.history) {
        setHistory(res.data.history);
      }
    } catch (err) {
      console.warn('Could not load history:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      let isSubscribed = true;
      const load = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`${API_BASE}/api/history`, { timeout: 4000 });
          if (isSubscribed && res.data?.history) {
            setHistory(res.data.history);
          }
        } catch (err) {
          console.warn('Could not load history:', err.message);
        } finally {
          if (isSubscribed) setLoading(false);
        }
      };
      load();
      return () => {
        isSubscribed = false;
      };
    }
  }, [open]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          backgroundColor: '#0B0F19',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          p: 3,
        },
      }}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <HistoryIcon sx={{ color: '#00E5FF' }} />
          <Typography variant="h6" fontWeight="bold">
            Valuation History
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton size="small" onClick={fetchHistory} disabled={loading}>
            <RefreshIcon sx={{ color: '#94A3B8' }} />
          </IconButton>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon sx={{ color: '#94A3B8' }} />
          </IconButton>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Recent vehicle valuations evaluated in this session:
      </Typography>

      <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* Content List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress size={30} color="primary" />
        </Box>
      ) : history.length === 0 ? (
        <Box textAlign="center" py={6}>
          <DirectionsCarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No past valuations recorded yet. Evaluate a car to save its estimate here.
          </Typography>
        </Box>
      ) : (
        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {history.map((item, idx) => {
            const car = item.requested_vehicle || {};
            const converted = convertFromLKR(
              item.predicted_price_lkr_raw || item.predicted_price_lkr_lakhs * 100000,
              selectedCurrency
            );

            return (
              <Box
                key={item.id || idx}
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(19, 28, 46, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'rgba(0, 229, 255, 0.3)',
                    backgroundColor: 'rgba(19, 28, 46, 0.95)',
                  },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                  <Typography variant="subtitle2" fontWeight="700" color="#F8FAFC">
                    {car.brand || 'Vehicle'} {car.model || ''} ({car.yom || ''})
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="800" color="#00E5FF">
                    {converted.formatted}
                  </Typography>
                </Box>

                <Box display="flex" gap={0.6} flexWrap="wrap" mb={1}>
                  <Chip label={`Rs. ${item.predicted_price_lkr_lakhs} Lakhs`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                  {car.mileage_km && (
                    <Chip label={`${Number(car.mileage_km).toLocaleString()} KM`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                  )}
                  {car.fuel_type && (
                    <Chip label={car.fuel_type} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                  )}
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </List>
      )}
    </Drawer>
  );
}
