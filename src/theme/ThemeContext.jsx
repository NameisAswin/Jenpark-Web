import { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

// ── Context ───────────────────────────────────────────────────────────────────
const ThemeCtx = createContext({ mode: 'light', toggleTheme: () => {} });

export function useAppTheme() {
  return useContext(ThemeCtx);
}

// ── Black Dark Palette ────────────────────────────────────────────────────────
const DARK = {
  bg0:    '#080808',   // page background
  bg1:    '#111111',   // sidebar / topbar
  bg2:    '#1a1a1a',   // cards
  bg3:    '#222222',   // input fields
  border: 'rgba(255,255,255,0.09)',
  red:    '#ef4444',
  redDim: 'rgba(239,68,68,0.14)',
  text0:  '#ffffff',   // headings
  text1:  '#e4e4e4',   // body
  text2:  '#a1a1a1',   // muted / labels
  text3:  '#666666',   // placeholder
};

// ── Build theme ───────────────────────────────────────────────────────────────
function buildTheme(mode) {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: isDark
        ? { main: DARK.red, light: '#f87171', dark: '#dc2626', contrastText: '#fff' }
        : { main: '#000000', light: '#333333', dark: '#000000', contrastText: '#fff' },
      secondary: isDark
        ? { main: DARK.bg2 }
        : { main: '#f5f5f5', light: '#ffffff', dark: '#e0e0e0', contrastText: '#000' },
      background: isDark
        ? { default: DARK.bg0, paper: DARK.bg2 }
        : { default: '#f8f9fa', paper: 'rgba(255,255,255,0.7)' },
      divider: isDark ? DARK.border : 'rgba(0, 0, 0, 0.16)',
      text: isDark
        ? { primary: DARK.text0, secondary: DARK.text1, disabled: DARK.text3 }
        : { primary: '#111827', secondary: '#4b5563', disabled: 'rgba(0,0,0,0.38)' },
      success: { main: '#22c55e' },
      error:   { main: '#ef4444' },
      warning: { main: '#f59e0b' },
      info:    { main: '#3b82f6' },
    },
    shape: { borderRadius: 24 },
    typography: {
      fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.02em', color: isDark ? DARK.text0 : '#111827' },
      h2: { fontWeight: 700, letterSpacing: '-0.01em', color: isDark ? DARK.text0 : '#111827' },
      h3: { fontWeight: 700, color: isDark ? DARK.text0 : '#111827' },
      h4: { fontWeight: 600, color: isDark ? DARK.text0 : '#111827' },
      h5: { fontWeight: 600, color: isDark ? DARK.text0 : '#111827' },
      h6: { fontWeight: 600, color: isDark ? DARK.text0 : '#111827' },
      button: { fontWeight: 600, textTransform: 'none' },
      body1: { color: isDark ? DARK.text1 : '#111827' },
      body2: { color: isDark ? DARK.text2 : '#4b5563' },
      caption: { color: isDark ? DARK.text2 : '#6b7280' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
          * { box-sizing: border-box; }
          body {
            scrollbar-width: thin;
            scrollbar-color: ${isDark ? 'rgba(239,68,68,0.3)' : 'rgba(0,0,0,0.2)'} transparent;
            background-color: ${isDark ? DARK.bg0 : '#f3f4f6'};
            color: ${isDark ? DARK.text0 : '#111827'};
            margin: 0; padding: 0; overflow-x: hidden;
          }
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb {
            background: ${isDark ? 'rgba(239,68,68,0.25)' : 'rgba(0, 0, 0, 0.25)'};
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${isDark ? 'rgba(239,68,68,0.5)' : 'rgba(0,0,0,0.3)'};
          }

          /* ── Glass panel ── */
          .glass-panel {
            background: ${isDark ? `${DARK.bg1}f0` : 'rgba(255,255,255,0.65)'};
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid ${isDark ? DARK.border : 'rgba(255,255,255,0.8)'};
            border-radius: 32px;
            box-shadow: 0 8px 32px 0 rgba(0,0,0,${isDark ? '0.5' : '0.05'});
          }

          /* ── Animated background ── */
          .animated-bg {
            position: fixed; top: 0; left: 0;
            width: 100vw; height: 100vh;
            z-index: -1;
            background: ${isDark ? DARK.bg0 : '#f8fafc'};
            overflow: hidden;
          }
          .animated-bg::before, .animated-bg::after, .animated-bg .blob-3 {
            content: ''; position: absolute; border-radius: 50%;
            filter: blur(90px);
            opacity: ${isDark ? '0.25' : '0.6'};
            animation: float 25s infinite ease-in-out alternate;
          }
          .animated-bg::before {
            width: 50vw; height: 50vw;
            background: ${isDark ? '#1a0000' : '#e2e8f0'};
            top: -10%; left: -10%;
          }
          .animated-bg::after {
            width: 45vw; height: 45vw;
            background: ${isDark ? '#ef444415' : '#cbd5e1'};
            bottom: -10%; right: -5%;
            animation-delay: -5s;
          }
          .animated-bg .blob-3 {
            width: 40vw; height: 40vw;
            background: ${isDark ? '#200000' : '#f1f5f9'};
            top: 30%; left: 30%;
            animation-delay: -12s;
          }
          @keyframes float {
            0%   { transform: translate(0,0) scale(1) rotate(0deg); }
            33%  { transform: translate(3%,5%) scale(1.05) rotate(5deg); }
            66%  { transform: translate(-2%,4%) scale(0.95) rotate(-5deg); }
            100% { transform: translate(-4%,-2%) scale(1.1) rotate(2deg); }
          }

          /* ── Dark input autofill override ── */
          ${isDark ? `
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus {
              -webkit-text-fill-color: ${DARK.text0} !important;
              -webkit-box-shadow: 0 0 0px 1000px ${DARK.bg3} inset !important;
              caret-color: ${DARK.text0};
            }
          ` : ''}
        `,
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 24, padding: '10px 28px', textTransform: 'none',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px -6px rgba(0,0,0,0.2)' },
          },
          containedPrimary: isDark ? {
            background: `linear-gradient(135deg, ${DARK.red}, #dc2626)`,
            color: '#fff',
            boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
            '&:hover': { boxShadow: '0 6px 20px rgba(239,68,68,0.5)' },
          } : {
            background: '#111827', color: '#ffffff',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
            '&:hover': { background: '#000', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)' },
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? DARK.bg2 : 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(24px)',
            border: `1px solid ${isDark ? DARK.border : 'rgba(255,255,255,0.8)'}`,
            boxShadow: `0 8px 32px rgba(0,0,0,${isDark ? '0.4' : '0.05'})`,
            borderRadius: 32,
            color: isDark ? DARK.text0 : '#111827',
            transition: 'transform 0.4s, box-shadow 0.4s',
            '&:hover': {
              transform: 'translateY(-6px)',
              boxShadow: isDark
                ? `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${DARK.red}22`
                : '0 16px 48px rgba(0, 0, 0, 0.16)',
            },
          },
        },
      },

      MuiTypography: {
        styleOverrides: {
          root: {
            color: isDark ? 'inherit' : 'inherit',
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            ...(isDark && {
              backgroundColor: DARK.bg2,
              color: DARK.text0,
            }),
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 12, fontWeight: 600,
            ...(isDark && { color: DARK.text1 }),
          },
        },
      },

      MuiInputBase: {
        styleOverrides: {
          root: isDark ? {
            color: DARK.text0,
            '& input::placeholder': { color: DARK.text3, opacity: 1 },
          } : {},
        },
      },

      MuiLinearProgress: {
        styleOverrides: {
          root: isDark ? { backgroundColor: 'rgba(255,255,255,0.08)' } : {},
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: isDark ? { borderColor: DARK.border } : {},
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: isDark ? {
            backgroundColor: '#2a2a2a',
            color: DARK.text0,
            border: `1px solid ${DARK.border}`,
          } : {},
        },
      },

      MuiBadge: {
        styleOverrides: {
          badge: isDark ? { boxShadow: `0 0 0 2px ${DARK.bg1}` } : {},
        },
      },
    },
  });
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('jenpark-theme') || 'light');

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('jenpark-theme', next);
      return next;
    });
  };

  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeCtx.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeCtx.Provider>
  );
}

// ── Re-export dark tokens for use in pages ────────────────────────────────────
export { DARK };
