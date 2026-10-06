import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../hooks/redux';
import { useBranding } from '../../context/BrandingContext';
import { testConnection } from '../../services/api';
import { PageHeader } from '../../components/app-shell';
import { SectionCard, ClayButton, StatusPill } from '../../components/ui-bits';
import { CheckCircle2, AlertTriangle, Info, Globe, Settings as SettingsIcon, ShieldCheck, Bell, Database } from 'lucide-react';
import { dialog } from '../../components/ui/Dialog';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxMembersPerRegistrar: number;
  sessionTimeout: number;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  maintenanceMode: boolean;
}

interface SecuritySettings {
  enforceStrongPasswords: boolean;
  enableTwoFactor: boolean;
  sessionSecurityLevel: 'low' | 'medium' | 'high';
  ipWhitelist: string[];
  loginAttemptLimit: number;
  lockoutDuration: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  newMemberAlerts: boolean;
  systemAlerts: boolean;
  weeklyReports: boolean;
  backupAlerts: boolean;
}

interface BrandingFormState {
  app_name: string;
  app_subtitle: string;
  landing_header_title: string;
  landing_header_subtitle: string;
  landing_hero_highlight: string;
  landing_description: string;
  ministry_lead: string;
  camp_location: string;
  camp_start_date: string;
  camp_end_date: string;
  registration_status_label: string;
  admin_dashboard_subtitle: string;
  registrant_dashboard_subtitle: string;
}

const SYSTEM_SETTINGS_KEY = 'kusanyiko-system-settings-v1';

function loadStoredSection<T extends object>(section: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(SYSTEM_SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed[section] === 'object' && parsed[section] !== null) {
      return { ...fallback, ...parsed[section] };
    }
  } catch { /* corrupt storage */ }
  return fallback;
}

function readSettingsBlob(): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem(SYSTEM_SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
}

interface BackupEntry {
  id: string;
  created_at: string;
  kind: 'manual' | 'test';
  status: 'success' | 'failed';
}

interface DatabaseState {
  backups: BackupEntry[];
  lastOptimized: string | null;
}

const EMPTY_DATABASE: DatabaseState = { backups: [], lastOptimized: null };
const inputCls =
  'w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_15%,transparent)] transition-all';
const labelCls = 'block text-xs font-semibold text-[var(--foreground)] mb-1.5';

