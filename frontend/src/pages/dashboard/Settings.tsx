import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  UserCircleIcon,
  CircleStackIcon,
  GlobeAltIcon,
  CloudIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

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

const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState<'system' | 'security' | 'notifications' | 'database'>('system');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showPasswords, setShowPasswords] = useState(false);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: 'Efatha Leaders\' Camp Registration',
    siteDescription: 'Church leaders\' camp registration and coordination system for Kibaha',
    adminEmail: 'admin@church.com',
    allowRegistration: true,
    requireEmailVerification: false,
    maxMembersPerRegistrar: 100,
    sessionTimeout: 30,
    backupFrequency: 'daily',
    maintenanceMode: false,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    enforceStrongPasswords: true,
    enableTwoFactor: false,
    sessionSecurityLevel: 'medium',
    ipWhitelist: [],
    loginAttemptLimit: 5,
    lockoutDuration: 15,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    newMemberAlerts: true,
    systemAlerts: true,
    weeklyReports: false,
    backupAlerts: true,
  });

  const [newIpAddress, setNewIpAddress] = useState('');

  const tabs = [
    { id: 'system', name: 'System', icon: CogIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'database', name: 'Database', icon: CircleStackIcon },
  ];

  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveStatus('saving');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save settings logic here
      console.log('Saving settings:', {
        systemSettings,
        securitySettings,
        notificationSettings
      });
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIpAddress = () => {
    if (newIpAddress && !securitySettings.ipWhitelist.includes(newIpAddress)) {
      setSecuritySettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIpAddress]
      }));
      setNewIpAddress('');
    }
  };

  const handleRemoveIpAddress = (ip: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(address => address !== ip)
    }));
  };

  const handleTestBackup = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('Backup test completed successfully!');
    } catch (error) {
      alert('Backup test failed. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSettings = () => {
    const settings = {
      system: systemSettings,
      security: { ...securitySettings, ipWhitelist: securitySettings.ipWhitelist },
      notifications: notificationSettings,
      exportedAt: new Date().toISOString(),
    };
    
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

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'saved':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <CogIcon className="h-10 w-10 text-green-500 mr-4" />
                Settings
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Configure system preferences and administrative settings
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExportSettings}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
              >
                Export Settings
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 flex items-center"
              >
                {getSaveStatusIcon()}
                <span className="ml-2">
                  {saveStatus === 'saving' ? 'Saving...' : 
                   saveStatus === 'saved' ? 'Saved!' : 
                   saveStatus === 'error' ? 'Error!' : 'Save Changes'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
              
              {/* System Settings */}
              {activeTab === 'system' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">System Configuration</h2>
                  
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                        <input
                          type="text"
                          value={systemSettings.siteName}
                          onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
                        <input
                          type="email"
                          value={systemSettings.adminEmail}
                          onChange={(e) => setSystemSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                      <textarea
                        value={systemSettings.siteDescription}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    {/* Registration Settings */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Registration Settings</h3>
                      <div className="space-y-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={systemSettings.allowRegistration}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, allowRegistration: e.target.checked }))}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Allow new registrations</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={systemSettings.requireEmailVerification}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, requireEmailVerification: e.target.checked }))}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Require email verification</span>
                        </label>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum members per registrar
                          </label>
                          <input
                            type="number"
                            value={systemSettings.maxMembersPerRegistrar}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, maxMembersPerRegistrar: parseInt(e.target.value) }))}
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* System Configuration */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">System Configuration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Session timeout (minutes)
                          </label>
                          <input
                            type="number"
                            value={systemSettings.sessionTimeout}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Backup frequency</label>
                          <select
                            value={systemSettings.backupFrequency}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, backupFrequency: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={systemSettings.maintenanceMode}
                            onChange={(e) => setSystemSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Enable maintenance mode</span>
                        </label>
                        {systemSettings.maintenanceMode && (
                          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center">
                              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                              <p className="text-sm text-yellow-800">
                                Maintenance mode will restrict access to administrators only.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Configuration</h2>
                  
                  <div className="space-y-6">
                    {/* Password Policy */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Password Policy</h3>
                      <div className="space-y-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={securitySettings.enforceStrongPasswords}
                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, enforceStrongPasswords: e.target.checked }))}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Enforce strong passwords</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={securitySettings.enableTwoFactor}
                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, enableTwoFactor: e.target.checked }))}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Enable two-factor authentication</span>
                        </label>
                      </div>
                    </div>

                    {/* Session Security */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Session Security</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Security level</label>
                        <select
                          value={securitySettings.sessionSecurityLevel}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionSecurityLevel: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="low">Low - Basic session validation</option>
                          <option value="medium">Medium - IP and browser validation</option>
                          <option value="high">High - Strict validation with fingerprinting</option>
                        </select>
                      </div>
                    </div>

                    {/* Login Security */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Login Security</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Login attempt limit
                          </label>
                          <input
                            type="number"
                            value={securitySettings.loginAttemptLimit}
                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, loginAttemptLimit: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lockout duration (minutes)
                          </label>
                          <input
                            type="number"
                            value={securitySettings.lockoutDuration}
                            onChange={(e) => setSecuritySettings(prev => ({ ...prev, lockoutDuration: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* IP Whitelist */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">IP Address Whitelist</h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={newIpAddress}
                            onChange={(e) => setNewIpAddress(e.target.value)}
                            placeholder="e.g., 192.168.1.1"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                          />
                          <button
                            onClick={handleAddIpAddress}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                          >
                            Add
                          </button>
                        </div>

                        <div className="space-y-2">
                          {securitySettings.ipWhitelist.map((ip, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                              <span className="text-sm text-gray-700">{ip}</span>
                              <button
                                onClick={() => handleRemoveIpAddress(ip)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          {securitySettings.ipWhitelist.length === 0 && (
                            <p className="text-sm text-gray-500">No IP addresses whitelisted</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Email notifications</span>
                          <p className="text-xs text-gray-500">Receive general system notifications via email</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700">New member alerts</span>
                          <p className="text-xs text-gray-500">Get notified when new members are registered</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.newMemberAlerts}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, newMemberAlerts: e.target.checked }))}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700">System alerts</span>
                          <p className="text-xs text-gray-500">Critical system notifications and errors</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.systemAlerts}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Weekly reports</span>
                          <p className="text-xs text-gray-500">Receive weekly summary reports</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.weeklyReports}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Backup alerts</span>
                          <p className="text-xs text-gray-500">Notifications about backup status and failures</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.backupAlerts}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, backupAlerts: e.target.checked }))}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Database Settings */}
              {activeTab === 'database' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Database Management</h2>
                  
                  <div className="space-y-6">
                    {/* Database Status */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm font-medium text-green-800">Database connection is healthy</span>
                      </div>
                    </div>

                    {/* Backup Management */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Management</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <button
                            onClick={handleTestBackup}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {loading ? 'Testing...' : 'Test Backup'}
                          </button>
                          
                          <button
                            onClick={() => alert('Manual backup initiated')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                          >
                            Create Backup
                          </button>
                          
                          <button
                            onClick={() => alert('Restore functionality coming soon')}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                          >
                            Restore Data
                          </button>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Recent Backups</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>2024-12-21 14:30:00</span>
                              <span className="text-green-600">Success</span>
                            </div>
                            <div className="flex justify-between">
                              <span>2024-12-20 14:30:00</span>
                              <span className="text-green-600">Success</span>
                            </div>
                            <div className="flex justify-between">
                              <span>2024-12-19 14:30:00</span>
                              <span className="text-green-600">Success</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Database Maintenance */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance</h3>
                      <div className="space-y-4">
                        <button
                          onClick={() => alert('Database optimization started')}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                        >
                          Optimize Database
                        </button>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <InformationCircleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">Database Optimization</p>
                              <p className="text-sm text-yellow-700 mt-1">
                                Regular optimization helps maintain optimal database performance. 
                                Run this monthly or when experiencing performance issues.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;