import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchRegistrantStats } from '../../store/slices/statsSlice';
import { fetchMembers } from '../../store/slices/membersSlice';
import { useBranding } from '../../context/BrandingContext';
import { PageHeader } from '../../components/app-shell';
import { KpiCard, SectionCard, ClayButton, StatusPill, EmptyState } from '../../components/ui-bits';
import { DashboardSkeleton } from '../../components/skeleton-loaders';
import { formatDelta } from '../../lib/utils';
import ProfilePicture from '../../components/ui/ProfilePicture';
import {
  Users,
  UserPlus,
  Activity,
  MapPin,
  ChartBar,
  RefreshCw,
  CalendarDays,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
const DAILY_GOAL = 25;

const RegistrantDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { registrantStats, loading } = useAppSelector((state) => state.stats);
  const { members } = useAppSelector((state) => state.members);
  const { user } = useAppSelector((state) => state.auth);
  const { branding } = useBranding();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const basePath = user?.role === 'apostle' ? '/apostle' : '/registrant';
  const isApostle = user?.role === 'apostle';

  const formatKanda = (kanda?: string) => {
    if (!kanda) return '';
    return kanda
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  useEffect(() => {
    dispatch(fetchRegistrantStats({}));
    dispatch(fetchMembers({}));
    setLastUpdated(new Date());
  }, [dispatch]);

  // Auto-refresh every 3 minutes when enabled (silent — no UI flashing)
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      dispatch(fetchRegistrantStats({ silent: true }));
      dispatch(fetchMembers({ silent: true }));
      setLastUpdated(new Date());
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dispatch, isAutoRefresh]);

  const handleManualRefresh = () => {
    dispatch(fetchRegistrantStats({}));
    dispatch(fetchMembers({}));
    setLastUpdated(new Date());
  };

  const inWindow = (iso: string | undefined, fromMs: number, toMs = Date.now()) => {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    return t >= fromMs && t <= toMs;
  };

  const stats = useMemo(() => {
    const now = Date.now();
    const week = members.filter((m) => inWindow(m.created_at, now - 7 * 864e5)).length;
    const prevWeek = members.filter((m) => {
      if (!m.created_at) return false;
      const t = new Date(m.created_at).getTime();
      return t >= now - 14 * 864e5 && t < now - 7 * 864e5;
    }).length;
    const month = members.filter((m) => inWindow(m.created_at, now - 30 * 864e5)).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = members.filter((m) => {
      if (!m.created_at) return false;
      const d = new Date(m.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length;
    const regions = new Set(members.map((m) => m.region).filter(Boolean)).size;
    const wow = formatDelta(week, prevWeek, 'week');
    return { week, prevWeek, month, todayCount, regions, wowText: wow.text, wowDown: wow.down };
  }, [members]);

  const totalRegistered = registrantStats?.total_registered ?? members.length;

  const dailySeries = useMemo(() => {
    const days: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: members.filter((m) => {
          if (!m.created_at) return false;
          const md = new Date(m.created_at);
          md.setHours(0, 0, 0, 0);
          return md.getTime() === d.getTime();
        }).length,
      });
    }
    return days;
  }, [members]);

  const regionSeries = useMemo(() => {
    const counts = new Map<string, number>();
    members.forEach((m) => {
      const r = (m.region || 'Unknown').trim() || 'Unknown';
      counts.set(r, (counts.get(r) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [members]);

  const monthlySeries = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = new Date().getFullYear();
    const counts = Array(12).fill(0);
    members.forEach((m) => {
      if (!m.created_at) return;
      const d = new Date(m.created_at);
      if (d.getFullYear() === year) counts[d.getMonth()] += 1;
    });
    return months.map((month, i) => ({ month, members: counts[i] }));
  }, [members]);

  const recentRegistrations = useMemo(
    () =>
      members
        .filter((m) => m.created_at)
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 5)
        .map((m) => ({
          id: m.id,
          name: `${m.first_name} ${m.last_name}`,
          region: m.region || 'Unknown',
          at: m.created_at!,
          picture: m.picture,
          first_name: m.first_name,
          last_name: m.last_name,
        })),
    [members]
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

  const daysRemaining = useMemo(() => {
    const end = new Date(branding.camp_end_date);
    if (Number.isNaN(end.getTime())) return null;
    return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 864e5));
  }, [branding.camp_end_date]);

  const goalPct = Math.min(100, Math.round((stats.todayCount / DAILY_GOAL) * 100));

  if (loading && members.length === 0 && !registrantStats) {
    return <DashboardSkeleton />;
  }

  const displayName =
    user?.first_name || user?.last_name
      ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
      : user?.username || 'Registrar';

  return (
    <div className="space-y-6">
      <PageHeader
        title={isApostle ? `Kanda Dashboard${user?.kanda ? ` — ${formatKanda(user.kanda)}` : ''}` : 'My Dashboard'}
        subtitle={isApostle ? `${branding.app_name} — Kanda oversight scope` : branding.registrant_dashboard_subtitle}
        cta={
          <>
            <ClayButton tone="neutral" icon={<RefreshCw className="w-4 h-4" />} onClick={handleManualRefresh}>
              Refresh
            </ClayButton>
            <ClayButton tone={isAutoRefresh ? 'success' : 'neutral'} onClick={() => setIsAutoRefresh((v) => !v)}>
              {isAutoRefresh ? 'Auto ON' : 'Auto OFF'}
            </ClayButton>
            <Link to={`${basePath}/members/add`}>
              <ClayButton tone="primary" icon={<UserPlus className="w-4 h-4" />}>
                New Record
              </ClayButton>
            </Link>
          </>
        }
      />

      <SectionCard
        title={`Welcome back, ${displayName}!`}
        subtitle={`${branding.camp_start_date} – ${branding.camp_end_date} • ${branding.camp_location}`}
        action={
          <span className="flex items-center gap-2">
            <StatusPill stage={branding.registration_status_label} tone="success" />
            {daysRemaining !== null && (
              <span className="tnum text-xs font-bold text-[var(--foreground)]">
                {daysRemaining} day{daysRemaining === 1 ? '' : 's'} left
              </span>
            )}
          </span>
        }
      >
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label={isApostle ? 'Kanda Members' : 'My Registrations'} value={totalRegistered} trend={`+${stats.month} in 30d`} tint="primary" icon={<Users className="w-4 h-4" />} index={0} />
          <KpiCard label="This Week" value={stats.week} trend={stats.wowText} down={stats.wowDown} tint="success" icon={<UserPlus className="w-4 h-4" />} index={1} />
          <KpiCard label="Last 30 Days" value={stats.month} trend={`${(stats.month / 30).toFixed(1)}/day pace`} tint="info" icon={<Activity className="w-4 h-4" />} index={2} />
          <KpiCard label="Regions Covered" value={stats.regions} tint="purple" icon={<MapPin className="w-4 h-4" />} index={3} />
        </div>
      </SectionCard>

      <div className="grid lg:grid-cols-3 gap-6">
        <SectionCard title="Daily Registrations" subtitle="Last 7 days in scope" className="lg:col-span-2" action={<StatusPill stage="Live" tone="success" />}>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <AreaChart data={dailySeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRegGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#gRegGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Members by Region" subtitle="Top areas in scope">
          {regionSeries.length === 0 ? (
            <EmptyState title="No regional data" message="Registered members will appear here." />
          ) : (
            <div className="h-72 w-full flex flex-col">
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <PieChart>
                    <Pie data={regionSeries} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={3} stroke="none">
                      {regionSeries.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5">
                {regionSeries.map((g, i) => (
                  <li key={g.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {g.name}
                    </span>
                    <span className="tnum font-bold text-[var(--foreground)]">{g.value.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Quick Actions" subtitle="Intake shortcuts">
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { to: `${basePath}/members/add`, label: 'Register Member', desc: 'New intake', icon: <UserPlus className="w-4 h-4" /> },
                { to: `${basePath}/members`, label: isApostle ? 'Kanda Members' : 'My Members', desc: 'Browse register', icon: <Users className="w-4 h-4" /> },
                { to: `${basePath}/stats`, label: isApostle ? 'Kanda Analytics' : 'My Statistics', desc: 'Trends & insights', icon: <ChartBar className="w-4 h-4" /> },
              ].map((a) => (
                <Link key={a.to + a.label} to={a.to} className="surface hover-lift p-4 flex items-start gap-3 focus-ring rounded-2xl min-w-0">
                  <span className="icon-badge flex-shrink-0">{a.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-sm font-semibold text-[var(--foreground)] break-words">{a.label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 break-words">{a.desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Daily Registration Goal"
            subtitle={`Today: ${stats.todayCount} of ${DAILY_GOAL} • Updated ${lastUpdated.toLocaleTimeString()}`}
            action={<StatusPill stage={`${goalPct}%`} tone={goalPct >= 100 ? 'success' : 'info'} />}
          >
            <div className="h-2.5 rounded-full bg-[var(--secondary)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${goalPct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.todayCount >= DAILY_GOAL
                ? 'Daily goal reached — excellent work.'
                : `${DAILY_GOAL - stats.todayCount} more to reach today's goal.`}
            </p>
          </SectionCard>

          <SectionCard title="Monthly Progress" subtitle={`Registrations in ${new Date().getFullYear()}`}>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <BarChart data={monthlySeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="members" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Recent Registrations"
          subtitle="Latest intake in scope"
          action={
            <Link to={`${basePath}/members`}>
              <ClayButton tone="neutral" icon={<CalendarDays className="w-4 h-4" />}>
                View All
              </ClayButton>
            </Link>
          }
        >
          {recentRegistrations.length === 0 ? (
            <EmptyState
              title="No registrations yet"
              message="Members you register will appear here."
              action={
                <Link to={`${basePath}/members/add`}>
                  <ClayButton tone="primary">Register Member</ClayButton>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {recentRegistrations.map((r) => (
                <li key={String(r.id)} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] row-hover">
                  <span className="w-9 h-9 rounded-xl overflow-hidden bg-[var(--secondary)] flex-shrink-0 block">
                    <ProfilePicture src={r.picture} firstName={r.first_name} lastName={r.last_name} size="sm" className="!w-full !h-full !ring-0 !border-0" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold text-[var(--foreground)] truncate">{r.name}</span>
                    <span className="block text-xs text-muted-foreground truncate">{r.region}</span>
                  </span>
                  <span className="tnum text-[11px] text-muted-foreground flex-shrink-0">{formatAgo(r.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default RegistrantDashboard;
