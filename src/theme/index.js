import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000', // Black
      light: '#333333',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f5f5f5', // Very light grey
      light: '#ffffff',
      dark: '#e0e0e0',
      contrastText: '#000000',
    },
    background: {
      default: '#f8f9fa', // Off-white/light gray
      paper: 'rgba(255, 255, 255, 0.7)', // Frosted glass light paper
    },
    divider: 'rgba(0, 0, 0, 0.16)',
    text: {
      primary: '#111827', // Almost black
      secondary: '#4b5563', // Slate gray
      disabled: 'rgba(0,0,0,0.38)',
    },
    success: { main: '#10b981' },
    error:   { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    info:    { main: '#3b82f6' },
  },
  shape: { borderRadius: 24 }, // very rounded corners for buttons/cards
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em', color: '#111827' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em', color: '#111827' },
    h3: { fontWeight: 700, color: '#111827' },
    h4: { fontWeight: 600, color: '#111827' },
    h5: { fontWeight: 600, color: '#111827' },
    h6: { fontWeight: 600, color: '#111827' },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24, // Pill shape
          padding: '10px 28px',
          textTransform: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.25)',
          },
        },
        containedPrimary: {
          background: '#111827',
          color: '#ffffff',
          boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.2)',
          '&:hover': {
            background: '#000000',
            boxShadow: '0 6px 20px 0 rgba(0, 0, 0, 0.25)',
          },
        },
        containedSecondary: {
          background: '#ffffff',
          color: '#111827',
          border: '1px solid rgba(0, 0, 0, 0.2)',
          boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.12)',
          '&:hover': {
            background: '#f9fafb',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
          borderRadius: 32,
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 16px 48px 0 rgba(0, 0, 0, 0.16)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
            transition: 'all 0.3s ease',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderWidth: '1px',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
              boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.12)',
            },
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        
        * {
          box-sizing: border-box;
        }
        body {
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.2) transparent;
          background-color: #f3f4f6;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          color: #111827;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.25);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.3);
        }
        
        /* Glassmorphism utilities */
        .glass-panel {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 32px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.12);
        }

        .dark-glass-panel {
          background: rgba(17, 24, 39, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.2);
          color: white;
        }
        
        .animated-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -1;
          background: #f8fafc;
          overflow: hidden;
        }
        
        /* Soft, fluid background blobs */
        .animated-bg::before, .animated-bg::after, .animated-bg .blob-3 {
          content: '';
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.6;
          animation: float 25s infinite ease-in-out alternate;
        }
        .animated-bg::before {
          width: 50vw;
          height: 50vw;
          background: #e2e8f0;
          top: -10%;
          left: -10%;
        }
        .animated-bg::after {
          width: 45vw;
          height: 45vw;
          background: #cbd5e1;
          bottom: -10%;
          right: -5%;
          animation-delay: -5s;
        }
        .animated-bg .blob-3 {
          width: 40vw;
          height: 40vw;
          background: #f1f5f9;
          top: 30%;
          left: 30%;
          animation-delay: -12s;
        }
        
        @keyframes float {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          33% { transform: translate(3%, 5%) scale(1.05) rotate(5deg); }
          66% { transform: translate(-2%, 4%) scale(0.95) rotate(-5deg); }
          100% { transform: translate(-4%, -2%) scale(1.1) rotate(2deg); }
        }
      `,
    },
  },
});

export default theme;
