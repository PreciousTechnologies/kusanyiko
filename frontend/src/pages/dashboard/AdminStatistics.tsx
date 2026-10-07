import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchAdminStats } from '../../store/slices/statsSlice';
import { fetchMembers } from '../../store/slices/membersSlice';
import { PageHeader } from '../../components/app-shell';
import { KpiCard, SectionCard, ClayButton, StatusPill, EmptyState } from '../../components/ui-bits';
import { DataTable } from '../../components/data-table';
import { DashboardSkeleton } from '../../components/skeleton-loaders';
import { formatDelta } from '../../lib/utils';
import ProfilePicture from '../../components/ui/ProfilePicture';
import { Users, Globe, MapPin, CalendarDays, RefreshCw } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const AdminStatistics: React.FC = () => {
  const dispatch = useAppDispatch();
  const { adminStats, loading, error } = useAppSelector((state) => state.stats);
  const { members } = useAppSelector((state) => state.members);
  const [timeFilter, setTimeFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminStats({}));
    dispatch(fetchMembers({}));
    setLastUpdated(new Date());
  }, [dispatch]);

  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      dispatch(fetchAdminStats({ silent: true }));
      dispatch(fetchMembers({ silent: true }));
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch, isAutoRefresh]);

  const handleManualRefresh = () => {
    dispatch(fetchAdminStats({}));
    dispatch(fetchMembers({}));
    setLastUpdated(new Date());
  };

  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

  // Members inside the selected time window — drives chart + regions + recent.
  const scopedMembers = useMemo(() => {
    const now = new Date();
    if (timeFilter === 'week') {
      const from = new Date(now.getTime() - 7 * 864e5);
      return members.filter((m) => m.created_at && new Date(m.created_at) >= from);
    }
    if (timeFilter === 'month') {
      const from = new Date(now.getTime() - 30 * 864e5);
      return members.filter((m) => m.created_at && new Date(m.created_at) >= from);
    }
    if (timeFilter === 'year') {
      return members.filter((m) => m.created_at && new Date(m.created_at).getFullYear() === now.getFullYear());
    }
    return members;
  }, [members, timeFilter]);

  // Chart buckets adapt to the window: months for all/year, days otherwise.
  const chartSeries = useMemo(() => {
    if (timeFilter === 'week' || timeFilter === 'month') {
      const days = timeFilter === 'week' ? 7 : 30;
      const buckets: { label: string; value: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const value = scopedMembers.filter((m) => {
          if (!m.created_at) return false;
          const md = new Date(m.created_at);
          md.setHours(0, 0, 0, 0);
          return md.getTime() === d.getTime();
        }).length;
        buckets.push({ label, value });
      }
      return buckets;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = new Date().getFullYear();
    const counts = Array(12).fill(0);
    members.forEach((m) => {
      if (!m.created_at) return;
      const d = new Date(m.created_at);
      if (d.getFullYear() === year) counts[d.getMonth()] += 1;
    });
    return months.map((label, i) => ({ label, value: counts[i] }));
  }, [members, scopedMembers, timeFilter]);

  const chartMeta = useMemo(() => {
    if (timeFilter === 'week') return { title: 'Daily Registrations', subtitle: 'Last 7 days in scope', dataKey: 'value' };
    if (timeFilter === 'month') return { title: 'Daily Registrations', subtitle: 'Last 30 days in scope', dataKey: 'value' };
    return { title: 'Monthly Growth', subtitle: `Registrations in ${new Date().getFullYear()}`, dataKey: 'value' };
  }, [timeFilter]);

  // KPI trends — all derived from real registration timestamps.
  const kpi = useMemo(() => {
    const now = new Date();
    const thisKey = monthKey(now);
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastKey = monthKey(last);
    let thisMonth = 0;
    let lastMonth = 0;
    const firstSeenCountry = new Map<string, string>();
    const firstSeenRegion = new Map<string, string>();
    members.forEach((m) => {
      if (!m.created_at) return;
      const d = new Date(m.created_at);
      const k = monthKey(d);
      if (k === thisKey) thisMonth += 1;
      if (k === lastKey) lastMonth += 1;
      const c = (m.country || '').trim() || 'Not Specified';
      const r = (m.region || '').trim() || 'Not Specified';
      const iso = d.toISOString();
      if (!firstSeenCountry.has(c) || iso < firstSeenCountry.get(c)!) firstSeenCountry.set(c, iso);
      if (!firstSeenRegion.has(r) || iso < firstSeenRegion.get(r)!) firstSeenRegion.set(r, iso);
    });
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const newCountries = Array.from(firstSeenCountry.values()).filter((iso) => iso >= monthStart).length;
    const newRegions = Array.from(firstSeenRegion.values()).filter((iso) => iso >= monthStart).length;
    const mom = formatDelta(thisMonth, lastMonth, 'month');
    return { thisMonth, lastMonth, momText: mom.text, momDown: mom.down, newCountries, newRegions };
  }, [members]);

  const topRegions = useMemo(() => {
    const counts = new Map<string, number>();
    scopedMembers.forEach((m) => {
      const r = (m.region || '').trim() || 'Not Specified';
      counts.set(r, (counts.get(r) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [scopedMembers]);

  const recentRows = useMemo(
    () =>
      scopedMembers
        .filter((m) => m.created_at)
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 8)
        .map((m) => ({
          id: m.id,
          member: `${m.first_name} ${m.last_name}`,
          first_name: m.first_name,
          last_name: m.last_name,
          picture: m.picture,
          region: m.region || 'Unknown',
          by: (m as any).created_by_name || 'System',
          at: new Date(m.created_at!).toLocaleDateString(),
        })),
    [scopedMembers]
  );

  if (loading && !adminStats && members.length === 0) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <SectionCard title="Analytics unavailable" subtitle="Could not load statistics">
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="mt-4">
          <ClayButton tone="primary" onClick={handleManualRefresh}>Retry</ClayButton>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ministry Analytics"
        subtitle={`Comprehensive registration analytics • Updated ${lastUpdated.toLocaleTimeString()}`}
        cta={
          <>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--foreground)] focus-ring"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <ClayButton tone="neutral" icon={<RefreshCw className="w-4 h-4" />} onClick={handleManualRefresh}>
              Refresh
            </ClayButton>
            <ClayButton tone={isAutoRefresh ? 'success' : 'neutral'} onClick={() => setIsAutoRefresh((v) => !v)}>
              {isAutoRefresh ? 'Auto ON' : 'Auto OFF'}
            </ClayButton>
          </>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Members" value={adminStats?.total_members ?? members.length} trend={`${kpi.thisMonth} new this month`} tint="primary" icon={<Users className="w-4 h-4" />} index={0} />
        <KpiCard label="Countries" value={adminStats?.country_stats?.length ?? new Set(members.map((m) => m.country)).size} trend={kpi.newCountries > 0 ? `${kpi.newCountries} new this month` : 'no new this month'} tint="info" icon={<Globe className="w-4 h-4" />} index={1} />
        <KpiCard label="Regions" value={adminStats?.region_stats?.length ?? new Set(members.map((m) => m.region)).size} trend={kpi.newRegions > 0 ? `${kpi.newRegions} new this month` : 'no new this month'} tint="purple" icon={<MapPin className="w-4 h-4" />} index={2} />
        <KpiCard label="This Month" value={kpi.thisMonth} trend={kpi.momText} down={kpi.momDown} tint="success" icon={<CalendarDays className="w-4 h-4" />} index={3} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard
          title={chartMeta.title}
          subtitle={chartMeta.subtitle}
          action={<StatusPill stage="Live" tone="success" />}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <BarChart data={chartSeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="All Regions" subtitle={timeFilter === 'all' ? 'Share of total register' : `Share of scoped register (${timeFilter})`}>
          {topRegions.length === 0 ? (
            <EmptyState title="No regional data" message="No registrations in the selected window yet." />
          ) : (
            <div className="h-72 w-full overflow-y-auto">
              <div style={{ minHeight: Math.max(280, topRegions.length * 34) }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <BarChart data={topRegions} layout="vertical" margin={{ top: 4, right: 16, left: 26, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={115} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="value" fill="var(--chart-3)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Recent Registrations" subtitle={timeFilter === 'all' ? 'Latest intake with registrar attribution' : `Latest intake in scope (${timeFilter})`}>
        <DataTable
          columns={[
            { key: 'member', label: 'Member', render: (_v, row: any) => (
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--secondary)] flex-shrink-0 block">
                  <ProfilePicture
                    src={row.picture}
                    firstName={row.first_name}
                    lastName={row.last_name}
                    size="sm"
                    className="!w-full !h-full !ring-0 !border-0"
                  />
                </span>
                <span className="font-semibold truncate">{row.member}</span>
              </span>
            ) },
            { key: 'region', label: 'Region' },
            { key: 'by', label: 'Registered By' },
            { key: 'at', label: 'Date', align: 'right', render: (v) => <span className="tnum">{v}</span> },
          ]}
          data={recentRows}
          defaultPageSize={8}
          searchPlaceholder="Filter recent registrations..."
          emptyTitle="No registrations"
          emptyMessage="Recent intake will appear here."
        />
      </SectionCard>
    </div>
  );
};

export default AdminStatistics;
