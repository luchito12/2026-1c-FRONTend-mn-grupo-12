import { createContext, useContext, useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider, createTheme, useMediaQuery } from '@mui/material';
const AppearanceContext = createContext(null);
export const useAppearance = () => useContext(AppearanceContext);
export function AppThemeProvider({ children }) {
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [preference, setPreference] = useState(() => {
    try {
      const value = localStorage.getItem('gitaula-theme');
      return ['light', 'dark', 'system'].includes(value) ? value : 'system';
    } catch {
      return 'system';
    }
  });
  const mode = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === 'dark' ? '#a6bdfc' : '#3458a1' },
          background: {
            default: mode === 'dark' ? '#11151d' : '#f6f7fa',
            paper: mode === 'dark' ? '#1a202b' : '#ffffff',
          },
        },
        typography: {
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          h1: { fontSize: '1.75rem', fontWeight: 650, lineHeight: 1.25 },
          h2: { fontSize: '1.25rem', fontWeight: 600 },
          h3: { fontSize: '1.05rem', fontWeight: 600 },
          button: { textTransform: 'none', fontWeight: 600 },
        },
        shape: { borderRadius: 10 },
        components: {
          MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: { root: { minHeight: 40 } },
          },
          MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
          MuiTextField: { defaultProps: { fullWidth: true, size: 'small', variant: 'outlined' } },
          MuiPaper: {
            defaultProps: { elevation: 0 },
            styleOverrides: { root: { backgroundImage: 'none' } },
          },
          MuiTableCell: {
            styleOverrides: { head: { fontWeight: 600 }, root: { verticalAlign: 'top' } },
          },
          MuiTab: { styleOverrides: { root: { textTransform: 'none', minHeight: 48 } } },
          MuiDialog: { defaultProps: { fullWidth: true, maxWidth: 'sm' } },
          MuiCssBaseline: {
            styleOverrides: {
              body: { minWidth: 320 },
              a: { color: 'inherit' },
              ':focus-visible': { outline: '3px solid #6486dc', outlineOffset: 3 },
              '#root': { minHeight: '100dvh' },
            },
          },
        },
      }),
    [mode],
  );
  function change(value) {
    setPreference(value);
    try {
      localStorage.setItem('gitaula-theme', value);
    } catch {
      /* Preference is optional. */
    }
  }
  return (
    <AppearanceContext.Provider value={{ preference, setPreference: change }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppearanceContext.Provider>
  );
}
