import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Stack,
  InputBase,
  Tooltip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  SearchOutlined,
  DirectionsCar,
  CloseOutlined,
  HistoryOutlined,
  RefreshOutlined,
  AccessTimeOutlined,
} from '@mui/icons-material';
import {
  selectVehicles,
  fetchVehiclesThunk,
  fetchHistoryThunk,
} from '../store/slices/vehiclesSlice';
import { motion } from 'framer-motion';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import { useAppTheme, DARK } from '../theme/ThemeContext';

// ── Glass card style ──────────────────────────────────────────────────────────
function getGlassSx(isDark) {
  return {
    background: isDark ? 'transparent' : 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: `1px solid ${isDark ? DARK.border : 'rgba(255,255,255,0.8)'}`,
    borderRadius: '32px',
    boxShadow: isDark ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.16)',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  };
}

function getInputSx(isDark) {
  return {
    flex: 1, border: 'none', outline: 'none',
    bgcolor: 'transparent',
    color: isDark ? DARK.text0 : '#111827', fontSize: '1.05rem', fontWeight: 500,
    fontFamily: 'Inter, system-ui, sans-serif',
    '&::placeholder': { color: isDark ? DARK.text3 : '#9ca3af' },
  };
}

// ── Animation Variants ────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

// ── Status helper ─────────────────────────────────────────────────────────────
function vehicleStatus(v) {
  const s = (v.status || '').toLowerCase();
  if (s === 'parked' || s === 'active' || s === 'checked_in') return 'Parked';
  if (s === 'checked_out' || s === 'exited') return 'Checked Out';
  return 'Registered';
}

