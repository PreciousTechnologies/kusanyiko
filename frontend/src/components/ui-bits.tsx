import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { springs, variants, durations } from '../lib/motion-tokens';
import { cn } from '../lib/utils';

/* ============================================================
   1. SunMoonIcon — Split Sun / Moon glyph for Brown theme
   ============================================================ */
export const SunMoonIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <defs>
        <clipPath id="sun-left-clip">
          <rect x="0" y="0" width="12" height="24" />
        </clipPath>
        <clipPath id="moon-right-clip">
          <rect x="12" y="0" width="12" height="24" />
        </clipPath>
      </defs>
      {/* Sun Half */}
      <g clipPath="url(#sun-left-clip)">
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
        <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
      </g>
      {/* Moon Half */}
      <g clipPath="url(#moon-right-clip)">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </g>
    </svg>
  );
};

/* ============================================================
   2. StatusPill — Visual Stage / State Indicator
   ============================================================ */
interface StatusPillProps {
  stage?: string;
  tone?: 'success' | 'warning' | 'danger' | 'purple' | 'info' | 'neutral';
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  stage = 'Active',
  tone,
  className = '',
}) => {
  const getTone = (): string => {
    if (tone) {
      switch (tone) {
        case 'success':
          return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
        case 'danger':
          return 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400';
        case 'warning':
          return 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400';
        case 'purple':
          return 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400';
        case 'info':
          return 'bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400';
        default:
          return 'bg-muted border-border text-muted-foreground';
      }
    }

    const lower = stage.toLowerCase();
    if (lower.includes('active') || lower.includes('approved') || lower.includes('success')) {
      return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
    }
    if (lower.includes('suspended') || lower.includes('rejected') || lower.includes('danger')) {
      return 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400';
    }
    if (lower.includes('returned') || lower.includes('review') || lower.includes('apostle')) {
      return 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400';
    }
    if (lower.includes('inactive') || lower.includes('draft')) {
      return 'bg-secondary/60 border-border text-muted-foreground';
    }
    return 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400';
  };

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={springs.snappy}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
        getTone(),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {stage}
    </motion.span>
  );
};

/* ============================================================
   3. ClayButton — Tactile Claymorphic CTA Button
   ============================================================ */
interface ClayButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'primary' | 'success' | 'danger' | 'neutral';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const ClayButton: React.FC<ClayButtonProps> = ({
  tone = 'primary',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const getToneStyle = () => {
    switch (tone) {
      case 'primary':
        return 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-md shadow-[color-mix(in_srgb,var(--primary)_20%,transparent)]';
      case 'success':
        return 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20';
      case 'danger':
        return 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-600/20';
      case 'neutral':
        return 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--secondary)]';
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={springs.snappy}
      disabled={disabled || loading}
      className={cn(
        'clay clay-press inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-display text-sm font-semibold transition-all focus-ring disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        getToneStyle(),
        className
      )}
      {...(props as any)}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </motion.button>
  );
};

/* ============================================================
   4. AnimatedValue — Smooth Count-up for Tabular Metrics
   ============================================================ */
export const AnimatedValue: React.FC<{ value: number | string; durationMs?: number }> = ({
  value,
  durationMs = 600,
}) => {
  const target = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  const [display, setDisplay] = useState(isNaN(target) ? 0 : 0);

  useEffect(() => {
    if (isNaN(target)) return;

    let start = 0;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * ease);

      setDisplay(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplay(target);
      }
    };

    requestAnimationFrame(animate);
  }, [target, durationMs]);

  if (typeof value === 'string' && isNaN(target)) {
    return <span className="tnum">{value}</span>;
  }

  return <span className="tnum">{display.toLocaleString()}</span>;
};

/* ============================================================
   5. KpiCard — Bento Grid Metric Tile with Animation
   ============================================================ */
interface KpiCardProps {
  label: string;
  value: number | string;
  trend?: string;
  down?: boolean;
  tint?: 'primary' | 'info' | 'purple' | 'pink' | 'success';
  icon: React.ReactNode;
  index?: number;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  trend,
  down = false,
  tint = 'primary',
  icon,
  index = 0,
  className = '',
}) => {
  const getBadgeTint = () => {
    switch (tint) {
      case 'info':
        return 'bg-cyan-500/12 text-cyan-600 dark:text-cyan-400';
      case 'purple':
        return 'bg-purple-500/12 text-purple-600 dark:text-purple-400';
      case 'pink':
        return 'bg-pink-500/12 text-pink-600 dark:text-pink-400';
      case 'success':
        return 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400';
      default:
        return 'bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] text-[var(--primary)]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.gentle, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className={cn('surface bento p-5 flex flex-col justify-between min-h-[140px]', className)}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', getBadgeTint())}>
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <h3 className="font-display text-3xl font-bold tracking-tight text-[var(--foreground)]">
          <AnimatedValue value={value} />
        </h3>

        {trend && (
          <p className={`mt-1 text-xs font-medium flex items-center gap-1 ${down ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            <span>{down ? '↓' : '↑'}</span>
            <span>{trend}</span>
          </p>
        )}
      </div>
    </motion.div>
  );
};

/* ============================================================
   6. SectionCard — Primary Content Container
   ============================================================ */
interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
}) => {
  return (
    <motion.section
      variants={variants.fadeSlideUp}
      initial="initial"
      animate="animate"
      transition={{ duration: durations.slow }}
      className={cn('surface p-6', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-[var(--foreground)]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <div>{children}</div>
    </motion.section>
  );
};

/* ============================================================
   7. EmptyState — Clean Empty/No Data Container
   ============================================================ */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = 'No Records Found',
  message = 'There are no entries matching your selection.',
  action,
  className = '',
}) => {
  return (
    <motion.div
      variants={variants.fadeScaleIn}
      initial="initial"
      animate="animate"
      className={cn(
        'border-2 border-dashed border-[var(--border)] rounded-2xl px-6 py-12 text-center flex flex-col items-center justify-center',
        className
      )}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-[var(--primary)] mb-3">
          {icon}
        </div>
      )}
      <h3 className="font-display text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="max-w-sm text-xs text-muted-foreground mt-1">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
};

/* ============================================================
   8. Stepper — 5-stage Visual Progress Bar
   ============================================================ */
export const Stepper: React.FC<{
  stages?: string[];
  current?: string;
}> = ({
  stages = ['Draft', 'Submitted', 'Zonal Reviewed', 'Regional Approved', 'National Approved'],
  current = 'Submitted',
}) => {
  const currentIndex = stages.findIndex(
    (s) => s.toLowerCase() === (current || '').toLowerCase()
  );

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      {stages.map((stage, idx) => {
        const isPast = idx < currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <React.Fragment key={stage}>
            <div
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
                isCurrent && 'bg-[var(--primary)] text-white shadow-sm',
                isPast && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
                !isPast && !isCurrent && 'bg-[var(--secondary)] text-muted-foreground border border-[var(--border)]'
              )}
            >
              {stage}
            </div>
            {idx < stages.length - 1 && (
              <span className="text-muted-foreground font-bold text-xs select-none">›</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
