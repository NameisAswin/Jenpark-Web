import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LocalParking,
  SpeedOutlined,
  SecurityOutlined,
  KeyboardArrowRight,
  PersonAddOutlined,
  LoginOutlined,
  TrendingUpOutlined,
  SmartphoneOutlined,
  LightModeOutlined,
  DarkModeOutlined,
  DirectionsCarOutlined,
} from '@mui/icons-material';
import { loginThunk, registerThunk } from '../store/slices/authThunks';
import { selectAuth } from '../store/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppTheme, DARK } from '../theme/ThemeContext';

/* ── animations ── */
const spinKf = `@keyframes lp-spin { to { transform: rotate(360deg); } }`;
const carRunKf = `@keyframes car-run {
  0% { transform: translateX(-15px); opacity: 0; }
  25% { opacity: 1; }
  75% { opacity: 1; }
  100% { transform: translateX(15px); opacity: 0; }
}`;

/* ── Shared field wrapper ── */
function Field({ label, children, isDark }) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: '0.75rem', fontWeight: 700,
          color: isDark ? DARK.text2 : '#4b5563',
          textTransform: 'uppercase', letterSpacing: '0.8px', mb: 1,
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function getInputWrapSx(isDark) {
  return {
    display: 'flex', alignItems: 'center', gap: 1.5,
    px: 2, py: 1.5,
    bgcolor: isDark ? DARK.bg3 : 'rgba(255,255,255,0.8)',
    border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`,
    borderRadius: '16px',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    '&:focus-within': {
      borderColor: isDark ? DARK.red : '#111827',
      bgcolor: isDark ? '#2a2a2a' : '#ffffff',
      boxShadow: isDark ? `0 0 0 3px ${DARK.red}25` : '0 0 0 4px rgba(0, 0, 0, 0.12)',
    },
  };
}

function getInputSx(isDark) {
  return {
    flex: 1, border: 'none', outline: 'none',
    bgcolor: 'transparent',
    color: isDark ? DARK.text0 : '#111827',
    fontSize: '0.95rem',
    fontFamily: 'Outfit, Inter, system-ui, sans-serif',
    fontWeight: 500,
    '&::placeholder': { color: isDark ? DARK.text3 : 'rgba(0,0,0,0.3)' },
  };
}

/* ── Submit button ── */
function SubmitBtn({ loading, label, isDark }) {
  return (
    <Box
      component={motion.button}
      whileHover={!loading ? { scale: 1.02 } : {}}
      whileTap={!loading ? { scale: 0.98 } : {}}
      type="submit"
      disabled={loading}
      sx={{
        mt: 1, width: '100%', py: 1.75, px: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
        background: loading
          ? (isDark ? '#2a2a2a' : '#9ca3af')
          : isDark
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : '#111827',
        color: '#ffffff', border: 'none', borderRadius: '24px',
        fontSize: '1rem', fontWeight: 700,
        fontFamily: 'Outfit, Inter, system-ui, sans-serif',
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: loading
          ? 'none'
          : isDark
            ? '0 4px 20px rgba(239,68,68,0.4)'
            : '0 4px 14px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s',
      }}
    >
      {loading ? (
        <>
          <DirectionsCarOutlined sx={{
            fontSize: 22,
            animation: 'car-run 1s ease-in-out infinite',
          }} />
          Authenticating…
        </>
      ) : (
        <>
          {label}
          <KeyboardArrowRight sx={{ fontSize: 20 }} />
        </>
      )}
    </Box>
  );
}

/* ── Error box ── */
function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Box sx={{
        mb: 3, px: 2, py: 1.5, borderRadius: '16px',
        bgcolor: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.3)',
        display: 'flex', alignItems: 'center', gap: 1.5,
        boxShadow: '0 4px 12px rgba(239,68,68,0.05)',
      }}>
        <Typography sx={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>⚠ {msg}</Typography>
      </Box>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  Main Component                                                */
/* ══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const [tab, setTab] = useState(0); // 0 = Login, 1 = Register
  const { mode, toggleTheme } = useAppTheme();
  const isDark = mode === 'dark';

  // Login state
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd,  setShowLoginPwd]  = useState(false);
  const [loginError,    setLoginError]    = useState('');

  // Register state
  const [regName,       setRegName]       = useState('');
  const [regEmail,      setRegEmail]      = useState('');
  const [regPassword,   setRegPassword]   = useState('');
  const [regConfirm,    setRegConfirm]    = useState('');
  const [showRegPwd,    setShowRegPwd]    = useState(false);
  const [regError,      setRegError]      = useState('');

  const { loading } = useSelector(selectAuth);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  /* ── Login submit ── */
  const onLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Email and password are required.');
      return;
    }
    const result = await dispatch(loginThunk({ email: loginEmail, password: loginPassword }));
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setLoginError(result.error);
    }
  };

  /* ── Register submit ── */
  const onRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regName || !regEmail || !regPassword) {
      setRegError('All fields are required.');
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError('Passwords do not match.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 8 characters.');
      return;
    }
    const result = await dispatch(
      registerThunk({ name: regName, email: regEmail, password: regPassword })
    );
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setRegError(result.error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  const featureVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
  };

  return (
    <>
      <style>{`${spinKf} ${carRunKf}`}</style>

      {/* Global animated background for the entire page */}
      <div className="animated-bg">
        <div className="blob-3" />
      </div>

      {/* ── Floating Theme Toggle ── */}
      <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} placement="left">
        <IconButton
          component={motion.button}
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          sx={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            width: 46, height: 46, borderRadius: '16px',
            bgcolor: isDark ? 'rgba(26,26,26,0.9)' : 'rgba(255,255,255,0.85)',
            border: isDark ? `1px solid ${DARK.border}` : '1px solid rgba(0, 0, 0, 0.16)',
            backdropFilter: 'blur(12px)',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0, 0, 0, 0.16)',
            color: isDark ? DARK.text0 : '#111827',
            '&:hover': { bgcolor: isDark ? DARK.red : '#111827', color: '#fff', borderColor: 'transparent' },
            transition: 'all 0.3s',
          }}
        >
          {isDark ? <LightModeOutlined sx={{ fontSize: 20 }} /> : <DarkModeOutlined sx={{ fontSize: 20 }} />}
        </IconButton>
      </Tooltip>

      <Box sx={{ width: '100vw', overflowX: 'hidden' }}>
        
        {/* ════════════════════ HERO SECTION (100vh) ════════════════════ */}
        <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
          
          {/* LEFT CONTENT */}
          <Box sx={{
            flex: { xs: 'none', md: '1.2' },
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            p: { md: 8, lg: 12 },
            position: 'relative',
            zIndex: 2,
            bgcolor: isDark ? 'rgba(8,8,8,0.6)' : 'transparent',
          }}>
            {/* Red accent top-left corner decoration */}
            <Box sx={{ position: 'absolute', top: 40, right: 40, width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444', boxShadow: '0 0 12px #ef4444', opacity: 0.8 }} />
            <Box sx={{ position: 'absolute', top: 60, right: 56, width: 6, height: 6, borderRadius: '50%', bgcolor: '#ef4444', opacity: 0.4 }} />
            <Box
              component={motion.div}
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {/* Logo */}
              <motion.div variants={itemVariants}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 6 }}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: '20px',
                    background: isDark ? 'linear-gradient(135deg,#ef4444,#dc2626)' : '#111827',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isDark ? '0 8px 24px rgba(239,68,68,0.35)' : '0 8px 24px rgba(0, 0, 0, 0.25)',
                  }}>
                    <LocalParking sx={{ color: '#fff', fontSize: 32 }} />
                  </Box>
                  <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-1px', color: isDark ? '#f1f5f9' : '#111827' }}>
                    JenPark
                  </Typography>
                  {/* Red live dot */}
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444', boxShadow: '0 0 8px #ef4444', animation: 'lp-spin 0s', ml: -0.5, mt: -2.5 }} />
                </Box>
              </motion.div>

              {/* Tagline */}
              <motion.div variants={itemVariants}>
                <Box sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 1.5, mb: 4,
                  px: 2.5, py: 1,
                  bgcolor: 'rgba(255,255,255,0.7)',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: '999px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.16)',
                  backdropFilter: 'blur(10px)',
                }}>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#111827' }}
                  />
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Next-Gen Parking Platform
                  </Typography>
                </Box>
              </motion.div>

              {/* Title */}
              <motion.div variants={itemVariants}>
                <Typography
                  variant="h1" fontWeight={800}
                  sx={{ lineHeight: 1.1, mb: 3, letterSpacing: '-2px', color: isDark ? '#f1f5f9' : '#111827', fontSize: '4.5rem' }}
                >
                  Manage space <br />
                  <span style={{ color: isDark ? '#ef4444' : '#6b7280' }}>intelligently.</span>
                </Typography>
              </motion.div>

              {/* Subtitle */}
              <motion.div variants={itemVariants}>
                <Typography variant="body1" sx={{ color: '#4b5563', mb: 6, lineHeight: 1.8, fontSize: '1.25rem', maxWidth: 500 }}>
                  Experience the future of facility management. Monitor occupancy, control access, and maximize revenue with a clean, modern interface.
                </Typography>
              </motion.div>
            </Box>
          </Box>

          {/* RIGHT CONTENT (FORM) */}
          <Box sx={{
            flex: 1, display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            px: { xs: 3, sm: 5, md: 8 }, py: 5,
            position: 'relative',
            zIndex: 3,
          }}>
            {/* Mobile logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 2, mb: 6 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: '16px',
                background: '#111827',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              }}>
                <LocalParking sx={{ color: '#fff', fontSize: 28 }} />
              </Box>
              <Typography variant="h5" fontWeight={800} color="#111827">
                JenPark
              </Typography>
            </Box>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: 'spring', damping: 20, delay: 0.2 }}
              style={{ width: '100%', maxWidth: 460 }}
            >
              {/* The Glass Form Container */}
              <Box sx={{
                p: { xs: 3, sm: 5 },
                borderRadius: '32px',
                bgcolor: isDark ? 'rgba(26,26,26,0.75)' : 'rgba(255,255,255,0.65)',
                border: isDark ? `1px solid ${DARK.border}` : '1px solid rgba(255,255,255,0.8)',
                boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0, 0, 0, 0.12)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Red top-right accent glow */}
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', bgcolor: '#ef4444', opacity: isDark ? 0.12 : 0.06, filter: 'blur(20px)', pointerEvents: 'none' }} />
                {/* Heading */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-1px', mb: 1, color: isDark ? '#f1f5f9' : '#111827' }}>
                    {tab === 0 ? 'H! THERE.' : 'Join JenPark.'}
                  </Typography>
                  <Typography variant="body1" sx={{ color: isDark ? '#94a3b8' : '#6b7280' }}>
                    {tab === 0
                      ? 'Enter your credentials to access the dashboard'
                      : 'Create your account to start managing facilities'}
                  </Typography>
                </Box>

                {/* Tab switcher */}
                <Box sx={{
                  display: 'flex', mb: 4, p: 0.75,
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '20px',
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0, 0, 0, 0.12)',
                  position: 'relative',
                }}>
                  {[
                    { label: 'Sign In',   icon: <LoginOutlined sx={{ fontSize: 18 }} /> },
                    { label: 'Register',  icon: <PersonAddOutlined sx={{ fontSize: 18 }} /> },
                  ].map(({ label, icon }, i) => (
                    <Box
                      key={label}
                      onClick={() => { setTab(i); setLoginError(''); setRegError(''); }}
                      sx={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                        py: 1.25, borderRadius: '16px', cursor: 'pointer',
                        position: 'relative',
                        zIndex: 2,
                        color: tab === i ? '#ffffff' : (isDark ? '#94a3b8' : '#4b5563'),
                        transition: 'color 0.3s',
                      }}
                    >
                      {tab === i && (
                        <motion.div
                          layoutId="active-tab"
                          style={{
                            position: 'absolute', inset: 0,
                            background: isDark ? 'linear-gradient(135deg, #ef4444, #dc2626)' : '#111827',
                            borderRadius: '16px',
                            boxShadow: isDark ? '0 4px 12px rgba(239,68,68,0.3)' : '0 4px 12px rgba(0, 0, 0, 0.2)',
                            zIndex: -1,
                          }}
                        />
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>{icon}</Box>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>
                        {label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* ── FORMS ── */}
                <Box sx={{ minHeight: 380, position: 'relative' }}>
                  <AnimatePresence mode="wait">
                    {tab === 0 ? (
                      <motion.div
                        key="login"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Box component="form" onSubmit={onLogin} noValidate>
                          <AnimatePresence>
                            <ErrorBox msg={loginError} />
                          </AnimatePresence>
                          <Stack spacing={2.5}>
                            <Field label="Email Address" isDark={isDark}>
                              <Box sx={getInputWrapSx(isDark)}>
                                <Box component="span" sx={{ fontSize: '1.2rem', color: isDark ? DARK.text2 : '#9ca3af' }}>✉</Box>
                                <Box
                                  component="input"
                                  id="login-email"
                                  type="email"
                                  placeholder="name@example.com"
                                  value={loginEmail}
                                  onChange={(e) => setLoginEmail(e.target.value)}
                                  autoComplete="email"
                                  sx={getInputSx(isDark)}
                                />
                              </Box>
                            </Field>

                            <Field label="Password" isDark={isDark}>
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.75 }}>
                                <Typography variant="body2" sx={{ color: isDark ? DARK.red : '#4b5563', fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: isDark ? '#f87171' : '#111827' } }}>
                                  Forgot password?
                                </Typography>
                              </Box>
                              <Box sx={getInputWrapSx(isDark)}>
                                <Box component="span" sx={{ fontSize: '1.2rem', color: isDark ? DARK.text2 : '#9ca3af' }}>🔒</Box>
                                <Box
                                  component="input"
                                  id="login-password"
                                  type={showLoginPwd ? 'text' : 'password'}
                                  placeholder="••••••••"
                                  value={loginPassword}
                                  onChange={(e) => setLoginPassword(e.target.value)}
                                  autoComplete="current-password"
                                  sx={{ ...getInputSx(isDark), '&::placeholder': { letterSpacing: '3px', color: isDark ? DARK.text3 : 'rgba(0,0,0,0.3)' } }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => setShowLoginPwd((v) => !v)}
                                  sx={{ color: isDark ? DARK.text2 : '#9ca3af', '&:hover': { color: isDark ? DARK.text0 : '#111827' }, p: 0.5 }}
                                >
                                  {showLoginPwd ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                                </IconButton>
                              </Box>
                            </Field>

                            <Box sx={{ mt: 4 }}>
                              <SubmitBtn loading={loading} label="Sign In" isDark={isDark} />
                            </Box>
                          </Stack>
                        </Box>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="register"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Box component="form" onSubmit={onRegister} noValidate>
                          <AnimatePresence>
                            <ErrorBox msg={regError} />
                          </AnimatePresence>
                          <Stack spacing={2.5}>
                            <Field label="Full Name" isDark={isDark}>
                              <Box sx={getInputWrapSx(isDark)}>
                                <Box component="span" sx={{ fontSize: '1.2rem', color: isDark ? DARK.text2 : '#9ca3af' }}>👤</Box>
                                <Box
                                  component="input"
                                  id="reg-name"
                                  type="text"
                                  placeholder="John Doe"
                                  value={regName}
                                  onChange={(e) => setRegName(e.target.value)}
                                  autoComplete="name"
                                  sx={getInputSx(isDark)}
                                />
                              </Box>
                            </Field>

                            <Field label="Email Address" isDark={isDark}>
                              <Box sx={getInputWrapSx(isDark)}>
                                <Box component="span" sx={{ fontSize: '1.2rem', color: isDark ? DARK.text2 : '#9ca3af' }}>✉</Box>
                                <Box
                                  component="input"
                                  id="reg-email"
                                  type="email"
                                  placeholder="name@example.com"
                                  value={regEmail}
                                  onChange={(e) => setRegEmail(e.target.value)}
                                  autoComplete="email"
                                  sx={getInputSx(isDark)}
                                />
                              </Box>
                            </Field>

                            <Field label="Password" isDark={isDark}>
                              <Box sx={getInputWrapSx(isDark)}>
                                <Box component="span" sx={{ fontSize: '1.2rem', color: isDark ? DARK.text2 : '#9ca3af' }}>🔒</Box>
                                <Box
                                  component="input"
                                  id="reg-password"
                                  type={showRegPwd ? 'text' : 'password'}
                                  placeholder="Min. 8 characters"
                                  value={regPassword}
                                  onChange={(e) => setRegPassword(e.target.value)}
                                  autoComplete="new-password"
                                  sx={getInputSx(isDark)}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => setShowRegPwd((v) => !v)}
                                  sx={{ color: isDark ? DARK.text2 : '#9ca3af', '&:hover': { color: isDark ? DARK.text0 : '#111827' }, p: 0.5 }}
                                >
                                  {showRegPwd ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                                </IconButton>
                              </Box>
                            </Field>

                            <Field label="Confirm Password" isDark={isDark}>
                              <Box sx={getInputWrapSx(isDark)}>
                                <Box component="span" sx={{ fontSize: '1.2rem', color: isDark ? DARK.text2 : '#9ca3af' }}>🔒</Box>
                                <Box
                                  component="input"
                                  id="reg-confirm"
                                  type="password"
                                  placeholder="Re-enter password"
                                  value={regConfirm}
                                  onChange={(e) => setRegConfirm(e.target.value)}
                                  autoComplete="new-password"
                                  sx={getInputSx(isDark)}
                                />
                              </Box>
                            </Field>

                            <SubmitBtn loading={loading} label="Create Account" isDark={isDark} />
                          </Stack>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </Box>
            </motion.div>
            
            {/* Scroll indicator */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ position: 'absolute', bottom: 30, opacity: 0.5 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827' }}>Scroll down</Typography>
              <Box sx={{ width: 2, height: 24, bgcolor: '#111827', mx: 'auto', mt: 1, borderRadius: 1 }} />
            </motion.div>

          </Box>
        </Box>

        {/* ════════════════════ FEATURES SECTION (Scroll Animated) ════════════════════ */}
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 10, px: { xs: 3, md: 10 }, position: 'relative', zIndex: 5 }}>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={featureVariants}
            style={{ textAlign: 'center', marginBottom: '80px' }}
          >
            <Typography variant="h2" fontWeight={800} sx={{ letterSpacing: '-1.5px', color: isDark ? DARK.text0 : '#111827', mb: 2 }}>
              Everything you need.
            </Typography>
            <Typography variant="h5" sx={{ color: isDark ? DARK.text2 : '#6b7280', maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
              A powerful, clean dashboard designed to streamline your operations and maximize efficiency.
            </Typography>
          </motion.div>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
            gap: 4,
          }}>
            {[
              { icon: <SpeedOutlined sx={{ fontSize: 40 }}/>, title: "Real-time Metrics", desc: "View live occupancy, incoming revenue, and vehicle flow with zero latency." },
              { icon: <TrendingUpOutlined sx={{ fontSize: 40 }}/>, title: "Data Insights", desc: "Understand your peak hours and optimize pricing through interactive charts." },
              { icon: <SmartphoneOutlined sx={{ fontSize: 40 }}/>, title: "Mobile Ready", desc: "Access your dashboard from any device with our fully responsive glassmorphic UI." },
              { icon: <SecurityOutlined sx={{ fontSize: 40 }}/>, title: "Enterprise Security", desc: "Role-based access control and encrypted connections keep your data safe." },
              { icon: <PersonAddOutlined sx={{ fontSize: 40 }}/>, title: "User Management", desc: "Easily onboard staff and manage permissions from a central interface." },
              { icon: <LocalParking sx={{ fontSize: 40 }}/>, title: "Zone Control", desc: "Segment your parking facility into zones and monitor capacity individually." }
            ].map((feat, idx) => (
              <motion.div
                key={feat.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0, transition: { delay: idx * 0.1, type: 'spring', stiffness: 100 } }
                }}
              >
                <Box sx={{
                  p: 4,
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  bgcolor: isDark ? 'rgba(26,26,26,0.65)' : 'rgba(255,255,255,0.5)',
                  backdropFilter: 'blur(16px)',
                  border: isDark ? `1px solid ${DARK.border}` : '1px solid rgba(255,255,255,0.8)',
                  borderRadius: '32px',
                  boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0, 0, 0, 0.16)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: isDark ? '0 16px 40px rgba(239,68,68,0.15)' : '0 16px 40px rgba(0, 0, 0, 0.16)',
                    border: isDark ? `1px solid rgba(239,68,68,0.3)` : '1px solid rgba(255,255,255,0.8)',
                  }
                }}>
                  {/* Small red accent dot top-right */}
                  <Box sx={{ position: 'absolute', top: 16, right: 16, width: 7, height: 7, borderRadius: '50%', bgcolor: '#ef4444', opacity: 0.7, boxShadow: '0 0 6px #ef4444' }} />
                  <Box sx={{
                    width: 64, height: 64, borderRadius: '20px', mb: 3,
                    bgcolor: isDark ? 'rgba(239,68,68,0.15)' : '#111827',
                    color: isDark ? '#ef4444' : '#fff',
                    border: isDark ? '1px solid rgba(239,68,68,0.25)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isDark ? '0 8px 20px rgba(239,68,68,0.15)' : '0 8px 20px rgba(0, 0, 0, 0.2)',
                  }}>
                    {feat.icon}
                  </Box>
                  <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5, color: isDark ? '#f1f5f9' : '#111827' }}>
                    {feat.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: isDark ? '#94a3b8' : '#4b5563', lineHeight: 1.6 }}>
                    {feat.desc}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>

          <Box sx={{ mt: 10, textAlign: 'center', py: 4, borderTop: isDark ? `1px solid ${DARK.border}` : '1px solid rgba(0, 0, 0, 0.12)' }}>
            <Typography variant="body2" sx={{ color: isDark ? DARK.text2 : '#6b7280' }}>
              © {new Date().getFullYear()} Jenx AI Technologies • Crafted with precision.
            </Typography>
          </Box>

        </Box>
      </Box>
    </>
  );
}
