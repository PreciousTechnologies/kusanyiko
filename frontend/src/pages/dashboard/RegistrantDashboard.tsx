import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchRegistrantStats } from '../../store/slices/statsSlice';
import { fetchMembers } from '../../store/slices/membersSlice';
import {
  UsersIcon,
  UserPlusIcon,
  ChartBarIcon,
  CalendarIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
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

const RegistrantDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { registrantStats, loading } = useAppSelector((state) => state.stats);
  const { members } = useAppSelector((state) => state.members);
  const { user } = useAppSelector((state) => state.auth);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    dispatch(fetchRegistrantStats());
    dispatch(fetchMembers({}));
    setLastUpdated(new Date());
  }, [dispatch]);

  // Auto-refresh data every 3 minutes for dashboard
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchRegistrantStats());
      dispatch(fetchMembers({}));
      setLastUpdated(new Date());
    }, 3 * 60 * 1000); // 3 minutes

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

  const calculateRecentRegistrations = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return members.filter(member => {
      if (!member.created_at) return false;
      const createdDate = new Date(member.created_at);
      return createdDate >= thirtyDaysAgo;
    }).length;
  };

  const getRecentRegistrationsList = () => {
    return members
      .filter(member => member.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 3)
      .map(member => ({
        name: `${member.first_name} ${member.last_name}`,
        region: member.region || 'Unknown',
        time: formatTimeAgo(member.created_at!),
        profilePicture: typeof member.picture === 'string' ? member.picture : member.picture ? URL.createObjectURL(member.picture) : null,
        initials: `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`,
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

  const statCards = [
    {
      title: 'My Registrations',
      value: registrantStats?.total_registered || 0,
      icon: UsersIcon,
      color: 'primary',
      change: 'Total members registered',
      description: 'All members you have registered',
    },
    {
      title: 'This Week',
      value: calculateWeeklyRegistrations(),
      icon: UserPlusIcon,
      color: 'success',
      change: 'New registrations',
      description: 'Members registered this week',
    },
    {
      title: 'Recent Activity',
      value: calculateRecentRegistrations(),
      icon: ArrowTrendingUpIcon,
      color: 'secondary',
      change: 'Last 30 days',
      description: 'Recent registrations',
    },
    {
      title: 'Campaign Progress',
      value: Math.round(((registrantStats?.total_registered || 0) / 25) * 100),
      icon: SparklesIcon,
      color: 'primary',
      change: 'Progress to goal',
      description: 'Campaign completion',
    },
  ];

  const quickActions = [
    {
      title: 'Register New Member',
      description: 'Add a new church member to the database',
      href: '/registrant/members/add',
      icon: UserPlusIcon,
      color: 'primary',
    },
    {
      title: 'View My Members',
      description: 'See all members you have registered',
      href: '/registrant/members',
      icon: UsersIcon,
      color: 'secondary',
    },
    {
      title: 'My Statistics',
      description: 'View detailed registration statistics',
      href: '/registrant/stats',
      icon: ChartBarIcon,
      color: 'success',
    },
  ];

  const recentRegistrations = getRecentRegistrationsList();

  // Chart data calculations
  const getWeeklyChartData = () => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const weeklyCounts = Array(4).fill(0);
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    members.forEach(member => {
      if (member.created_at) {
        const date = new Date(member.created_at);
        if (date.getMonth() === month && date.getFullYear() === year) {
          const week = Math.floor(date.getDate() / 7);
          if (week < 4) weeklyCounts[week]++;
        }
      }
    });

    return {
      labels: weeks,
      datasets: [{
        label: 'Weekly Registrations',
        data: weeklyCounts,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      }],
    };
  };

  const getRegionChartData = () => {
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
        label: 'Members by Region',
        data: topRegions.map(([, count]) => count),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
        ],
      }],
    };
  };

  const getMonthlyProgressData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyCounts = Array(6).fill(0);
    const now = new Date();
    const year = now.getFullYear();

    members.forEach(member => {
      if (member.created_at) {
        const date = new Date(member.created_at);
        if (date.getFullYear() === year) {
          const month = date.getMonth();
          if (month < 6) monthlyCounts[month]++;
        }
      }
    });

    return {
      labels: months,
      datasets: [{
        label: 'Monthly Registrations',
        data: monthlyCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      }],
    };
  };

  const campaignInfo = {
    startDate: 'October 6, 2025',
    endDate: 'October 12, 2025',
    location: 'Precious Centre, Kibaha',
    daysRemaining: 7,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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
              Welcome, {user?.first_name || user?.username}!
            </h1>
            <p className="text-gray-600 text-lg">
              EFATHA Leaders' Camp • Your registration dashboard
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-3 rounded-xl border border-green-200">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
            <span className="text-green-700 font-semibold text-sm">Camp Registration Active</span>
          </div>
        </div>
      </div>

      {/* Leaders' Camp Information with Green Accent */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-100 p-6 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-green-800 mb-2">Leaders' Camp Information</h2>
            <p className="text-green-700 font-medium">{campaignInfo.startDate} - {campaignInfo.endDate}</p>
            <p className="text-green-600 text-sm mt-1 flex items-center">
              <span className="text-lg mr-1">📍</span> {campaignInfo.location}
            </p>
          </div>
          <div className="text-center bg-white rounded-xl p-4 shadow-md border border-green-200">
            <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{campaignInfo.daysRemaining}</div>
            <div className="text-sm text-green-700 font-medium">Days Remaining</div>
          </div>
        </div>
      </div>

      {/* Statistics Cards with Enhanced Green Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={stat.title} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 group relative">
            {/* Live indicator */}
            <div className="absolute top-3 right-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">LIVE</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
              </div>
              <div className="p-4 rounded-xl bg-white border-2 border-green-200 shadow-lg group-hover:scale-110 transition-transform duration-200 ring-4 ring-green-100">
                <stat.icon className="h-8 w-8 text-green-600 drop-shadow-sm" strokeWidth={2} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.href}
                  className="group p-5 border-2 border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50/50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-xl bg-white border-2 border-green-200 group-hover:scale-110 transition-transform duration-200 shadow-lg ring-4 ring-green-100">
                      <action.icon className="h-8 w-8 text-green-600 drop-shadow-sm" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors duration-200 text-lg">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 mt-1">{action.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Registration Goal Progress with Green Theme */}
            <div className="mt-8 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-bold text-green-800">Daily Registration Goal</span>
                <span className="text-lg font-semibold text-green-700 bg-white px-3 py-1 rounded-full">12 / 25</span>
              </div>
              <div className="w-full bg-green-100 rounded-full h-3 shadow-inner">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full shadow-lg" style={{width: '48%'}}></div>
              </div>
              <p className="text-sm text-green-700 mt-2 font-medium">13 more registrations to reach daily goal 🎯</p>
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
                  </div>
                  <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">{registration.time}</div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link
                to="/registrant/members"
                className="block w-full text-center py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                View All My Members →
              </Link>
            </div>
          </div>

          {/* Registration Tips with Enhanced Green Theme */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-200 p-6 mt-6 hover:shadow-xl transition-all duration-300">
            <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
              💡 Registration Tips
            </h3>
            <ul className="space-y-3 text-sm text-green-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span className="font-medium">Ensure all required fields are completed</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span className="font-medium">Double-check church registration numbers</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span className="font-medium">Take clear photos for member profiles</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span className="font-medium">Verify contact information accuracy</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* --- GRAPHS SECTION --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 w-1 h-6 rounded-full mr-3"></span>
            Weekly Registrations
          </h3>
          <Line data={getWeeklyChartData()} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 w-1 h-6 rounded-full mr-3"></span>
            Members by Region
          </h3>
          <Pie data={getRegionChartData()} options={{ responsive: true }} />
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 w-1 h-6 rounded-full mr-3"></span>
            Monthly Progress
          </h3>
          <Bar data={getMonthlyProgressData()} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </div>
    </div>
  );
};

export default RegistrantDashboard;