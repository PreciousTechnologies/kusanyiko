import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchRegistrantStats } from '../../store/slices/statsSlice';
import { fetchMembers } from '../../store/slices/membersSlice';
import {
  ChartBarIcon,
  UsersIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ChartPieIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const MyStatistics: React.FC = () => {
  const dispatch = useAppDispatch();
  const { registrantStats, loading, error } = useAppSelector((state) => state.stats);
  const { members } = useAppSelector((state) => state.members);
  const { user } = useAppSelector((state) => state.auth);
  const [timeFilter, setTimeFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scopeLabel = user?.role === 'apostle' ? 'Kanda' : 'My';

  useEffect(() => {
    dispatch(fetchRegistrantStats());
    dispatch(fetchMembers({}));
    setLastUpdated(new Date());
  }, [dispatch]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchRegistrantStats());
      dispatch(fetchMembers({}));
      setLastUpdated(new Date());
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [dispatch]);

  // Calculate real-time statistics
  const calculateWeeklyRegistrations = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return members.filter(member => {
      if (!member.created_at) return false;
      const createdDate = new Date(member.created_at);
      return createdDate >= oneWeekAgo;
    }).length;
  };

  const calculateMonthlyRegistrations = () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return members.filter(member => {
      if (!member.created_at) return false;
      const createdDate = new Date(member.created_at);
      return createdDate >= oneMonthAgo;
    }).length;
  };

  const calculateRegionsCovered = () => {
    const uniqueRegions = new Set(
      members
        .filter(member => member.region)
        .map(member => member.region)
    );
    return uniqueRegions.size;
  };

  const calculateSuccessRate = () => {
    if (members.length === 0) return '0%';
    const successfulRegistrations = members.filter(member => !member.is_deleted).length;
    return `${Math.round((successfulRegistrations / members.length) * 100)}%`;
  };

  const getRecentActivity = () => {
    return members
      .filter(member => member.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 4)
      .map(member => ({
        action: `Registered ${member.first_name} ${member.last_name}`,
        region: member.region || 'Unknown',
        time: formatTimeAgo(member.created_at!),
        status: member.is_deleted ? 'error' : 'success',
      }));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Less than an hour ago';
    }
  };

  const getBestPerformanceDay = () => {
    const dayCount: { [key: string]: number } = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    members.forEach(member => {
      if (member.created_at) {
        const day = new Date(member.created_at).getDay();
        const dayName = dayNames[day];
        dayCount[dayName] = (dayCount[dayName] || 0) + 1;
      }
    });

    if (Object.keys(dayCount).length === 0) return 'No data available';

    const bestDay = Object.entries(dayCount).reduce((a, b) => a[1] > b[1] ? a : b);
    return `${bestDay[0]} (${bestDay[1]} registrations)`;
  };

  const getTopRegion = () => {
    const regionCount: { [key: string]: number } = {};
    
    members.forEach(member => {
      if (member.region) {
        regionCount[member.region] = (regionCount[member.region] || 0) + 1;
      }
    });

    if (Object.keys(regionCount).length === 0) return 'No data available';

    const totalMembers = members.length;
    const topRegion = Object.entries(regionCount).reduce((a, b) => a[1] > b[1] ? a : b);
    const percentage = Math.round((topRegion[1] / totalMembers) * 100);
    return `${topRegion[0]} (${percentage}%)`;
  };

  const getSuccessRate = () => {
    if (members.length === 0) return 0;
    const successfulRegistrations = members.filter(member => !member.is_deleted).length;
    return Math.round((successfulRegistrations / members.length) * 100);
  };

  const getWeeklyData = () => {
    const weeklyData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      
      const registrations = members.filter(member => {
        if (!member.created_at) return false;
        const memberDate = new Date(member.created_at);
        return memberDate.toDateString() === date.toDateString();
      }).length;
      
      weeklyData.push({ day: dayName, registrations });
    }
    
    return weeklyData;
  };

  // Chart data preparation functions
  const getGenderChartData = () => {
    const genderCount: { [key: string]: number } = {};
    members.forEach(member => {
      if (member.gender) {
        genderCount[member.gender] = (genderCount[member.gender] || 0) + 1;
      }
    });

    return Object.entries(genderCount).map(([gender, count]) => ({
      name: gender === 'male' ? 'Male' : 'Female',
      value: count,
      fill: gender === 'male' ? '#3B82F6' : '#EC4899'
    }));
  };

  const getRegionChartData = () => {
    const regionCount: { [key: string]: number } = {};
    members.forEach(member => {
      if (member.region) {
        regionCount[member.region] = (regionCount[member.region] || 0) + 1;
      }
    });

    return Object.entries(regionCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([region, count]) => ({
        region,
        members: count
      }));
  };

  const getWeeklyChartData = () => {
    return getWeeklyData();
  };

  const getPerformanceData = () => {
    const dayCount: { [key: string]: number } = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    members.forEach(member => {
      if (member.created_at) {
        const day = new Date(member.created_at).getDay();
        const dayName = dayNames[day];
        dayCount[dayName] = (dayCount[dayName] || 0) + 1;
      }
    });

    return Object.entries(dayCount).map(([day, count]) => ({
      day: day.substring(0, 3), // Short day name
      registrations: count
    }));
  };

  // Real-time statistics data
  const statisticsData = [
    {
      title: `${scopeLabel} Registrations`,
      value: registrantStats?.total_registered || 0,
      change: '+12%',
      trend: 'up',
      icon: UsersIcon,
      color: 'green',
      description: user?.role === 'apostle' ? 'Members in your kanda' : 'Members you have registered',
    },
    {
      title: 'This Week',
      value: calculateWeeklyRegistrations(),
      change: `+${Math.round(((calculateWeeklyRegistrations() / (registrantStats?.total_registered || 1)) * 100))}%`,
      trend: 'up',
      icon: CalendarDaysIcon,
      color: 'blue',
      description: 'Registrations this week',
    },
    {
      title: 'Regions Covered',
      value: calculateRegionsCovered(),
      change: 'Active',
      trend: 'neutral',
      icon: MapPinIcon,
      color: 'purple',
      description: 'Different regions',
    },
    {
      title: 'Success Rate',
      value: calculateSuccessRate(),
      change: '+2%',
      trend: 'up',
      icon: CheckCircleIcon,
      color: 'emerald',
      description: 'Successful registrations',
    },
  ];

  const recentActivity = getRecentActivity();
  const weeklyData = getWeeklyData();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchRegistrantStats()),
        dispatch(fetchMembers({}))
      ]);
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdated = () => {
    return lastUpdated.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
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
          <p className="mt-4 text-gray-600">Loading your statistics...</p>
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
        {/* Header Section with Mobile-Optimized Layout */}
        <div className="mb-8">
          <div className="stats-header flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
                <ChartBarIcon className="h-8 w-8 text-green-500 mr-3" />
                My Statistics
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Real-time
                </span>
              </h1>
              <p className="text-gray-600 mt-2">
                Track your registration performance and member statistics • Last updated: {formatLastUpdated()}
              </p>
            </div>
            
            {/* Controls with Mobile-First Design */}
            <div className="stats-controls flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`refresh-button inline-flex items-center px-4 py-2 border border-green-300 rounded-xl text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ${
                  isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
              >
                <ArrowUpIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>

              {/* Time Filter */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="time-filter bg-white border border-green-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statisticsData.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:scale-105 relative"
            >
              {/* Live indicator */}
              <div className="absolute top-3 right-3">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">LIVE</span>
                </div>
              </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Performance</h3>
              <ChartPieIcon className="h-5 w-5 text-green-500" />
            </div>
            
            <div className="space-y-4">
              {weeklyData.map((day, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-12 text-sm font-medium text-gray-600">{day.day}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(day.registrations / 7) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-8 text-sm font-semibold text-gray-900">{day.registrations}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <ClockIcon className="h-5 w-5 text-green-500" />
            </div>
            
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-green-50 transition-colors duration-200">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">Region: {activity.region}</p>
                  </div>
                  <div className="text-xs text-gray-400">{activity.time}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-300">
                View All Activity
              </button>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ChartPieIcon className="h-5 w-5 text-green-500 mr-2" />
              Performance Insights
            </h3>
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">LIVE</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <ArrowUpIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Best Day</p>
                  <p className="text-xs text-gray-600">{getBestPerformanceDay()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPinIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Top Region</p>
                  <p className="text-xs text-gray-600">{getTopRegion()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Success Rate</p>
                  <p className="text-xs text-gray-600">{getSuccessRate()}% completion</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyStatistics;