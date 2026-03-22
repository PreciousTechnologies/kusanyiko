import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  UserPlusIcon,
  UserIcon,
  XMarkIcon,
  UserGroupIcon,
  ChartPieIcon,
  CloudArrowDownIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector } from '../../hooks/redux';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const adminNavItems = [
    {
      section: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon, description: 'Main overview & statistics' },
        { name: 'Statistics', href: '/admin/stats', icon: ChartPieIcon, description: 'Advanced member analytics' },
      ],
    },
    {
      section: 'LEADERS CAMP REGISTRATION',
      items: [
        { name: 'All Members', href: '/admin/members', icon: UsersIcon, description: 'View all registrations' },
        { name: 'My Members', href: '/admin/my-members', icon: UserGroupIcon, description: 'Members I registered' },
        { name: 'Add Member', href: '/admin/members/add', icon: UserPlusIcon, description: 'Register new member' },
        { name: 'Export Data', href: '/admin/export', icon: CloudArrowDownIcon, description: 'Download member data' },
      ],
    },
    {
      section: 'ADMINISTRATION',
      items: [
        { name: 'User Management', href: '/admin/users', icon: ShieldCheckIcon, description: 'Manage registrants & permissions' },
      ],
    },
  ];

  const registrantNavItems = [
    {
      section: 'OVERVIEW',
      items: [
        { name: 'Dashboard', href: '/registrant/dashboard', icon: HomeIcon, description: 'Your overview & progress' },
        { name: 'My Statistics', href: '/registrant/stats', icon: ChartPieIcon, description: 'Your registration analytics' },
      ],
    },
    {
      section: 'LEADERS CAMP REGISTRATION',
      items: [
        { name: 'My Members', href: '/registrant/members', icon: UserGroupIcon, description: 'Members you registered' },
        { name: 'Add Member', href: '/registrant/members/add', icon: UserPlusIcon, description: 'Register new member' },
      ],
    },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : registrantNavItems;

  const isActiveLink = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username[0].toUpperCase();
  };

  return (
    <>
      {/* White Background Sidebar with Green Themes */}
      <div className={`
        fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 
        bg-white
        border-r border-green-200 shadow-lg
        transform transition-all duration-500 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        flex flex-col
      `}>
        {/* Mobile Header - White Background with Green Elements */}
        <div className="flex items-center justify-between p-4 border-b border-green-200 lg:hidden bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white border-2 border-green-500 rounded-full flex items-center justify-center text-green-600 text-sm font-bold shadow-lg ring-2 ring-green-100">
              {getUserInitials()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}`
                  : user?.username
                }
              </p>
              <p className="text-xs text-green-600 capitalize font-medium">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-green-50 transition-all duration-200 hover:scale-110"
          >
            <XMarkIcon className="h-6 w-6 text-green-600" />
          </button>
        </div>

        {/* Navigation with White Background and Green Themes */}
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto scrollbar-custom">
          {navItems.map((section) => (
            <div key={section.section}>
              <h3 className="px-3 text-xs font-bold text-green-700 uppercase tracking-wider mb-4 flex items-center">
                <span className="bg-gradient-to-r from-green-500 to-emerald-500 w-2 h-2 rounded-full mr-2 shadow-sm"></span>
                {section.section}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const isActive = isActiveLink(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => window.innerWidth < 1024 && onClose()}
                      className={`
                        group flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300
                        transform hover:scale-105 relative overflow-hidden
                        ${isActive
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20'
                          : 'text-gray-700 hover:bg-green-50 hover:text-green-700 border border-transparent hover:border-green-200'
                        }
                      `}
                    >
                      {/* Active indicator line */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-300 rounded-r-full shadow-sm"></div>
                      )}
                      
                      <item.icon className={`
                        mr-3 h-5 w-5 transition-all duration-300
                        ${isActive ? 'text-white drop-shadow-sm' : 'text-green-600 group-hover:text-green-700'}
                      `} strokeWidth={2} />
                      <span className="flex-1 font-semibold">{item.name}</span>
                      
                      {/* Active pulse */}
                      {isActive && (
                        <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse shadow-lg" />
                      )}
                      
                      {/* Hover effect */}
                      {!isActive && (
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                          <div className="w-1 h-1 bg-green-600 rounded-full" />
                        </div>
                      )}
                      
                      {/* Tooltip for better UX */}
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.description}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer with White Background and Green Status */}
        <div className="px-4 py-6 border-t border-green-200 bg-white">
          <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="relative">
                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-sm font-semibold text-green-700">Camp Registration Active</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-green-600 font-medium">
                Oct 6-12, 2025 • Kibaha
              </div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-sm">
                LIVE
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
