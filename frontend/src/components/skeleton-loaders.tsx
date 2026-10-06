import React from 'react';
import { cn } from '../lib/utils';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] dark:bg-white/10',
        className
      )}
    />
  );
};

export const KpiCardSkeleton: React.FC = () => {
  return (
    <div className="surface p-5 flex flex-col justify-between min-h-[140px]">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="w-9 h-9 rounded-xl" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="p-4 border-b border-[var(--border)] flex gap-4">
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="divide-y divide-[var(--border)]">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* KPI grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>

      {/* Charts row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="surface p-5 lg:col-span-2 min-h-[300px] flex flex-col justify-between">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
        <div className="surface p-5 min-h-[300px] flex flex-col items-center justify-center">
          <Skeleton className="h-6 w-36 mb-6 self-start" />
          <Skeleton className="w-44 h-44 rounded-full" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="surface p-5">
        <Skeleton className="h-6 w-48 mb-4" />
        <TableSkeleton rows={4} />
      </div>
    </div>
  );
};

export const AppShellSkeleton: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Sidebar skeleton */}
      <aside className="w-[264px] hidden md:flex flex-col sticky top-0 h-screen border-r border-[var(--border)] bg-[var(--sidebar)] p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-2 flex-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-xl" />
          ))}
        </div>
        <div className="p-3 border border-[var(--border)] rounded-xl flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      </aside>

      {/* Main skeleton */}
      <main className="flex-1 p-6">
        <DashboardSkeleton />
      </main>
    </div>
  );
};
