import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchMembers } from '../../store/slices/membersSlice';
import { fetchAdminStats } from '../../store/slices/statsSlice';
import { exportAPI } from '../../services/api';
import {
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

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
  const [dateRange, setDateRange] = useState({
    start: '',
    end: new Date().toISOString().split('T')[0]
  });
  const [exportProgress, setExportProgress] = useState<{ [key: string]: number }>({});
  const [exportStatus, setExportStatus] = useState<{ [key: string]: 'idle' | 'exporting' | 'completed' | 'error' }>({});

  // Calculate summary statistics
  const calculateSummaryStats = () => {
    const stats = {
      totalMembers: members.length,
      males: members.filter(m => m.gender === 'male').length,
      females: members.filter(m => m.gender === 'female').length,
      saved: members.filter(m => m.saved).length,
      unsaved: members.filter(m => !m.saved).length,
      countries: {} as { [key: string]: number },
      tanzaniaRegions: {} as { [key: string]: number },
      darEsSalaamAreas: {} as { [key: string]: number }
    };

    // Count members by country
    members.forEach(member => {
      stats.countries[member.country] = (stats.countries[member.country] || 0) + 1;
    });

    // Count members by region (only for Tanzania)
    members.filter(m => m.country === 'Tanzania' && m.region).forEach(member => {
      stats.tanzaniaRegions[member.region!] = (stats.tanzaniaRegions[member.region!] || 0) + 1;
    });

    // Count members by center/area (only for Dar es Salaam)
    members.filter(m => m.country === 'Tanzania' && m.region === 'Dar es Salaam' && m.center_area).forEach(member => {
      stats.darEsSalaamAreas[member.center_area!] = (stats.darEsSalaamAreas[member.center_area!] || 0) + 1;
    });

    return stats;
  };

  const summaryStats = calculateSummaryStats();

  // Calculate real data for export options
  const myMembersCount = members.filter(member => 
    member.created_by === user?.id || member.registered_by === user?.id
  ).length;

  const totalAnalyticsSize = adminStats ? 
    Math.round((adminStats.total_members * 0.05 + adminStats.recent_registrations * 0.02) * 100) / 100 : 0;

  const exportOptions: ExportOption[] = [
    {
      id: 'summary-report',
      name: 'Summary Report',
      description: `Comprehensive summary report with ${summaryStats.totalMembers} total members, gender breakdown, salvation status, and geographical distribution`,
      icon: ChartBarIcon,
      dataType: 'analytics',
      formats: ['excel', 'pdf'], // CSV not supported for analytics
      estimatedSize: '0.5 MB',
      category: 'reports'
    },
    {
      id: 'demographics-report',
      name: 'Demographics Report',
      description: `Detailed demographics analysis including gender distribution (${summaryStats.males} males, ${summaryStats.females} females) and salvation status (${summaryStats.saved} saved, ${summaryStats.unsaved} unsaved)`,
      icon: UsersIcon,
      dataType: 'analytics',
      formats: ['excel', 'pdf'], // CSV not supported for analytics
      estimatedSize: '0.3 MB',
      category: 'reports'
    },
    {
      id: 'geographical-report',
      name: 'Geographical Report',
      description: `Geographical distribution of members by country, regions (Tanzania), and areas (Dar es Salaam)`,
      icon: ChartBarIcon,
      dataType: 'analytics',
      formats: ['excel', 'pdf'], // CSV not supported for analytics
      estimatedSize: '0.4 MB',
      category: 'reports'
    },
    {
      id: 'members-all',
      name: 'All Members (Detailed)',
      description: `Complete member database with ${members.length} members including personal details, contact information, and registration data`,
      icon: UsersIcon,
      dataType: 'members',
      formats: ['csv', 'excel', 'pdf'],
      estimatedSize: `${Math.max(0.1, members.length * 0.015).toFixed(1)} MB`,
      category: 'member-data'
    },
    {
      id: 'members-my',
      name: 'My Registered Members',
      description: `${myMembersCount} members that you have personally registered`,
      icon: UsersIcon,
      dataType: 'members',
      formats: ['csv', 'excel', 'pdf'],
      estimatedSize: `${Math.max(0.1, myMembersCount * 0.015).toFixed(1)} MB`,
      category: 'member-data'
    },
    {
      id: 'analytics-overview',
      name: 'Analytics Overview',
      description: `Comprehensive analytics report with charts, trends, and statistical insights for ${adminStats?.total_members || 0} members`,
      icon: ChartBarIcon,
      dataType: 'analytics',
      formats: ['pdf', 'excel'],
      estimatedSize: `${Math.max(1.0, totalAnalyticsSize).toFixed(1)} MB`,
      category: 'analytics'
    },
    {
      id: 'analytics-monthly',
      name: 'Monthly Reports',
      description: `Month-by-month breakdown of ${adminStats?.recent_registrations || 0} registrations and member activities`,
      icon: CalendarIcon,
      dataType: 'analytics',
      formats: ['csv', 'excel', 'pdf'],
      estimatedSize: `${Math.max(0.5, (adminStats?.recent_registrations || 0) * 0.01).toFixed(1)} MB`,
      category: 'analytics'
    },
    {
      id: 'user-activity',
      name: 'User Activity Log',
      description: 'System user activity, login history, and administrative actions',
      icon: ClockIcon,
      dataType: 'users',
      formats: ['csv', 'excel'],
      estimatedSize: '1.8 MB',
      category: 'system'
    },
    {
      id: 'financial-summary',
      name: 'Financial Summary',
      description: 'Donation tracking, tithe records, and financial contribution analysis',
      icon: DocumentTextIcon,
      dataType: 'financial',
      formats: ['excel', 'pdf'],
      estimatedSize: '4.2 MB',
      category: 'system'
    }
  ];

  useEffect(() => {
    dispatch(fetchMembers({}));
    dispatch(fetchAdminStats());
  }, [dispatch]);

  const handleExportToggle = (exportId: string) => {
    setSelectedExports(prev => 
      prev.includes(exportId) 
        ? prev.filter(id => id !== exportId)
        : [...prev, exportId]
    );
  };

  const performRealExport = async (exportId: string) => {
    setExportStatus(prev => ({ ...prev, [exportId]: 'exporting' }));
    setExportProgress(prev => ({ ...prev, [exportId]: 0 }));

    try {
      let response;
      const option = exportOptions.find(opt => opt.id === exportId);
      
      // Update progress incrementally
      const updateProgress = (progress: number) => {
        setExportProgress(prev => ({ ...prev, [exportId]: progress }));
      };

      updateProgress(20);

      // Perform actual API calls based on export type
      switch (exportId) {
        case 'summary-report':
          updateProgress(40);
          // Analytics exports don't support CSV, use Excel instead
          const analyticsFormat = selectedFormat === 'csv' ? 'excel' : selectedFormat;
          response = await exportAPI.exportAnalytics(analyticsFormat as 'excel' | 'pdf', {
            type: 'summary',
            date_range: {
              start_date: dateRange.start,
              end_date: dateRange.end
            }
          });
          break;
          
        case 'demographics-report':
          updateProgress(40);
          const demographicsFormat = selectedFormat === 'csv' ? 'excel' : selectedFormat;
          response = await exportAPI.exportAnalytics(demographicsFormat as 'excel' | 'pdf', {
            type: 'demographics',
            date_range: {
              start_date: dateRange.start,
              end_date: dateRange.end
            }
          });
          break;
          
        case 'geographical-report':
          updateProgress(40);
          const geographicalFormat = selectedFormat === 'csv' ? 'excel' : selectedFormat;
          response = await exportAPI.exportAnalytics(geographicalFormat as 'excel' | 'pdf', {
            type: 'geographical',
            date_range: {
              start_date: dateRange.start,
              end_date: dateRange.end
            }
          });
          break;
          
        case 'members-all':
          updateProgress(40);
          response = await exportAPI.exportMembers(selectedFormat as 'csv' | 'excel' | 'pdf', {});
          break;
          
        case 'members-my':
          updateProgress(40);
          response = await exportAPI.exportMembers(selectedFormat as 'csv' | 'excel' | 'pdf', { 
            created_by: user?.id 
          });
          break;
          
        case 'analytics-overview':
          updateProgress(40);
          response = await exportAPI.exportAnalytics(selectedFormat as 'pdf' | 'excel', {
            type: 'overview',
            date_range: {
              start_date: dateRange.start,
              end_date: dateRange.end
            }
          });
          break;
          
        case 'analytics-monthly':
          updateProgress(40);
          const monthlyFormat = selectedFormat === 'csv' ? 'excel' : selectedFormat;
          response = await exportAPI.exportAnalytics(monthlyFormat as 'pdf' | 'excel', {
            type: 'monthly',
            date_range: {
              start_date: dateRange.start,
              end_date: dateRange.end
            }
          });
          break;
          
        case 'user-activity':
          updateProgress(40);
          response = await exportAPI.exportUserActivity(selectedFormat as 'csv' | 'excel', {
            date_range: {
              start_date: dateRange.start,
              end_date: dateRange.end
            }
          });
          break;
          
        case 'financial-summary':
          updateProgress(40);
          response = await exportAPI.exportFinancial(selectedFormat as 'excel' | 'pdf', {
            start_date: dateRange.start,
            end_date: dateRange.end
          });
          break;
          
        default:
          throw new Error('Unknown export type');
      }      updateProgress(80);

      // Create and download the file
      if (response && response.data) {
        const blob = new Blob([response.data], { 
          type: response.headers['content-type'] || 'application/octet-stream' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Get filename from response headers or generate one
        const getFileExtension = (format: string) => {
          switch (format) {
            case 'excel': return 'xlsx';
            case 'pdf': return 'pdf';
            case 'csv': return 'csv';
            default: return format;
          }
        };
        
        let filename = `${option?.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.${getFileExtension(selectedFormat)}`;
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
          if (filenameMatch) {
            filename = decodeURIComponent(filenameMatch[1] || filenameMatch[2]);
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      updateProgress(100);
      setExportStatus(prev => ({ ...prev, [exportId]: 'completed' }));
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus(prev => ({ ...prev, [exportId]: 'error' }));
      // Show error message to user
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const simulateExport = async (exportId: string) => {
    // Use real export instead of simulation
    await performRealExport(exportId);
  };

  const handleBulkExport = async () => {
    for (const exportId of selectedExports) {
      await simulateExport(exportId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'exporting':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <TableCellsIcon className="h-4 w-4" />;
      case 'excel':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'pdf':
        return <DocumentArrowDownIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const supportsFormat = (option: ExportOption, format: string) => {
    return option.formats.includes(format);
  };

  const renderExportOption = (option: ExportOption) => {
    const status = exportStatus[option.id] || 'idle';
    const progress = exportProgress[option.id] || 0;
    const isSelected = selectedExports.includes(option.id);
    const isSupported = supportsFormat(option, selectedFormat);

    return (
      <div key={option.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <option.icon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-gray-900">{option.name}</h3>
              <p className="text-sm text-gray-500">{option.estimatedSize}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(status)}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleExportToggle(option.id)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-4">{option.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {option.formats.map((format) => (
              <span
                key={format}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  format === selectedFormat && isSupported
                    ? 'bg-green-100 text-green-800'
                    : format === selectedFormat && !isSupported
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {getFormatIcon(format)}
                <span className="ml-1 uppercase">{format}</span>
              </span>
            ))}
          </div>

          <button
            onClick={() => simulateExport(option.id)}
            disabled={!isSupported}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'exporting' ? 'Exporting...' : 'Export Now'}
          </button>

          {!isSupported && (
            <p className="text-xs text-red-500 mt-2 text-center">
              Not available in {selectedFormat.toUpperCase()} format
            </p>
          )}
        </div>

        {status === 'exporting' && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Exporting...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (membersLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading export data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <DocumentArrowDownIcon className="h-10 w-10 text-green-500 mr-4" />
                Export Data
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Export church data in various formats for reporting and analysis
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Members</p>
              <p className="text-2xl font-bold text-green-600">{members.length}</p>
            </div>
          </div>
        </div>

        {/* Export Controls */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <div className="space-y-2">
                {(['csv', 'excel', 'pdf'] as const).map((format) => (
                  <label key={format} className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value={format}
                      checked={selectedFormat === format}
                      onChange={(e) => setSelectedFormat(e.target.value as any)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-2 flex items-center">
                      {getFormatIcon(format)}
                      <span className="ml-1 capitalize">{format}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col justify-end">
              <button
                onClick={handleBulkExport}
                disabled={selectedExports.length === 0}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export Selected ({selectedExports.length})
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Select data types below to export
              </p>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-8">
          {/* Reports Category */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
              Summary Reports
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exportOptions.filter(option => option.category === 'reports').map((option) => renderExportOption(option))}
            </div>
          </div>

          {/* Member Data Category */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UsersIcon className="h-5 w-5 text-green-500 mr-2" />
              Member Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exportOptions.filter(option => option.category === 'member-data').map((option) => renderExportOption(option))}
            </div>
          </div>

          {/* Analytics Category */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 text-purple-500 mr-2" />
              Analytics & Trends
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exportOptions.filter(option => option.category === 'analytics').map((option) => renderExportOption(option))}
            </div>
          </div>

          {/* System Category */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 text-orange-500 mr-2" />
              System & Activity Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exportOptions.filter(option => option.category === 'system').map((option) => renderExportOption(option))}
            </div>
          </div>
        </div>

        {/* Recent Exports */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Exports</h2>
          <div className="space-y-3">
            {Object.entries(exportStatus)
              .filter(([_, status]) => status === 'completed')
              .slice(0, 5)
              .map(([exportId, status]) => {
                const option = exportOptions.find(opt => opt.id === exportId);
                return (
                  <div key={exportId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{option?.name}</p>
                        <p className="text-sm text-gray-500">
                          Exported just now as {selectedFormat.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                      Download Again
                    </button>
                  </div>
                );
              })}
            {Object.keys(exportStatus).filter(key => exportStatus[key] === 'completed').length === 0 && (
              <p className="text-gray-500 text-center py-8">No recent exports</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportData;