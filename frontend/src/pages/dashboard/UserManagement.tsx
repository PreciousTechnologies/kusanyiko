import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAppSelector } from '../../hooks/redux';
import { userManagementAPI } from '../../services/api';
import { dialog } from '../../components/ui/Dialog';
import { PageHeader } from '../../components/app-shell';
import { KpiCard, SectionCard, ClayButton, StatusPill, EmptyState } from '../../components/ui-bits';
import { DataTable } from '../../components/data-table';
import { TableSkeleton } from '../../components/skeleton-loaders';
import { springs, variants } from '../../lib/motion-tokens';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Eye,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

const getInitials = (firstName?: string, lastName?: string, username?: string): string => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  return initials || (username?.[0] || 'U').toUpperCase();
};

interface User {
  id: any;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'registrant' | 'apostle' | 'member' | 'security';
  kanda?: string;
  status: 'active' | 'inactive' | 'suspended';
  date_joined: string;
  last_login: string | null;
  members_registered: number;
  is_staff: boolean;
  is_superuser: boolean;
}

interface UserFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'registrant' | 'apostle' | 'member' | 'security';
  kanda?: string;
  password?: string;
  is_staff: boolean;
  is_superuser: boolean;
}

const KANDA_OPTIONS = [
  { value: 'dar_es_salaam_na_pwani', label: 'Dar es Salaam na Pwani' },
  { value: 'nyanda_za_juu_kusini', label: 'Nyanda za Juu Kusini' },
  { value: 'kusini', label: 'Kusini' },
  { value: 'kaskazini', label: 'Kaskazini' },
  { value: 'magharibi_na_ziwa', label: 'Magharibi na Ziwa' },
  { value: 'kati', label: 'Kati' },
];

const inputCls =
  'mt-1 w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_15%,transparent)] transition-all';
