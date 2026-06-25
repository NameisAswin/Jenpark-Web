import { useEffect, useMemo, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Avatar,
  Chip,
  Divider,
  Button,
  LinearProgress,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  WbSunnyOutlined,
  Nightlight,
  AccessTimeOutlined,
  DirectionsCar,
  LocalParking,
  ReceiptLongOutlined,
  ArrowForward,
  AddCircleOutlineRounded,
  LogoutOutlined,
} from '@mui/icons-material';
import { selectAuth, selectIsAdmin } from '../store/slices/authSlice';
import { selectVehicles, fetchVehiclesThunk } from '../store/slices/vehiclesSlice';
import { motion } from 'framer-motion';
import { useAppTheme, DARK } from '../theme/ThemeContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', Icon: WbSunnyOutlined };
  if (h < 17) return { text: 'Good Afternoon', Icon: WbSunnyOutlined };
  return { text: 'Good Evening', Icon: Nightlight };
}

function formatTime(t) {
  if (!t) return '—:—';
  return new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function getGlassSx(isDark) {
  return {
    transition: 'border-color 0.4s, box-shadow 0.4s, transform 0.4s',
    '&:hover': {
      borderColor: isDark ? DARK.red : 'rgba(0, 0, 0, 0.2)',
      boxShadow: isDark ? '0 16px 48px rgba(239,68,68,0.15)' : '0 16px 48px rgba(0, 0, 0, 0.16)',
      transform: 'translateY(-6px)',
    },
  };
}

// ── Animation Variants ────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ parked, total, isDark }) {
  const r    = 42;
  const circ = 2 * Math.PI * r;
  const pct  = total > 0 ? parked / total : 0;

  return (
    <Box sx={{ position: 'relative', width: 104, height: 104, flexShrink: 0 }}>
      <svg width="104" height="104" viewBox="0 0 104 104">
        <circle cx="52" cy="52" r={r} fill="none" stroke={isDark ? DARK.border : "rgba(0,0,0,0.06)"} strokeWidth="12" />
        {total > 0 && (
          <motion.circle
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${pct * circ} ${circ}` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            cx="52" cy="52" r={r} fill="none"
            stroke="url(#dpGrad)" strokeWidth="12"
            strokeLinecap="round" transform="rotate(-90 52 52)"
          />
        )}
        <defs>
          <linearGradient id="dpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={isDark ? DARK.red : "#111827"} />
            <stop offset="100%" stopColor={isDark ? "#dc2626" : "#111827"} />
          </linearGradient>
        </defs>
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography fontWeight={800} fontSize="1.3rem" lineHeight={1} sx={{ color: isDark ? DARK.text0 : '#111827' }}>{total}</Typography>
        <Typography sx={{ fontSize: '0.6rem', color: isDark ? DARK.text2 : '#6b7280', fontWeight: 600 }}>Vehicles</Typography>
      </Box>
    </Box>
  );
}

// ── LegendRow ─────────────────────────────────────────────────────────────────
function LegendRow({ color, label, value, total, isDark }) {
  const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0;
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: isDark ? DARK.text2 : '#6b7280', fontWeight: 600 }}>{label}</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: isDark ? DARK.text0 : '#111827', fontWeight: 700 }}>{value}</Typography>
      </Box>
      <LinearProgress
        variant="determinate" value={pct}
        sx={{
          height: 6, borderRadius: 6,
          bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 6 },
        }}
      />
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { user }  = useSelector(selectAuth);
  const isAdmin   = useSelector(selectIsAdmin);
  const { items: vehicles = [], status } = useSelector(selectVehicles);
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'info' });
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';

  const reload = useCallback(() => {
    dispatch(fetchVehiclesThunk());
  }, [dispatch]);

  useEffect(() => {
    reload();
  }, [reload]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total     = vehicles.length;
    const parkedVehiclesArray = vehicles.filter((v) => !v.exitTime && !v.checkOutTime);
    const parked    = parkedVehiclesArray.length;
    const revenue   = vehicles.reduce((acc, v) => acc + (Number(v.revenue) || 0), 0);
    
    return { total, parked, revenue, parkedVehiclesArray };
  }, [vehicles]);

  const userName = user?.name || user?.username || user?.email?.split('@')[0] || 'User';
  const userRole = user?.role || 'Vehicle Owner';
  const greeting = getGreeting();
  const today    = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(today);

  // Week calendar
  const weekDays  = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    return d;
  });
  const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const isLoading = status === 'loading';

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      sx={{ minHeight: '100%', p: 1 }}
    >

      {/* Toast */}
      <Snackbar
        open={toast.open} autoHideDuration={3000}
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
      <motion.div variants={itemVariants}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <greeting.Icon sx={{ fontSize: 18, color: isDark ? DARK.text2 : '#4b5563' }} />
              <Typography sx={{ fontSize: '0.85rem', color: isDark ? DARK.text2 : '#6b7280', fontWeight: 600 }}>{greeting.text}</Typography>
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px', color: isDark ? DARK.text0 : '#111827' }}>
              Dashboard
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: isDark ? DARK.text2 : '#6b7280' }}>
              {today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Chip
              icon={<AccessTimeOutlined sx={{ fontSize: '18px !important', color: isDark ? DARK.text1 : undefined }} />}
              label={`${vehicles.length} vehicles loaded`}
              sx={{ bgcolor: isDark ? DARK.bg3 : 'rgba(255,255,255,0.7)', border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)'}`, color: isDark ? DARK.text1 : '#4b5563', fontSize: '0.85rem', fontWeight: 600, height: 44, borderRadius: '16px', backdropFilter: 'blur(10px)' }}
            />

            {isAdmin && (
              <Chip
                component={motion.div}
                whileHover={{ scale: 1.05 }}
                label="Admin"
                onClick={() => navigate('/admin/users')}
                sx={{ bgcolor: isDark ? `linear-gradient(135deg, ${DARK.red}, #dc2626)` : '#111827', color: '#ffffff', fontWeight: 700, cursor: 'pointer', height: 44, borderRadius: '16px', boxShadow: isDark ? `0 4px 12px rgba(239,68,68,0.3)` : '0 4px 12px rgba(0, 0, 0, 0.2)' }}
              />
            )}
          </Box>
        </Box>
      </motion.div>

      {/* ── Row 1: Profile + Donut + Stats ── */}
      <Grid container spacing={3} mb={4}>

        {/* Profile card */}
        <Grid item xs={12} md={5} lg={4}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card elevation={0} sx={{ ...getGlassSx(isDark), height: '100%' }}>
              <CardContent sx={{ p: '32px !important', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.5px', mb: 0.5, color: isDark ? DARK.text0 : '#111827' }}>
                      {userName}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? DARK.text2 : '#4b5563' }}>
                      {userRole}
                    </Typography>
                  </Box>
                  <Avatar sx={{
                    width: 56, height: 56, borderRadius: '20px',
                    background: isDark ? `linear-gradient(135deg, ${DARK.red}, #dc2626)` : '#111827', color: '#ffffff',
                    fontSize: '1.2rem', fontWeight: 800,
                    boxShadow: isDark ? `0 8px 20px rgba(239,68,68,0.2)` : '0 8px 20px rgba(0, 0, 0, 0.2)',
                    flexShrink: 0,
                  }}>
                    {getInitials(userName)}
                  </Avatar>
                </Box>

                <Divider sx={{ borderColor: isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)', mb: 3 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                  <DonutChart parked={stats.parked} total={stats.total} isDark={isDark} />
                  <Stack spacing={2} sx={{ flex: 1, justifyContent: 'center' }}>
                    <LegendRow isDark={isDark} color={isDark ? DARK.red : "#111827"} label="Parked" value={stats.parked} total={stats.total} />
                    <LegendRow isDark={isDark} color={isDark ? DARK.bg1 : "rgba(0, 0, 0, 0.25)"} label="Total" value={stats.total} total={stats.total} />
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Stat mini-cards */}
        <Grid item xs={12} md={7} lg={8}>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            
            {/* Total Vehicles Card */}
            <Grid item xs={12} sm={4} sx={{ display: 'flex' }}>
              <motion.div variants={itemVariants} style={{ width: '100%' }}>
                <Card
                  elevation={0}
                  onClick={() => navigate('/total-vehicles')}
                  sx={{ ...getGlassSx(isDark), width: '100%', height: '100%', cursor: 'pointer', position: 'relative' }}
                >
                  <CardContent sx={{ p: '28px !important', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                      <Box sx={{
                        width: 52, height: 52, borderRadius: '16px',
                        background: isDark ? DARK.red : '#111827',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isDark ? `0 8px 20px rgba(239,68,68,0.3)` : '0 8px 20px rgba(0, 0, 0, 0.2)',
                        '& .MuiSvgIcon-root': { fontSize: 26, color: '#fff' },
                      }}>
                        <DirectionsCar />
                      </Box>
                    </Box>
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="h2" fontWeight={800} sx={{ lineHeight: 1, mb: 1, letterSpacing: '-1px', color: isDark ? DARK.text0 : '#111827' }}>
                        {isLoading ? <CircularProgress size={32} sx={{ color: isDark ? DARK.text0 : '#111827' }} /> : stats.total}
                      </Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ color: isDark ? DARK.text2 : '#6b7280' }}>Total Vehicles</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Currently Parked Card */}
            <Grid item xs={12} sm={4} sx={{ display: 'flex' }}>
              <motion.div variants={itemVariants} style={{ width: '100%' }}>
                <Card elevation={0} sx={{ ...getGlassSx(isDark), width: '100%', height: '100%' }}>
                  <CardContent sx={{ p: '28px !important', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{
                      width: 52, height: 52, borderRadius: '16px',
                      background: isDark ? DARK.red : '#111827', mb: 3,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isDark ? `0 8px 20px rgba(248,113,113,0.3)` : '0 8px 20px rgba(0, 0, 0, 0.2)',
                      '& .MuiSvgIcon-root': { fontSize: 26, color: '#fff' },
                    }}>
                      <LocalParking />
                    </Box>
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="h2" fontWeight={800} sx={{ lineHeight: 1, mb: 1, letterSpacing: '-1px', color: isDark ? DARK.text0 : '#111827' }}>
                        {isLoading ? <CircularProgress size={32} sx={{ color: isDark ? DARK.text0 : '#111827' }} /> : stats.parked}
                      </Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ color: isDark ? DARK.text2 : '#6b7280' }}>Currently Parked</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Total Revenue Card */}
            <Grid item xs={12} sm={4} sx={{ display: 'flex' }}>
              <motion.div variants={itemVariants} style={{ width: '100%' }}>
                <Card
                  elevation={0}
                  onClick={() => navigate('/total-revenue')}
                  sx={{ ...getGlassSx(isDark), width: '100%', height: '100%', cursor: 'pointer', position: 'relative' }}
                >
                  <CardContent sx={{ p: '28px !important', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{
                      width: 52, height: 52, borderRadius: '16px',
                      background: isDark ? DARK.red : '#111827', mb: 3,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isDark ? `0 8px 20px rgba(220,38,38,0.3)` : '0 8px 20px rgba(0, 0, 0, 0.2)',
                      '& .MuiSvgIcon-root': { fontSize: 26, color: '#fff' },
                    }}>
                      <ReceiptLongOutlined />
                    </Box>
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="h2" fontWeight={800} sx={{ lineHeight: 1, mb: 1, letterSpacing: '-1px', color: isDark ? DARK.text0 : '#111827' }}>
                        {isLoading ? <CircularProgress size={32} sx={{ color: isDark ? DARK.text0 : '#111827' }} /> : `₹${stats.revenue}`}
                      </Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ color: isDark ? DARK.text2 : '#6b7280' }}>Total Revenue</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

          </Grid>
        </Grid>
      </Grid>

      {/* ── Row 2: Recent Vehicles + Schedule ── */}
      <Grid container spacing={3} mb={2}>

        {/* Recent vehicles */}
        <Grid item xs={12} md={7}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card elevation={0} sx={{ ...getGlassSx(isDark), height: '100%', cursor: 'pointer' }} onClick={() => navigate('/vehicles')}>
              <CardContent sx={{ p: '32px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Typography variant="h4" fontWeight={800} sx={{ cursor: 'pointer', letterSpacing: '-0.5px', color: isDark ? DARK.text0 : '#111827' }} onClick={() => navigate('/vehicles')}>
                    Recent Vehicles
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label={`${vehicles.length} total`}
                      size="small"
                      sx={{ bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)', color: isDark ? DARK.text2 : '#4b5563', border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`, fontWeight: 700, px: 1, borderRadius: '12px' }}
                    />
                    <Button
                      size="small"
                      endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
                      onClick={(e) => { e.stopPropagation(); navigate('/vehicles'); }}
                      sx={{ fontSize: '0.9rem', color: isDark ? DARK.text0 : '#111827', fontWeight: 700, px: 2, borderRadius: '16px', bgcolor: isDark ? DARK.bg3 : 'rgba(0, 0, 0, 0.16)', '&:hover': { bgcolor: isDark ? '#2a2a2a' : 'rgba(0, 0, 0, 0.16)' } }}
                    >
                      Manage
                    </Button>
                  </Box>
                </Box>

                {isLoading ? (
                  <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={32} sx={{ color: isDark ? DARK.text0 : '#111827' }} />
                  </Box>
                ) : stats.parkedVehiclesArray.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <DirectionsCar sx={{ fontSize: 64, color: isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)', mb: 3 }} />
                    <Typography variant="h6" sx={{ color: isDark ? DARK.text2 : '#6b7280', mb: 4 }}>No vehicles registered yet.</Typography>
                    <Button
                      size="large" startIcon={<AddCircleOutlineRounded />}
                      onClick={(e) => { e.stopPropagation(); navigate('/vehicles'); }}
                      sx={{
                        background: isDark ? `linear-gradient(135deg, ${DARK.red}, #dc2626)` : '#111827',
                        color: '#fff', borderRadius: '20px', fontWeight: 700, px: 4, py: 1.5,
                        boxShadow: isDark ? '0 8px 24px rgba(239,68,68,0.3)' : '0 8px 24px rgba(0, 0, 0, 0.25)',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: isDark ? '0 12px 32px rgba(239,68,68,0.4)' : '0 12px 32px rgba(0,0,0,0.2)' },
                      }}
                    >
                      Check In First Vehicle
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {stats.parkedVehiclesArray.slice(0, 4).map((v, idx) => {
                      const isParked    = !v.exitTime && !v.checkOutTime;
                      const plate       = v.vehicleNumber || v.plateNumber || v.plate || `Vehicle ${idx + 1}`;
                      const owner       = v.ownerName     || v.owner       || '—';
                      const since       = v.entryTime     || v.createdAt   || null;

                      return (
                        <motion.div key={v._id || v.id || idx} whileHover={{ scale: 1.01, backgroundColor: isDark ? DARK.bg3 : 'rgba(255,255,255,0.8)' }} style={{ borderRadius: '20px', border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`, background: isDark ? 'transparent' : 'rgba(255,255,255,0.4)' }}>
                          <Box sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            py: 2, px: 2, borderRadius: '20px',
                            transition: 'all 0.2s',
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Box sx={{
                                minWidth: 64, textAlign: 'center',
                                bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.16)',
                                border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)'}`,
                                borderRadius: '16px', py: 1, px: 1.5,
                              }}>
                                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: isDark ? DARK.text2 : '#6b7280', display: 'block' }}>
                                  {formatTime(since)}
                                </Typography>
                              </Box>
                              <Avatar sx={{ width: 48, height: 48, borderRadius: '16px', bgcolor: isParked ? (isDark ? DARK.red : '#111827') : (isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)'), color: isParked ? '#ffffff' : (isDark ? DARK.text2 : '#6b7280') }}>
                                <DirectionsCar sx={{ fontSize: 24 }} />
                              </Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? DARK.text0 : '#111827' }}>{plate}</Typography>
                                <Typography variant="body1" fontWeight={500} sx={{ color: isDark ? DARK.text2 : '#6b7280' }}>{owner}</Typography>
                              </Box>
                            </Box>
                          </Box>
                        </motion.div>
                      );
                    })}
                    {stats.parkedVehiclesArray.length > 4 && (
                      <Button
                        size="medium" fullWidth
                        onClick={(e) => { e.stopPropagation(); navigate('/vehicles'); }}
                        sx={{ color: isDark ? DARK.text0 : '#111827', fontSize: '0.95rem', fontWeight: 700, borderRadius: '16px', mt: 2, py: 1.5, bgcolor: isDark ? DARK.bg3 : 'rgba(0, 0, 0, 0.16)', '&:hover': { bgcolor: isDark ? '#2a2a2a' : 'rgba(0,0,0,0.06)' } }}
                      >
                        +{stats.parkedVehiclesArray.length - 4} more — View all
                      </Button>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Schedule / calendar */}
        <Grid item xs={12} md={5}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card elevation={0} sx={{ ...getGlassSx(isDark), height: '100%', cursor: 'pointer' }} onClick={() => navigate('/total-vehicles')}>
              <CardContent sx={{ p: '32px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Typography variant="h4" fontWeight={800} sx={{ cursor: 'pointer', letterSpacing: '-0.5px', color: isDark ? DARK.text0 : '#111827' }} onClick={() => navigate('/total-vehicles')}>This Week</Typography>
                  <Chip label="Weekly" size="small" sx={{ bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)', border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`, color: isDark ? DARK.text2 : '#4b5563', fontSize: '0.85rem', fontWeight: 600, borderRadius: '12px', px: 1 }} />
                </Box>

                {/* Week strip */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                  {weekDays.map((d) => {
                    const isSelected = d.toDateString() === selectedDate.toDateString();
                    return (
                      <Box key={d.toDateString()} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                        <Typography sx={{ fontSize: '0.75rem', color: isSelected ? (isDark ? DARK.text0 : '#111827') : (isDark ? DARK.text2 : '#9ca3af'), fontWeight: 800, letterSpacing: '0.5px' }}>
                          {DAY_LABELS[d.getDay()]}
                        </Typography>
                        <Box 
                          onClick={(e) => { e.stopPropagation(); setSelectedDate(d); }}
                          sx={{
                            width: 44, height: 44, borderRadius: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isSelected ? (isDark ? DARK.red : '#111827') : 'transparent',
                            color: isSelected ? '#fff' : (isDark ? DARK.text1 : '#4b5563'),
                            fontWeight: isSelected ? 800 : 600, fontSize: '1rem',
                            boxShadow: isSelected ? (isDark ? `0 8px 20px rgba(239,68,68,0.3)` : '0 8px 20px rgba(0, 0, 0, 0.25)') : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': { bgcolor: isSelected ? undefined : (isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)') },
                          }}>
                          {d.getDate()}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                <Divider sx={{ mb: 3, borderColor: isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)' }} />

                {isLoading ? (
                  <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={32} sx={{ color: isDark ? DARK.text0 : '#111827' }} />
                  </Box>
                ) : vehicles.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <AccessTimeOutlined sx={{ fontSize: 56, color: isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)', mb: 2 }} />
                    <Typography variant="body1" fontWeight={500} sx={{ color: isDark ? DARK.text2 : '#6b7280' }}>No vehicles registered yet.</Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {(() => {
                      const selectedDateVehicles = vehicles.filter(v => {
                        const entry = v.entryTime || v.createdAt || v.checkInTime;
                        if (!entry) return false;
                        return new Date(entry).toDateString() === selectedDate.toDateString();
                      });

                      if (selectedDateVehicles.length === 0) {
                        return <Typography variant="h6" textAlign="center" py={4} sx={{ color: isDark ? DARK.text2 : '#6b7280' }}>No vehicles on this date.</Typography>;
                      }

                      return (
                        <>
                          {selectedDateVehicles.slice(0, 4).map((v, idx) => {
                            const plate   = v.vehicleNumber || v.plateNumber || `Vehicle ${idx + 1}`;
                            const since   = v.entryTime     || v.createdAt   || null;
                            const isParked = !v.exitTime && !v.checkOutTime;

                            return (
                              <motion.div key={v._id || v.id || idx} whileHover={{ scale: 1.02 }}>
                                <Box sx={{
                                  display: 'flex', alignItems: 'center', gap: 2.5, p: 2,
                                  borderRadius: '20px',
                                  bgcolor: isDark ? 'transparent' : 'rgba(255,255,255,0.7)',
                                  border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)'}`,
                                  boxShadow: isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.02)',
                                }}>
                                  <Box sx={{
                                    width: 6, height: 44, borderRadius: 3,
                                    bgcolor: isParked ? (isDark ? DARK.red : '#111827') : (isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.2)'),
                                    flexShrink: 0,
                                  }} />
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="h6" fontWeight={800} noWrap sx={{ color: isDark ? DARK.text0 : '#111827' }}>{plate}</Typography>
                                    <Typography variant="body1" fontWeight={600} noWrap sx={{ color: isDark ? DARK.text2 : '#6b7280' }}>
                                      {v.ownerName || '—'}{since ? ` · ${formatTime(since)}` : ''}
                                    </Typography>
                                  </Box>
                                  {isParked
                                    ? <LocalParking sx={{ color: isDark ? DARK.text0 : '#111827', fontSize: 24, flexShrink: 0 }} />
                                    : <LogoutOutlined sx={{ color: isDark ? DARK.text3 : '#9ca3af', fontSize: 24, flexShrink: 0 }} />
                                  }
                                </Box>
                              </motion.div>
                            );
                          })}
                          {selectedDateVehicles.length > 4 && (
                            <Button
                              size="medium" fullWidth
                              onClick={(e) => { e.stopPropagation(); navigate('/total-vehicles'); }}
                              sx={{ color: isDark ? DARK.text0 : '#111827', fontSize: '0.95rem', fontWeight: 700, borderRadius: '16px', mt: 2, py: 1.5, bgcolor: isDark ? DARK.bg3 : 'rgba(0, 0, 0, 0.16)', '&:hover': { bgcolor: isDark ? '#2a2a2a' : 'rgba(0,0,0,0.06)' } }}
                            >
                              +{selectedDateVehicles.length - 4} more — View all
                            </Button>
                          )}
                        </>
                      );
                    })()}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

    </Box>
  );
}
