import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchAdminStats } from '../../store/slices/statsSlice';
import { fetchMembers } from '../../store/slices/membersSlice';
import {
  ChartBarIcon,
  UsersIcon,
  CalendarDaysIcon,
  MapPinIcon,
  GlobeAltIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminStatistics: React.FC = () => {
  const dispatch = useAppDispatch();
  const { adminStats, loading, error } = useAppSelector((state) => state.stats);
  const { members } = useAppSelector((state) => state.members);
  const [timeFilter, setTimeFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial fetch
    dispatch(fetchAdminStats({}));
    dispatch(fetchMembers({}));
    setLastUpdated(new Date());
  }, [dispatch]);

  // Auto-refresh every 30 seconds (silent — no UI flashing)
  useEffect(() => {
    if (isAutoRefresh && !refreshInterval) {
      const interval = setInterval(() => {
        dispatch(fetchAdminStats({ silent: true }));
        dispatch(fetchMembers({ silent: true }));
        setLastUpdated(new Date());
      }, 30000); // 30 seconds
      setRefreshInterval(interval);
    } else if (!isAutoRefresh && refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    };
  }, [dispatch, isAutoRefresh, refreshInterval]);

  const handleManualRefresh = () => {
    dispatch(fetchAdminStats({}));
    dispatch(fetchMembers({}));
    setLastUpdated(new Date());
  };

  // Enhanced admin statistics data
  const statisticsData = [
    {
      title: 'Total Members',
      value: adminStats?.total_members || 0,
      change: '+18%',
      trend: 'up',
      icon: UsersIcon,
      color: 'green',
      description: 'All registered members',
    },
    {
      title: 'Countries',
      value: adminStats?.country_stats?.length || 0,
      change: '+2',
      trend: 'up',
      icon: GlobeAltIcon,
      color: 'blue',
      description: 'Countries with members',
    },
    {
      title: 'Regions',
      value: adminStats?.region_stats?.length || 0,
      change: '+5',
      trend: 'up',
      icon: MapPinIcon,
      color: 'purple',
      description: 'Active regions',
    },
    {
      title: 'This Month',
      value: 156,
      change: '+32%',
      trend: 'up',
      icon: CalendarDaysIcon,
      color: 'emerald',
      description: 'New registrations',
    },
  ];

  const topRegions = adminStats?.region_stats?.slice(0, 5) || [
    { region: 'Dar es Salaam', count: 45 },
    { region: 'Mwanza', count: 32 },
    { region: 'Arusha', count: 28 },
    { region: 'Dodoma', count: 24 },
    { region: 'Mbeya', count: 19 },
  ];

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getRecentRegistrations = () => {
    const filtered = members
      .filter(member => member.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 4);

    return filtered.map(member => ({
      name: `${member.first_name} ${member.last_name}`,
      region: member.region || 'Unknown',
      registrant: member.registered_by ? `User ${member.registered_by}` : 'System',
      time: formatTimeAgo(member.created_at!),
      status: 'approved', // Default status for now
    }));
  };

  const recentRegistrations = getRecentRegistrations();

  // Monthly registrations from real data
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const now = new Date();
  const year = now.getFullYear();
  const monthlyCounts = Array(12).fill(0);
  members.forEach(member => {
    if (member.created_at) {
      const date = new Date(member.created_at);
      if (date.getFullYear() === year) {
        monthlyCounts[date.getMonth()]++;
      }
    }
  });
  const monthlyGrowth = months.map((month, i) => ({ month, members: monthlyCounts[i] }));
  const monthlyBarData = {
    labels: months,
    datasets: [
      {
        label: 'Registrations',
        data: monthlyCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };
  const topRegionsPieData = {
    labels: topRegions.map(r => r.region),
    datasets: [
      {
        label: 'Members',
        data: topRegions.map(r => r.count),
        backgroundColor: [
          '#4ade80', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa'
        ],
      },
    ],
  };
  const totalMembersBarData = {
    labels: ['Total Members'],
    datasets: [
      {
        label: 'Total',
        data: [adminStats?.total_members || 0],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
      },
    ],
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">Error loading statistics: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ChartBarIcon className="h-8 w-8 text-green-500 mr-3" />
                Admin Statistics
                <div className="ml-4 flex items-center space-x-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">LIVE</span>
                  </div>
                  <span className="text-gray-500">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive overview of member registrations and analytics • Real-time data
              </p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isAutoRefresh 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isAutoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span>{isAutoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</span>
              </button>
            </div>
          </div>
          
          {/* Time Filter */}
          <div className="mt-4 flex items-center space-x-2">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-white border border-green-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statisticsData.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${
                  stat.color === 'green' ? 'from-green-500 to-emerald-600' :
                  stat.color === 'blue' ? 'from-blue-500 to-cyan-600' :
                  stat.color === 'purple' ? 'from-purple-500 to-violet-600' :
                  'from-emerald-500 to-green-600'
                } shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(stat.trend)}
                  <span className={`text-sm font-semibold ${
                    stat.trend === 'up' ? 'text-green-600' :
                    stat.trend === 'down' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Growth Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Growth</h3>
              <BuildingOfficeIcon className="h-5 w-5 text-green-500" />
            </div>
            
            <div className="space-y-4">
              {monthlyGrowth.map((month, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-12 text-sm font-medium text-gray-600">{month.month}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(month.members / 290) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-12 text-sm font-semibold text-gray-900">{month.members}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Regions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Regions</h3>
              <MapPinIcon className="h-5 w-5 text-green-500" />
            </div>
            
            <div className="space-y-4">
              {topRegions.map((region, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-green-50 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{region.region}</span>
                  </div>
                  <span className="font-semibold text-green-600">{region.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Registrations</h3>
            <ClockIcon className="h-5 w-5 text-green-500" />
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Member</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Region</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Registered By</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRegistrations.map((registration, index) => (
                  <tr key={index} className="border-b border-gray-50 hover:bg-green-50 transition-colors duration-200">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{registration.name}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{registration.region}</td>
                    <td className="py-3 px-4 text-gray-600">{registration.registrant}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">{registration.time}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(registration.status)}
                        <span className={`text-sm font-medium capitalize ${
                          registration.status === 'approved' ? 'text-green-600' :
                          registration.status === 'pending' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {registration.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 text-green-500 mr-2" />
            Analytics Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <ArrowUpIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Growth Rate</p>
                  <p className="text-xs text-gray-600">+25% this month</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Avg. Daily</p>
                  <p className="text-xs text-gray-600">8.5 registrations</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Approval Rate</p>
                  <p className="text-xs text-gray-600">96% success rate</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Avg. Process Time</p>
                  <p className="text-xs text-gray-600">2.3 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- GRAPHS SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-8">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Monthly Registrations</h3>
            <Bar data={monthlyBarData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Top Regions</h3>
            <Pie data={topRegionsPieData} options={{ responsive: true }} />
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Total Members</h3>
            <Bar data={totalMembersBarData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;