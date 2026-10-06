import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchRegistrantStats } from '../../store/slices/statsSlice';
import { fetchMembers } from '../../store/slices/membersSlice';
import { PageHeader } from '../../components/app-shell';
import { KpiCard, SectionCard, ClayButton, StatusPill, EmptyState } from '../../components/ui-bits';
import { DataTable } from '../../components/data-table';
import { DashboardSkeleton } from '../../components/skeleton-loaders';
import { formatDelta } from '../../lib/utils';
import ProfilePicture from '../../components/ui/ProfilePicture';
import {
  Users,
  CalendarDays,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Clock,
  Trophy,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

const MyStatistics: React.FC = () => {
  const dispatch = useAppDispatch();
  const { registrantStats, loading, error } = useAppSelector((state) => state.stats);
  const { members } = useAppSelector((state) => state.members);
  const { user } = useAppSelector((state) => state.auth);
  const [timeFilter, setTimeFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const scopeLabel = user?.role === 'apostle' ? 'Kanda' : 'My';
  const basePath = user?.role === 'apostle' ? '/apostle' : '/registrant';

  useEffect(() => {
    dispatch(fetchRegistrantStats({}));
    dispatch(fetchMembers({}));
    setLastUpdated(new Date());
  }, [dispatch]);

  // Auto-refresh every 5 minutes when enabled (silent — no UI flashing)
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      dispatch(fetchRegistrantStats({ silent: true }));
      dispatch(fetchMembers({ silent: true }));
      setLastUpdated(new Date());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dispatch, isAutoRefresh]);

  const handleManualRefresh = () => {
    dispatch(fetchRegistrantStats({}));
    dispatch(fetchMembers({}));
    setLastUpdated(new Date());
  };

  // Members inside the selected window — drives activity + insights.
  const scopedMembers = useMemo(() => {
    const now = Date.now();
    if (timeFilter === 'week') return members.filter((m) => m.created_at && new Date(m.created_at).getTime() >= now - 7 * 864e5);
    if (timeFilter === 'month') return members.filter((m) => m.created_at && new Date(m.created_at).getTime() >= now - 30 * 864e5);
    if (timeFilter === 'year') return members.filter((m) => m.created_at && new Date(m.created_at).getFullYear() === new Date().getFullYear());
    return members;
  }, [members, timeFilter]);

  const kpi = useMemo(() => {
    const now = Date.now();
    const week = members.filter((m) => m.created_at && new Date(m.created_at).getTime() >= now - 7 * 864e5).length;
    const prevWeek = members.filter((m) => {
      if (!m.created_at) return false;
      const t = new Date(m.created_at).getTime();
      return t >= now - 14 * 864e5 && t < now - 7 * 864e5;
    }).length;
    const month = members.filter((m) => m.created_at && new Date(m.created_at).getTime() >= now - 30 * 864e5).length;
    const regions = new Set(members.map((m) => m.region).filter(Boolean)).size;
    const kept = members.filter((m) => !m.is_deleted).length;
    const wow = formatDelta(week, prevWeek, 'week');
    return { week, month, regions, kept, wowText: wow.text, wowDown: wow.down };
  }, [members]);

  const totalRegistered = registrantStats?.total_registered ?? members.length;
  const successPct = members.length > 0 ? Math.round((kpi.kept / members.length) * 100) : 0;

  const monthlySeries = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = new Date().getFullYear();
    const counts = Array(12).fill(0);
    members.forEach((m) => {
      if (!m.created_at) return;
      const d = new Date(m.created_at);
      if (d.getFullYear() === year) counts[d.getMonth()] += 1;
    });
    return months.map((label, i) => ({ label, value: counts[i] }));
  }, [members]);

  const genderSeries = useMemo(() => {
    let male = 0;
    let female = 0;
    members.forEach((m) => {
      const g = String(m.gender || '').toLowerCase();
      if (g.startsWith('m')) male += 1;
      else if (g.startsWith('f')) female += 1;
    });
    return [
      { name: 'Male', value: male },
      { name: 'Female', value: female },
    ];
  }, [members]);

  const insights = useMemo(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCount = new Map<string, number>();
    const regionCount = new Map<string, number>();
    scopedMembers.forEach((m) => {
      if (!m.created_at) return;
      const day = dayNames[new Date(m.created_at).getDay()];
      dayCount.set(day, (dayCount.get(day) || 0) + 1);
      if (m.region) regionCount.set(m.region, (regionCount.get(m.region) || 0) + 1);
    });
    let bestDay = 'No data yet';
    let bestDayCount = 0;
    Array.from(dayCount.entries()).forEach(([day, count]) => {
      if (count > bestDayCount) {
        bestDay = `${day} (${count})`;
        bestDayCount = count;
      }
    });
    let topRegion = 'No data yet';
    let topCount = 0;
    const scopedTotal = scopedMembers.length || 1;
    Array.from(regionCount.entries()).forEach(([region, count]) => {
      if (count > topCount) {
        topRegion = `${region} (${Math.round((count / scopedTotal) * 100)}%)`;
        topCount = count;
      }
    });
    return { bestDay, topRegion };
  }, [scopedMembers]);

  const recentRows = useMemo(
    () =>
      scopedMembers
        .filter((m) => m.created_at)
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 8)
        .map((m) => ({
          id: m.id,
          action: `Registered ${m.first_name} ${m.last_name}`,
          first_name: m.first_name,
          last_name: m.last_name,
          picture: m.picture,
          region: m.region || 'Unknown',
          at: m.created_at!,
        })),
    [scopedMembers]
  );

  const formatAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading && members.length === 0 && !registrantStats) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <SectionCard title="Statistics unavailable" subtitle="Could not load your statistics">
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
        title={`${scopeLabel} Statistics`}
        subtitle={`Registration performance • Updated ${lastUpdated.toLocaleTimeString()}`}
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
        <KpiCard label={`${scopeLabel} Registrations`} value={totalRegistered} trend={`+${kpi.month} in 30d`} tint="primary" icon={<Users className="w-4 h-4" />} index={0} />
        <KpiCard label="This Week" value={kpi.week} trend={kpi.wowText} down={kpi.wowDown} tint="info" icon={<CalendarDays className="w-4 h-4" />} index={1} />
        <KpiCard label="Regions Covered" value={kpi.regions} tint="purple" icon={<MapPin className="w-4 h-4" />} index={2} />
        <KpiCard label="Success Rate" value={`${successPct}%`} trend={`${kpi.kept} of ${members.length} kept`} tint="success" icon={<CheckCircle2 className="w-4 h-4" />} index={3} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard
          title="Monthly Performance"
          subtitle={`Registrations in ${new Date().getFullYear()}`}
          action={<StatusPill stage="Live" tone="success" />}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <BarChart data={monthlySeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Gender Split" subtitle="Across your register">
          {genderSeries.every((g) => g.value === 0) ? (
            <EmptyState title="No data yet" message="Gender distribution will appear here." />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <PieChart>
                  <Pie data={genderSeries} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={3} stroke="none">
                    {genderSeries.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Recent Activity"
        subtitle={timeFilter === 'all' ? 'Latest registrations in scope' : `Latest registrations (${timeFilter})`}
        action={
          <Link to={`${basePath}/members`}>
            <ClayButton tone="neutral" icon={<Clock className="w-4 h-4" />}>
              View All
            </ClayButton>
          </Link>
        }
      >
        <DataTable
          columns={[
            { key: 'action', label: 'Activity', render: (_v, row: any) => (
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
                <span className="font-semibold truncate">{row.action}</span>
              </span>
            ) },
            { key: 'region', label: 'Region' },
            {
              key: 'at',
              label: 'Date',
              align: 'right',
              render: (v) => <span className="tnum text-xs text-muted-foreground" title={new Date(v).toLocaleDateString()}>{formatAgo(v)}</span>,
            },
          ]}
          data={recentRows}
          defaultPageSize={8}
          searchPlaceholder="Filter activity..."
          emptyTitle="No activity"
          emptyMessage="Registrations in the selected window will appear here."
        />
      </SectionCard>

      <SectionCard title="Performance Insights" subtitle={timeFilter === 'all' ? 'Patterns across your register' : `Patterns in scope (${timeFilter})`}>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Best Day', value: insights.bestDay, icon: <Trophy className="w-4 h-4" />, tint: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' },
            { label: 'Top Region', value: insights.topRegion, icon: <MapPin className="w-4 h-4" />, tint: 'bg-cyan-500/12 text-cyan-600 dark:text-cyan-400' },
            { label: 'Success Rate', value: `${successPct}% completion`, icon: <CheckCircle2 className="w-4 h-4" />, tint: 'bg-purple-500/12 text-purple-600 dark:text-purple-400' },
          ].map((t) => (
            <div key={t.label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 flex items-center gap-3">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.tint}`}>{t.icon}</span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-muted-foreground">{t.label}</span>
                <span className="tnum block text-sm font-bold text-[var(--foreground)] truncate">{t.value}</span>
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

export default MyStatistics;
