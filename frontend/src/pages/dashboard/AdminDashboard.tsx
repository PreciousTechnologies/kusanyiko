import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchAdminStats } from '../../store/slices/statsSlice';
import { fetchMembers } from '../../store/slices/membersSlice';
import { useBranding } from '../../context/BrandingContext';
import { PageHeader } from '../../components/app-shell';
import { KpiCard, SectionCard, ClayButton, StatusPill, EmptyState } from '../../components/ui-bits';
import { DataTable } from '../../components/data-table';
import { DashboardSkeleton } from '../../components/skeleton-loaders';
import { formatDelta } from '../../lib/utils';
import ProfilePicture from '../../components/ui/ProfilePicture';
import {
  Users,
  UserPlus,
  Globe,
  MapPin,
  ChartBar,
  FileDown,
  ShieldCheck,
  RefreshCw,
  UserCheck,
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
} from 'recharts';

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--pink)',
];

const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { adminStats, loading } = useAppSelector((state) => state.stats);
  const { members } = useAppSelector((state) => state.members);
  const { user } = useAppSelector((state) => state.auth);
  const { branding } = useBranding();
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

  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return members.filter((m) => {
      if (!m.created_at) return false;
      const d = new Date(m.created_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length;
  }, [members]);

  // Real week-over-week intake growth: this 7-day window vs the prior one.
  // formatDelta keeps tiny baselines from exploding into +100000% noise.
  const weeklyGrowth = useMemo(() => {
    const now = Date.now();
    const thisWeek = members.filter((m) => {
      if (!m.created_at) return false;
      const t = new Date(m.created_at).getTime();
      return t >= now - 7 * 864e5;
    }).length;
    const lastWeek = members.filter((m) => {
      if (!m.created_at) return false;
      const t = new Date(m.created_at).getTime();
      return t >= now - 14 * 864e5 && t < now - 7 * 864e5;
    }).length;
    return formatDelta(thisWeek, lastWeek, 'week');
  }, [members]);

  const growthSeries = useMemo(() => {
    const days: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = members.filter((m) => {
        if (!m.created_at) return false;
        const md = new Date(m.created_at);
        md.setHours(0, 0, 0, 0);
        return md.getTime() === d.getTime();
      }).length;
      days.push({ day: label, count });
    }
    return days;
  }, [members]);

  const genderSeries = useMemo(() => {
    const counts: Record<string, number> = { Male: 0, Female: 0 };
    members.forEach((m) => {
      const g = String(m.gender || '').toLowerCase();
      if (g.startsWith('m')) counts.Male += 1;
      else if (g.startsWith('f')) counts.Female += 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [members]);

  const topRegions = useMemo(() => {
    const rows = (adminStats?.region_stats || []).slice(0, 5);
    const total = adminStats?.total_members || 1;
    return rows.map((r: any) => ({
      region: r.region || 'Not Specified',
      members: r.count,
      share: Number(((r.count / total) * 100).toFixed(1)),
    }));
  }, [adminStats]);

  const recentRegistrations = useMemo(
    () =>
      members
        .filter((m) => m.created_at)
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 5)
        .map((m) => ({
          id: m.id,
          name: `${m.first_name} ${m.last_name}`,
          first_name: m.first_name,
          last_name: m.last_name,
          picture: m.picture,
          region: m.region || 'Unknown',
          by: (m as any).created_by_name || 'System',
          at: m.created_at!,
        })),
    [members]
  );

  const myRecent = useMemo(() => {
    const mine = members.filter((m) => {
      const cb: any = (m as any).created_by;
      if (typeof cb === 'number') return cb === (user as any)?.id;
      if (typeof cb === 'string') return cb === (user as any)?.id || cb === user?.username;
      return (m as any).registered_by === (user as any)?.id;
    });
    return {
      total: mine.length,
      rows: mine
        .filter((m) => m.created_at)
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 3),
    };
  }, [members, user]);

  const formatAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading && members.length === 0 && !adminStats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ministry Dashboard"
        subtitle={`${branding.admin_dashboard_subtitle} • ${branding.camp_start_date} – ${branding.camp_end_date}`}
        cta={
          <>
            <ClayButton tone="neutral" icon={<RefreshCw className="w-4 h-4" />} onClick={handleManualRefresh}>
              Refresh
            </ClayButton>
            <ClayButton
              tone={isAutoRefresh ? 'success' : 'neutral'}
              onClick={() => setIsAutoRefresh((v) => !v)}
            >
              {isAutoRefresh ? 'Auto ON' : 'Auto OFF'}
            </ClayButton>
            <Link to="/admin/members/add">
              <ClayButton tone="primary" icon={<UserPlus className="w-4 h-4" />}>
                New Record
              </ClayButton>
            </Link>
          </>
        }
      />

      {/* KPI grid — Bento */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Members" value={adminStats?.total_members ?? members.length} trend={weeklyGrowth.text} down={weeklyGrowth.down} tint="primary" icon={<Users className="w-4 h-4" />} index={0} />
        <KpiCard label="New Today" value={todayCount} trend="Registration goal: 50/day" tint="success" icon={<UserPlus className="w-4 h-4" />} index={1} />
        <KpiCard label="Countries" value={adminStats?.country_stats?.length || 0} trend="Multi-national presence" tint="info" icon={<Globe className="w-4 h-4" />} index={2} />
        <KpiCard label="Regions" value={adminStats?.region_stats?.length || 0} trend="Geographic coverage" tint="purple" icon={<MapPin className="w-4 h-4" />} index={3} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <SectionCard
          title="Ministry Growth"
          subtitle={`Last 7 days • Updated ${lastUpdated.toLocaleTimeString()}`}
          className="lg:col-span-2"
          action={<StatusPill stage="Live" tone="success" />}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <AreaChart data={growthSeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="count" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#gGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Gender Distribution" subtitle="Active register">
          <div className="h-72 w-full flex flex-col">
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%" debounce={100}>
                <PieChart>
                  <Pie data={genderSeries} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={3} stroke="none">
                    {genderSeries.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1.5">
              {genderSeries.map((g, i) => (
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
        </SectionCard>
      </div>

      {/* Regions table */}
      <SectionCard
        title="Top Regions by Members"
        subtitle="Ranked by registration volume"
        action={
          <Link to="/admin/stats">
            <ClayButton tone="neutral" icon={<ChartBar className="w-4 h-4" />}>
              Full Analytics
            </ClayButton>
          </Link>
        }
      >
        <DataTable
          columns={[
            { key: 'region', label: 'Region', render: (v) => <span className="font-semibold">{v}</span> },
            { key: 'members', label: 'Members', align: 'right', render: (v) => <span className="tnum font-bold">{Number(v).toLocaleString()}</span> },
            {
              key: 'share',
              label: 'Share %',
              align: 'right',
              render: (v) => <span className="tnum px-2 py-0.5 rounded-md bg-[var(--secondary)] text-[var(--foreground)] text-xs font-bold">{v}%</span>,
            },
          ]}
          data={topRegions}
          initialSortColumn="members"
          initialSortDirection="desc"
          defaultPageSize={5}
          searchPlaceholder="Filter regions..."
          emptyTitle="No regional data"
          emptyMessage="Registrations have no region breakdown yet."
        />
      </SectionCard>

      {/* Bottom row: quick actions + recent + mine */}
      <div className="grid lg:grid-cols-3 gap-6">
        <SectionCard title="Quick Actions" subtitle="Intake & administration">
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { to: '/admin/members/add', label: 'Register Member', desc: 'New intake', icon: <UserPlus className="w-4 h-4" /> },
              { to: '/admin/members', label: 'All Members', desc: 'Full register', icon: <Users className="w-4 h-4" /> },
              { to: '/admin/export', label: 'Export Data', desc: 'CSV / Excel / PDF', icon: <FileDown className="w-4 h-4" /> },
              { to: '/admin/users', label: 'User Management', desc: 'Roles & access', icon: <ShieldCheck className="w-4 h-4" /> },
            ].map((a) => (
                <Link key={a.to} to={a.to} className="surface hover-lift p-4 flex items-start gap-3 focus-ring rounded-2xl min-w-0">
                  <span className="icon-badge flex-shrink-0">{a.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-sm font-semibold text-[var(--foreground)] break-words">{a.label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5 break-words">{a.desc}</span>
                  </span>
                </Link>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Live sync {isAutoRefresh ? 'every 30s' : 'paused'} • Last update <span className="tnum">{lastUpdated.toLocaleTimeString()}</span></span>
          </div>
        </SectionCard>

        <SectionCard title="Recent Registrations" subtitle="Latest intake across regions">
          {recentRegistrations.length === 0 ? (
            <EmptyState title="No registrations yet" message="New members will appear here in real time." />
          ) : (
            <ul className="space-y-3">
              {recentRegistrations.map((r) => (
                <li key={String(r.id)} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] row-hover">
                  <span className="w-9 h-9 rounded-xl overflow-hidden bg-[var(--secondary)] flex-shrink-0 block">
                    <ProfilePicture
                      src={r.picture}
                      firstName={r.first_name}
                      lastName={r.last_name}
                      size="sm"
                      className="!w-full !h-full !ring-0 !border-0"
                    />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold text-[var(--foreground)] truncate">{r.name}</span>
                    <span className="block text-xs text-muted-foreground truncate">{r.region} • by {r.by}</span>
                  </span>
                  <span className="tnum text-[11px] text-muted-foreground flex-shrink-0">{formatAgo(r.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="My Members"
          subtitle={`${myRecent.total.toLocaleString()} registered by you`}
          action={
            <Link to="/admin/my-members">
              <ClayButton tone="neutral" icon={<UserCheck className="w-4 h-4" />}>
                View All
              </ClayButton>
            </Link>
          }
        >
          {myRecent.rows.length === 0 ? (
            <EmptyState
              title="No members yet"
              message="Register your first member to see them here."
              action={
                <Link to="/admin/members/add">
                  <ClayButton tone="primary">Register Member</ClayButton>
                </Link>
              }
            />
          ) : (
            <ul className="space-y-3">
              {myRecent.rows.map((m) => (
                <li key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-[color-mix(in_srgb,var(--secondary)_40%,transparent)] border border-[var(--border)]">
                  <span className="w-9 h-9 rounded-xl overflow-hidden bg-[var(--secondary)] flex-shrink-0 block">
                    <ProfilePicture
                      src={m.picture}
                      firstName={m.first_name}
                      lastName={m.last_name}
                      size="sm"
                      className="!w-full !h-full !ring-0 !border-0"
                    />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold truncate">{m.first_name} {m.last_name}</span>
                    <span className="block text-xs text-muted-foreground truncate">{m.region || 'Unknown region'}</span>
                  </span>
                  <StatusPill stage={m.saved ? 'Saved' : 'Not Saved'} tone={m.saved ? 'success' : 'warning'} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default AdminDashboard;
