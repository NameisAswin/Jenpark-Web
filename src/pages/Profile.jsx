import { useState, useRef, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Grid,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
} from '@mui/material';
import {
  PersonOutline,
  EmailOutlined,
  BadgeOutlined,
  CameraAltOutlined,
  SaveOutlined,
  EditOutlined,
  CloseOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  CropRotateOutlined,
} from '@mui/icons-material';
import { selectAuth } from '../store/slices/authSlice';
import { updateProfileThunk } from '../store/slices/authThunks';
import { motion } from 'framer-motion';
import { useAppTheme, DARK } from '../theme/ThemeContext';

function getInputSx(isDark, editable = false) {
  return {
    width: '100%', border: 'none', outline: 'none',
    bgcolor: 'transparent',
    color: isDark ? DARK.text0 : '#111827', fontSize: '1.05rem', fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    cursor: editable ? 'text' : 'default',
  };
}

function getFieldWrapSx(isDark, editable = false) {
  return {
    display: 'flex', alignItems: 'center', gap: 1.5,
    px: 2, py: 1.5,
    bgcolor: editable
      ? (isDark ? '#1f1f1f' : '#ffffff')
      : (isDark ? DARK.bg3 : 'rgba(255,255,255,0.8)'),
    border: `1px solid ${editable
      ? (isDark ? DARK.red : '#111827')
      : (isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)')}`,
    borderRadius: '16px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: editable
      ? (isDark ? `0 0 0 3px ${DARK.red}22` : '0 0 0 3px rgba(0,0,0,0.08)')
      : 'none',
  };
}

function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