const labelCls = 'block text-xs font-semibold text-[var(--foreground)]';

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<User | null>(null);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [userForm, setUserForm] = useState<UserFormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'registrant',
    kanda: '',
    password: '',
    is_staff: false,
    is_superuser: false,
  });

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userManagementAPI.getUsers();
      setUsers((response.data || []).filter(Boolean));
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([
        {
          id: 1,
          username: 'admin',
          email: 'admin@church.com',
          first_name: 'System',
          last_name: 'Administrator',
          role: 'admin' as const,
          status: 'active' as const,
          date_joined: '2024-01-15T10:00:00Z',
          last_login: '2024-12-21T14:30:00Z',
          members_registered: 150,
          is_staff: true,
          is_superuser: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
        if (!u) return false;
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
        return matchesRole && matchesStatus;
      }),
    [users, roleFilter, statusFilter]
  );

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === 'active').length,
      admins: users.filter((u) => u.role === 'admin').length,
      registrants: users.filter((u) => u.role === 'registrant' || u.role === 'apostle').length,
    }),
    [users]
  );

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowModalPassword(false);
    setUserForm({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      role: 'registrant',
      kanda: '',
      password: '',
      is_staff: false,
      is_superuser: false,
    });
    setShowUserModal(true);
  };

  const handleEditUser = (u: User) => {
    setEditingUser(u);
    setShowModalPassword(false);
    setUserForm({
      username: u.username,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
      kanda: u.kanda || '',
      password: '',
      is_staff: u.is_staff,
      is_superuser: u.is_superuser,
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.username.trim()) {
      setShakeKey((k) => k + 1);
      await dialog.error('Username required', 'Please enter a username for this user.');
      return;
    }
    if (!userForm.email.trim()) {
      setShakeKey((k) => k + 1);
      await dialog.error('Email required', 'Please enter an email address for this user.');
      return;
    }
    if (!userForm.first_name.trim() || !userForm.last_name.trim()) {
      setShakeKey((k) => k + 1);
      await dialog.error('Name required', 'Please enter first and last name.');
      return;
    }
    if (!editingUser && (!userForm.password || userForm.password.length < 6)) {
      setShakeKey((k) => k + 1);
      await dialog.error('Weak password', 'A password of at least 6 characters is required for new users.');
      return;
    }
    if (editingUser && userForm.password && userForm.password.length < 6) {
      setShakeKey((k) => k + 1);
      await dialog.error('Weak password', 'The new password must be at least 6 characters long (or leave it blank).');
      return;
    }
    if (userForm.role === 'apostle' && !userForm.kanda) {
      setShakeKey((k) => k + 1);
      await dialog.error('Kanda required', 'Please select a kanda for apostle users.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      setShakeKey((k) => k + 1);
      await dialog.error('Invalid email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      if (editingUser) {
        let passwordNote = '';
        if (userForm.password) {
          await userManagementAPI.setUserPassword(editingUser.id, userForm.password);
          passwordNote = ' Their password was changed — only the new password works now.';
        }
        const updateData = { ...userForm };
        delete updateData.password;
        const response = await userManagementAPI.updateUser(editingUser.id, updateData);
        setUsers((prev) => prev.map((u) => (String(u.id) === String(editingUser.id) ? { ...u, ...response.data } : u)));
        await dialog.success('User updated', `${editingUser.username} was updated successfully.${passwordNote}`);
      } else {
        const response = await userManagementAPI.createUser(userForm);
        if (!response.data?.id) {
          throw new Error('Server returned no user record - the account may still have been created. Refresh the list to check.');
        }
        setUsers((prev) => [...prev, response.data]);
        await dialog.success('User created', `${userForm.username} was created successfully. They can sign in right away.`);
      }
      setShowUserModal(false);
    } catch (error: any) {
      console.error('Failed to save user:', error);
      const errorData = error.response?.data;
      let errorMessage = error.message || 'Unknown error';
      if (errorData) {
        if (typeof errorData === 'string') errorMessage = errorData;
        else if (typeof errorData === 'object') {
          errorMessage = Object.keys(errorData)
            .map((key) => (Array.isArray(errorData[key]) ? `${key}: ${errorData[key].join(', ')}` : `${key}: ${errorData[key]}`))
            .join('\n');
        }
      }
      await dialog.error(`Failed to ${editingUser ? 'update' : 'create'} user`, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    setLoading(true);
    try {
      if (currentUser && String(u.id) === String((currentUser as any).id)) {
        await dialog.info('Cannot delete your own account', 'Use Profile Settings → Danger Zone instead.');
        return;
      }
      await userManagementAPI.deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => String(x.id) !== String(u.id)));
      setShowDeleteModal(null);
      await dialog.success('User deleted', `${u.username} has been deleted successfully.`);
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      await dialog.error('Delete failed', error.response?.data?.error || error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (u: User, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      await userManagementAPI.updateUserStatus(u.id, newStatus);
      setUsers((prev) => prev.map((x) => (String(x.id) === String(u.id) ? { ...x, status: newStatus } : x)));
    } catch (error) {
      console.error('Failed to update user status:', error);
      await dialog.error('Status update failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleRoleChange = async (u: User, newRole: User['role']) => {
    try {
      const updateData = {
        role: newRole,
        is_staff: newRole === 'admin',
        is_superuser: newRole === 'admin' && u.is_superuser,
        kanda: newRole === 'apostle' ? u.kanda || '' : '',
      };
      const response = await userManagementAPI.updateUser(u.id, updateData);
      setUsers((prev) => prev.map((x) => (String(x.id) === String(u.id) ? { ...x, ...response.data } : x)));
    } catch (error) {
      console.error('Failed to update user role:', error);
      await dialog.error('Role update failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleResetPassword = async (u: User) => {
    const ok = await dialog.confirm({
      title: `Reset password for ${u.username}?`,
      message: `A password reset link will be emailed to ${u.email}. They can then choose a new password.`,
      confirmText: 'Send reset link',
    });
    if (!ok) return;
    try {
      const response = await userManagementAPI.resetUserPassword(u.id);
      await dialog.success('Reset link sent', response.data?.message || `A password reset link was sent to ${u.email}.`);
    } catch (error) {
      await dialog.error('Password reset failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleViewActivity = async (u: User) => {
    try {
      const response = await userManagementAPI.getUserActivity(u.id);
      const activityData = response.data;
      if (!activityData || activityData.length === 0) {
        await dialog.info('No recent activity', `There is no recorded activity for ${u.username} yet.`);
        return;
      }
      const text = activityData
        .map((a: any) => `${new Date(a.timestamp).toLocaleString()} — ${a.action}${a.resource_type ? ` (${a.resource_type})` : ''}`)
        .join('\n');
      await dialog.info(`Recent activity — ${u.username}`, text.length > 1500 ? `${text.slice(0, 1500)}\n… and more` : text);
    } catch (error) {
      await dialog.error('Activity unavailable', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) setSelectedUsers([]);
    else setSelectedUsers(filteredUsers.map((u) => u.id));
  };

  const handleBulkStatusChange = async (newStatus: 'active' | 'inactive' | 'suspended') => {
    if (selectedUsers.length === 0) return;
    const ok = await dialog.confirm({
      title: `Change status for ${selectedUsers.length} users?`,
      message: `This will set the status of ${selectedUsers.length} selected users to "${newStatus}".`,
      confirmText: 'Change status',
    });
    if (!ok) return;
    try {
      await Promise.all(selectedUsers.map((id) => userManagementAPI.updateUserStatus(id, newStatus)));
      setUsers((prev) => prev.map((u) => (selectedUsers.map(String).includes(String(u.id)) ? { ...u, status: newStatus } : u)));
      setSelectedUsers([]);
      await dialog.success('Statuses updated', 'Selected users updated.');
    } catch (error) {
      await dialog.error('Bulk update failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    const ok = await dialog.danger({
      title: `Delete ${selectedUsers.length} users?`,
      message: 'This permanently removes the selected users and their login access. This action cannot be undone.',
      confirmText: `Delete ${selectedUsers.length} users`,
    });
    if (!ok) return;
    try {
      await Promise.all(selectedUsers.map((id) => userManagementAPI.deleteUser(id)));
      const gone = new Set(selectedUsers.map(String));
      setUsers((prev) => prev.filter((u) => !gone.has(String(u.id))));
      setSelectedUsers([]);
      await dialog.success('Users deleted', 'Selected users deleted.');
    } catch (error) {
      await dialog.error('Bulk delete failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="System users, roles and permissions"
        cta={
          <ClayButton tone="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreateUser}>
            Invite New User
          </ClayButton>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Total Users" value={stats.total} tint="primary" icon={<Users className="w-4 h-4" />} index={0} />
        <KpiCard label="Active Users" value={stats.active} tint="success" icon={<CheckCircle2 className="w-4 h-4" />} index={1} />
        <KpiCard label="Administrators" value={stats.admins} tint="purple" icon={<ShieldCheck className="w-4 h-4" />} index={2} />
        <KpiCard label="Registrants" value={stats.registrants} tint="info" icon={<UserCheck className="w-4 h-4" />} index={3} />
      </div>

      {selectedUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.snappy}
          className="surface p-4 flex flex-wrap items-center justify-between gap-3"
        >
          <span className="text-xs font-semibold text-[var(--foreground)]">
            <span className="tnum">{selectedUsers.length}</span> user{selectedUsers.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex flex-wrap gap-2">
            <ClayButton tone="success" onClick={() => handleBulkStatusChange('active')}>Activate</ClayButton>
            <ClayButton tone="neutral" onClick={() => handleBulkStatusChange('inactive')}>Deactivate</ClayButton>
            <ClayButton tone="neutral" onClick={() => handleBulkStatusChange('suspended')}>Suspend</ClayButton>
            <ClayButton tone="danger" onClick={handleBulkDelete}>Delete</ClayButton>
            <ClayButton tone="neutral" onClick={() => setSelectedUsers([])}>Clear</ClayButton>
          </div>
        </motion.div>
      )}

      <SectionCard
        title={`Users (${filteredUsers.length})`}
        subtitle="Search, filter, manage access"
        action={
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded accent-[var(--primary)]"
            />
            Select all
          </label>
        }
      >
        {loading && users.length === 0 ? (
          <TableSkeleton rows={8} />
        ) : (
          <DataTable
            columns={[
              {
                key: 'user',
                label: 'User',
                render: (_v, row: User) => (
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedUsers.map(String).includes(String(row.id))}
                      onChange={() =>
                        setSelectedUsers((prev) =>
                          prev.map(String).includes(String(row.id))
                            ? prev.filter((id) => String(id) !== String(row.id))
                            : [...prev, row.id]
                        )
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded accent-[var(--primary)] flex-shrink-0"
                    />
                    <span className="w-9 h-9 rounded-full bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] text-[var(--primary)] border border-[color-mix(in_srgb,var(--primary)_30%,transparent)] flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {getInitials(row.first_name, row.last_name, row.username)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-[var(--foreground)] truncate">
                        {row.first_name} {row.last_name}
                      </span>
                      <span className="block text-xs text-[var(--primary)] font-medium truncate">@{row.username}</span>
                      <span className="block text-xs text-muted-foreground truncate">{row.email}</span>
                    </span>
                  </div>
                ),
              },
              {
                key: 'role',
                label: 'Role',
                render: (_v, row: User) => (
                  <div className="flex flex-col gap-1.5 items-start">
                    <select
                      value={row.role}
                      onChange={(e) => handleRoleChange(row, e.target.value as User['role'])}
                      disabled={String(row.id) === String((currentUser as any)?.id)}
                      className="h-8 px-2 rounded-full text-xs font-bold border border-[color-mix(in_srgb,var(--primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)] focus-ring disabled:opacity-60"
                    >
                      <option value="admin">Administrator</option>
                      <option value="apostle">Apostle</option>
                      <option value="registrant">Registrant</option>
                      <option value="member">Member</option>
                      <option value="security">Security</option>
                    </select>
                    {row.is_superuser && <StatusPill stage="Superuser" tone="purple" />}
                  </div>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (_v, row: User) => (
                  <StatusPill
                    stage={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    tone={row.status === 'active' ? 'success' : row.status === 'suspended' ? 'danger' : 'neutral'}
                  />
                ),
              },
              {
                key: 'members_registered',
                label: 'Members',
                align: 'right',
                render: (v) => <span className="tnum font-bold">{Number(v || 0).toLocaleString()}</span>,
              },
              {
                key: 'date_joined',
                label: 'Joined',
                render: (v, row: User) => (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(v)}
                    <span className="block">Login: {formatDate(row.last_login)}</span>
                  </span>
                ),
              },
            ]}
            data={filteredUsers}
            searchPlaceholder="Search username, email or name..."
            searchFilter={(row: User, q) =>
              `${row.username} ${row.email} ${row.first_name} ${row.last_name}`.toLowerCase().includes(q)
            }
            initialSortColumn="date_joined"
            initialSortDirection="desc"
            defaultPageSize={10}
            emptyTitle="No users found"
            emptyMessage="Try adjusting your search or filter criteria."
            actions={(row: User) => (
              <>
                <button onClick={() => handleEditUser(row)} title="Edit" className="p-2 rounded-lg text-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleViewActivity(row)} title="Activity" className="p-2 rounded-lg text-cyan-600 hover:bg-cyan-500/10 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => handleResetPassword(row)} title="Reset password" className="p-2 rounded-lg text-[var(--primary)] hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] transition-colors">
                  <KeyRound className="w-4 h-4" />
                </button>
                {row.status !== 'active' ? (
                  <button onClick={() => handleStatusChange(row, 'active')} title="Activate" className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={() => handleStatusChange(row, 'inactive')} title="Deactivate" className="p-2 rounded-lg text-amber-600 hover:bg-amber-500/10 transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => handleStatusChange(row, 'suspended')} title="Suspend" className="p-2 rounded-lg text-orange-600 hover:bg-orange-500/10 transition-colors">
                  <AlertTriangle className="w-4 h-4" />
                </button>
                {String(row.id) !== String((currentUser as any)?.id) && (
                  <button onClick={() => setShowDeleteModal(row)} title="Delete" className="p-2 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            toolbar={
              <div className="flex items-center gap-2">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-9 px-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs font-semibold focus-ring"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="apostle">Apostle</option>
                  <option value="registrant">Registrant</option>
                  <option value="member">Member</option>
                  <option value="security">Security</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 px-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs font-semibold focus-ring"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            }
          />
        )}
      </SectionCard>

      {/* Create/Edit modal */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div variants={variants.backdropFade} initial="initial" animate="animate" exit="exit" onClick={() => setShowUserModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              key={shakeKey}
              variants={variants.modalPanel}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springs.gentle}
              className="glass-strong relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
                <h2 className="font-display text-lg font-bold text-[var(--foreground)]">{editingUser ? 'Edit User' : 'Invite New User'}</h2>
                <button onClick={() => setShowUserModal(false)} className="p-2 rounded-full text-muted-foreground hover:bg-[var(--secondary)]">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>First Name</label>
                    <input type="text" value={userForm.first_name} onChange={(e) => setUserForm((p) => ({ ...p, first_name: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name</label>
                    <input type="text" value={userForm.last_name} onChange={(e) => setUserForm((p) => ({ ...p, last_name: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Username</label>
                  <input type="text" value={userForm.username} onChange={(e) => setUserForm((p) => ({ ...p, username: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{editingUser ? 'New password (blank = keep)' : 'Password'}</label>
                  <div className="relative">
                    <input
                      type={showModalPassword ? 'text' : 'password'}
                      value={userForm.password}
                      onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder={editingUser ? 'Leave blank to keep current' : 'Min. 6 characters'}
                      className={`${inputCls} pr-11`}
                    />
                    <button type="button" onClick={() => setShowModalPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:bg-[var(--secondary)]">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserFormData['role'];
                      setUserForm((p) => ({
                        ...p,
                        role: newRole,
                        kanda: newRole === 'apostle' ? p.kanda || '' : '',
                        is_staff: newRole === 'admin' || p.is_staff,
                        is_superuser: newRole === 'admin' ? p.is_superuser : false,
                      }));
                    }}
                    className={inputCls}
                  >
                    <option value="admin">Administrator</option>
                    <option value="apostle">Apostle</option>
                    <option value="registrant">Registrant</option>
                    <option value="member">Member</option>
                    <option value="security">Security</option>
                  </select>
                </div>
                {userForm.role === 'apostle' && (
                  <div>
                    <label className={labelCls}>Kanda</label>
                    <select value={userForm.kanda || ''} onChange={(e) => setUserForm((p) => ({ ...p, kanda: e.target.value }))} className={inputCls}>
                      <option value="">Select kanda</option>
                      {KANDA_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <ClayButton tone="neutral" onClick={() => setShowUserModal(false)}>Cancel</ClayButton>
                <ClayButton tone="primary" loading={loading} onClick={handleSaveUser}>
                  {editingUser ? 'Update' : 'Create'}
                </ClayButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div variants={variants.backdropFade} initial="initial" animate="animate" exit="exit" onClick={() => setShowDeleteModal(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div variants={variants.modalPanel} initial="initial" animate="animate" exit="exit" transition={springs.gentle} className="glass-strong relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
              <motion.h2 key="del-title" animate={undefined} className="font-display text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Delete User
              </motion.h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Delete {showDeleteModal.first_name} {showDeleteModal.last_name} (@{showDeleteModal.username})? This cannot be undone.
              </p>
              {filteredUsers.length === 0 && <EmptyState title="Nothing else" message="This is the last matching user." />}
              <div className="mt-6 flex justify-end gap-2">
                <ClayButton tone="neutral" onClick={() => setShowDeleteModal(null)}>Cancel</ClayButton>
                <ClayButton tone="danger" loading={loading} onClick={() => handleDeleteUser(showDeleteModal)}>Delete</ClayButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
