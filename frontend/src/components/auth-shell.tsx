import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useBranding } from '../context/BrandingContext';
import { useTheme } from '../context/ThemeContext';
import { SunMoonIcon } from './ui-bits';
import { springs } from '../lib/motion-tokens';

/* ============================================================
   AuthShell — shared hull for Login / Forgot / Reset pages.
   Ambient primary-tinted washes + brand header with theme
   cycler. Public-safe: no auth state required.
   ============================================================ */
export const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { branding } = useBranding();
  const { theme, cycleTheme } = useTheme();

  return (
    <div className="efatha-scope relative min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans antialiased">
      {/* Ambient washes */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[var(--primary)] opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 w-[520px] h-[520px] rounded-full bg-[var(--info)] opacity-10 blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.gentle}
        className="relative z-10 flex items-center justify-between px-6 lg:px-10 h-20"
      >
        <Link to="/" className="flex items-center gap-3 focus-ring rounded-xl" aria-label="Back to home">
          <span className="w-10 h-10 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)] block flex-shrink-0">
            <img src={`${process.env.PUBLIC_URL}/image.png`} alt="" className="w-full h-full object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block font-display font-bold text-sm tracking-tight truncate">
              {branding.app_name}
            </span>
            <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              MIS Portal
            </span>
          </span>
        </Link>

        <button
          onClick={cycleTheme}
          title={`Theme: ${theme} — click to switch`}
          aria-label="Switch theme"
          className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-[var(--border)] bg-[var(--card)] shadow-sm text-muted-foreground hover:text-[var(--foreground)] hover:border-[var(--primary)] transition-colors focus-ring"
        >
          {theme === 'mint' ? (
            <Sun className="w-5 h-5 shrink-0 text-amber-500" />
          ) : theme === 'brown' ? (
            <SunMoonIcon size={20} className="shrink-0 text-amber-600" />
          ) : (
            <Moon className="w-5 h-5 shrink-0 text-indigo-400" />
          )}
        </button>
      </motion.header>

      <div className="relative z-10 px-6 lg:px-10 pb-10">{children}</div>
    </div>
  );
};

export default AuthShell;
