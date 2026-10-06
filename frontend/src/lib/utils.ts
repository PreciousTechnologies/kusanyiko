import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Human-safe period-over-period delta for KPI trend lines.
 *
 * Raw percentages explode against tiny baselines (e.g. 1070 vs 1 =
 * "+106900%") and read as broken UI. Rules:
 * - baseline < 10 → absolute delta ("+312 vs prior week"), never a %.
 * - |pct| > 999 → absolute delta (same readout, no 6-digit noise).
 * - otherwise → signed percent ("+12% vs prior month").
 * `down` drives the ↓ rose state on KpiCard; zero diff is not down.
 */
export function formatDelta(
  current: number,
  previous: number,
  period: 'week' | 'month'
): { text: string; down: boolean } {
  const diff = current - previous;
  const down = diff < 0;
  const sign = diff >= 0 ? '+' : '';
  const absolute = `${sign}${diff} vs prior ${period}`;
  if (previous < 10) return { text: absolute, down };
  const pct = Math.round((diff / previous) * 100);
  if (Math.abs(pct) > 999) return { text: absolute, down };
  return { text: `${sign}${pct}% vs prior ${period}`, down };
}
