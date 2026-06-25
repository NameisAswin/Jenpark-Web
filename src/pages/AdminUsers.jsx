import { useState, useEffect, useCallback } from 'react';
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
  Avatar,
} from '@mui/material';
import {
  Add,
  SearchOutlined,
  DeleteOutlined,
  CloseOutlined,
  RefreshOutlined,
  PersonOutlined,
  EditOutlined,
  AdminPanelSettingsOutlined,
  CheckOutlined,
} from '@mui/icons-material';
import { usersService } from '../services/users.service';
import { useAppTheme, DARK } from '../theme/ThemeContext';
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

function getFieldWrapSx(isDark) {
  return {
    display: 'flex', alignItems: 'center', gap: 1.5,
    px: 2, py: 1.5,
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

function getInputSx(isDark) {
  return {
    flex: 1, border: 'none', outline: 'none',
    bgcolor: 'transparent',
    color: isDark ? DARK.text0 : '#111827', fontSize: '1rem',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 600,
    '&::placeholder': { color: isDark ? DARK.text3 : 'rgba(0,0,0,0.3)', fontWeight: 500 },
  };
}

function FieldLabel({ children, isDark }) {
  return (
    <Typography sx={{
      fontSize: '0.75rem', fontWeight: 800, mb: 0.75,
      color: isDark ? DARK.text2 : '#4b5563',
      textTransform: 'uppercase', letterSpacing: '1px',
    }}>
      {children}
    </Typography>
  );
}

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function getRoleColors(isDark) {
  return {
    admin: { bg: isDark ? DARK.red : '#111827', color: '#ffffff', border: isDark ? DARK.red : '#111827' },
    user:  { bg: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)', color: isDark ? DARK.text2 : '#4b5563', border: isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)' },
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

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState('');
  const [toast,       setToast]       = useState({ open: false, msg: '', severity: 'info' });
  const [createOpen,  setCreateOpen]  = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [deleteId,    setDeleteId]    = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Create form state ────────────────────────────────────────────────────
  const [formName,     setFormName]     = useState('');
  const [formEmail,    setFormEmail]    = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole,     setFormRole]     = useState('user');
  const [formError,    setFormError]    = useState('');
  const [formLoading,  setFormLoading]  = useState(false);

  // ── Load users ───────────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersService.getAll();
      const list = Array.isArray(data) ? data : data?.data || data?.users || [];
      setUsers(list);
    } catch (err) {
      setToast({ open: true, msg: err?.response?.data?.message || 'Failed to load users.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // ── Filtered ─────────────────────────────────────────────────────────────
  const filtered = users.filter((u) =>
    [u.name || '', u.email || ''].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  // ── Reset form ───────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormName(''); setFormEmail(''); setFormPassword('');
    setFormRole('user'); setFormError('');
  };

  // ── Create user ──────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formName.trim())     { setFormError('Name is required.'); return; }
    if (!formEmail.trim())    { setFormError('Email is required.'); return; }
    if (!formPassword.trim()) { setFormError('Password is required.'); return; }
    if (formPassword.length < 6) { setFormError('Password must be at least 6 characters.'); return; }

    setFormLoading(true);
    try {
      await usersService.create({
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword,
        role: formRole,
      });
      setToast({ open: true, msg: 'User created successfully!', severity: 'success' });
      setCreateOpen(false);
      resetForm();
      reload();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Update user ──────────────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formName.trim())  { setFormError('Name is required.'); return; }
    if (!formEmail.trim()) { setFormError('Email is required.'); return; }

    setFormLoading(true);
    try {
      const id = editTarget._id || editTarget.id;
      const payload = { name: formName.trim(), email: formEmail.trim(), role: formRole };
      if (formPassword.trim()) payload.password = formPassword;
      await usersService.update(id, payload);
      setToast({ open: true, msg: 'User updated successfully!', severity: 'success' });
      setEditTarget(null);
      resetForm();
      reload();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to update user.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete user ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await usersService.remove(deleteId);
      setToast({ open: true, msg: 'User deleted.', severity: 'success' });
      setDeleteId(null);
      reload();
    } catch (err) {
      setToast({ open: true, msg: err?.response?.data?.message || 'Failed to delete user.', severity: 'error' });
      setDeleteId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Open edit ────────────────────────────────────────────────────────────
  const openEdit = (u) => {
    setEditTarget(u);
    setFormName(u.name || '');
    setFormEmail(u.email || '');
    setFormPassword('');
    setFormRole(u.role || 'user');
    setFormError('');
  };

  return (
    <Box sx={{ minHeight: '100%', p: 1 }}>

      {/* Toast */}
      <Snackbar
        open={toast.open} autoHideDuration={3500}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <AdminPanelSettingsOutlined sx={{ color: isDark ? DARK.text0 : '#111827', fontSize: 28 }} />
              <Typography variant="h4" fontWeight={800} color={isDark ? DARK.text0 : '#111827'} sx={{ letterSpacing: '-0.5px' }}>
                User Management
              </Typography>
            </Box>
            <Typography variant="body2" color={isDark ? DARK.text2 : '#6b7280'} sx={{ mt: 0.5 }}>
              {users.length} registered user{users.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Tooltip title="Refresh">
              <IconButton
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={reload} size="medium"
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
              onClick={() => { setCreateOpen(true); resetForm(); }}
              sx={{
                background: isDark ? DARK.red : '#111827',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                borderRadius: '16px', fontWeight: 700, px: 3, py: 1, color: '#ffffff',
                '&:hover': {
                  background: isDark ? '#dc2626' : '#000000',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                },
              }}
            >
              Create User
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* ── Search ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Box sx={{
          ...glassSx,
          display: 'flex', alignItems: 'center', gap: 2,
          px: 3, py: 2, mb: 4,
          '&:focus-within': { borderColor: '#111827', bgcolor: isDark ? DARK.bg1 : 'rgba(255,255,255,0.9)', boxShadow: '0 12px 48px rgba(0, 0, 0, 0.16)' },
        }}>
          <SearchOutlined sx={{ color: isDark ? DARK.text3 : '#9ca3af', fontSize: 24 }} />
          <InputBase
            placeholder="Search by name or email…"
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

      {/* ── Users table ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Box sx={getGlassSx(isDark)}>

          {/* Header */}
          <Box sx={{
            display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 120px',
            px: 4, py: 3,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            bgcolor: isDark ? DARK.bg1 : 'rgba(0,0,0,0.02)',
            borderRadius: '32px 32px 0 0',
          }}>
            {['Name', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
              <Typography key={h} sx={{ fontSize: '0.8rem', fontWeight: 800, color: isDark ? DARK.text2 : '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {h}
              </Typography>
            ))}
          </Box>

          {/* Loading */}
          {loading && (
            <Box sx={{ py: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3 }}>
              <CircularProgress size={32} sx={{ color: isDark ? DARK.text0 : '#111827' }} />
              <Typography variant="h6" color={isDark ? DARK.text2 : '#4b5563'} fontWeight={600}>Loading users…</Typography>
            </Box>
          )}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <PersonOutlined sx={{ fontSize: 80, color: 'rgba(0, 0, 0, 0.12)', mb: 3 }} />
              <Typography variant="h5" color={isDark ? DARK.text2 : '#4b5563'} fontWeight={700}>
                {search ? 'No users match your search.' : 'No users found.'}
              </Typography>
            </Box>
          )}

          {/* Rows */}
          {!loading && filtered.length > 0 && (
            <Box component={motion.div} variants={containerVariants} initial="hidden" animate="show">
              <Stack spacing={0} divider={<Divider sx={{ borderColor: isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)' }} />}>
                {filtered.map((u, idx) => {
                  const id      = u._id || u.id;
                  const name    = u.name  || '—';
                  const email   = u.email || '—';
                  const role    = u.role  || 'user';
                  const joined  = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString('en-IN', { dateStyle: 'short' })
                    : '—';
                  const roleStyle = getRoleColors(isDark)[role] || getRoleColors(isDark).user;

                  return (
                    <motion.div key={id || idx} variants={itemVariants}>
                      <Box sx={{
                        display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 120px',
                        alignItems: 'center', px: 4, py: 3,
                        borderRadius: idx === filtered.length - 1 ? '0 0 32px 32px' : 0,
                        transition: 'background 0.2s',
                        '&:hover': { bgcolor: isDark ? DARK.bg1 : 'rgba(0,0,0,0.02)' },
                      }}>

                        {/* Name + avatar */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                          <Avatar sx={{
                            width: 48, height: 48, borderRadius: '16px',
                            background: role === 'admin' ? (isDark ? DARK.red : '#111827') : (isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)'),
                            color: role === 'admin' ? '#ffffff' : (isDark ? DARK.text2 : '#4b5563'),
                            fontSize: '1rem', fontWeight: 800, flexShrink: 0,
                            boxShadow: role === 'admin' ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none'
                          }}>
                            {getInitials(name)}
                          </Avatar>
                          <Typography variant="h6" fontWeight={800} color={isDark ? DARK.text0 : '#111827'} noWrap>
                            {name}
                          </Typography>
                        </Box>

                        {/* Email */}
                        <Typography variant="body1" color={isDark ? DARK.text2 : '#6b7280'} fontWeight={500} noWrap sx={{ pr: 2 }}>
                          {email}
                        </Typography>

                        {/* Role chip */}
                        <Box>
                          <Chip
                            label={role}
                            size="small"
                            sx={{
                              bgcolor: roleStyle.bg, color: roleStyle.color,
                              border: `1px solid ${roleStyle.border}`,
                              fontWeight: 800, fontSize: '0.85rem', textTransform: 'capitalize', borderRadius: '10px', px: 1
                            }}
                          />
                        </Box>

                        {/* Joined */}
                        <Typography variant="body1" color={isDark ? DARK.text2 : '#4b5563'} fontWeight={700}>{joined}</Typography>

                        {/* Actions */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit user">
                            <IconButton
                              size="medium" onClick={() => openEdit(u)}
                              sx={{ bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)', color: isDark ? DARK.text0 : '#111827', borderRadius: '12px', '&:hover': { bgcolor: isDark ? DARK.bg2 : 'rgba(0, 0, 0, 0.2)' } }}
                            >
                              <EditOutlined sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete user">
                            <IconButton
                              size="medium" onClick={() => setDeleteId(id)}
                              sx={{ bgcolor: 'rgba(220,38,38,0.1)', color: '#dc2626', borderRadius: '12px', '&:hover': { bgcolor: 'rgba(220,38,38,0.2)' } }}
                            >
                              <DeleteOutlined sx={{ fontSize: 20 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>

                      </Box>
                    </motion.div>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Box>
      </motion.div>

      {/* ── Create User Dialog ── */}
      <UserFormDialog
        isDark={isDark}
        open={createOpen}
        title="Create New User"
        submitLabel="Create User"
        name={formName} setName={setFormName}
        email={formEmail} setEmail={setFormEmail}
        password={formPassword} setPassword={setFormPassword}
        role={formRole} setRole={setFormRole}
        error={formError}
        loading={formLoading}
        onSubmit={handleCreate}
        onClose={() => { setCreateOpen(false); resetForm(); }}
      />

      {/* ── Edit User Dialog ── */}
      <UserFormDialog
        isDark={isDark}
        open={Boolean(editTarget)}
        title="Edit User"
        submitLabel="Save Changes"
        name={formName} setName={setFormName}
        email={formEmail} setEmail={setFormEmail}
        password={formPassword} setPassword={setFormPassword}
        role={formRole} setRole={setFormRole}
        error={formError}
        loading={formLoading}
        onSubmit={handleUpdate}
        onClose={() => { setEditTarget(null); resetForm(); }}
        passwordOptional
      />

      {/* ── Confirm Delete Dialog ── */}
      <Dialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        PaperProps={{ sx: { bgcolor: isDark ? DARK.bg2 : '#ffffff', border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`, borderRadius: '32px', boxShadow: '0 24px 64px rgba(0, 0, 0, 0.25)' } }}
      >
        <DialogTitle sx={{ color: '#dc2626', fontWeight: 800, p: 4, pb: 2, fontSize: '1.5rem' }}>Confirm Deletion</DialogTitle>
        <DialogContent sx={{ px: 4, pb: 3 }}>
          <Typography color={isDark ? DARK.text2 : '#4b5563'} variant="h6" fontWeight={500}>
            Are you sure you want to permanently delete this user? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 2, bgcolor: isDark ? DARK.bg1 : 'rgba(0,0,0,0.02)', borderRadius: '0 0 32px 32px' }}>
          <Button onClick={() => setDeleteId(null)} sx={{ color: isDark ? DARK.text2 : '#4b5563', fontWeight: 700, borderRadius: '16px', px: 4, py: 1.5, '&:hover': { bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)' } }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleDelete}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlined />}
            sx={{ background: '#dc2626', color: '#fff', borderRadius: '16px', fontWeight: 800, px: 4, py: 1.5, boxShadow: '0 8px 24px rgba(220,38,38,0.3)', '&:hover': { background: '#b91c1c' } }}
          >
            {deleteLoading ? 'Deleting…' : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

// ── Shared user form dialog ───────────────────────────────────────────────────
function UserFormDialog({
  isDark,
  open, title, submitLabel,
  name, setName, email, setEmail,
  password, setPassword, role, setRole,
  error, loading, onSubmit, onClose, passwordOptional = false,
}) {
  const roles = ['user', 'admin'];

  return (
    <Dialog
      open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{
        sx: {
          bgcolor: isDark ? DARK.bg2 : '#ffffff',
          border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`,
          borderRadius: '32px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.25)',
        }
      }}
    >
      <DialogTitle sx={{ color: isDark ? DARK.text0 : '#111827', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 4, pb: 3, fontSize: '1.5rem' }}>
        {title}
        <IconButton onClick={onClose} size="medium" sx={{ color: isDark ? DARK.text3 : '#9ca3af', '&:hover': { color: isDark ? DARK.text0 : '#111827', bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)' } }}>
          <CloseOutlined sx={{ fontSize: 24 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 4, pb: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 4, bgcolor: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px' }}>
            {error}
          </Alert>
        )}

        <Box component="form" id="user-form" onSubmit={onSubmit} noValidate>
          <Stack spacing={4}>

            {/* Name */}
            <Box>
              <FieldLabel isDark={isDark}>Full Name</FieldLabel>
              <Box sx={getFieldWrapSx(isDark)}>
                <Box component="span" sx={{ color: isDark ? DARK.text3 : '#9ca3af', fontSize: '1.2rem' }}>👤</Box>
                <Box component="input" type="text" placeholder="John Doe" value={name}
                  onChange={(e) => setName(e.target.value)} sx={getInputSx(isDark)} />
              </Box>
            </Box>

            {/* Email */}
            <Box>
              <FieldLabel isDark={isDark}>Email Address</FieldLabel>
              <Box sx={getFieldWrapSx(isDark)}>
                <Box component="span" sx={{ color: isDark ? DARK.text3 : '#9ca3af', fontSize: '1.2rem' }}>✉</Box>
                <Box component="input" type="email" placeholder="name@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} sx={getInputSx(isDark)} />
              </Box>
            </Box>

            {/* Password */}
            <Box>
              <FieldLabel isDark={isDark}>{passwordOptional ? 'New Password (leave blank to keep)' : 'Password'}</FieldLabel>
              <Box sx={getFieldWrapSx(isDark)}>
                <Box component="span" sx={{ color: isDark ? DARK.text3 : '#9ca3af', fontSize: '1.2rem' }}>🔒</Box>
                <Box component="input" type="password"
                  placeholder={passwordOptional ? 'Leave blank to keep current' : 'Min. 6 characters'}
                  value={password} onChange={(e) => setPassword(e.target.value)} sx={getInputSx(isDark)} />
              </Box>
            </Box>

            {/* Role */}
            <Box>
              <FieldLabel isDark={isDark}>Role</FieldLabel>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {roles.map((r) => (
                  <Box
                    key={r}
                    onClick={() => setRole(r)}
                    sx={{
                      flex: 1, py: 2, borderRadius: '16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
                      transition: 'all 0.2s',
                      background: role === r ? (isDark ? DARK.red : '#111827') : (isDark ? DARK.bg3 : 'rgba(0,0,0,0.02)'),
                      border: `1px solid ${role === r ? (isDark ? DARK.red : '#111827') : (isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)')}`,
                    }}
                  >
                    {r === 'admin'
                      ? <AdminPanelSettingsOutlined sx={{ fontSize: 24, color: role === r ? '#ffffff' : '#9ca3af' }} />
                      : <PersonOutlined sx={{ fontSize: 24, color: role === r ? '#ffffff' : '#9ca3af' }} />
                    }
                    <Typography sx={{
                      fontSize: '1rem', fontWeight: 800, textTransform: 'capitalize',
                      color: role === r
                        ? '#ffffff'
                        : '#6b7280',
                    }}>
                      {r}
                    </Typography>
                    {role === r && <CheckOutlined sx={{ fontSize: 20, color: '#ffffff' }} />}
                  </Box>
                ))}
              </Box>
            </Box>

          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 4, pt: 2, gap: 2, bgcolor: isDark ? DARK.bg1 : 'rgba(0,0,0,0.02)', borderRadius: '0 0 32px 32px' }}>
        <Button onClick={onClose} sx={{ color: isDark ? DARK.text2 : '#6b7280', fontWeight: 700, borderRadius: '16px', px: 4, py: 1.5, '&:hover': { bgcolor: isDark ? DARK.bg1 : 'rgba(0, 0, 0, 0.12)' } }}>Cancel</Button>
        <Button
          type="submit" form="user-form"
          variant="contained" disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            background: isDark ? DARK.red : '#111827', color: '#fff',
            fontWeight: 800, borderRadius: '16px', px: 5, py: 1.5,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            '&:hover': { background: isDark ? '#dc2626' : '#000000', transform: 'translateY(-2px)', boxShadow: '0 12px 32px rgba(0,0,0,0.2)' },
          }}
        >
          {loading ? 'Saving…' : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
