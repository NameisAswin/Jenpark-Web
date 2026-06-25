import { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Badge,
  Drawer,
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  DirectionsCarOutlined,
  LocalParkingOutlined,
  NotificationsNoneOutlined,
  LogoutOutlined,
  KeyboardArrowDownOutlined,
  AdminPanelSettingsOutlined,
  PersonOutline,
  LightModeOutlined,
  DarkModeOutlined,
  MenuOutlined,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectAuth, selectIsAdmin } from '../store/slices/authSlice';
import useAuth from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppTheme, DARK } from '../theme/ThemeContext';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardOutlined />,     path: '/dashboard' },
  { label: 'Vehicles',  icon: <DirectionsCarOutlined />, path: '/vehicles'  },
  { label: 'Profile',   icon: <PersonOutline />,         path: '/profile'   },
];

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function MainLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useSelector(selectAuth);
  const isAdmin   = useSelector(selectIsAdmin);
  const { isAuthenticated, signOut } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const isDark = mode === 'dark';
  
  const [mobileOpen, setMobileOpen] = useState(false);

  const userName = user?.name || user?.username || user?.email?.split('@')[0] || '';
  const userRole = user?.role || 'Vehicle Owner';

  // Animation variants for page transitions
  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -10 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'easeInOut',
    duration: 0.3,
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <Box
        component={motion.div}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        sx={{
          width: 52, height: 52, borderRadius: '20px',
          background: isDark ? 'linear-gradient(135deg, #ef4444, #dc2626)' : '#111827',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mb: 4,
          boxShadow: isDark ? '0 8px 24px rgba(239,68,68,0.35)' : '0 8px 24px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={() => { navigate('/dashboard'); setMobileOpen(false); }}
      >
        <LocalParkingOutlined sx={{ color: '#fff', fontSize: 28 }} />
        {/* Red live indicator */}
        <Box sx={{ position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: '50%', bgcolor: '#22c55e', border: '2px solid', borderColor: isDark ? '#1e293b' : '#f8fafc', boxShadow: '0 0 6px #22c55e' }} />
      </Box>

      {NAV_ITEMS.map((item) => {
        const active = item.path && location.pathname.startsWith(item.path);
        return (
          <Tooltip key={item.label} title={item.label} placement="right" arrow>
            <Box
              component={motion.div}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { if(item.path) { navigate(item.path); setMobileOpen(false); } }}
              sx={{
                width: 56, height: 56, borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: item.path ? 'pointer' : 'not-allowed',
                position: 'relative',
                color: active ? '#ffffff' : (isDark ? '#94a3b8' : '#6b7280'),
                background: active
                  ? (isDark ? 'linear-gradient(135deg, #ef4444, #dc2626)' : '#111827')
                  : 'transparent',
                boxShadow: active
                  ? (isDark ? '0 8px 20px rgba(239,68,68,0.35)' : '0 8px 20px rgba(0, 0, 0, 0.25)')
                  : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                mb: 1.5,
                '&:hover': item.path ? {
                  color: active ? '#ffffff' : (isDark ? '#f1f5f9' : '#111827'),
                  background: active
                    ? (isDark ? '#dc2626' : '#000000')
                    : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0, 0, 0, 0.12)'),
                } : {},
              }}
            >
              {item.icon}
            </Box>
          </Tooltip>
        );
      })}

      {isAdmin && (
        <Tooltip title="User Management" placement="right" arrow>
          <Box
            component={motion.div}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { navigate('/admin/users'); setMobileOpen(false); }}
            sx={{
              width: 56, height: 56, borderRadius: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              color: location.pathname.startsWith('/admin/users') ? '#ffffff' : '#6b7280',
              background: location.pathname.startsWith('/admin/users') ? '#111827' : 'transparent',
              boxShadow: location.pathname.startsWith('/admin/users') ? '0 8px 20px rgba(0, 0, 0, 0.25)' : 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              mb: 1.5,
              mt: 2,
              '&:hover': {
                color: location.pathname.startsWith('/admin/users') ? '#ffffff' : '#111827',
                background: location.pathname.startsWith('/admin/users') ? '#000000' : 'rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            <AdminPanelSettingsOutlined />
          </Box>
        </Tooltip>
      )}

      <Box sx={{ flex: 1 }} />

      {/* Theme toggle */}
      <Tooltip title={isDark ? 'Light Mode' : 'Dark Mode'} placement="right" arrow>
        <IconButton
          component={motion.button}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          sx={{
            width: 52, height: 52, borderRadius: '20px', mb: 1,
            bgcolor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(0, 0, 0, 0.2)',
            color: isDark ? '#ef4444' : '#6b7280',
            border: isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(0,0,0,0.06)',
            '&:hover': {
              bgcolor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(0, 0, 0, 0.16)',
              color: isDark ? '#ef4444' : '#111827',
            },
          }}
        >
          {isDark ? <LightModeOutlined fontSize="small" /> : <DarkModeOutlined fontSize="small" />}
        </IconButton>
      </Tooltip>

      {isAuthenticated && (
        <Tooltip title="Sign Out" placement="right" arrow>
          <IconButton
            component={motion.button}
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { signOut(); setMobileOpen(false); }}
            sx={{
              color: '#6b7280',
              bgcolor: 'transparent',
              '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.1)' },
              width: 52, height: 52,
              borderRadius: '20px',
            }}
          >
            <LogoutOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );

  return (
    <>
      <div className="animated-bg">
        <div className="blob-3" />
      </div>
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: 'transparent',
        }}
      >
        {/* ─── Desktop Sidebar ─────────────────────────────────────────────────────────── */}
        <Box
          component={motion.aside}
          initial={{ x: -100 }}
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          sx={{
            display: { xs: 'none', md: 'flex' },
            width: 88,
            flexShrink: 0,
            flexDirection: 'column',
            alignItems: 'center',
            py: 3,
            gap: 1,
            className: 'glass-panel',
            borderRight: `1px solid ${isDark ? DARK.border : 'rgba(255,255,255,0.8)'}`,
            borderTopRightRadius: 32,
            borderBottomRightRadius: 32,
            zIndex: 20,
            boxShadow: isDark ? `4px 0 24px rgba(0,0,0,0.6)` : '4px 0 24px rgba(0, 0, 0, 0.16)',
            ml: 2,
            my: 2,
            height: 'calc(100vh - 32px)',
          }}
        >
          {sidebarContent}
        </Box>

        {/* ─── Mobile Drawer ─────────────────────────────────────────────────────────── */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 88,
              bgcolor: isDark ? DARK.bg1 : '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 3,
              gap: 1,
              borderRight: `1px solid ${isDark ? DARK.border : 'rgba(0,0,0,0.05)'}`,
            },
          }}
        >
          {sidebarContent}
        </Drawer>

        {/* ─── Main panel ──────────────────────────────────────────────────────── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Top bar */}
          <Box
            component={motion.header}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
            sx={{
              height: 76,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              px: { xs: 2, md: 4 },
              gap: { xs: 1.5, md: 3 },
              className: 'glass-panel',
              border: isDark ? `1px solid ${DARK.border}` : '1px solid rgba(255,255,255,0.8)',
              zIndex: 10,
              mx: { xs: 2, md: 3 },
              mt: 2,
              borderRadius: '32px',
            }}
          >
            {/* Hamburger menu for mobile */}
            <IconButton
              sx={{ display: { xs: 'flex', md: 'none' }, color: isDark ? DARK.text1 : '#111827' }}
              onClick={() => setMobileOpen(true)}
            >
              <MenuOutlined />
            </IconButton>

            <Box sx={{ flex: 1 }} />

            {/* Notif bell */}
            <Tooltip title="Notifications">
              <IconButton
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                sx={{
                  bgcolor: isDark ? DARK.bg3 : 'rgba(255,255,255,0.6)',
                  border: `1px solid ${isDark ? DARK.border : 'rgba(255,255,255,0.8)'}`,
                  borderRadius: '16px',
                  width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 },
                  boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0, 0, 0, 0.12)',
                  '&:hover': { bgcolor: isDark ? '#2a2a2a' : '#ffffff', borderColor: isDark ? DARK.red : 'rgba(0, 0, 0, 0.2)' },
                }}
              >
                <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { boxShadow: `0 0 0 2px ${isDark ? DARK.bg1 : '#ffffff'}` } }}>
                  <NotificationsNoneOutlined sx={{ fontSize: { xs: 20, md: 24 }, color: isDark ? DARK.text1 : '#111827' }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User pill */}
            {isAuthenticated && (
              <Box
                component={motion.div}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/profile')}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: { xs: 1, md: 1.5 }, py: { xs: 0.5, md: 0.75 },
                  borderRadius: '24px',
                  border: `1px solid ${isDark ? DARK.border : 'rgba(255,255,255,0.8)'}`,
                  bgcolor: isDark ? DARK.bg3 : 'rgba(255,255,255,0.6)',
                  boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0, 0, 0, 0.12)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': { bgcolor: isDark ? '#2a2a2a' : '#ffffff', borderColor: isDark ? DARK.red : 'rgba(0, 0, 0, 0.2)' },
                }}
              >
                <Avatar
                  sx={{
                    width: { xs: 32, md: 38 }, height: { xs: 32, md: 38 }, borderRadius: '16px',
                    background: isDark ? `linear-gradient(135deg, ${DARK.red}, #dc2626)` : '#111827',
                    color: '#ffffff',
                    fontSize: { xs: '0.8rem', md: '0.9rem' }, fontWeight: 700,
                    boxShadow: isDark ? `0 4px 12px rgba(239,68,68,0.3)` : 'none',
                  }}
                >
                  {getInitials(userName)}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' }, pr: 1 }}>
                  <Typography variant="body2" fontWeight={700} display="block" lineHeight={1.2}
                    sx={{ color: isDark ? DARK.text0 : '#111827' }}
                  >
                    {userName || 'User'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: isDark ? DARK.text2 : '#6b7280', fontWeight: 600, lineHeight: 1, mt: 0.5 }}>
                    {userRole}
                  </Typography>
                </Box>
                <KeyboardArrowDownOutlined sx={{ fontSize: 18, color: isDark ? DARK.text2 : '#6b7280', display: { xs: 'none', sm: 'block' } }} />
              </Box>
            )}
          </Box>

          {/* Page content with AnimatePresence for transitions */}
          <Box
            component="main"
            sx={{
              flex: 1,
              overflow: 'auto',
              p: { xs: 2, sm: 4 },
              position: 'relative',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                style={{ height: '100%' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Box>
        </Box>
      </Box>
    </>
  );
}
