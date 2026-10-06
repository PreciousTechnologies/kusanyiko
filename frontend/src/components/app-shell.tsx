import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  UserPlus,
  UserCheck,
  FileDown,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Sun,
  Moon,
  Sparkles,
  SearchCheck,
  Layers,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { logout } from '../store/slices/authSlice';
import { useBranding } from '../context/BrandingContext';
import { useTheme } from '../context/ThemeContext';
import { SunMoonIcon } from './ui-bits';
import { SidebarHeader } from './sidebar';
import { springs, durations } from '../lib/motion-tokens';
import { cn } from '../lib/utils';

/* ============================================================
   PageHeader Pattern (Section 7)
   ============================================================ */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  cta?: React.ReactNode;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  cta,
  onSearch,
  searchPlaceholder = 'Filter or search...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const { user } = useAppSelector((state) => state.auth);

  const defaultSubtitle = useMemo(() => {
    if (subtitle) return subtitle;
    if (user?.role === 'admin') return 'National Administration — All Regions & Modules';
    if (user?.role === 'apostle') return `${user.kanda ? user.kanda.replace(/_/g, ' ').toUpperCase() : 'Regional'} Supervision Scope`;
    if (user?.role === 'security') return 'Gate Checkpoint & Member Verification Station';
    return 'Registrar Intake & Data Management';
  }, [subtitle, user]);

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
          {title}
        </h1>
        <p className="text-xs sm:text-[13px] font-medium text-muted-foreground mt-0.5">
          {defaultSubtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onSearch(e.target.value);
              }}
              placeholder={searchPlaceholder}
              className="h-10 w-48 sm:w-64 rounded-xl border border-[var(--border)] bg-[var(--card)] pl-9 pr-8 text-xs sm:text-sm text-[var(--foreground)] placeholder:text-muted-foreground focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_15%,transparent)] transition-all"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  onSearch('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[var(--foreground)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {cta && <div className="flex flex-wrap items-center gap-2">{cta}</div>}
      </div>
    </div>
  );
};

/* ============================================================
   AppShell — RBAC Dual-Mode Navigation & Layout (Section 5, 6)
   ============================================================ */
interface AppShellProps {
  section?: string;
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { branding } = useBranding();
  const { theme, cycleTheme } = useTheme();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('efatha.sidebar_collapsed') === 'true';
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Toggle sidebar collapse
  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('efatha.sidebar_collapsed', String(next));
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // User initials & presentation
  const userInitials = useMemo(() => {
    if (!user) return 'U';
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase() || user.username[0]?.toUpperCase() || 'U';
  }, [user]);

  const userDisplayName = useMemo(() => {
    if (!user) return 'User';
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.username;
  }, [user]);

  const roleCapability = useMemo(() => {
    switch (user?.role) {
      case 'admin':
        return 'Full access to all modules, users & settings';
      case 'apostle':
        return 'Regional leadership & oversight scope';
      case 'security':
        return 'Search-only checkpoint & gate review';
      default:
        return 'Member registration & Intake dashboard';
    }
  }, [user?.role]);

