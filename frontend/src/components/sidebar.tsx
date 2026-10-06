import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { useBranding } from '../context/BrandingContext';
import { durations, springs } from '../lib/motion-tokens';
import { cn } from '../lib/utils';

/* ============================================================
   SidebarHeader — desktop sidebar brand row + collapse toggle.
   The toggle is intentionally high-contrast (solid primary with
   a white chevron) so it stays unmistakable in mint, brown and
   dark themes at both rail widths (264px / 76px).
   ============================================================ */
interface SidebarHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const { branding } = useBranding();

  return (
    <div
      className={cn(
        'flex items-center gap-2 border-b border-[var(--border)] min-h-16 py-3',
        collapsed ? 'justify-center px-2' : 'px-4'
      )}
    >
      {!collapsed && (
        <Link
          to="/"
          className="flex items-center gap-3 overflow-hidden min-w-0 flex-1 focus-ring rounded-xl"
        >
          <div className="icon-badge shadow-sm flex-shrink-0">
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: durations.fast }}
            className="min-w-0"
          >
            <span className="font-display font-bold text-sm tracking-tight text-[var(--foreground)] truncate block">
              {branding.app_name || 'Efatha Connect'}
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
              MIS Portal
            </span>
          </motion.div>
        </Link>
      )}

      {/* Collapse toggle — `>` on the open sidebar collapses it,
          `<` on the collapsed rail restores it. Glyphs are pure CSS
          (inner static span) so they always paint; the motion wrapper
          only handles fade/slide via the shared springs. */}
      <motion.button
        onClick={onToggleCollapse}
        data-testid="sidebar-toggle"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        whileTap={{ scale: 0.9 }}
        transition={springs.snappy}
        className="w-6 h-6 shrink-0 rounded-lg bg-transparent text-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] transition-colors flex items-center justify-center focus-ring"
      >
        <AnimatePresence mode="wait" initial={false}>
          {collapsed ? (
            <motion.span
              key="expand"
              aria-hidden="true"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: durations.fast }}
              className="block"
            >
              <span className="block w-1.5 h-1.5 border-current border-t-2 border-r-2 rounded-[1px] rotate-45 translate-x-[-1px]" />
            </motion.span>
          ) : (
            <motion.span
              key="collapse"
              aria-hidden="true"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: durations.fast }}
              className="block"
            >
              <span className="block w-1.5 h-1.5 border-current border-t-2 border-l-2 rounded-[1px] -rotate-45 translate-x-[1px]" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default SidebarHeader;
