import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchAdminStats } from '../../store/slices/statsSlice';
import { fetchMembers } from '../../store/slices/membersSlice';
import {
  UsersIcon,
  UserPlusIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  ClockIcon,
  TrophyIcon,
  SparklesIcon,
  CloudArrowDownIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { adminStats, loading } = useAppSelector((state) => state.stats);
  const { members } = useAppSelector((state) => state.members);
  const { user } = useAppSelector((state) => state.auth);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchMembers({}));
    setLastUpdated(new Date());
  }, [dispatch]);

  // Auto-refresh data every 30 seconds if enabled
  useEffect(() => {
    if (isAutoRefresh && !refreshInterval) {
      const interval = setInterval(() => {
        dispatch(fetchAdminStats());
        dispatch(fetchMembers({}));
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
    dispatch(fetchAdminStats());
    dispatch(fetchMembers({}));
    setLastUpdated(new Date());
  };

  // Calculate real-time statistics
  const calculateTodayRegistrations = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return members.filter(member => {
      if (!member.created_at) return false;
      const createdDate = new Date(member.created_at);
      createdDate.setHours(0, 0, 0, 0);
      return createdDate.getTime() === today.getTime();
    }).length;
  };

  const calculateWeeklyGrowth = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyCount = members.filter(member => {
      if (!member.created_at) return false;
      const createdDate = new Date(member.created_at);
      return createdDate >= oneWeekAgo;
    }).length;

    // Calculate percentage growth (assuming previous week had similar pattern)
    const estimatedPreviousWeek = Math.max(1, (adminStats?.total_members || 0) - weeklyCount);
    return Math.round((weeklyCount / estimatedPreviousWeek) * 100);
  };

  const refreshData = () => {
    handleManualRefresh();
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  const statCards = [
    {
      title: 'Total Members',
      value: adminStats?.total_members || 0,
      change: `+${calculateWeeklyGrowth()}% from last week`,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'New Today',
      value: calculateTodayRegistrations(),
      change: 'Registration goal: 50/day',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Countries',
      value: adminStats?.country_stats?.length || 0,
      change: 'Multi-national presence',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Regions',
      value: adminStats?.region_stats?.length || 0,
      change: 'Geographic coverage',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  const quickActions = [
    {
      title: 'Add New Member',
      description: 'Register a new church member',
      href: '/admin/members/add',
      color: 'from-green-500 to-emerald-600',
      hoverColor: 'hover:from-green-600 hover:to-emerald-700',
    },
    {
      title: 'My Members',
      description: 'View members I created',
      href: '/admin/my-members',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      title: 'Export Data',
      description: 'Download member database',
      href: '/admin/export',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
    },
    {
      title: 'View Analytics',
      description: 'Detailed statistics and reports',
      href: '/admin/stats',
      color: 'from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700',
    },
    {
      title: 'User Management',
      description: 'Manage system users',
      href: '/admin/users',
      color: 'from-indigo-500 to-indigo-600',
      hoverColor: 'hover:from-indigo-600 hover:to-indigo-700',
    },
    {
      title: 'All Members',
      description: 'View all registered members',
      href: '/admin/members',
      color: 'from-teal-500 to-teal-600',
      hoverColor: 'hover:from-teal-600 hover:to-teal-700',
    },
  ];

  const getRecentRegistrations = () => {
    const filtered = members
      .filter(member => member.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 3);

    return filtered.map(member => ({
      name: `${member.first_name} ${member.last_name}`,
      region: member.region || 'Unknown',
      registrant: member.registered_by ? `User ${member.registered_by}` : 'System',
      time: formatTimeAgo(member.created_at!),
      profilePicture: typeof member.picture === 'string' ? member.picture : member.picture ? URL.createObjectURL(member.picture) : null,
      initials: `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`,
    }));
  };

  const getMyMembers = () => {
    const filteredMembers = members.filter(member => {
      // Check if the admin created this member
      // Handle different formats of created_by field
      const memberCreatedBy = member.created_by;
      const currentUserId = user?.id;
      const currentUsername = user?.username;

      // Check against user ID (number)
      if (typeof memberCreatedBy === 'number' && memberCreatedBy === currentUserId) {
        return true;
      }

      // Check against username (string)
      if (typeof memberCreatedBy === 'string' && memberCreatedBy === currentUsername) {
        return true;
      }

      // Additional check for registered_by field if created_by is not available
      if (!memberCreatedBy && member.registered_by === currentUserId) {
        return true;
      }

      return false;
    });

    return filteredMembers
      .filter(member => member.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 3)
      .map(member => ({
        id: member.id,
        name: `${member.first_name} ${member.last_name}`,
        initials: `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`,
        region: member.region || 'Unknown',
        time: formatTimeAgo(member.created_at!),
        profilePicture: typeof member.picture === 'string' ? member.picture : member.picture ? URL.createObjectURL(member.picture) : null,
        saved: member.saved,
      }));
  };

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

  const getMyMembersTotal = () => {
    const filteredMembers = members.filter(member => {
      const memberCreatedBy = member.created_by;
      const currentUserId = user?.id;
      const currentUsername = user?.username;

      // Check against user ID (number)
      if (typeof memberCreatedBy === 'number' && memberCreatedBy === currentUserId) {
        return true;
      }

      // Check against username (string)
      if (typeof memberCreatedBy === 'string' && memberCreatedBy === currentUsername) {
        return true;
      }

      // Additional check for registered_by field if created_by is not available
      if (!memberCreatedBy && member.registered_by === currentUserId) {
        return true;
      }

      return false;
    });

    return filteredMembers.length;
  };

  const recentRegistrations = getRecentRegistrations();
  const myMembers = getMyMembers();
  const myMembersTotal = getMyMembersTotal();

  // Chart data calculations
  const getDailyRegistrationsChart = () => {
    // Get the last 7 days (including today)
    const last7Days: Date[] = [];
    const dailyCounts = Array(7).fill(0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // Set to start of day for consistent comparison
      date.setHours(0, 0, 0, 0);
      last7Days.push(date);
    }

    members.forEach(member => {
      if (member.created_at) {
        try {
          const memberDate = new Date(member.created_at);
          if (isNaN(memberDate.getTime())) {
            return; // Skip invalid dates
          }

          // Set member date to start of day for comparison
          memberDate.setHours(0, 0, 0, 0);

          // Find which day this member was created
          const dayIndex = last7Days.findIndex(day =>
            day.getTime() === memberDate.getTime()
          );

          if (dayIndex !== -1) {
            dailyCounts[dayIndex]++;
          }
        } catch (error) {
          // Skip members with invalid date formats
        }
      }
    });

    return {
      labels: last7Days.map(date => {
        const options: Intl.DateTimeFormatOptions = {
          month: 'short',
          day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
      }),
      datasets: [{
        label: 'Daily Registrations',
        data: dailyCounts,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        tension: 0.4,
        fill: true,
      }],
    };
  };

  const getGenderDistributionChart = () => {
    const genderCount = { Male: 0, Female: 0, Other: 0 };
    members.forEach(member => {
      let gender = member.gender;
      if (!gender) {
        genderCount.Other++;
      } else {
        // Normalize gender values - handle different formats
        const genderStr = gender.toString().toLowerCase().trim();
        if (genderStr === 'male' || genderStr === 'm' || genderStr === 'man' || genderStr === 'boy') {
          genderCount.Male++;
        } else if (genderStr === 'female' || genderStr === 'f' || genderStr === 'woman' || genderStr === 'girl') {
          genderCount.Female++;
        } else {
          genderCount.Other++;
        }
      }
    });

    return {
      labels: Object.keys(genderCount),
      datasets: [{
        label: 'Members by Gender',
        data: Object.values(genderCount),
        backgroundColor: [
          '#3B82F6', '#EC4899', '#F59E0B'
        ],
      }],
    };
  };

  const getTopRegionsChart = () => {
    const regionCount: { [key: string]: number } = {};
    members.forEach(member => {
      const region = member.region || 'Unknown';
      regionCount[region] = (regionCount[region] || 0) + 1;
    });

    const topRegions = Object.entries(regionCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      labels: topRegions.map(([region]) => region),
      datasets: [{
        label: 'Members',
        data: topRegions.map(([, count]) => count),
        backgroundColor: 'rgba(139, 92, 246, 0.6)',
      }],
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header with Enhanced Green Theme */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              Welcome back, {user?.first_name || user?.username}!
            </h1>
            <p className="text-gray-600 text-lg">
              EFATHA Leaders' Camp Dashboard • October 6-12, 2025
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-3 rounded-xl border border-green-200">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
            <span className="text-green-700 font-semibold text-sm">Camp Registration Active</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards with Enhanced Green Theme */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Live Statistics</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">LIVE</span>
              <span className="text-xs text-gray-500 ml-2">
                Updated: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 text-xs"
              >
                <ArrowPathIcon className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors duration-200 text-xs ${
                  isAutoRefresh
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isAutoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span>{isAutoRefresh ? 'Auto ON' : 'Auto OFF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={stat.title} className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 group ${stat.bgColor}/5 hover:${stat.bgColor}/10`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold uppercase tracking-wide mb-1 ${stat.textColor}`}>{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  {stat.title === 'New Today' && <ClockIcon className="w-3 h-3 mr-1" />}
                  {stat.title === 'Total Members' && <TrophyIcon className="w-3 h-3 mr-1" />}
                  {stat.title === 'Countries' && <SparklesIcon className="w-3 h-3 mr-1" />}
                  {stat.title === 'Regions' && <BuildingOfficeIcon className="w-3 h-3 mr-1" />}
                  {stat.change}
                </p>
              </div>
              <div className={`p-4 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                {stat.title === 'Total Members' && <UsersIcon className="h-6 w-6 text-white" />}
                {stat.title === 'New Today' && <UserPlusIcon className="h-6 w-6 text-white" />}
                {stat.title === 'Countries' && <GlobeAltIcon className="h-6 w-6 text-white" />}
                {stat.title === 'Regions' && <MapPinIcon className="h-6 w-6 text-white" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions with Enhanced Green Theme */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 w-1 h-8 rounded-full mr-3"></span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.href}
                  className="group p-5 border-2 border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} ${action.hoverColor} group-hover:scale-110 transition-all duration-200 shadow-lg`}>
                      {action.title === 'Add New Member' && <UserPlusIcon className="h-6 w-6 text-white" />}
                      {action.title === 'My Members' && <UsersIcon className="h-6 w-6 text-white" />}
                      {action.title === 'Export Data' && <CloudArrowDownIcon className="h-6 w-6 text-white" />}
                      {action.title === 'View Analytics' && <ChartBarIcon className="h-6 w-6 text-white" />}
                      {action.title === 'User Management' && <UserGroupIcon className="h-6 w-6 text-white" />}
                      {action.title === 'All Members' && <DocumentTextIcon className="h-6 w-6 text-white" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200 text-lg">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 mt-1 text-sm">{action.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity with Enhanced Green Theme */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 w-1 h-8 rounded-full mr-3"></span>
              Recent Registrations
            </h2>
            <div className="space-y-4">
              {recentRegistrations.map((registration, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-green-50 hover:border-green-200 transition-all duration-200">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-lg hover:ring-2 hover:ring-green-300 transition-all duration-200 hover:scale-105">
                    {registration.profilePicture ? (
                      <img
                        src={registration.profilePicture}
                        alt={registration.name}
                        className="w-full h-full object-cover bg-white border-2 border-green-200 rounded-full ring-4 ring-green-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`absolute inset-0 bg-white border-2 border-green-200 rounded-full flex items-center justify-center text-green-600 font-bold text-sm shadow-lg ring-4 ring-green-100 ${registration.profilePicture ? 'hidden' : 'flex'}`}
                    >
                      {registration.initials}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{registration.name}</p>
                    <p className="text-sm text-gray-600">{registration.region}</p>
                    <p className="text-xs text-gray-500">by {registration.registrant}</p>
                  </div>
                  <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">{registration.time}</div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link
                to="/admin/members"
                className="block w-full text-center py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                View All Members →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* My Members Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="bg-gradient-to-r from-green-500 to-emerald-500 w-1 h-8 rounded-full mr-3"></span>
          My Members
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({myMembersTotal} total • {myMembers.length} recent)
          </span>
        </h2>

        {myMembers.length > 0 ? (
          <div className="space-y-4">
            {myMembers.map((member, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-green-50 hover:border-green-200 transition-all duration-200">
                <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-lg hover:ring-2 hover:ring-green-300 transition-all duration-200 hover:scale-105">
                  {member.profilePicture ? (
                    <img
                      src={member.profilePicture}
                      alt={member.name}
                      className="w-full h-full object-cover bg-white border-2 border-green-200 rounded-full ring-4 ring-green-100"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`absolute inset-0 bg-white border-2 border-green-200 rounded-full flex items-center justify-center text-green-600 font-bold text-sm shadow-lg ring-4 ring-green-100 ${member.profilePicture ? 'hidden' : 'flex'}`}
                  >
                    {member.initials}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.region}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      member.saved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {member.saved ? 'Saved' : 'Not Saved'}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">{member.time}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-xl">
            <UsersIcon className="h-12 w-12 text-green-300 mx-auto mb-3" />
            <p className="text-lg font-medium">No members created yet</p>
            <p className="text-sm mt-1">Start adding members to see them here!</p>
            <Link
              to="/admin/members/add"
              className="inline-block mt-4 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
            >
              Add First Member
            </Link>
          </div>
        )}

        <div className="mt-6">
          <Link
            to="/admin/my-members"
            className="block w-full text-center py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:scale-105 shadow-lg"
          >
            View All My Members →
          </Link>
        </div>
      </div>

      {/* Geographic Distribution with Enhanced Green Theme */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="bg-gradient-to-r from-green-500 to-emerald-500 w-1 h-8 rounded-full mr-3"></span>
          Geographic Distribution
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {adminStats?.region_stats?.map((region: any) => (
            <div key={region.region} className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:border-green-200 hover:scale-105 transition-all duration-200 hover:shadow-md">
              <p className="font-bold text-2xl text-green-600">{region.count}</p>
              <p className="text-sm text-green-700 font-medium mt-1">{region.region}</p>
            </div>
          )) || (
            <div className="col-span-full text-center text-gray-500 py-8 bg-gray-50 rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
              Loading geographic data...
            </div>
          )}
        </div>
      </div>

      {/* --- GRAPHS SECTION --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 w-1 h-6 rounded-full mr-3"></span>
            Daily Registrations
          </h3>
          <Line data={getDailyRegistrationsChart()} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 w-1 h-6 rounded-full mr-3"></span>
            Gender Distribution
          </h3>
          <Pie data={getGenderDistributionChart()} options={{ responsive: true }} />
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 w-1 h-6 rounded-full mr-3"></span>
            Top Regions
          </h3>
          <Bar data={getTopRegionsChart()} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;