  // Dynamic Navigation Groups
  const navGroups: NavGroup[] = useMemo(() => {
    if (user?.role === 'security') {
      return [
        {
          label: 'GATE & CHECKPOINT',
          items: [
            { name: 'Member Search', to: '/security/search', icon: SearchCheck, hint: 'Search' },
            { name: 'Profile Settings', to: '/security/profile-settings', icon: Settings, hint: 'Config' },
          ],
        },
      ];
    }

    if (user?.role === 'apostle') {
      return [
        {
          label: 'OVERVIEW',
          items: [
            { name: 'Kanda Dashboard', to: '/apostle/dashboard', icon: LayoutDashboard, hint: 'View' },
            { name: 'Kanda Analytics', to: '/apostle/stats', icon: BarChart3, hint: 'Review' },
          ],
        },
        {
          label: 'KANDA MEMBERS',
          items: [
            { name: 'Regional Members', to: '/apostle/members', icon: Users, hint: 'All' },
            { name: 'Add Member', to: '/apostle/members/add', icon: UserPlus, hint: 'Register' },
          ],
        },
        {
          label: 'ACCOUNT',
          items: [
            { name: 'Profile Settings', to: '/apostle/profile-settings', icon: Settings, hint: 'Account' },
          ],
        },
      ];
    }

    if (user?.role === 'registrant') {
      return [
        {
          label: 'OVERVIEW',
          items: [
            { name: 'My Dashboard', to: '/registrant/dashboard', icon: LayoutDashboard, hint: 'View' },
            { name: 'My Statistics', to: '/registrant/stats', icon: BarChart3, hint: 'Stats' },
          ],
        },
        {
          label: 'REGISTRATION',
          items: [
            { name: 'My Members', to: '/registrant/members', icon: UserCheck, hint: 'Mine' },
            { name: 'Register Member', to: '/registrant/members/add', icon: UserPlus, hint: 'Intake' },
          ],
        },
        {
          label: 'ACCOUNT',
          items: [
            { name: 'Profile Settings', to: '/registrant/profile-settings', icon: Settings, hint: 'Account' },
          ],
        },
      ];
    }

    // Default: Admin
    return [
      {
        label: 'OVERVIEW',
        items: [
          { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, hint: 'Overview' },
          { name: 'Statistics', to: '/admin/stats', icon: BarChart3, hint: 'Analytics' },
        ],
      },
      {
        label: 'REGISTRATIONS',
        items: [
          { name: 'All Members', to: '/admin/members', icon: Users, hint: 'All' },
          { name: 'My Members', to: '/admin/my-members', icon: UserCheck, hint: 'Mine' },
          { name: 'Register Member', to: '/admin/members/add', icon: UserPlus, hint: 'Intake' },
          { name: 'Export Data', to: '/admin/export', icon: FileDown, hint: 'Export' },
        ],
      },
      {
        label: 'ADMINISTRATION',
        items: [
          { name: 'User Management', to: '/admin/users', icon: ShieldCheck, hint: 'Manage' },
          { name: 'Branding & Portal', to: '/admin/settings', icon: Settings, hint: 'Config' },
        ],
      },
    ];
  }, [user?.role]);

