import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { userManagementAPI } from '../../services/api';
import '../../styles/user-management.css';
import {
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'registrant' | 'apostle' | 'member';
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
  role: 'admin' | 'registrant' | 'apostle' | 'member';
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

const UserManagement: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  // Additional state for bulk actions
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Real data state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<User | null>(null);
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

  // Fetch users from database
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    console.log('fetchUsers called');
    setLoading(true);
    try {
      const response = await userManagementAPI.getUsers();
      console.log('API response:', response);
      setUsers(response.data);
      console.log('Users set:', response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // For development, fall back to mock data if API fails
      const mockUsers: User[] = [
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
        {
          id: 2,
          username: 'john_registrant',
          email: 'john@church.com',
          first_name: 'John',
          last_name: 'Smith',
          role: 'registrant' as const,
          status: 'active' as const,
          date_joined: '2024-02-20T09:15:00Z',
          last_login: '2024-12-20T16:45:00Z',
          members_registered: 85,
          is_staff: false,
          is_superuser: false,
        },
      ];
      setUsers(mockUsers);
      console.log('Fallback to mock data:', mockUsers);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = () => {
    setEditingUser(null);
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

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      kanda: user.kanda || '',
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    // Validation
    if (!userForm.username.trim()) {
      alert('Username is required');
      return;
    }
    
    if (!userForm.email.trim()) {
      alert('Email is required');
      return;
    }
    
    if (!userForm.first_name.trim()) {
      alert('First name is required');
      return;
    }
    
    if (!userForm.last_name.trim()) {
      alert('Last name is required');
      return;
    }
    
    if (!editingUser && (!userForm.password || userForm.password.length < 6)) {
      alert('Password is required and must be at least 6 characters long');
      return;
    }

    if (userForm.role === 'apostle' && !userForm.kanda) {
      alert('Please select a kanda for apostle users');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      if (editingUser) {
        // Update existing user - exclude password from updates
        const updateData = { ...userForm };
        delete updateData.password;
        
        const response = await userManagementAPI.updateUser(editingUser.id, updateData);
        setUsers(prev => prev.map(user => 
          user.id === editingUser.id 
            ? { ...user, ...response.data }
            : user
        ));
        alert('User updated successfully!');
      } else {
        // Create new user
        const response = await userManagementAPI.createUser(userForm);
        setUsers(prev => [...prev, response.data]);
        alert('User created successfully!');
      }
      
      setShowUserModal(false);
      setUserForm({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'registrant',
        password: '',
        is_staff: false,
        is_superuser: false,
      });
    } catch (error: any) {
      console.error('Failed to save user:', error);
      
      // Handle specific error messages
      if (error.response?.data) {
        const errorData = error.response.data;
        let errorMessage = `Failed to ${editingUser ? 'update' : 'create'} user:\n`;
        
        if (typeof errorData === 'string') {
          errorMessage += errorData;
        } else if (typeof errorData === 'object') {
          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              errorMessage += `${key}: ${errorData[key].join(', ')}\n`;
            } else {
              errorMessage += `${key}: ${errorData[key]}\n`;
            }
          });
        }
        
        alert(errorMessage);
      } else {
        alert(`Failed to ${editingUser ? 'update' : 'create'} user: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    setLoading(true);
    
    try {
      await userManagementAPI.deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setShowDeleteModal(null);
      alert(`User ${user.username} has been deleted successfully.`);
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      
      let errorMessage = 'Failed to delete user';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred while deleting user. The user may have associated data that prevents deletion.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (user: User, newStatus: 'active' | 'inactive' | 'suspended') => {
    setLoading(true);
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await userManagementAPI.updateUserStatus(user.id, newStatus);
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ));
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert(`Failed to update user status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (user: User, newRole: 'admin' | 'registrant' | 'apostle' | 'member') => {
    setLoading(true);
    
    try {
      const updateData = { 
        role: newRole,
        is_staff: newRole === 'admin',
        is_superuser: newRole === 'admin' && user.is_superuser, // Only keep superuser if they already have it
        kanda: newRole === 'apostle' ? (user.kanda || '') : ''
      };
      
      const response = await userManagementAPI.updateUser(user.id, updateData);
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, ...response.data } : u
      ));
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert(`Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!window.confirm(`Are you sure you want to reset password for ${user.username}? This will generate a new temporary password.`)) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await userManagementAPI.resetUserPassword(user.id);
      alert(`Password reset for ${user.username}!\nTemporary password: ${response.data.temporary_password}\n\nPlease share this securely with the user.`);
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert(`Failed to reset password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUnlockAccount = async (user: User) => {
    setLoading(true);
    
    try {
      await userManagementAPI.unlockAccount(user.id);
      alert(`Account unlocked for ${user.username}!`);
      fetchUsers(); // Refresh user list
    } catch (error) {
      console.error('Failed to unlock account:', error);
      alert(`Failed to unlock account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewActivity = async (user: User) => {
    setLoading(true);
    
    try {
      const response = await userManagementAPI.getUserActivity(user.id);
      // Open activity in a modal or new window
      const activityData = response.data;
      const activityText = activityData.map((activity: any) => 
        `${new Date(activity.timestamp).toLocaleString()} - ${activity.action} (${activity.details || 'No details'})`
      ).join('\n');
      
      alert(`Recent activity for ${user.username}:\n\n${activityText.slice(0, 1000)}${activityText.length > 1000 ? '...' : ''}`);
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
      alert(`Failed to fetch user activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Bulk actions
  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleBulkStatusChange = async (newStatus: 'active' | 'inactive' | 'suspended') => {
    if (selectedUsers.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to change status to "${newStatus}" for ${selectedUsers.length} users?`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      await Promise.all(
        selectedUsers.map(userId => 
          userManagementAPI.updateUserStatus(userId, newStatus)
        )
      );
      
      setUsers(prev => prev.map(user => 
        selectedUsers.includes(user.id) ? { ...user, status: newStatus } : user
      ));
      
      setSelectedUsers([]);
      alert(`Successfully updated ${selectedUsers.length} users`);
    } catch (error) {
      console.error('Failed to bulk update users:', error);
      alert(`Failed to bulk update users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
      return;
    }
    
    setLoading(true);
    
    try {
      await Promise.all(
        selectedUsers.map(userId => 
          userManagementAPI.deleteUser(userId)
        )
      );
      
      setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
      alert(`Successfully deleted ${selectedUsers.length} users`);
    } catch (error) {
      console.error('Failed to bulk delete users:', error);
      alert(`Failed to bulk delete users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheckIcon className="h-5 w-5 text-red-500" />;
      case 'apostle':
        return <ShieldCheckIcon className="h-5 w-5 text-orange-500" />;
      case 'registrant':
        return <UserCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <UsersIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Active
        </span>;
      case 'inactive':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Inactive
        </span>;
      case 'suspended':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          Suspended
        </span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="user-management-container min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="user-management-header mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center">
              <UsersIcon className="h-10 w-10 text-green-500 mr-4" />
              User Management
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Manage system users, roles, and permissions
              {loading && (
                <span className="inline-flex items-center ml-4">
                  <span className="h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin mr-2 inline-block" />
                  Loading...
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleCreateUser}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add User
          </button>
        </div>

        {/* Stats Cards */}
        <div className="user-stats-grid grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="stat-icon h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="stat-content ml-4">
              <p className="stat-label text-sm font-medium text-gray-600">Total Users</p>
              <p className="stat-value text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>

          <div className="stat-card bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="stat-icon h-12 w-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="stat-content ml-4">
              <p className="stat-label text-sm font-medium text-gray-600">Active Users</p>
              <p className="stat-value text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
          </div>

          <div className="stat-card bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="stat-icon h-12 w-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="stat-content ml-4">
              <p className="stat-label text-sm font-medium text-gray-600">Administrators</p>
              <p className="stat-value text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>

          <div className="stat-card bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="stat-icon h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
              <UserCircleIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="stat-content ml-4">
              <p className="stat-label text-sm font-medium text-gray-600">Registrants</p>
              <p className="stat-value text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'registrant' || u.role === 'apostle').length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="user-filters-section bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="user-filter-icon h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="user-filter-input w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="user-filter-select w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="apostle">Apostle</option>
            <option value="registrant">Registrant</option>
            <option value="member">Member</option>
          </select>
  const handleRoleChange = async (user: User, newRole: 'admin' | 'registrant' | 'apostle' | 'member') => {

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="user-filter-select w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <FunnelIcon className="h-4 w-4 mr-2" />
            {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-blue-700 font-medium">
                  {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleBulkStatusChange('active')}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  disabled={loading}
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkStatusChange('inactive')}
                  className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                  disabled={loading}
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkStatusChange('suspended')}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  disabled={loading}
                >
                  Suspend
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                  disabled={loading}
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table - Enhanced Mobile Responsive */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Mobile Card View */}
          <div className="mobile-card-view">
            <div className="space-y-4 p-4">
              {filteredUsers.length === 0 && !loading ? (
                <div className="empty-state">
                  <UsersIcon className="empty-state-icon" />
                  <h3 className="empty-state-title">No users found</h3>
                  <p className="empty-state-text">Try adjusting your search or filter criteria.</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-card-header">
                      <div className="user-card-header-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <div className="user-avatar">
                          {user.first_name[0]}{user.last_name[0]}
                        </div>
                        <div className="user-header-info">
                          <div className="user-name">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="user-username">@{user.username}</div>
                        </div>
                      </div>
                      <div className="user-status-badge">
                        {user.status === 'active' && <div className="status-badge-active"><CheckCircleIcon className="h-3 w-3" />Active</div>}
                        {user.status === 'inactive' && <div className="status-badge-inactive"><XCircleIcon className="h-3 w-3" />Inactive</div>}
                        {user.status === 'suspended' && <div className="status-badge-suspended"><ExclamationTriangleIcon className="h-3 w-3" />Suspended</div>}
                      </div>
                    </div>
                    
                    <div className="user-card-body">
                      <div className="user-email">{user.email}</div>
                      
                      <div className="user-role-section">
                        <div className="user-role-icon">
                          {getRoleIcon(user.role)}
                        </div>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value as any)}
                          disabled={user.id === currentUser?.id || loading}
                          className="user-role-select"
                        >
                          <option value="admin">Administrator</option>
                          <option value="apostle">Apostle</option>
                          <option value="registrant">Registrant</option>
                          <option value="member">Member</option>
                        </select>
                      </div>
                      
                      <div className="user-info-item">
                        <ClockIcon className="h-3 w-3" />
                        <span>Joined: {formatDate(user.date_joined).split(',')[0]}</span>
                      </div>
                      
                      <div className="user-info-item">
                        <span className="user-members-count">{user.members_registered} members</span>
                      </div>
                      
                      {user.is_superuser && (
                        <div className="user-badge-superuser">
                          ⭐ Superuser
                        </div>
                      )}
                    </div>
                    
                    <div className="user-card-actions">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="action-icon-btn action-edit"
                        title="Edit User"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleViewActivity(user)}
                        className="action-icon-btn action-view"
                        title="View Activity"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleResetPassword(user)}
                        className="action-icon-btn action-password"
                        title="Reset Password"
                        disabled={loading}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-6m6 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6a2 2 0 012-2m0 0V7a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </button>
                      
                      {user.status !== 'active' ? (
                        <button
                          onClick={() => handleStatusChange(user, 'active')}
                          className="action-icon-btn action-activate"
                          title="Activate"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(user, 'inactive')}
                          className="action-icon-btn action-deactivate"
                          title="Deactivate"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleStatusChange(user, 'suspended')}
                        className="action-icon-btn action-suspend"
                        title="Suspend"
                      >
                        <ExclamationTriangleIcon className="h-4 w-4" />
                      </button>

                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => setShowDeleteModal(user)}
                          className="action-icon-btn action-delete"
                          title="Delete User"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="desktop-table-view overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Members Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-medium">
                            {user.first_name[0]}{user.last_name[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 mb-2">
                        {getRoleIcon(user.role)}
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value as any)}
                          disabled={user.id === currentUser?.id || loading}
                          className="text-sm font-medium text-gray-900 bg-transparent border-none focus:ring-2 focus:ring-green-500 rounded px-1"
                        >
                          <option value="admin">Administrator</option>
                          <option value="apostle">Apostle</option>
                          <option value="registrant">Registrant</option>
                          <option value="member">Member</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        {getStatusBadge(user.status)}
                        {user.is_superuser && (
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Superuser
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <div>
                          <div>Joined: {formatDate(user.date_joined)}</div>
                          <div>Last login: {formatDate(user.last_login)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm font-medium text-gray-900">
                        {user.members_registered}
                      </div>
                      <div className="text-sm text-gray-500">members</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-1 lg:space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-100"
                          title="Edit User"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleViewActivity(user)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100 hidden md:block"
                          title="View Activity"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleResetPassword(user)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded-full hover:bg-purple-100 hidden lg:block"
                          title="Reset Password"
                          disabled={loading}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-6m6 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6a2 2 0 012-2m0 0V7a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </button>
                        
                        {user.status !== 'active' ? (
                          <button
                            onClick={() => handleStatusChange(user, 'active')}
                            className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-100"
                            title="Activate"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(user, 'inactive')}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded-full hover:bg-yellow-100"
                            title="Deactivate"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleStatusChange(user, 'suspended')}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 hidden md:block"
                          title="Suspend"
                        >
                          <ExclamationTriangleIcon className="h-4 w-4" />
                        </button>

                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => setShowDeleteModal(user)}
                            className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100"
                            title="Delete User"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                        
                        {/* More Actions Dropdown for smaller screens */}
                        <div className="relative lg:hidden">
                          <button
                            onClick={() => {/* Handle dropdown toggle */}}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100"
                            title="More Actions"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center">
                <div className="h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                <span className="text-gray-600">Loading users...</span>
              </div>
            </div>
          )}
        </div>

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h3>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      value={userForm.first_name}
                      onChange={(e) => setUserForm(prev => ({ ...prev, first_name: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={userForm.last_name}
                      onChange={(e) => setUserForm(prev => ({ ...prev, last_name: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => {
                      const newRole = e.target.value as 'admin' | 'registrant' | 'apostle' | 'member';
                      setUserForm(prev => ({ 
                        ...prev, 
                        role: newRole,
                        kanda: newRole === 'apostle' ? prev.kanda || '' : '',
                        is_staff: newRole === 'admin' || prev.is_staff, // Automatically set staff for admin
                        is_superuser: newRole === 'admin' ? prev.is_superuser : false // Only allow superuser for admin
                      }));
                    }}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="admin">Administrator</option>
                    <option value="apostle">Apostle</option>
                    <option value="registrant">Registrant</option>
                    <option value="member">Member</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {userForm.role === 'admin' && 'Admin users automatically get staff status'}
                    {userForm.role === 'apostle' && 'Can monitor members in assigned kanda'}
                    {userForm.role === 'registrant' && 'Can register new members'}
                    {userForm.role === 'member' && 'Basic user permissions'}
                  </p>
                </div>

                {userForm.role === 'apostle' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kanda</label>
                    <select
                      value={userForm.kanda || ''}
                      onChange={(e) => setUserForm(prev => ({ ...prev, kanda: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select kanda</option>
                      {KANDA_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={userForm.is_staff}
                      onChange={(e) => setUserForm(prev => ({ ...prev, is_staff: e.target.checked }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Staff Status</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={userForm.is_superuser}
                      onChange={(e) => setUserForm(prev => ({ ...prev, is_superuser: e.target.checked }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Superuser Status</span>
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-md hover:from-green-600 hover:to-green-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to delete {showDeleteModal.first_name} {showDeleteModal.last_name}? 
                  This action cannot be undone.
                </p>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteUser(showDeleteModal)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;