const Settings: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  void user;
  const { branding, updateBranding } = useBranding();
  const [activeTab, setActiveTab] = useState<'branding' | 'system' | 'security' | 'notifications' | 'database'>('branding');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [brandingSaveStatus, setBrandingSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [brandingForm, setBrandingForm] = useState<BrandingFormState>({
    app_name: branding.app_name,
    app_subtitle: branding.app_subtitle,
    landing_header_title: branding.landing_header_title,
    landing_header_subtitle: branding.landing_header_subtitle,
    landing_hero_highlight: branding.landing_hero_highlight,
    landing_description: branding.landing_description,
    ministry_lead: branding.ministry_lead,
    camp_location: branding.camp_location,
    camp_start_date: branding.camp_start_date,
    camp_end_date: branding.camp_end_date,
    registration_status_label: branding.registration_status_label,
    admin_dashboard_subtitle: branding.admin_dashboard_subtitle,
    registrant_dashboard_subtitle: branding.registrant_dashboard_subtitle,
  });

  useEffect(() => {
    setBrandingForm({
      app_name: branding.app_name,
      app_subtitle: branding.app_subtitle,
      landing_header_title: branding.landing_header_title,
      landing_header_subtitle: branding.landing_header_subtitle,
      landing_hero_highlight: branding.landing_hero_highlight,
      landing_description: branding.landing_description,
      ministry_lead: branding.ministry_lead,
      camp_location: branding.camp_location,
      camp_start_date: branding.camp_start_date,
      camp_end_date: branding.camp_end_date,
      registration_status_label: branding.registration_status_label,
      admin_dashboard_subtitle: branding.admin_dashboard_subtitle,
      registrant_dashboard_subtitle: branding.registrant_dashboard_subtitle,
    });
  }, [branding]);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() =>
    loadStoredSection('system', {
      siteName: 'Kusanyiko Member Registration',
      siteDescription: 'Church member registration and coordination system',
      adminEmail: 'admin@church.com',
      allowRegistration: true,
      requireEmailVerification: false,
      maxMembersPerRegistrar: 100,
      sessionTimeout: 30,
      backupFrequency: 'daily' as const,
      maintenanceMode: false,
    })
  );

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() =>
    loadStoredSection('security', {
      enforceStrongPasswords: true,
      enableTwoFactor: false,
      sessionSecurityLevel: 'medium' as const,
      ipWhitelist: [],
      loginAttemptLimit: 5,
      lockoutDuration: 15,
    })
  );

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    loadStoredSection('notifications', {
      emailNotifications: true,
      newMemberAlerts: true,
      systemAlerts: true,
      weeklyReports: false,
      backupAlerts: true,
    })
  );

  const [newIpAddress, setNewIpAddress] = useState('');
  const [databaseState, setDatabaseState] = useState<DatabaseState>(() => loadStoredSection('database', EMPTY_DATABASE));
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null);

  const tabs = [
    { id: 'branding', name: 'Branding', icon: Globe },
    { id: 'system', name: 'System', icon: SettingsIcon },
    { id: 'security', name: 'Security', icon: ShieldCheck },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'database', name: 'Database', icon: Database },
  ] as const;

  const handleSaveBranding = async () => {
    setBrandingSaveStatus('saving');
    try {
      await updateBranding(brandingForm);
      setBrandingSaveStatus('saved');
      setTimeout(() => setBrandingSaveStatus('idle'), 3000);
    } catch {
      setBrandingSaveStatus('error');
      setTimeout(() => setBrandingSaveStatus('idle'), 3000);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveStatus('saving');
    try {
      localStorage.setItem(
        SYSTEM_SETTINGS_KEY,
        JSON.stringify({ ...readSettingsBlob(), system: systemSettings, security: securitySettings, notifications: notificationSettings })
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const persistDatabase = (next: DatabaseState) => {
    setDatabaseState(next);
    try {
      localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify({ ...readSettingsBlob(), database: next }));
    } catch { /* storage blocked */ }
  };

  const recordBackup = (kind: 'manual' | 'test', status: 'success' | 'failed') => {
    const entry: BackupEntry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, created_at: new Date().toISOString(), kind, status };
    persistDatabase({ ...databaseState, backups: [entry, ...databaseState.backups].slice(0, 20) });
  };

  useEffect(() => {
    if (activeTab !== 'database') return;
    let cancelled = false;
    setDbHealthy(null);
    testConnection().then(
      (ok) => { if (!cancelled) setDbHealthy(ok); },
      () => { if (!cancelled) setDbHealthy(false); }
    );
    return () => { cancelled = true; };
  }, [activeTab]);

  const handleTestBackup = async () => {
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const ok = await testConnection();
      recordBackup('test', ok ? 'success' : 'failed');
      if (ok) await dialog.success('Backup test passed', 'Database is reachable!');
      else await dialog.error('Backup test failed', 'The database could not be reached.');
    } catch {
      recordBackup('test', 'failed');
      await dialog.error('Backup test failed', 'Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    recordBackup('manual', 'success');
    await dialog.success('Backup recorded', 'Manual checkpoint recorded. Live backups are managed by Supabase automatically.');
  };

  const handleOptimize = async () => {
    persistDatabase({ ...databaseState, lastOptimized: new Date().toISOString() });
    await dialog.success('Optimization recorded', 'Checkpoint recorded. Supabase manages vacuuming automatically.');
  };

  const handleExportSettings = () => {
    const settings = { system: systemSettings, security: securitySettings, notifications: notificationSettings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'church-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const brandingFields: { key: keyof BrandingFormState; label: string; span?: boolean }[] = [
    { key: 'app_name', label: 'App Name (Browser Title)' },
    { key: 'app_subtitle', label: 'Header Subtitle' },
    { key: 'landing_header_title', label: 'Landing Header Title' },
    { key: 'landing_header_subtitle', label: 'Landing Header Subtitle' },
    { key: 'landing_hero_highlight', label: 'Hero Highlight Text' },
    { key: 'ministry_lead', label: 'Ministry Lead' },
    { key: 'camp_location', label: 'Camp Location' },
    { key: 'registration_status_label', label: 'Registration Status Label' },
    { key: 'camp_start_date', label: 'Camp Start Date' },
    { key: 'camp_end_date', label: 'Camp End Date' },
    { key: 'admin_dashboard_subtitle', label: 'Admin Dashboard Subtitle' },
    { key: 'registrant_dashboard_subtitle', label: 'Registrant Dashboard Subtitle' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="System preferences and portal configuration"
        cta={
          <>
            <ClayButton tone="neutral" onClick={handleExportSettings}>Export Settings</ClayButton>
            <ClayButton tone="primary" loading={loading} onClick={handleSaveSettings}>
              {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error!' : 'Save Changes'}
            </ClayButton>
          </>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-60 flex-shrink-0">
          <div className="surface p-2 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`clay-press flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-6">
          {activeTab === 'branding' && (
            <SectionCard
              title="Branding & Camp Theme"
              subtitle="Live on landing page and dashboards"
              action={
                <ClayButton tone="primary" loading={brandingSaveStatus === 'saving'} onClick={handleSaveBranding}>
                  {brandingSaveStatus === 'saved' ? 'Saved!' : brandingSaveStatus === 'error' ? 'Error!' : 'Save Branding'}
                </ClayButton>
              }
            >
              <div className="grid md:grid-cols-2 gap-4">
                {brandingFields.map((f) => (
                  <div key={f.key}>
                    <label className={labelCls}>{f.label}</label>
                    <input type="text" value={brandingForm[f.key]} onChange={(e) => setBrandingForm((p) => ({ ...p, [f.key]: e.target.value }))} className={inputCls} />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className={labelCls}>Landing Description</label>
                <textarea value={brandingForm.landing_description} onChange={(e) => setBrandingForm((p) => ({ ...p, landing_description: e.target.value }))} rows={4} className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm focus-ring" />
              </div>
            </SectionCard>
          )}

          {activeTab === 'system' && (
            <SectionCard title="System Configuration" subtitle="Registration and session behaviour (stored per-browser)">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Site Name</label>
                  <input type="text" value={systemSettings.siteName} onChange={(e) => setSystemSettings((p) => ({ ...p, siteName: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Admin Email</label>
                  <input type="email" value={systemSettings.adminEmail} onChange={(e) => setSystemSettings((p) => ({ ...p, adminEmail: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="mt-4">
                <label className={labelCls}>Site Description</label>
                <textarea value={systemSettings.siteDescription} onChange={(e) => setSystemSettings((p) => ({ ...p, siteDescription: e.target.value }))} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm focus-ring" />
              </div>
              <div className="mt-6 space-y-3 border-t border-[var(--border)] pt-5">
                {[
                  { label: 'Allow new registrations', checked: systemSettings.allowRegistration, set: (v: boolean) => setSystemSettings((p) => ({ ...p, allowRegistration: v })) },
                  { label: 'Require email verification', checked: systemSettings.requireEmailVerification, set: (v: boolean) => setSystemSettings((p) => ({ ...p, requireEmailVerification: v })) },
                  { label: 'Maintenance mode (admins only)', checked: systemSettings.maintenanceMode, set: (v: boolean) => setSystemSettings((p) => ({ ...p, maintenanceMode: v })) },
                ].map((t) => (
                  <label key={t.label} className="flex items-center gap-2.5 text-sm font-medium">
                    <input type="checkbox" checked={t.checked} onChange={(e) => t.set(e.target.checked)} className="w-4 h-4 rounded accent-[var(--primary)]" />
                    {t.label}
                  </label>
                ))}
                {systemSettings.maintenanceMode && (
                  <p className="flex items-center gap-2 text-xs font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
                    <AlertTriangle className="w-4 h-4" /> Maintenance mode restricts access to administrators only.
                  </p>
                )}
              </div>
            </SectionCard>
          )}

          {activeTab === 'security' && (
            <SectionCard title="Security Configuration" subtitle="Password, session and login policy">
              <div className="space-y-3">
                {[
                  { label: 'Enforce strong passwords', checked: securitySettings.enforceStrongPasswords, set: (v: boolean) => setSecuritySettings((p) => ({ ...p, enforceStrongPasswords: v })) },
                  { label: 'Enable two-factor authentication', checked: securitySettings.enableTwoFactor, set: (v: boolean) => setSecuritySettings((p) => ({ ...p, enableTwoFactor: v })) },
                ].map((t) => (
                  <label key={t.label} className="flex items-center gap-2.5 text-sm font-medium">
                    <input type="checkbox" checked={t.checked} onChange={(e) => t.set(e.target.checked)} className="w-4 h-4 rounded accent-[var(--primary)]" />
                    {t.label}
                  </label>
                ))}
              </div>
              <div className="mt-4 grid md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Security level</label>
                  <select value={securitySettings.sessionSecurityLevel} onChange={(e) => setSecuritySettings((p) => ({ ...p, sessionSecurityLevel: e.target.value as any }))} className={inputCls}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Login attempt limit</label>
                  <input type="number" value={securitySettings.loginAttemptLimit} onChange={(e) => setSecuritySettings((p) => ({ ...p, loginAttemptLimit: parseInt(e.target.value) || 5 }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Lockout (minutes)</label>
                  <input type="number" value={securitySettings.lockoutDuration} onChange={(e) => setSecuritySettings((p) => ({ ...p, lockoutDuration: parseInt(e.target.value) || 15 }))} className={inputCls} />
                </div>
              </div>
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">IP Whitelist</p>
                <div className="flex gap-2">
                  <input type="text" value={newIpAddress} onChange={(e) => setNewIpAddress(e.target.value)} placeholder="e.g. 192.168.1.1" className={inputCls} />
                  <ClayButton
                    tone="neutral"
                    onClick={() => {
                      if (newIpAddress && !securitySettings.ipWhitelist.includes(newIpAddress)) {
                        setSecuritySettings((p) => ({ ...p, ipWhitelist: [...p.ipWhitelist, newIpAddress] }));
                        setNewIpAddress('');
                      }
                    }}
                  >
                    Add
                  </ClayButton>
                </div>
                <div className="mt-2 space-y-1.5">
                  {securitySettings.ipWhitelist.length === 0 && <p className="text-xs text-muted-foreground">No IP addresses whitelisted</p>}
                  {securitySettings.ipWhitelist.map((ip) => (
                    <div key={ip} className="flex items-center justify-between rounded-xl bg-[color-mix(in_srgb,var(--secondary)_60%,transparent)] border border-[var(--border)] px-3 py-2 text-xs">
                      <span className="tnum font-semibold">{ip}</span>
                      <button onClick={() => setSecuritySettings((p) => ({ ...p, ipWhitelist: p.ipWhitelist.filter((x) => x !== ip) }))} className="font-semibold text-rose-600 hover:underline">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {activeTab === 'notifications' && (
            <SectionCard title="Notification Preferences" subtitle="Which events notify the team">
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', title: 'Email notifications', desc: 'General system notifications via email' },
                  { key: 'newMemberAlerts', title: 'New member alerts', desc: 'Notified when members are registered' },
                  { key: 'systemAlerts', title: 'System alerts', desc: 'Critical errors and warnings' },
                  { key: 'weeklyReports', title: 'Weekly reports', desc: 'Weekly summary digest' },
                  { key: 'backupAlerts', title: 'Backup alerts', desc: 'Backup status and failures' },
                ].map((n) => (
                  <label key={n.key} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
                    <span>
                      <span className="block text-sm font-semibold">{n.title}</span>
                      <span className="block text-xs text-muted-foreground">{n.desc}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={(notificationSettings as any)[n.key]}
                      onChange={(e) => setNotificationSettings((p) => ({ ...p, [n.key]: e.target.checked }))}
                      className="w-4 h-4 rounded accent-[var(--primary)]"
                    />
                  </label>
                ))}
              </div>
            </SectionCard>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <SectionCard title="Database Health" subtitle="Live connection check">
                <div className="flex items-center gap-3">
                  {dbHealthy === null ? (
                    <StatusPill stage="Checking…" tone="info" />
                  ) : dbHealthy ? (
                    <StatusPill stage="Healthy" tone="success" />
                  ) : (
                    <StatusPill stage="Unreachable" tone="danger" />
                  )}
                  <span className="text-xs text-muted-foreground">Supabase manages continuous backups server-side.</span>
                </div>
              </SectionCard>
              <SectionCard title="Backup Management" subtitle="Manual checkpoints (kept per-browser)">
                <div className="flex flex-wrap gap-2">
                  <ClayButton tone="neutral" loading={loading} onClick={handleTestBackup}>Test Backup</ClayButton>
                  <ClayButton tone="primary" onClick={handleCreateBackup}>Create Backup</ClayButton>
                  <ClayButton tone="neutral" onClick={handleOptimize}>Optimize Database</ClayButton>
                </div>
                {databaseState.lastOptimized && (
                  <p className="mt-3 text-xs text-muted-foreground">Last optimized: {new Date(databaseState.lastOptimized).toLocaleString()}</p>
                )}
                <div className="mt-4 space-y-1.5">
                  {databaseState.backups.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No backups recorded yet.</p>
                  ) : (
                    databaseState.backups.slice(0, 10).map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-xs rounded-xl border border-[var(--border)] px-3 py-2">
                        <span className="tnum">{new Date(b.created_at).toLocaleString()} • {b.kind}</span>
                        {b.status === 'success' ? <StatusPill stage="Success" tone="success" /> : <StatusPill stage="Failed" tone="danger" />}
                      </div>
                    ))
                  )}
                </div>
                <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" /> Point-in-time restores live in Supabase Dashboard → Backups (paid plans).
                </p>
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
