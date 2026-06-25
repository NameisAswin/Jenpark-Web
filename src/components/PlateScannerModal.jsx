import { useEffect, useState } from 'react';
import { usePlateScanner } from '../hooks/usePlateScanner';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, Button, IconButton, Tab, Tabs, CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon, CameraAlt as CameraIcon, UploadFile as UploadIcon, Search as SearchIcon, CheckCircle as CheckCircleIcon, PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import { useAppTheme, DARK } from '../theme/ThemeContext';

export default function PlateScannerModal({ onDetected, onClose }) {
  const [mode, setMode] = useState('camera'); // "camera" | "upload"
  const { mode: themeMode } = useAppTheme();
  const isDark = themeMode === 'dark';

  const {
    videoRef, cameraOpen, scanning, preview, ocrResult, plateText, plateImage, error,
    openCamera, stopCamera, scanPlate, scanFile, cleanup,
  } = usePlateScanner();

  /* Auto-start camera */
  useEffect(() => {
    if (mode === 'camera') openCamera();
    return () => { if (mode === 'camera') stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* Cleanup on unmount */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => cleanup(), []);

  /* Auto-fill when plate found */
  useEffect(() => {
    if (plateText) {
      const timer = setTimeout(() => { onDetected(plateText, plateImage); onClose(); }, 1400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateText]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) await scanFile(file);
  };

  const handleTabChange = (e, newValue) => {
    if (newValue === mode) return;
    if (mode === 'camera') stopCamera();
    setMode(newValue);
  };

  return (
    <Dialog 
      open={true} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth 
      PaperProps={{
        sx: {
          bgcolor: isDark ? DARK.bg2 : '#ffffff',
          border: `1px solid ${isDark ? DARK.border : 'rgba(0,0,0,0.2)'}`,
          borderRadius: '24px',
          backgroundImage: 'none',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, color: isDark ? DARK.text0 : '#111827' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PhotoCameraIcon />
          <Typography variant="h6" fontWeight={800}>Auto Scan Number Plate</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: isDark ? DARK.text2 : '#4b5563' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Tabs 
        value={mode} 
        onChange={handleTabChange} 
        variant="fullWidth" 
        sx={{ borderBottom: 1, borderColor: isDark ? DARK.border : 'divider' }}
      >
        <Tab icon={<CameraIcon />} iconPosition="start" label="Live Camera" value="camera" sx={{ fontWeight: 700, color: isDark ? DARK.text2 : 'inherit', '&.Mui-selected': { color: isDark ? DARK.red : 'primary.main' } }} />
        <Tab icon={<UploadIcon />} iconPosition="start" label="Upload Image" value="upload" sx={{ fontWeight: 700, color: isDark ? DARK.text2 : 'inherit', '&.Mui-selected': { color: isDark ? DARK.red : 'primary.main' } }} />
      </Tabs>

      <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {mode === 'camera' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ 
              position: 'relative', width: '100%', aspectRatio: '16/9', bgcolor: '#000', borderRadius: '16px', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline autoPlay />
              
              {!cameraOpen && !error && (
                <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff' }}>
                  <CircularProgress color="inherit" size={32} sx={{ mb: 1 }} />
                  <Typography>Starting camera…</Typography>
                </Box>
              )}
              
              {cameraOpen && (
                <Box sx={{ position: 'absolute', inset: 0, border: '4px solid rgba(255,255,255,0.2)', pointerEvents: 'none' }}>
                  <Box sx={{ position: 'absolute', top: '20%', left: '10%', right: '10%', bottom: '20%', border: '2px dashed rgba(255,255,255,0.7)', borderRadius: '8px' }} />
                  <Typography sx={{ position: 'absolute', bottom: 16, width: '100%', textAlign: 'center', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    Aim camera at the number plate
                  </Typography>
                </Box>
              )}
            </Box>
            <Button 
              variant="contained" 
              onClick={scanPlate} 
              disabled={!cameraOpen || scanning}
              startIcon={scanning ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
              sx={{ 
                py: 1.5, borderRadius: '12px', fontWeight: 700, 
                bgcolor: isDark ? DARK.red : '#111827',
                '&:hover': { bgcolor: isDark ? '#dc2626' : '#000000' }
              }}
            >
              {scanning ? 'Scanning…' : 'Scan Plate'}
            </Button>
          </Box>
        )}

        {mode === 'upload' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              component="label"
              sx={{ 
                border: `2px dashed ${isDark ? DARK.border : 'rgba(0,0,0,0.2)'}`, 
                borderRadius: '16px', py: 6, display: 'flex', flexDirection: 'column', gap: 1,
                color: isDark ? DARK.text2 : '#4b5563',
                '&:hover': { bgcolor: isDark ? DARK.bg1 : 'rgba(0,0,0,0.02)' },
                textTransform: 'none'
              }}
            >
              <UploadIcon sx={{ fontSize: 48, mb: 1, color: isDark ? DARK.text0 : '#111827' }} />
              <Typography variant="h6" fontWeight={700} color={isDark ? DARK.text0 : '#111827'}>Click or drag a photo</Typography>
              <Typography variant="body2">PNG, JPG — any size</Typography>
              <input type="file" accept="image/*" hidden onChange={handleFileChange} />
            </Button>
            {scanning && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, color: isDark ? DARK.text0 : '#111827' }}>
                <CircularProgress size={24} color="inherit" />
                <Typography fontWeight={600}>Running OCR…</Typography>
              </Box>
            )}
          </Box>
        )}

        {preview && (
          <Box sx={{ mt: 2, p: 2, borderRadius: '16px', bgcolor: isDark ? DARK.bg1 : 'rgba(0,0,0,0.02)', border: `1px solid ${isDark ? DARK.border : 'rgba(0,0,0,0.1)'}` }}>
            <img src={preview} alt="Captured frame" style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }} />
            
            {plateText ? (
              <Box sx={{ textAlign: 'center' }}>
                <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 48, mb: 1 }} />
                <Typography variant="h6" fontWeight={800} color={isDark ? DARK.text0 : '#111827'}>Plate Detected!</Typography>
                <Box sx={{ my: 1.5, py: 1, px: 3, display: 'inline-block', border: `2px solid ${isDark ? DARK.text0 : '#111827'}`, borderRadius: '8px', bgcolor: isDark ? DARK.bg2 : '#fff' }}>
                  <Typography variant="h5" fontFamily="monospace" fontWeight={800} letterSpacing="2px" color={isDark ? DARK.text0 : '#111827'}>
                    {plateText}
                  </Typography>
                </Box>
                <Typography variant="body2" color={isDark ? DARK.text2 : '#6b7280'}>Auto-filling vehicle number…</Typography>
              </Box>
            ) : (
              ocrResult && !scanning && (
                <Box>
                  <Typography variant="caption" fontWeight={700} color={isDark ? DARK.text2 : '#6b7280'}>OCR Raw Text:</Typography>
                  <Box sx={{ mt: 0.5, p: 1.5, bgcolor: isDark ? DARK.bg2 : '#fff', borderRadius: '8px', border: `1px solid ${isDark ? DARK.border : 'rgba(0,0,0,0.1)'}` }}>
                    <Typography fontFamily="monospace" color={isDark ? DARK.text0 : '#111827'}>{ocrResult}</Typography>
                  </Box>
                </Box>
              )
            )}
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={600}>⚠️ {error}</Typography>
          </Box>
        )}

        <Typography variant="caption" textAlign="center" color={isDark ? DARK.text2 : '#6b7280'} mt={1}>
          💡 For best results use good lighting and hold the plate steady
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