// ── Image Crop/Align Modal ────────────────────────────────────────────────────
function ImageCropModal({ open, imageSrc, isDark, onConfirm, onClose }) {
  const canvasRef   = useRef(null);
  const containerRef = useRef(null);
  const [zoom,   setZoom]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart  = useRef(null);
  const imgRef     = useRef(new Image());

  // Load image once src is set
  const imgLoaded = useRef(false);
  if (imageSrc && imgRef.current.src !== imageSrc) {
    imgRef.current.src = imageSrc;
    imgRef.current.onload = () => {
      imgLoaded.current = true;
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
  }

  // Draw onto canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded.current) return;
    const size = canvas.width;
    const ctx  = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    const img = imgRef.current;
    const scale  = Math.max(size / img.naturalWidth, size / img.naturalHeight) * zoom;
    const w = img.naturalWidth  * scale;
    const h = img.naturalHeight * scale;
    const x = (size - w) / 2 + offset.x;
    const y = (size - h) / 2 + offset.y;
    
    // Draw the image
    ctx.drawImage(img, x, y, w, h);

    // Draw dimming overlay with a transparent hole using the winding rule
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    // Outer rect (clockwise)
    ctx.rect(0, 0, size, size);
    // Inner circle (counter-clockwise) creates a hole
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.fill();

    // Circle border
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? DARK.red : '#111827';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [zoom, offset, isDark]);

  // Redraw after every render
  useEffect(() => {
    draw();
  });

  const onMouseDown = (e) => {
    setDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };
  const onMouseMove = (e) => {
    if (!dragging || !dragStart.current) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const onMouseUp = () => setDragging(false);

  // Touch support
  const onTouchStart = (e) => {
    const t = e.touches[0];
    setDragging(true);
    dragStart.current = { x: t.clientX - offset.x, y: t.clientY - offset.y };
  };
  const onTouchMove = (e) => {
    if (!dragging || !dragStart.current) return;
    const t = e.touches[0];
    setOffset({ x: t.clientX - dragStart.current.x, y: t.clientY - dragStart.current.y });
  };

  const handleConfirm = () => {
    if (!imgLoaded.current) return;
    // Export as 300×300 JPEG
    const out = document.createElement('canvas');
    out.width = 300; out.height = 300;
    const ctx = out.getContext('2d');
    
    // Create circular clip path
    ctx.beginPath();
    ctx.arc(150, 150, 150, 0, Math.PI * 2);
    ctx.clip();

    // Fill background white
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    const canvas = canvasRef.current;
    const size = canvas ? canvas.width : 260;
    const img = imgRef.current;
    const scale  = Math.max(size / img.naturalWidth, size / img.naturalHeight) * zoom;
    const w = img.naturalWidth  * scale;
    const h = img.naturalHeight * scale;
    const x = (size - w) / 2 + offset.x;
    const y = (size - h) / 2 + offset.y;

    // Scale coordinates to the output canvas
    const outScale = 300 / size;
    ctx.drawImage(img, x * outScale, y * outScale, w * outScale, h * outScale);
    
    onConfirm(out.toDataURL('image/jpeg', 0.9));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: isDark ? DARK.bg2 : '#fff',
          borderRadius: '24px',
          border: `1px solid ${isDark ? DARK.border : 'rgba(0,0,0,0.12)'}`,
          boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.7)' : '0 24px 64px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: isDark ? DARK.text0 : '#111827', pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CropRotateOutlined sx={{ color: isDark ? DARK.red : '#111827' }} />
          Align Profile Photo
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 1 }}>
        <Typography variant="body2" sx={{ color: isDark ? DARK.text2 : '#6b7280', mb: 2 }}>
          Drag to reposition · Use the slider to zoom
        </Typography>

        {/* Canvas preview */}
        <Box
          sx={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            mb: 3, userSelect: 'none',
          }}
        >
          <canvas
            ref={canvasRef}
            width={260}
            height={260}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
            style={{
              width: '260px',
              height: '260px',
              borderRadius: '16px',
              cursor: dragging ? 'grabbing' : 'grab',
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.2)',
              display: 'block',
              backgroundColor: isDark ? '#000' : '#f3f4f6',
            }}
          />
        </Box>

        {/* Zoom slider */}
        <Box sx={{ px: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ZoomOutOutlined sx={{ color: isDark ? DARK.text3 : '#9ca3af', fontSize: 20 }} />
            <Slider
              value={zoom}
              min={0.5}
              max={3}
              step={0.05}
              onChange={(_, v) => setZoom(v)}
              sx={{
                color: isDark ? DARK.red : '#111827',
                '& .MuiSlider-thumb': {
                  width: 18, height: 18,
                  boxShadow: isDark ? '0 0 0 4px rgba(239,68,68,0.2)' : '0 0 0 4px rgba(0,0,0,0.1)',
                },
              }}
            />
            <ZoomInOutlined sx={{ color: isDark ? DARK.text3 : '#9ca3af', fontSize: 20 }} />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button
          onClick={onClose}
          sx={{
            flex: 1, borderRadius: '14px', fontWeight: 700, py: 1.2,
            bgcolor: isDark ? DARK.bg3 : 'rgba(0,0,0,0.07)',
            color: isDark ? DARK.text1 : '#374151',
            '&:hover': { bgcolor: isDark ? DARK.bg2 : 'rgba(0,0,0,0.12)' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          sx={{
            flex: 1, borderRadius: '14px', fontWeight: 700, py: 1.2,
            background: isDark ? DARK.red : '#111827', color: '#fff',
            '&:hover': { background: isDark ? '#dc2626' : '#000' },
          }}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector(selectAuth);
  const { mode } = useAppTheme();
  const isDark   = mode === 'dark';
  const fileRef  = useRef(null);

  const userName  = user?.name || user?.username || 'User';
  const userEmail = user?.email || '—';
  const userRole  = user?.role || 'user';

  const [editing,         setEditing]         = useState(false);
  const [nameVal,         setNameVal]         = useState(userName);
  const [avatarPreview,   setAvatarPreview]   = useState(user?.profilePicture || '');
  const [avatarBase64,    setAvatarBase64]    = useState('');
  const [committedAvatar, setCommittedAvatar] = useState(user?.profilePicture || '');
  const [committedName,   setCommittedName]   = useState(userName);
  const [saving,          setSaving]          = useState(false);
  const [toast,           setToast]           = useState({ open: false, msg: '', severity: 'info' });

  // Crop modal state
  const [cropOpen,    setCropOpen]    = useState(false);
  const [cropSrc,     setCropSrc]     = useState('');

  const handleEdit = () => {
    setNameVal(committedName);
    setAvatarPreview(committedAvatar);
    setAvatarBase64('');
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setNameVal(committedName);
    setAvatarPreview(committedAvatar);
    setAvatarBase64('');
  };

  const handlePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setToast({ open: true, msg: 'Only PNG, JPG, or WEBP images are allowed.', severity: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ open: true, msg: 'Image must be under 5 MB.', severity: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropSrc(ev.target.result);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleCropConfirm = (croppedBase64) => {
    setAvatarBase64(croppedBase64);
    setAvatarPreview(croppedBase64);
    setCropOpen(false);
    setCropSrc('');
  };

  const handleSave = async () => {
    if (!nameVal.trim()) {
      setToast({ open: true, msg: 'Name cannot be empty.', severity: 'error' });
      return;
    }
    setSaving(true);
    const payload = { name: nameVal.trim() };
    if (avatarBase64) payload.profilePicture = avatarBase64;

    const result = await dispatch(updateProfileThunk(payload));
    setSaving(false);

    if (result.success) {
      if (avatarBase64) setCommittedAvatar(avatarBase64);
      setCommittedName(nameVal.trim());
      setEditing(false);
      setAvatarBase64('');
      setToast({ open: true, msg: 'Profile updated successfully!', severity: 'success' });
    } else {
      setToast({ open: true, msg: result.error || 'Failed to update profile.', severity: 'error' });
    }
  };

  const displayName   = editing ? nameVal       : committedName;
  const displayAvatar = editing ? avatarPreview  : committedAvatar;

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      sx={{ minHeight: '100%', pb: 4, p: 1 }}
    >
      {/* Toast */}
      <Snackbar
        open={toast.open} autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} sx={{
          bgcolor: isDark ? DARK.bg2 : '#ffffff',
          border: `1px solid ${isDark ? DARK.border : 'rgba(0, 0, 0, 0.2)'}`,
          color: isDark ? DARK.text0 : '#111827',
          borderRadius: '16px',
          boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0, 0, 0, 0.2)',
        }}>
          {toast.msg}
        </Alert>
      </Snackbar>

      {/* Crop Modal */}
      <ImageCropModal
        open={cropOpen}
        imageSrc={cropSrc}
        isDark={isDark}
        onConfirm={handleCropConfirm}
        onClose={() => { setCropOpen(false); setCropSrc(''); }}
      />

      {/* Page header — single Edit Profile button lives here */}
      <motion.div variants={itemVariants}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px', color: isDark ? DARK.text0 : '#111827' }}>
            My Profile
          </Typography>

          {!editing ? (
            <Button
              startIcon={<EditOutlined />}
              onClick={handleEdit}
              sx={{
                background: isDark ? DARK.red : '#111827', color: '#fff',
                borderRadius: '16px', px: 3, py: 1.2, fontWeight: 700,
                '&:hover': { background: isDark ? '#dc2626' : '#000' },
              }}
            >
              Edit Profile
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                startIcon={<CloseOutlined />}
                onClick={handleCancel}
                disabled={saving}
                sx={{
                  bgcolor: isDark ? DARK.bg3 : 'rgba(0,0,0,0.08)',
                  color: isDark ? DARK.text1 : '#374151',
                  borderRadius: '16px', px: 3, py: 1.2, fontWeight: 700,
                  '&:hover': { bgcolor: isDark ? DARK.bg2 : 'rgba(0,0,0,0.14)' },
                }}
              >
                Cancel
              </Button>
              <Button
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  background: isDark ? DARK.red : '#111827', color: '#fff',
                  borderRadius: '16px', px: 3, py: 1.2, fontWeight: 700,
                  '&:hover': { background: isDark ? '#dc2626' : '#000' },
                  '&:disabled': { opacity: 0.6 },
                }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </Box>
          )}
        </Box>
      </motion.div>

      <Grid container spacing={4}>
        {/* Left Column: Avatar */}
        <Grid item xs={12} md={4}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card elevation={0} sx={{ height: '100%' }}>
              <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Box sx={{ position: 'relative', mb: 3 }}>
                  <Avatar
                    src={displayAvatar}
                    sx={{
                      width: 140, height: 140,
                      background: isDark ? `linear-gradient(135deg, ${DARK.red}, #dc2626)` : '#111827',
                      color: '#ffffff',
                      fontSize: '3.5rem', fontWeight: 800,
                      boxShadow: isDark ? `0 8px 32px rgba(239,68,68,0.3)` : '0 8px 32px rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    {getInitials(displayName)}
                  </Avatar>

                  {/* Active camera button in edit mode */}
                  {editing && (
                    <>
                      <input
                        ref={fileRef}
                        accept="image/png,image/jpeg,image/webp"
                        type="file"
                        style={{ display: 'none' }}
                        onChange={handlePictureChange}
                      />
                      <Box
                        onClick={() => fileRef.current?.click()}
                        component={motion.div}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        sx={{
                          position: 'absolute', bottom: 4, right: 4,
                          background: isDark ? DARK.red : '#111827',
                          color: '#fff',
                          borderRadius: '50%', width: 44, height: 44,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: isDark ? '0 4px 16px rgba(239,68,68,0.4)' : '0 4px 16px rgba(0, 0, 0, 0.3)',
                          border: `2px solid ${isDark ? DARK.bg2 : '#fff'}`,
                        }}
                      >
                        <CameraAltOutlined sx={{ fontSize: 20 }} />
                      </Box>
                    </>
                  )}

                  {/* Inactive camera icon in view mode */}
                  {!editing && (
                    <Box sx={{
                      position: 'absolute', bottom: 4, right: 4,
                      background: isDark ? DARK.bg3 : '#ffffff', color: isDark ? DARK.text3 : '#9ca3af',
                      borderRadius: '50%', width: 44, height: 44,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
                      border: isDark ? `2px solid ${DARK.border}` : '2px solid rgba(0, 0, 0, 0.12)',
                    }}>
                      <CameraAltOutlined sx={{ fontSize: 20 }} />
                    </Box>
                  )}
                </Box>

                <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5, color: isDark ? DARK.text0 : '#111827' }}>
                  {displayName}
                </Typography>
                <Typography variant="body1" sx={{ color: isDark ? DARK.text2 : '#6b7280', fontWeight: 700, textTransform: 'capitalize' }}>
                  {userRole}
                </Typography>
                {editing && (
                  <Typography variant="caption" sx={{ mt: 2, color: isDark ? DARK.text3 : '#9ca3af' }}>
                    Click the camera icon to change your photo
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Right Column: Details */}
        <Grid item xs={12} md={8}>
          <motion.div variants={itemVariants} style={{ height: '100%' }}>
            <Card elevation={0} sx={{ height: '100%' }}>
              <CardContent sx={{ p: 5 }}>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 4, color: isDark ? DARK.text0 : '#111827' }}>
                  Personal Information
                </Typography>

                <Grid container spacing={4}>
                  {/* Full Name */}
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: isDark ? DARK.text2 : '#6b7280', textTransform: 'uppercase', mb: 1, letterSpacing: '1px' }}>
                      Full Name
                    </Typography>
                    <Box sx={getFieldWrapSx(isDark, editing)}>
                      <PersonOutline sx={{ color: isDark ? DARK.text3 : '#9ca3af', fontSize: 24, flexShrink: 0 }} />
                      <Box
                        component="input"
                        readOnly={!editing}
                        value={nameVal}
                        onChange={(e) => setNameVal(e.target.value)}
                        placeholder="Enter your full name"
                        sx={getInputSx(isDark, editing)}
                      />
                    </Box>
                  </Grid>

                  {/* Email */}
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: isDark ? DARK.text2 : '#6b7280', textTransform: 'uppercase', mb: 1, letterSpacing: '1px' }}>
                      Email Address
                    </Typography>
                    <Box sx={getFieldWrapSx(isDark, false)}>
                      <EmailOutlined sx={{ color: isDark ? DARK.text3 : '#9ca3af', fontSize: 24 }} />
                      <Box component="input" readOnly value={userEmail} sx={getInputSx(isDark, false)} />
                    </Box>
                  </Grid>

                  {/* Role */}
                  <Grid item xs={12} sm={6}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: isDark ? DARK.text2 : '#6b7280', textTransform: 'uppercase', mb: 1, letterSpacing: '1px' }}>
                      Role
                    </Typography>
                    <Box sx={getFieldWrapSx(isDark, false)}>
                      <BadgeOutlined sx={{ color: isDark ? DARK.text3 : '#9ca3af', fontSize: 24 }} />
                      <Box component="input" readOnly value={userRole} sx={{ ...getInputSx(isDark, false), textTransform: 'capitalize' }} />
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4, borderColor: isDark ? DARK.border : 'rgba(0, 0, 0, 0.12)' }} />

                {/* Footer: Save / Cancel only shown in edit mode */}
                {editing && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                    <Button
                      startIcon={<CloseOutlined />}
                      onClick={handleCancel}
                      disabled={saving}
                      sx={{
                        bgcolor: isDark ? DARK.bg3 : 'rgba(0,0,0,0.08)',
                        color: isDark ? DARK.text1 : '#374151',
                        borderRadius: '16px', px: 4, py: 1.5, fontWeight: 700,
                        '&:hover': { bgcolor: isDark ? DARK.bg2 : 'rgba(0,0,0,0.14)' },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlined />}
                      onClick={handleSave}
                      disabled={saving}
                      sx={{
                        background: isDark ? DARK.red : '#111827', color: '#fff',
                        borderRadius: '16px', px: 5, py: 1.5, fontWeight: 700,
                        '&:hover': { background: isDark ? '#dc2626' : '#000' },
                        '&:disabled': { opacity: 0.6 },
                      }}
                    >
                      {saving ? 'Saving…' : 'Save Changes'}
                    </Button>
                  </Box>
                )}

              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
