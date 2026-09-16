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

const API_BASE = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : (import.meta.env.PROD ? '' : 'http://localhost:5000');

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
          width: { xs: '100%', sm: 400 },
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid #E2E8F0',
          p: 3,
        },
      }}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Box display="flex" alignItems="center" gap={1}>
          <HistoryIcon sx={{ color: '#4F46E5', fontSize: 22 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
            Valuation History
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <IconButton size="small" onClick={fetchHistory} disabled={loading} sx={{ color: '#64748B' }}>
            <RefreshIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ color: '#64748B' }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem', mb: 2 }}>
        Recent vehicle valuations evaluated in this session:
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Content List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress size={28} color="primary" />
        </Box>
      ) : history.length === 0 ? (
        <Box textAlign="center" py={6}>
          <DirectionsCarIcon sx={{ fontSize: 44, color: '#CBD5E1', mb: 1 }} />
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem' }}>
            No past valuations recorded yet. Evaluate a car to save its estimate here.
          </Typography>
        </Box>
      ) : (
        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
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
                  p: 1.8,
                  borderRadius: 2,
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: '#CBD5E1',
                    backgroundColor: '#F1F5F9',
                  },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.85rem' }}>
                    {car.brand || 'Vehicle'} {car.model || ''} ({car.yom || ''})
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#4F46E5', fontSize: '0.88rem' }}>
                    {converted.formatted}
                  </Typography>
                </Box>

                <Box display="flex" gap={0.5} flexWrap="wrap" mb={0.8}>
                  <Chip label={`Rs. ${item.predicted_price_lkr_lakhs} Lakhs`} size="small" sx={{ height: 18, fontSize: '0.68rem', bgcolor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', fontWeight: 600 }} />
                  {car.mileage_km && (
                    <Chip label={`${Number(car.mileage_km).toLocaleString()} KM`} size="small" sx={{ height: 18, fontSize: '0.68rem', bgcolor: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0' }} />
                  )}
                  {car.fuel_type && (
                    <Chip label={car.fuel_type} size="small" sx={{ height: 18, fontSize: '0.68rem', bgcolor: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0' }} />
                  )}
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
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
