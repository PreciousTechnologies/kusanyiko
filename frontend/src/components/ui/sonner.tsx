import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '../../context/ThemeContext';

/* ============================================================
   Themed Toaster (blueprint §20) — single mount point in App.
   Follows mint / brown / dark through CSS tokens; sonner's
   theme prop keeps its success/error/info accents in sync.
   ============================================================ */
export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme === 'mint' ? 'light' : 'dark'}
      position="top-right"
      gap={8}
      toastOptions={{
        style: {
          background: 'var(--card)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          fontSize: '13px',
          boxShadow: 'var(--shadow-elev-def)',
        },
      }}
    />
  );
}

export default Toaster;
