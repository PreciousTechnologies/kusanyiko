import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchMembers } from '../../store/slices/membersSlice';
import { fetchAdminStats } from '../../store/slices/statsSlice';
import { exportAPI } from '../../services/api';
import { PageHeader } from '../../components/app-shell';
import { SectionCard, ClayButton, StatusPill, EmptyState, KpiCard } from '../../components/ui-bits';
import { DashboardSkeleton } from '../../components/skeleton-loaders';
import { springs } from '../../lib/motion-tokens';
import { isOwnedByUser } from '../../lib/utils';
import {
  FileDown,
  Table2,
  FileText,
  ChartBar,
  Users,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { dialog } from '../../components/ui/Dialog';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  dataType: 'members' | 'analytics' | 'users' | 'financial';
  formats: string[];
  estimatedSize: string;
  category: 'reports' | 'member-data' | 'analytics' | 'system';
}

const ExportData: React.FC = () => {
  const dispatch = useAppDispatch();
  const { members, loading: membersLoading } = useAppSelector((state) => state.members);
  const { adminStats, loading: statsLoading } = useAppSelector((state) => state.stats);
  const { user } = useAppSelector((state) => state.auth);

  const [selectedExports, setSelectedExports] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
  const [dateRange, setDateRange] = useState({ start: '', end: new Date().toISOString().split('T')[0] });
  const [exportProgress, setExportProgress] = useState<{ [key: string]: number }>({});
  const [exportStatus, setExportStatus] = useState<{ [key: string]: 'idle' | 'exporting' | 'completed' | 'error' }>({});

  useEffect(() => {
    dispatch(fetchMembers({}));
    dispatch(fetchAdminStats({}));
  }, [dispatch]);

  const summary = {
    total: members.length,
    males: members.filter((m) => m.gender === 'male').length,
    females: members.filter((m) => m.gender === 'female').length,
    saved: members.filter((m) => m.saved).length,
  };
  const myCount = members.filter((m) => isOwnedByUser(m as any, user as any)).length;

  const exportOptions: ExportOption[] = [
    { id: 'summary-report', name: 'Summary Report', description: `Comprehensive summary with ${summary.total} members, gender and salvation breakdown`, icon: ChartBar, dataType: 'analytics', formats: ['excel', 'pdf'], estimatedSize: '0.5 MB', category: 'reports' },
    { id: 'demographics-report', name: 'Demographics Report', description: `${summary.males} males, ${summary.females} females • ${summary.saved} saved`, icon: Users, dataType: 'analytics', formats: ['excel', 'pdf'], estimatedSize: '0.3 MB', category: 'reports' },
    { id: 'geographical-report', name: 'Geographical Report', description: 'Distribution by country, region and center/area', icon: ChartBar, dataType: 'analytics', formats: ['excel', 'pdf'], estimatedSize: '0.4 MB', category: 'reports' },
    { id: 'members-all', name: 'All Members (Detailed)', description: `Complete database with ${members.length} members`, icon: Users, dataType: 'members', formats: ['csv', 'excel', 'pdf'], estimatedSize: `${Math.max(0.1, members.length * 0.015).toFixed(1)} MB`, category: 'member-data' },
    { id: 'members-my', name: 'My Registered Members', description: `${myCount} members you personally registered`, icon: Users, dataType: 'members', formats: ['csv', 'excel', 'pdf'], estimatedSize: `${Math.max(0.1, myCount * 0.015).toFixed(1)} MB`, category: 'member-data' },
    { id: 'analytics-overview', name: 'Analytics Overview', description: `Charts and trends for ${adminStats?.total_members || 0} members`, icon: ChartBar, dataType: 'analytics', formats: ['pdf', 'excel'], estimatedSize: '1.0 MB', category: 'analytics' },
    { id: 'analytics-monthly', name: 'Monthly Reports', description: `Month-by-month breakdown of registrations`, icon: CalendarDays, dataType: 'analytics', formats: ['csv', 'excel', 'pdf'], estimatedSize: '0.5 MB', category: 'analytics' },
    { id: 'user-activity', name: 'User Activity Log', description: 'Login history and administrative actions', icon: Clock, dataType: 'users', formats: ['csv', 'excel'], estimatedSize: '1.8 MB', category: 'system' },
    { id: 'financial-summary', name: 'Financial Summary', description: 'Donations, tithes and contributions (sample)', icon: FileText, dataType: 'financial', formats: ['excel', 'pdf'], estimatedSize: '4.2 MB', category: 'system' },
  ];

  const performRealExport = async (exportId: string) => {
    setExportStatus((prev) => ({ ...prev, [exportId]: 'exporting' }));
    setExportProgress((prev) => ({ ...prev, [exportId]: 0 }));
    try {
      const option = exportOptions.find((o) => o.id === exportId);
      const update = (p: number) => setExportProgress((prev) => ({ ...prev, [exportId]: p }));
      update(20);
      let response: any;
      const nonCsv = (selectedFormat === 'csv' ? 'excel' : selectedFormat) as 'excel' | 'pdf';
      switch (exportId) {
        case 'summary-report':
          response = await exportAPI.exportAnalytics(nonCsv, { type: 'summary', date_range: { start_date: dateRange.start, end_date: dateRange.end } });
          break;
        case 'demographics-report':
          response = await exportAPI.exportAnalytics(nonCsv, { type: 'demographics', date_range: { start_date: dateRange.start, end_date: dateRange.end } });
          break;
        case 'geographical-report':
          response = await exportAPI.exportAnalytics(nonCsv, { type: 'geographical', date_range: { start_date: dateRange.start, end_date: dateRange.end } });
          break;
        case 'members-all':
          response = await exportAPI.exportMembers(selectedFormat as any, {});
          break;
        case 'members-my':
          response = await exportAPI.exportMembers(selectedFormat as any, {
            owned_by_me: true,
            owner_id: (user as any)?.id,
            owner_username: user?.username,
          });
          break;
        case 'analytics-overview':
          response = await exportAPI.exportAnalytics(selectedFormat as any, { type: 'overview', date_range: { start_date: dateRange.start, end_date: dateRange.end } });
          break;
        case 'analytics-monthly':
          response = await exportAPI.exportAnalytics(nonCsv as any, { type: 'monthly', date_range: { start_date: dateRange.start, end_date: dateRange.end } });
          break;
        case 'user-activity':
          response = await exportAPI.exportUserActivity(selectedFormat as any, { date_range: { start_date: dateRange.start, end_date: dateRange.end } });
          break;
        case 'financial-summary':
          response = await exportAPI.exportFinancial(selectedFormat as any, { start_date: dateRange.start, end_date: dateRange.end });
          break;
        default:
          throw new Error('Unknown export type');
      }
      update(80);
      if (response?.data) {
        const blob = new Blob([response.data], { type: response.headers?.['content-type'] || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = selectedFormat === 'excel' ? 'xlsx' : selectedFormat;
        let filename = `${option?.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.${ext}`;
        const cd = response.headers?.['content-disposition'];
        if (cd) {
          const m = cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
          if (m) filename = decodeURIComponent(m[1] || m[2]);
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      update(100);
      setExportStatus((prev) => ({ ...prev, [exportId]: 'completed' }));
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus((prev) => ({ ...prev, [exportId]: 'error' }));
      await dialog.error('Export failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleBulkExport = async () => {
    for (const id of selectedExports) await performRealExport(id);
  };

  const supports = (o: ExportOption, f: string) => o.formats.includes(f);

  const renderOption = (option: ExportOption, idx: number) => {
    const status = exportStatus[option.id] || 'idle';
    const progress = exportProgress[option.id] || 0;
    const selected = selectedExports.includes(option.id);
    const ok = supports(option, selectedFormat);
    const Icon = option.icon;
    return (
      <motion.div
        key={option.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.gentle, delay: idx * 0.04 }}
        className={`surface bento p-5 flex flex-col ${selected ? 'ring-1 ring-[color-mix(in_srgb,var(--primary)_40%,transparent)] border-[color-mix(in_srgb,var(--primary)_40%,transparent)]' : ''}`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="icon-badge"><Icon className="w-4 h-4" /></span>
            <span className="min-w-0">
              <span className="block font-display text-sm font-semibold text-[var(--foreground)] truncate">{option.name}</span>
              <span className="tnum block text-[11px] text-muted-foreground">{option.estimatedSize} est.</span>
            </span>
          </div>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => setSelectedExports((p) => (p.includes(option.id) ? p.filter((x) => x !== option.id) : [...p, option.id]))}
            className="w-4 h-4 rounded accent-[var(--primary)] mt-1"
          />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed flex-1">{option.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {option.formats.map((f) => (
            <span
              key={f}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                f === selectedFormat && ok
                  ? 'bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] border-[color-mix(in_srgb,var(--primary)_30%,transparent)] text-[var(--primary)]'
                  : f === selectedFormat
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-600'
                    : 'bg-[var(--secondary)] border-[var(--border)] text-muted-foreground'
              }`}
            >
              {f === 'csv' ? <Table2 className="w-3 h-3" /> : f === 'pdf' ? <FileDown className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              {f.toUpperCase()}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span>
            {status === 'completed' ? <StatusPill stage="Done" tone="success" /> : status === 'error' ? <StatusPill stage="Failed" tone="danger" /> : status === 'exporting' ? <StatusPill stage={`${progress}%`} tone="info" /> : null}
          </span>
          <ClayButton tone="primary" loading={status === 'exporting'} disabled={!ok} onClick={() => performRealExport(option.id)}>
            Export Now
          </ClayButton>
        </div>
        {!ok && <p className="mt-2 text-[11px] text-rose-600">Not available in {selectedFormat.toUpperCase()}</p>}
        {status === 'exporting' && (
          <div className="mt-3 h-1.5 rounded-full bg-[var(--secondary)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </motion.div>
    );
  };

  if (membersLoading || statsLoading) return <DashboardSkeleton />;

  const categories: { id: ExportOption['category']; title: string; icon: React.ReactNode }[] = [
    { id: 'reports', title: 'Summary Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'member-data', title: 'Member Data', icon: <Users className="w-4 h-4" /> },
    { id: 'analytics', title: 'Analytics & Trends', icon: <ChartBar className="w-4 h-4" /> },
    { id: 'system', title: 'System & Activity Data', icon: <Clock className="w-4 h-4" /> },
  ];

  const completed = Object.entries(exportStatus).filter(([, s]) => s === 'completed');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Export Data"
        subtitle={`Reports and member database • ${members.length.toLocaleString()} total members`}
        cta={
          <ClayButton tone="primary" disabled={selectedExports.length === 0} onClick={handleBulkExport}>
            Export Selected ({selectedExports.length})
          </ClayButton>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <KpiCard label="Total Members" value={members.length} tint="primary" icon={<Users className="w-4 h-4" />} index={0} />
        <KpiCard label="Male / Female" value={`${summary.males}/${summary.females}`} tint="info" icon={<ChartBar className="w-4 h-4" />} index={1} />
        <KpiCard label="Saved" value={summary.saved} tint="success" icon={<CheckCircle2 className="w-4 h-4" />} index={2} />
      </div>

      <SectionCard title="Export Settings" subtitle="Format and date window apply to every export below">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Format</p>
            <div className="flex flex-wrap gap-2">
              {(['csv', 'excel', 'pdf'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFormat(f)}
                  className={`clay-press rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    selectedFormat === f
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm'
                      : 'border-[var(--border)] bg-[var(--card)] text-muted-foreground hover:text-[var(--foreground)]'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Date range</p>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))} className="h-10 px-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs focus-ring" />
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))} className="h-10 px-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs focus-ring" />
            </div>
          </div>
          <div className="flex items-end">
            <p className="text-xs text-muted-foreground">Select tiles below, then use Export Selected. Analytics reports use Excel when CSV is unsupported.</p>
          </div>
        </div>
      </SectionCard>

      {categories.map((c) => (
        <SectionCard key={c.id} title={c.title} subtitle={`${exportOptions.filter((o) => o.category === c.id).length} datasets`}>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {exportOptions.filter((o) => o.category === c.id).map((o, i) => renderOption(o, i))}
          </div>
        </SectionCard>
      ))}

      <SectionCard title="Recent Exports" subtitle="Completed in this session">
        {completed.length === 0 ? (
          <EmptyState icon={<Clock className="w-6 h-6" />} title="No recent exports" message="Completed exports will appear here." />
        ) : (
          <ul className="space-y-2">
            {completed.slice(0, 5).map(([id]) => {
              const o = exportOptions.find((x) => x.id === id);
              return (
                <li key={id} className="flex items-center gap-3 p-3 rounded-xl bg-[color-mix(in_srgb,var(--secondary)_40%,transparent)] border border-[var(--border)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-semibold truncate">{o?.name}</span>
                    <span className="block text-xs text-muted-foreground">Exported as {selectedFormat.toUpperCase()}</span>
                  </span>
                  <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground hidden" />
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};

export default ExportData;