function StatusChip({ v, isDark }) {
  const status = vehicleStatus(v);
  const cfg = {
    Parked:        { bg: isDark ? DARK.red : '#111827', color: '#ffffff', border: isDark ? DARK.red : '#111827' },
    'Checked Out': { bg: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)',  color: isDark ? DARK.text2 : '#4b5563', border: isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)' },
    Registered:    { bg: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)',  color: isDark ? DARK.text2 : '#4b5563', border: isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)' },
  }[status] || { bg: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)', color: isDark ? DARK.text2 : '#4b5563', border: isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)' };

  return (
    <Chip
      label={status}
      size="small"
      sx={{
        bgcolor: cfg.bg, color: cfg.color,
        border: `1px solid ${cfg.border}`,
        fontWeight: 700, fontSize: '0.75rem', borderRadius: '10px', px: 1
      }}
    />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TotalRevenuePage() {
  const dispatch = useDispatch();
  const { items: vehicles, status, error, history } = useSelector(selectVehicles);
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const [search,        setSearch]        = useState('');
  const [toast,         setToast]         = useState({ open: false, msg: '', severity: 'info' });
  const [historyOpen,   setHistoryOpen]   = useState(false);
  const [historyPlate,  setHistoryPlate]  = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  const [dateFilter, setDateFilter] = useState('');

  // ── Details Modal state ──────────────────────────────────────────────────
  const [detailsOpen,     setDetailsOpen]     = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // ── Load vehicles on mount ───────────────────────────────────────────────
  const reload = useCallback(() => {
    dispatch(fetchVehiclesThunk());
  }, [dispatch]);

  useEffect(() => {
    reload();
  }, [reload]);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = vehicles.filter((v) => {
    // Must have revenue to show in this list
    if (!v.revenue || Number(v.revenue) <= 0) return false;

    if (dateFilter && !String(v.exitTime || v.checkOutTime || v.entryTime || v.createdAt || '').startsWith(dateFilter)) return false;
    const plate = v.vehicleNumber || v.plateNumber || v.plate || '';
    const owner = v.ownerName     || v.owner       || '';
    return [plate, owner].join(' ').toLowerCase().includes(search.toLowerCase());
  });

  const totalRevenueAmount = filtered.reduce((acc, v) => acc + (Number(v.revenue) || 0), 0);

  const handleRowClick = (v) => {
    setSelectedVehicle(v);
    setDetailsOpen(true);
  };
  const handleViewHistory = async (v) => {
    const plate = v.vehicleNumber || v.plateNumber || v.plate;
    setHistoryPlate(plate);
    setHistoryOpen(true);
    setHistoryLoading(true);
    await dispatch(fetchHistoryThunk(plate));
    setHistoryLoading(false);
  };

  const isLoading = status === 'loading';

  return (
    <Box sx={{ minHeight: '100%', p: 1 }}>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          sx={{ bgcolor: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.2)', color: '#111827', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)' }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>

      {/* ── Page header ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px', mb: 0.5, color: isDark ? DARK.text0 : '#111827' }}>
              Total Revenue
            </Typography>
            <Typography variant="h3" sx={{ color: isDark ? DARK.text0 : '#111827', fontWeight: 800, mb: 0.5, letterSpacing: '-1px' }}>
              ₹{totalRevenueAmount}
            </Typography>
            <Typography variant="body2" fontWeight={500} sx={{ color: isDark ? DARK.text2 : '#6b7280' }}>
              From {filtered.length} checked-out vehicle{filtered.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Tooltip title="Refresh">
              <IconButton
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setDateFilter(''); reload(); }}
                size="medium"
                sx={{
                  bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)', border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`,
                  color: isDark ? DARK.text2 : '#4b5563', borderRadius: '16px',
                  '&:hover': { bgcolor: isDark ? DARK.bg2 : 'rgba(0, 0, 0, 0.2)' },
                }}
              >
                <RefreshOutlined sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, background: isDark ? DARK.bg2 : 'rgba(255,255,255,0.7)', p: 0.5, px: 2, borderRadius: '16px', border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}` }}>
                <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? DARK.text2 : '#4b5563' }}>Filter Month:</Typography>
                <DatePicker
                  views={['year', 'month']}
                  value={dateFilter ? dayjs(dateFilter) : null}
                  onChange={(newValue) => setDateFilter(newValue ? newValue.format('YYYY-MM') : '')}
                  slotProps={{
                    textField: {
                      variant: 'standard',
                      InputProps: { disableUnderline: true },
                      sx: {
                        width: '140px',
                        '& .MuiInputBase-input': {
                          color: isDark ? DARK.text0 : '#111827',
                          fontWeight: 600,
                          py: 0.5,
                        },
                        '& .MuiIconButton-root': {
                          color: isDark ? DARK.text2 : '#4b5563',
                          p: 0.5,
                        }
                      }
                    },
                    popper: {
                      sx: {
                        '& .MuiPaper-root': {
                          borderRadius: '24px',
                          boxShadow: isDark ? `0 12px 48px rgba(0,0,0,0.4)` : '0 12px 48px rgba(0, 0, 0, 0.2)',
                          border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)'}`,
                          bgcolor: isDark ? DARK.bg1 : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(24px)',
                          '& .MuiTypography-root': { color: isDark ? DARK.text0 : undefined },
                          '& .MuiIconButton-root': { color: isDark ? DARK.text1 : undefined },
                          '& .MuiPickersDay-root': { color: isDark ? DARK.text0 : undefined, '&:hover': { bgcolor: isDark ? DARK.bg2 : undefined } },
                          '& .MuiPickersDay-root.Mui-selected': { bgcolor: isDark ? `${DARK.red} !important` : undefined, color: '#fff !important' },
                          '& .MuiDayCalendar-weekDayLabel': { color: isDark ? DARK.text3 : undefined }
                        }
                      }
                    }
                  }}
                />
              </Box>
            </LocalizationProvider>
          </Box>
        </Box>
      </motion.div>

      {/* ── API error ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px' }}>
          {error}
        </Alert>
      )}

      {/* ── Search bar ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Box
          sx={{
            ...getGlassSx(isDark),
            display: 'flex', alignItems: 'center', gap: 2,
            px: 3, py: 2, mb: 4,
            '&:focus-within': { borderColor: isDark ? DARK.red : '#111827', bgcolor: isDark ? DARK.bg1 : 'rgba(255,255,255,0.9)', boxShadow: isDark ? `0 12px 48px rgba(239,68,68,0.15)` : '0 12px 48px rgba(0, 0, 0, 0.16)' },
          }}
        >
          <SearchOutlined sx={{ color: isDark ? DARK.text3 : '#9ca3af', fontSize: 24 }} />
          <InputBase
            placeholder="Search by plate or owner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={getInputSx(isDark)}
          />
          {search && (
            <IconButton size="small" onClick={() => setSearch('')} sx={{ color: isDark ? DARK.text3 : '#9ca3af' }}>
              <CloseOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          )}
        </Box>
      </motion.div>

      {/* ── Vehicle table ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Box sx={getGlassSx(isDark)}>

          {/* Table header */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1.2fr 1.4fr 1fr 180px',
            px: 4, py: 3,
            borderBottom: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)'}`,
            bgcolor: isDark ? DARK.bg2 : 'rgba(0,0,0,0.02)',
            borderRadius: '32px 32px 0 0',
          }}>
            {['Owner', 'Vehicle No.', 'Time Parked', 'Revenue', 'Actions'].map((h) => (
              <Typography key={h} sx={{ fontSize: '0.8rem', fontWeight: 800, color: isDark ? DARK.text2 : '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {h}
              </Typography>
            ))}
          </Box>

          {/* Loading */}
          {isLoading && (
            <Box sx={{ py: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3 }}>
              <CircularProgress size={32} sx={{ color: isDark ? DARK.text0 : '#111827' }} />
              <Typography variant="h6" fontWeight={600} sx={{ color: isDark ? DARK.text2 : '#4b5563' }}>Loading vehicles…</Typography>
            </Box>
          )}

          {/* Empty */}
          {!isLoading && filtered.length === 0 && (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <DirectionsCar sx={{ fontSize: 80, color: isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)', mb: 3 }} />
              <Typography variant="h5" fontWeight={700} mb={2} sx={{ color: isDark ? DARK.text2 : '#4b5563' }}>
                {search ? 'No vehicles match your search.' : 'No revenue-generating vehicles found.'}
              </Typography>
            </Box>
          )}

          {/* Rows */}
          {!isLoading && filtered.length > 0 && (
            <Box component={motion.div} variants={containerVariants} initial="hidden" animate="show">
              <Stack spacing={0} divider={<Divider sx={{ borderColor: isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)' }} />}>
                {filtered.map((v, idx) => (
                  <VehicleRow
                    key={v._id || v.id || idx}
                    vehicle={v}
                    isLast={idx === filtered.length - 1}
                    onHistory={() => handleViewHistory(v)}
                    onClick={() => handleRowClick(v)}
                    isDark={isDark}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </motion.div>

      {/* ── History Modal ── */}
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: isDark ? DARK.bg2 : '#ffffff',
            border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`,
            borderRadius: '32px',
            boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.4)' : '0 24px 64px rgba(0, 0, 0, 0.25)',
          }
        }}
      >
        <DialogTitle sx={{ color: isDark ? DARK.text0 : '#111827', fontWeight: 800, fontSize: '1.5rem', p: 4, pb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <HistoryOutlined sx={{ color: isDark ? DARK.text0 : '#111827', fontSize: 32 }} />
          History — {historyPlate}
        </DialogTitle>
        <DialogContent sx={{ px: 4, pb: 2 }}>
          {historyLoading ? (
            <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={40} sx={{ color: isDark ? DARK.text0 : '#111827' }} />
            </Box>
          ) : history.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <AccessTimeOutlined sx={{ fontSize: 64, color: isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)', mb: 3 }} />
              <Typography sx={{ color: isDark ? DARK.text2 : '#6b7280', fontWeight: 600 }} variant="h6">No history found for this plate.</Typography>
            </Box>
          ) : (
            <Stack spacing={2} mt={1}>
              {history.map((h, i) => (
                <Box key={h._id || i} sx={{
                  p: 3, borderRadius: '24px',
                  bgcolor: isDark ? DARK.bg1 : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)'}`,
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? DARK.text0 : '#111827' }}>
                      {h.vehicleNumber || h.plateNumber || historyPlate}
                    </Typography>
                    <StatusChip v={h} isDark={isDark} />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                       <Typography variant="body1" fontWeight={700} sx={{ color: isDark ? DARK.text2 : '#6b7280' }}>Check-In:</Typography>
                       <Typography variant="body1" fontWeight={600} sx={{ color: isDark ? DARK.text0 : '#111827' }}>{(h.entryTime || h.checkInTime || h.createdAt) ? new Date(h.entryTime || h.checkInTime || h.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                       <Typography variant="body1" fontWeight={700} sx={{ color: isDark ? DARK.text2 : '#6b7280' }}>Check-Out:</Typography>
                       <Typography variant="body1" fontWeight={600} sx={{ color: isDark ? DARK.text0 : '#111827' }}>{(h.exitTime || h.checkOutTime) ? new Date(h.exitTime || h.checkOutTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 2, bgcolor: isDark ? DARK.bg1 : 'rgba(0,0,0,0.02)', borderRadius: '0 0 32px 32px' }}>
          <Button
            onClick={() => setHistoryOpen(false)}
            sx={{ color: isDark ? DARK.text0 : '#111827', fontWeight: 700, borderRadius: '16px', px: 4, py: 1.5, bgcolor: isDark ? DARK.bg3 : 'rgba(0, 0, 0, 0.12)', '&:hover': { bgcolor: isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)' } }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Modal */}
      <VehicleDetailsModal
        open={detailsOpen}
        vehicle={selectedVehicle}
        onClose={() => setDetailsOpen(false)}
        isDark={isDark}
      />
    </Box>
  );
}

// ── Row sub-component ─────────────────────────────────────────────────────────
function VehicleRow({ vehicle: v, isLast, onHistory, onClick, isDark }) {
  const entryRaw  = v.entryTime || v.createdAt || v.checkInTime;
  
  let timeParked = '—';
  if (entryRaw) {
    const end = (v.exitTime || v.checkOutTime) ? new Date(v.exitTime || v.checkOutTime) : new Date();
    const diffMs = end - new Date(entryRaw);
    if (diffMs > 0) {
      const hours = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      timeParked = `${hours}h ${mins}m`;
    }
  }

  const plate    = v.vehicleNumber || v.plateNumber || v.plate || '—';
  const owner    = v.ownerName     || v.owner       || '—';
  const revenue  = v.revenue ? `₹${v.revenue}` : '—';

  return (
    <motion.div variants={itemVariants}>
      <Box 
        onClick={onClick}
        sx={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1.2fr 1.4fr 1fr 180px',
        alignItems: 'center',
        px: 4, py: 3,
        borderRadius: isLast ? '0 0 32px 32px' : 0,
        cursor: 'pointer',
        transition: 'background 0.2s',
        '&:hover': { bgcolor: isDark ? DARK.bg1 : 'rgba(0,0,0,0.02)' },
      }}>
        {/* Owner */}
        <Typography variant="body1" fontWeight={700} noWrap sx={{ pr: 2, color: isDark ? DARK.text0 : '#111827' }}>
          {owner}
        </Typography>

        {/* Plate badge */}
        <Box>
          <Box component="span" sx={{
            display: 'inline-block', px: 2, py: 0.75,
            bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)', color: isDark ? DARK.text0 : '#111827',
            border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`,
            borderRadius: '12px', fontSize: '0.9rem',
            fontWeight: 800, fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase'
          }}>
            {plate}
          </Box>
        </Box>

        {/* Time Parked */}
        <Typography variant="body1" sx={{ fontWeight: 600, color: isDark ? DARK.text2 : '#4b5563' }}>{timeParked}</Typography>

        {/* Revenue */}
        <Typography variant="body1" sx={{ color: isDark ? DARK.text0 : '#111827', fontWeight: 800 }}>{revenue}</Typography>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View history">
            <IconButton
              size="medium"
              onClick={onHistory}
              sx={{
                bgcolor: isDark ? DARK.bg3 : 'rgba(0, 0, 0, 0.12)', color: isDark ? DARK.text1 : '#111827',
                borderRadius: '12px',
                '&:hover': { bgcolor: isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)' },
              }}
            >
              <HistoryOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </motion.div>
  );
}

// ── Details Modal Component ─────────────────────────────────────────────────────
function VehicleDetailsModal({ open, vehicle, onClose, isDark }) {
  if (!vehicle) return null;

  const timeParkedDisplay = (() => {
    const entry = vehicle.entryTime || vehicle.createdAt || vehicle.checkInTime;
    if (!entry) return '—';
    const end = (vehicle.exitTime || vehicle.checkOutTime) ? new Date(vehicle.exitTime || vehicle.checkOutTime) : new Date();
    const diff = end - new Date(entry);
    if (diff <= 0) return '—';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  })();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: isDark ? DARK.bg2 : '#ffffff', border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`, borderRadius: '32px', boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.4)' : '0 24px 64px rgba(0, 0, 0, 0.25)' } }}>
      <DialogTitle sx={{ color: isDark ? DARK.text0 : '#111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 4, pb: 3, fontSize: '1.5rem', fontWeight: 800 }}>
        Vehicle Details
      </DialogTitle>
      <DialogContent sx={{ px: 4, py: 2 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="caption" sx={{ color: isDark ? DARK.text2 : '#6b7280', fontWeight: 800, letterSpacing: '1px' }}>VEHICLE NUMBER</Typography>
            <Typography variant="h5" sx={{ color: isDark ? DARK.text0 : '#111827', fontFamily: 'monospace', mt: 0.5, fontWeight: 800, letterSpacing: '1px' }}>
              {vehicle.vehicleNumber || vehicle.plateNumber || vehicle.plate}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: isDark ? DARK.text2 : '#6b7280', fontWeight: 800, letterSpacing: '1px' }}>OWNER NAME</Typography>
            <Typography variant="h6" sx={{ color: isDark ? DARK.text0 : '#111827', mt: 0.5, fontWeight: 600 }}>{vehicle.ownerName || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: isDark ? DARK.text2 : '#6b7280', fontWeight: 800, letterSpacing: '1px' }}>PHONE NUMBER</Typography>
            <Typography variant="h6" sx={{ color: isDark ? DARK.text0 : '#111827', mt: 0.5, fontWeight: 600 }}>{vehicle.ownerPhoneNumber || '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: isDark ? DARK.text2 : '#6b7280', fontWeight: 800, letterSpacing: '1px' }}>PARKING SLOT</Typography>
            <Typography variant="h6" sx={{ color: isDark ? DARK.text0 : '#111827', mt: 0.5, fontWeight: 600 }}>{vehicle.parkingSlot || '—'}</Typography>
          </Box>
          <Box display="flex" gap={6} pt={2} borderTop={`1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)'}`}>
            <Box>
              <Typography variant="caption" sx={{ color: isDark ? DARK.text2 : '#6b7280', fontWeight: 800, letterSpacing: '1px' }}>TIME PARKED</Typography>
              <Typography variant="h6" sx={{ color: isDark ? DARK.text0 : '#111827', mt: 0.5, fontWeight: 700 }}>{timeParkedDisplay}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: isDark ? DARK.text2 : '#6b7280', fontWeight: 800, letterSpacing: '1px' }}>REVENUE</Typography>
              <Typography variant="h6" sx={{ color: isDark ? DARK.text0 : '#111827', fontWeight: 800, mt: 0.5 }}>{vehicle.revenue ? `₹${vehicle.revenue}` : '—'}</Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 4, pt: 3, display: 'flex', justifyContent: 'flex-end', bgcolor: isDark ? DARK.bg1 : 'rgba(0,0,0,0.02)', borderRadius: '0 0 32px 32px' }}>
        <Button onClick={onClose} sx={{ color: isDark ? DARK.text2 : '#6b7280', fontWeight: 700, borderRadius: '16px', px: 4, py: 1.5, '&:hover': { bgcolor: isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)' } }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