  const isActiveLink = (to: string) => {
    if (to === '/admin/dashboard') return location.pathname === '/admin/dashboard' || location.pathname === '/admin';
    return location.pathname === to || location.pathname.startsWith(to + '/');
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased">
      {/* Route Loading Progress Bar */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: durations.fast }}
            className="fixed top-0 left-0 right-0 h-1 z-50 origin-left"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--primary), var(--info), transparent)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ============================================================
          Desktop Sidebar (Collapsible: 264px <-> 76px)
          ============================================================ */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 264 }}
        transition={springs.gentle}
        className="hidden md:flex flex-col sticky top-0 h-screen border-r border-[var(--border)] bg-[var(--sidebar)] z-30 select-none shadow-sm flex-shrink-0"
      >
        {/* Brand Header — dedicated SidebarHeader component */}
        <SidebarHeader collapsed={collapsed} onToggleCollapse={toggleCollapse} />

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none">
                  {group.label}
                </div>
              )}

              {group.items.map((item) => {
                const active = isActiveLink(item.to);
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'relative group flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-[13px] font-medium transition-all focus-ring',
                      active
                        ? 'text-[var(--primary)] font-semibold'
                        : 'text-muted-foreground hover:text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--secondary)_60%,transparent)]'
                    )}
                    title={collapsed ? `${item.name}${item.hint ? ` (${item.hint})` : ''}` : undefined}
                  >
                    {/* Active Gliding Motion Pill */}
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        transition={springs.snappy}
                        className="absolute inset-0 bg-[var(--accent)] rounded-xl border border-[color-mix(in_srgb,var(--primary)_20%,transparent)] -z-10 shadow-sm"
                      />
                    )}

                    <IconComponent
                      className={cn(
                        'w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110',
                        active ? 'text-[var(--primary)]' : 'text-muted-foreground'
                      )}
                    />

                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate">{item.name}</span>
                        {item.hint && (
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-full font-semibold border',
                              active
                                ? 'bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] border-[color-mix(in_srgb,var(--primary)_30%,transparent)] text-[var(--primary)]'
                                : 'bg-[var(--secondary)] border-[var(--border)] text-muted-foreground'
                            )}
                          >
                            {item.hint}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer: User Card, Theme Toggle & Logout */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--sidebar)] space-y-2">
          {/* Theme Switcher */}
          <button
            onClick={cycleTheme}
            className={cn(
              'w-full flex items-center justify-between p-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary)] text-xs font-semibold text-muted-foreground hover:text-[var(--foreground)] transition-colors focus-ring',
              collapsed && 'justify-center'
            )}
            title={`Current theme: ${theme}. Click to switch.`}
          >
            <div className="flex items-center gap-2">
              {theme === 'mint' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : theme === 'brown' ? (
                <SunMoonIcon size={16} className="text-amber-600" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
              {!collapsed && (
                <span className="capitalize">{theme} Theme</span>
              )}
            </div>
            {!collapsed && <span className="text-[10px] opacity-60">Cycle</span>}
          </button>

          {/* User Card */}
          <div
            className={cn(
              'flex items-center justify-between p-2 rounded-xl border border-[var(--border)] bg-[var(--card)]',
              collapsed && 'justify-center p-1.5'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] text-[var(--primary)] border border-[color-mix(in_srgb,var(--primary)_30%,transparent)] flex items-center justify-center font-bold text-xs flex-shrink-0">
                {userInitials}
              </div>

              {!collapsed && (
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-[var(--foreground)] truncate">
                    {userDisplayName}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize font-semibold truncate">
                    {user?.role || 'Member'}
                  </p>
                </div>
              )}
            </div>

            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {!collapsed && (
            <div className="px-2 pt-0.5">
              <p className="text-[10px] text-muted-foreground leading-tight truncate">
                {roleCapability}
              </p>
            </div>
          )}
        </div>
      </motion.aside>

      {/* ============================================================
          Mobile Header & Drawer
          ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-40 h-16 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--card)_90%,transparent)] backdrop-blur-md px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] text-[var(--primary)] flex items-center justify-center font-bold text-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-sm text-[var(--foreground)]">
                {branding.app_name || 'Efatha Connect'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cycleTheme}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-muted-foreground"
              title="Switch theme"
            >
              {theme === 'mint' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : theme === 'brown' ? (
                <SunMoonIcon size={16} className="text-amber-600" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>

            <button
              onClick={() => navigate('/admin/profile-settings')}
              className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] text-[var(--primary)] border border-[color-mix(in_srgb,var(--primary)_30%,transparent)] flex items-center justify-center font-bold text-xs"
            >
              {userInitials}
            </button>
          </div>
        </header>

        {/* Mobile Slide-over Drawer */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              {/* Scrim */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileDrawerOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              />

              {/* Panel */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={springs.drawer}
                className="relative w-4/5 max-w-xs h-full bg-[var(--sidebar)] border-r border-[var(--border)] p-4 flex flex-col justify-between shadow-2xl z-10"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
                    <div className="flex items-center gap-2">
                      <div className="icon-badge">
                        <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      <span className="font-display font-bold text-sm text-[var(--foreground)]">
                        {branding.app_name}
                      </span>
                    </div>
                    <button
                      onClick={() => setMobileDrawerOpen(false)}
                      className="p-1 rounded-lg text-muted-foreground"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
                    {navGroups.map((group) => (
                      <div key={group.label} className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">
                          {group.label}
                        </div>
                        {group.items.map((item) => {
                          const active = isActiveLink(item.to);
                          const IconComp = item.icon;

                          return (
                            <Link
                              key={item.to}
                              to={item.to}
                              className={cn(
                                'flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium',
                                active
                                  ? 'bg-[var(--primary)] text-white font-semibold'
                                  : 'text-muted-foreground hover:bg-[var(--secondary)]'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <IconComp className="w-4 h-4" />
                                <span>{item.name}</span>
                              </div>
                              {item.hint && (
                                <span
                                  className={cn(
                                    'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                                    active ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                                  )}
                                >
                                  {item.hint}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] space-y-2.5">
                  {/* Theme row: icon button left, theme name right */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={cycleTheme}
                      aria-label="Switch theme"
                      title={`Current theme: ${theme}. Click to switch.`}
                      className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center text-muted-foreground hover:text-[var(--foreground)] hover:border-[var(--primary)] transition-colors focus-ring"
                    >
                      {theme === 'mint' ? (
                        <Sun className="w-4 h-4 text-amber-500" />
                      ) : theme === 'brown' ? (
                        <SunMoonIcon size={16} className="text-amber-600" />
                      ) : (
                        <Moon className="w-4 h-4 text-indigo-400" />
                      )}
                    </button>
                    <span className="text-xs font-bold capitalize text-[var(--foreground)]">{theme} Theme</span>
                  </div>

                  {/* Identity grid: avatar + name/role, logout aside in the same grid */}
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] text-[var(--primary)] border border-[color-mix(in_srgb,var(--primary)_30%,transparent)] flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {userInitials}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-bold text-[var(--foreground)] truncate">{userDisplayName}</p>
                        <p className="text-[10px] text-muted-foreground capitalize font-semibold truncate">
                          {user?.role || 'Member'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      title="Sign out"
                      aria-label="Sign out"
                      className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-500/10 border border-rose-500/30 transition-colors focus-ring"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content Viewport */}
        <main className="efatha-scope flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: durations.base }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
