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
  Add,
  SearchOutlined,
  DeleteOutlined,
  DirectionsCar,
  CloseOutlined,
  LogoutOutlined,
  HistoryOutlined,
  RefreshOutlined,
  LocalParking,
  AccessTimeOutlined,
  EditOutlined,
  PhoneOutlined,
  WhatsApp,
} from '@mui/icons-material';
import {
  selectVehicles,
  fetchVehiclesThunk,
  checkinVehicleThunk,
  checkoutVehicleThunk,
  fetchHistoryThunk,
  deleteVehicleThunk,
  updateVehicleThunk,
} from '../store/slices/vehiclesSlice';
import { vehicleRegex } from '../utils/validators';
import { useAppTheme, DARK } from '../theme/ThemeContext';
import PlateScannerModal from '../components/PlateScannerModal';
import { motion } from 'framer-motion';

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
    color: isDark ? DARK.text0 : '#111827', fontSize: '0.9rem',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 600,
    '&::placeholder': { color: isDark ? DARK.text3 : 'rgba(0,0,0,0.3)', fontWeight: 500 },
  };
}

function getFieldWrapSx(isDark) {
  return {
    display: 'flex', alignItems: 'center', gap: 1.25,
    px: 1.75, py: 1.35,
    bgcolor: isDark ? DARK.bg3 : 'rgba(255,255,255,0.8)',
    border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`,
    borderRadius: '16px',
    transition: 'all 0.2s',
    '&:focus-within': {
      borderColor: isDark ? DARK.red : '#111827',
      bgcolor: isDark ? DARK.bg1 : '#ffffff',
      boxShadow: isDark ? `0 0 0 4px ${DARK.redDim}` : '0 0 0 4px rgba(0, 0, 0, 0.12)',
    },
  };
}

function FieldLabel({ children, isDark }) {
  return (
    <Typography sx={{
      fontSize: '0.75rem', fontWeight: 700, mb: 0.75,
      color: isDark ? DARK.text2 : '#4b5563',
      textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>
      {children}
    </Typography>
  );
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
        fontWeight: 700, fontSize: '0.75rem', borderRadius: '10px'
      }}
    />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VehicleListPage() {
  const dispatch = useDispatch();
  const { items: vehicles, status, error, history } = useSelector(selectVehicles);
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const [search,        setSearch]        = useState('');
  const [showForm,      setShowForm]      = useState(false);
  const [toast,         setToast]         = useState({ open: false, msg: '', severity: 'info' });
  const [historyOpen,   setHistoryOpen]   = useState(false);
  const [historyPlate,  setHistoryPlate]  = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Check-in form state ──────────────────────────────────────────────────
  const [ownerName,        setOwnerName]        = useState('');
  const [ownerPhoneNumber, setOwnerPhoneNumber] = useState('');
  const [parkingSlot,      setParkingSlot]      = useState('');
  const [vehicleNumber,    setVehicleNumber]    = useState('');
  const [vehicleError,     setVehicleError]     = useState('');
  const [formError,        setFormError]        = useState('');
  const [submitting,       setSubmitting]       = useState(false);
  const [showScanner,      setShowScanner]      = useState(false);
  const [plateImage,       setPlateImage]       = useState(''); // base64 from scanner

  // ── Details Modal state ──────────────────────────────────────────────────
  const [detailsOpen,     setDetailsOpen]     = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // ── Confirmation Dialog state ─────────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', content: '', actionText: '', onConfirm: null });

  // ── Load vehicles on mount ───────────────────────────────────────────────
  const reload = useCallback(() => {
    dispatch(fetchVehiclesThunk());
  }, [dispatch]);

  useEffect(() => {
    reload();
  }, [reload]);

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = vehicles.filter((v) => {
    const isParked = !v.exitTime && !v.checkOutTime;
    if (!isParked) return false;

    const plate = v.vehicleNumber || v.plateNumber || v.plate || '';
    const owner = v.ownerName     || v.owner       || '';
    return [plate, owner].join(' ').toLowerCase().includes(search.toLowerCase());
  });

  // ── Check-in submit ──────────────────────────────────────────────────────
  const handleCheckin = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!ownerName.trim())     { setFormError('Owner name is required.'); return; }
    if (!ownerPhoneNumber.trim()) { setFormError('Owner phone number is required.'); return; }
    if (!parkingSlot.trim())   { setFormError('Parking slot is required.'); return; }
    if (!vehicleNumber.trim()) { setFormError('Vehicle number is required.'); return; }
    const clean = vehicleNumber.trim().replace(/-/g, '').toUpperCase();
    if (!vehicleRegex.test(clean)) { setFormError('Invalid plate format · e.g. KL07AB1234'); return; }

    setSubmitting(true);
    
    const payload = {
      vehicleNumber: clean,
      ownerName: ownerName.trim(),
      ownerPhoneNumber: ownerPhoneNumber.trim(),
      parkingSlot: parkingSlot.trim(),
      plateImage: plateImage || '',
    };

    const result = await dispatch(checkinVehicleThunk(payload));
    setSubmitting(false);

    if (result.success) {
      setShowForm(false);
      setOwnerName(''); setVehicleNumber(''); setVehicleError(''); setOwnerPhoneNumber(''); setParkingSlot(''); setPlateImage('');
      setToast({ open: true, msg: 'Vehicle checked in successfully!', severity: 'success' });
      reload();
    } else {
      setFormError(result.error || 'Check-in failed.');
    }
  };

  const handleCheckout = async (v) => {
    const id = v._id || v.id;
    setConfirmDialog({
      open: true,
      title: 'Confirm Checkout',
      content: `Are you sure you want to check out vehicle ${v.vehicleNumber || v.plate}?`,
      actionText: 'Check Out',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        const result = await dispatch(checkoutVehicleThunk(id));
        if (result.success) {
          setToast({ open: true, msg: 'Vehicle checked out.', severity: 'success' });
          reload();
        } else {
          setToast({ open: true, msg: result.error || 'Check-out failed.', severity: 'error' });
        }
      }
    });
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (v) => {
    const id = v._id || v.id;
    setConfirmDialog({
      open: true,
      title: 'Confirm Delete',
      content: `Are you sure you want to delete the record for vehicle ${v.vehicleNumber || v.plate}?`,
      actionText: 'Delete',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        const result = await dispatch(deleteVehicleThunk(id));
        if (result.success) {
          setToast({ open: true, msg: 'Vehicle deleted.', severity: 'success' });
          reload();
        } else {
          setToast({ open: true, msg: result.error || 'Delete failed.', severity: 'error' });
        }
      }
    });
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const handleEditSave = async (id, payload) => {
    const result = await dispatch(updateVehicleThunk(id, payload));
    if (result.success) {
      setToast({ open: true, msg: 'Vehicle updated.', severity: 'success' });
      setDetailsOpen(false);
      reload();
    } else {
      setToast({ open: true, msg: result.error || 'Update failed.', severity: 'error' });
    }
  };

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

  // ── Vehicle number field ─────────────────────────────────────────────────
  const handleVehicleChange = (e) => {
    const upper = e.target.value.toUpperCase().replace(/[-\s]/g, '');
    setVehicleNumber(upper);
    if (upper.length > 0 && !vehicleRegex.test(upper)) {
      setVehicleError('Not valid · e.g. KL07AB1234');
    } else {
      setVehicleError('');
    }
  };

  const handlePlateDetected = (plate, image = '') => {
    setVehicleNumber(plate.toUpperCase().replace(/-/g, ''));
    setVehicleError(vehicleRegex.test(plate) ? '' : 'Not valid · e.g. KL07AB1234');
    if (image) setPlateImage(image); // store the base64 image from scanner
    setShowScanner(false);
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
          sx={{ bgcolor: isDark ? DARK.bg2 : '#ffffff', border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`, color: isDark ? DARK.text0 : '#111827', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)' }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>

      {/* ── Page header ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} color={isDark ? DARK.text0 : '#111827'} sx={{ letterSpacing: '-0.5px', mb: 0.5 }}>
              Vehicles
            </Typography>
            <Typography variant="body2" color={isDark ? DARK.text2 : '#6b7280'}>
              {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Tooltip title="Refresh">
              <IconButton
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={reload}
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

            <Button
              component={motion.button}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              variant="contained"
              startIcon={<Add />}
              onClick={() => { setShowForm((v) => !v); setFormError(''); }}
              sx={{
                background: isDark ? DARK.red : '#111827',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                borderRadius: '16px', fontWeight: 700, px: 3, py: 1,
                color: '#ffffff',
                '&:hover': {
                  background: isDark ? '#dc2626' : '#000000',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              {showForm ? 'Cancel' : 'Check In Vehicle'}
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* ── API error ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px' }}>
          {error}
        </Alert>
      )}

      {/* ── Check-in Form ── */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
          <Box
            mb={4}
            sx={{
              ...getGlassSx(isDark),
              p: 4,
              borderColor: isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)',
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.16)',
            }}
          >
            <Typography variant="h5" fontWeight={800} color={isDark ? DARK.text0 : '#111827'} mb={3} sx={{ letterSpacing: '-0.5px' }}>
              Check In Vehicle
            </Typography>

            {formError && (
              <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px' }}>
                {formError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleCheckin} noValidate>
              <Stack spacing={4}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 4 }}>
                  {/* Owner Name */}
                  <Box>
                    <FieldLabel isDark={isDark}>Owner Name</FieldLabel>
                    <Box sx={getFieldWrapSx(isDark)}>
                      <Box
                        component="input"
                        type="text"
                        placeholder="e.g. John Doe"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        sx={getInputSx(isDark)}
                      />
                    </Box>
                  </Box>

                  {/* Owner Phone */}
                  <Box>
                    <FieldLabel isDark={isDark}>Owner Phone</FieldLabel>
                    <Box sx={getFieldWrapSx(isDark)}>
                      <Box
                        component="input"
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={ownerPhoneNumber}
                        onChange={(e) => setOwnerPhoneNumber(e.target.value)}
                        sx={getInputSx(isDark)}
                      />
                    </Box>
                  </Box>

                  {/* Parking Slot */}
                  <Box>
                    <FieldLabel isDark={isDark}>Parking Slot</FieldLabel>
                    <Box sx={getFieldWrapSx(isDark)}>
                      <Box
                        component="input"
                        type="text"
                        placeholder="e.g. A-12"
                        value={parkingSlot}
                        onChange={(e) => setParkingSlot(e.target.value)}
                        sx={getInputSx(isDark)}
                      />
                    </Box>
                  </Box>

                  {/* Vehicle Number */}
                  <Box>
                    <FieldLabel isDark={isDark}>Vehicle Number</FieldLabel>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Box sx={{ ...getFieldWrapSx(isDark), flex: 1, borderColor: vehicleError ? DARK.red : (isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)') }}>
                        <Box
                          component="input"
                          type="text"
                          placeholder="KL07AB1234"
                          value={vehicleNumber}
                          onChange={handleVehicleChange}
                          sx={{ ...getInputSx(isDark), fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase' }}
                        />
                      </Box>
                      <Button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        size="medium"
                        sx={{
                          minWidth: 80, borderRadius: '16px', fontWeight: 700,
                          background: 'rgba(0, 0, 0, 0.12)',
                          border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`,
                          color: isDark ? DARK.text0 : '#111827', flexShrink: 0,
                          '&:hover': { background: 'rgba(0, 0, 0, 0.2)' },
                        }}
                      >
                        Scan
                      </Button>
                    </Box>
                    {vehicleError && (
                      <Typography sx={{ color: '#dc2626', fontSize: '0.8rem', mt: 1, fontWeight: 600 }}>⚠ {vehicleError}</Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
                  <Button
                    type="submit"
                    disabled={submitting}
                    variant="contained"
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <LocalParking />}
                    sx={{
                      background: isDark ? DARK.red : '#111827',
                      color: '#ffffff',
                      fontWeight: 700, borderRadius: '16px', px: 4, py: 1.5,
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                      '&:hover': { background: isDark ? '#dc2626' : '#000000', transform: 'translateY(-2px)', boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)' },
                    }}
                  >
                    {submitting ? 'Checking In…' : 'Check In'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => { setShowForm(false); setFormError(''); }}
                    sx={{ color: isDark ? DARK.text2 : '#4b5563', borderRadius: '16px', fontWeight: 700, px: 4, py: 1.5, '&:hover': { bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)' } }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Box>
        </motion.div>
      )}

      {/* ── Search bar ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Box
          sx={{
            ...getGlassSx(isDark),
            display: 'flex', alignItems: 'center', gap: 2,
            px: 3, py: 2, mb: 4,
            '&:focus-within': { borderColor: '#111827', bgcolor: isDark ? DARK.bg1 : 'rgba(255,255,255,0.9)', boxShadow: '0 12px 48px rgba(0, 0, 0, 0.16)' },
          }}
        >
          <SearchOutlined sx={{ color: isDark ? DARK.text3 : '#9ca3af', fontSize: 24 }} />
          <InputBase
            placeholder="Search by plate or owner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, fontSize: '1.05rem', color: isDark ? DARK.text0 : '#111827', fontWeight: 500, '& input::placeholder': { color: isDark ? DARK.text3 : '#9ca3af' } }}
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
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
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
              <Typography variant="h6" color={isDark ? DARK.text2 : '#4b5563'} fontWeight={600}>Loading vehicles…</Typography>
            </Box>
          )}

          {/* Empty */}
          {!isLoading && filtered.length === 0 && (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <DirectionsCar sx={{ fontSize: 80, color: 'rgba(0, 0, 0, 0.12)', mb: 3 }} />
              <Typography variant="h5" color={isDark ? DARK.text2 : '#4b5563'} fontWeight={700} mb={4}>
                {search ? 'No vehicles match your search.' : 'No vehicles yet. Check in your first one!'}
              </Typography>
              {!search && (
                <Button
                  size="large" startIcon={<Add />}
                  onClick={() => setShowForm(true)}
                  sx={{
                    background: isDark ? DARK.red : '#111827',
                    color: '#fff', borderRadius: '16px', fontWeight: 700, px: 4, py: 1.5,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                    '&:hover': { transform: 'translateY(-2px)', background: isDark ? '#dc2626' : '#000000' }
                  }}
                >
                  Check In Vehicle
                </Button>
              )}
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
                    onCheckout={() => { handleCheckout(v); setDetailsOpen(false); }}
                    onHistory={() => handleViewHistory(v)}
                    onDelete={() => handleDelete(v)}
                    onClick={() => handleRowClick(v)}
                    onEdit={() => handleRowClick(v)}
                   isDark={isDark} />
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
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.2)',
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
              <AccessTimeOutlined sx={{ fontSize: 64, color: 'rgba(0, 0, 0, 0.12)', mb: 3 }} />
              <Typography color={isDark ? DARK.text2 : '#6b7280'} variant="h6" fontWeight={600}>No history found for this plate.</Typography>
            </Box>
          ) : (
            <Stack spacing={2} mt={1}>
              {history.map((h, i) => (
                <Box key={h._id || i} sx={{
                  p: 3, borderRadius: '24px',
                  bgcolor: isDark ? DARK.bg2 : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)'}`,
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={800} color={isDark ? DARK.text0 : '#111827'}>
                      {h.vehicleNumber || h.plateNumber || historyPlate}
                    </Typography>
                    {vehicleStatus(h) !== 'Registered' && <StatusChip v={h} isDark={isDark} />}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                       <Typography variant="body1" color={isDark ? DARK.text2 : '#6b7280'} fontWeight={700}>Check-In:</Typography>
                       <Typography variant="body1" color={isDark ? DARK.text0 : '#111827'} fontWeight={600}>{(h.entryTime || h.checkInTime || h.createdAt) ? new Date(h.entryTime || h.checkInTime || h.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                       <Typography variant="body1" color={isDark ? DARK.text2 : '#6b7280'} fontWeight={700}>Check-Out:</Typography>
                       <Typography variant="body1" color={isDark ? DARK.text0 : '#111827'} fontWeight={600}>{(h.exitTime || h.checkOutTime) ? new Date(h.exitTime || h.checkOutTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 2 }}>
          <Button
            onClick={() => setHistoryOpen(false)}
            sx={{ color: isDark ? DARK.text0 : '#111827', fontWeight: 700, borderRadius: '16px', px: 4, py: 1.5, bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)', '&:hover': { bgcolor: isDark ? DARK.bg2 : 'rgba(0, 0, 0, 0.2)' } }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        PaperProps={{
          sx: {
            bgcolor: isDark ? DARK.bg2 : '#ffffff',
            border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`,
            borderRadius: '32px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.25)',
          }
        }}
      >
        <DialogTitle sx={{ color: isDark ? DARK.text0 : '#111827', fontWeight: 800, fontSize: '1.5rem', p: 4, pb: 2 }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent sx={{ px: 4, pb: 2 }}>
          <Typography color={isDark ? DARK.text2 : '#4b5563'} fontWeight={600} fontSize="1.1rem">
            {confirmDialog.content}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 2, display: 'flex', gap: 2 }}>
          <Button
            onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            sx={{ color: isDark ? DARK.text2 : '#4b5563', fontWeight: 700, borderRadius: '16px', px: 4, py: 1.5, '&:hover': { bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDialog.onConfirm}
            variant="contained"
            sx={{
              background: isDark ? DARK.red : '#111827', color: '#fff', borderRadius: '16px', fontWeight: 700, px: 4, py: 1.5,
              '&:hover': { background: isDark ? '#dc2626' : '#000000' }
            }}
          >
            {confirmDialog.actionText}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Modal */}
      <VehicleDetailsModal
        open={detailsOpen}
        vehicle={selectedVehicle}
        onClose={() => setDetailsOpen(false)}
        onEditSave={handleEditSave}
        onCheckout={(v) => { handleCheckout(v); setDetailsOpen(false); }}
       isDark={isDark} />

      {/* Scanner Modal */}
      {showScanner && (
        <PlateScannerModal
          onClose={() => setShowScanner(false)}
          onDetected={handlePlateDetected}
        />
      )}
    </Box>
  );
}

// ── Row sub-component ─────────────────────────────────────────────────────────
function VehicleRow({ vehicle: v, isLast, onCheckout, onHistory, onDelete, onClick, onEdit, isDark }) {
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
        '&:hover': { bgcolor: isDark ? DARK.bg2 : 'rgba(0,0,0,0.02)' },
      }}>
        {/* Owner */}
        <Typography variant="body1" fontWeight={700} color={isDark ? DARK.text0 : '#111827'} noWrap sx={{ pr: 2 }}>
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
        <Typography variant="body1" color={isDark ? DARK.text2 : '#4b5563'} sx={{ fontWeight: 600 }}>{timeParked}</Typography>

        {/* Revenue */}
        <Typography variant="body1" sx={{ color: isDark ? DARK.text0 : '#111827', fontWeight: 800 }}>{revenue}</Typography>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1 }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Check out vehicle">
            <IconButton
              size="medium"
              onClick={onCheckout}
              sx={{
                bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)',
                color: isDark ? DARK.text0 : '#111827',
                borderRadius: '12px',
                '&:hover': { bgcolor: isDark ? DARK.bg2 : 'rgba(0, 0, 0, 0.2)' },
              }}
            >
              <LogoutOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit record">
            <IconButton
              size="medium"
              onClick={onEdit}
              sx={{
                bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)', color: isDark ? DARK.text0 : '#111827',
                borderRadius: '12px',
                '&:hover': { bgcolor: isDark ? DARK.bg2 : 'rgba(0, 0, 0, 0.2)' },
              }}
            >
              <EditOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="View history">
            <IconButton
              size="medium"
              onClick={onHistory}
              sx={{
                bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)', color: isDark ? DARK.text0 : '#111827',
                borderRadius: '12px',
                '&:hover': { bgcolor: isDark ? DARK.bg2 : 'rgba(0, 0, 0, 0.2)' },
              }}
            >
              <HistoryOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete record">
            <IconButton
              size="medium"
              onClick={onDelete}
              sx={{
                bgcolor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626',
                borderRadius: '12px',
                '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.2)' },
              }}
            >
              <DeleteOutlined sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </motion.div>
  );
}

// ── Details Modal Component ─────────────────────────────────────────────────────
function VehicleDetailsModal({ open, vehicle, onClose, onEditSave, onCheckout, isDark }) {
  const [isEditing, setIsEditing] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhoneNumber, setOwnerPhoneNumber] = useState('');
  const [parkingSlot, setParkingSlot] = useState('');

  useEffect(() => {
    if (open && vehicle) {
      setOwnerName(vehicle.ownerName || '');
      setOwnerPhoneNumber(vehicle.ownerPhoneNumber || '');
      setParkingSlot(vehicle.parkingSlot || '');
      setIsEditing(false);
    }
  }, [open, vehicle]);

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

  const handleSave = () => {
    onEditSave(vehicle._id || vehicle.id, { ownerName, ownerPhoneNumber, parkingSlot });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: isDark ? DARK.bg2 : '#ffffff', border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`, borderRadius: '32px', boxShadow: '0 24px 64px rgba(0, 0, 0, 0.25)' } }}>
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
            {isEditing ? (
              <InputBase fullWidth value={ownerName} onChange={(e)=>setOwnerName(e.target.value)} sx={{ borderBottom: '2px solid #111827', color: isDark ? DARK.text0 : '#111827', mt: 0.5, fontSize: '1.2rem', fontWeight: 600 }} />
            ) : (
              <Typography variant="h6" sx={{ color: isDark ? DARK.text0 : '#111827', mt: 0.5, fontWeight: 600 }}>{ownerName || '—'}</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: isDark ? DARK.text2 : '#6b7280', fontWeight: 800, letterSpacing: '1px' }}>PHONE NUMBER</Typography>
            {isEditing ? (
              <InputBase fullWidth value={ownerPhoneNumber} onChange={(e)=>setOwnerPhoneNumber(e.target.value)} sx={{ borderBottom: '2px solid #111827', color: isDark ? DARK.text0 : '#111827', mt: 0.5, fontSize: '1.2rem', fontWeight: 600 }} />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 2 }}>
                <Typography variant="h6" sx={{ color: isDark ? DARK.text0 : '#111827', fontWeight: 600 }}>{ownerPhoneNumber || '—'}</Typography>
                {ownerPhoneNumber && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Call Owner">
                      <IconButton
                        component="a"
                        href={`tel:${ownerPhoneNumber.replace(/[^+\d]/g, '')}`}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a',
                          '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.2)' },
                        }}
                      >
                        <PhoneOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="WhatsApp Owner">
                      <IconButton
                        component="a"
                        href={`https://wa.me/${ownerPhoneNumber.replace(/[^\d]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(37, 211, 102, 0.1)', color: '#25D366',
                          '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.2)' },
                        }}
                      >
                        <WhatsApp fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>
            )}
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: isDark ? DARK.text2 : '#6b7280', fontWeight: 800, letterSpacing: '1px' }}>PARKING SLOT</Typography>
            {isEditing ? (
              <InputBase fullWidth value={parkingSlot} onChange={(e)=>setParkingSlot(e.target.value)} sx={{ borderBottom: '2px solid #111827', color: isDark ? DARK.text0 : '#111827', mt: 0.5, fontSize: '1.2rem', fontWeight: 600 }} />
            ) : (
              <Typography variant="h6" sx={{ color: isDark ? DARK.text0 : '#111827', mt: 0.5, fontWeight: 600 }}>{parkingSlot || '—'}</Typography>
            )}
          </Box>
          <Box display="flex" gap={6} pt={2} borderTop="1px solid rgba(0, 0, 0, 0.12)">
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
      <DialogActions sx={{ p: 4, pt: 3, display: 'flex', justifyContent: 'space-between', bgcolor: isDark ? DARK.bg2 : 'rgba(0,0,0,0.02)', borderRadius: '0 0 32px 32px' }}>
        <Box>
          <Button variant="outlined" startIcon={<LogoutOutlined />} onClick={() => onCheckout(vehicle)} sx={{ borderRadius: '16px', mr: 2, fontWeight: 700, px: 4, py: 1.5, borderColor: 'rgba(0, 0, 0, 0.2)', color: isDark ? DARK.text0 : '#111827', '&:hover': { bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)', borderColor: '#111827' } }}>
            Check Out
          </Button>
          {isEditing ? (
            <Button variant="contained" onClick={handleSave} sx={{ background: isDark ? DARK.red : '#111827', color: '#fff', borderRadius: '16px', fontWeight: 700, px: 5, py: 1.5, '&:hover': { background: isDark ? '#dc2626' : '#000000' } }}>
              Save
            </Button>
          ) : (
            <Button variant="contained" startIcon={<EditOutlined />} onClick={() => setIsEditing(true)} sx={{ background: isDark ? DARK.red : '#111827', color: '#fff', borderRadius: '16px', fontWeight: 700, px: 4, py: 1.5, '&:hover': { background: isDark ? '#dc2626' : '#000000' } }}>
              Edit
            </Button>
          )}
        </Box>
        <Button onClick={onClose} sx={{ color: isDark ? DARK.text2 : '#6b7280', fontWeight: 700, borderRadius: '16px', px: 4, py: 1.5, '&:hover': { bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)' } }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
