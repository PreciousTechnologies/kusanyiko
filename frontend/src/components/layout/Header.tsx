import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import { useBranding } from '../../context/BrandingContext';

interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isSidebarOpen }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { branding } = useBranding();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username[0].toUpperCase();
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-green-100 shadow-sm">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl hover:bg-green-50 transition-all duration-300 hover:scale-110 border border-transparent hover:border-green-200"
          >
            {isSidebarOpen ? (
              <XMarkIcon className="h-6 w-6 text-green-600" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-green-600" />
            )}
          </button>

          {/* Brand/Logo with Mission Statement */}
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-green-700">We Bring The 🌍To Jesus</h1>
              <p className="text-xs text-gray-600 font-medium">{branding.app_subtitle}</p>
            </div>
          </div>

          {/* User Role Badge */}
          {user && (
            <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1 rounded-full border border-green-200 shadow-sm">
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-sm font-semibold text-green-700 capitalize">{user.role}</span>
            </div>
          )}

          {/* Date & Time */}
          <div className="hidden lg:block text-sm text-gray-600 font-medium">
            {getCurrentDateTime()}
          </div>
        </div>

        {/* Right Section - Profile Only */}
        <div className="flex items-center space-x-4">
          {/* User Role Badge */}
          {user && (
            <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1 rounded-full border border-green-200 shadow-sm">
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-sm font-semibold text-green-700 capitalize">{user.role}</span>
            </div>
          )}

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-green-50 transition-all duration-300 border border-transparent hover:border-green-200"
            >
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white border-2 border-green-500 rounded-full flex items-center justify-center text-green-600 text-sm font-bold shadow-lg ring-2 ring-green-100">
                  {getUserInitials()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.first_name && user?.last_name 
                      ? `${user.first_name} ${user.last_name}`
                      : user?.username
                    }
                  </p>
                  <p className="text-xs text-green-600 capitalize font-medium">{user?.role}</p>
                </div>
              </div>
              <ChevronDownIcon className="h-4 w-4 text-green-500" />
            </button>

            {/* Enhanced Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-md border border-green-100 shadow-xl rounded-2xl z-50">
                <div className="p-4 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white border-2 border-green-500 rounded-full flex items-center justify-center text-green-600 font-bold shadow-lg ring-2 ring-green-100">
                      {getUserInitials()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.first_name && user?.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user?.username
                        }
                      </p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                      <p className="text-xs text-green-600 capitalize font-semibold">{user?.role}</p>
                    </div>
                  </div>
                </div>
                
                <div className="py-2">
                  <button 
                    onClick={() => {
                      const profilePath = user?.role === 'admin' ? '/admin/profile-settings' : '/registrant/profile-settings';
                      navigate(profilePath);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 font-medium"
                  >
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 font-medium">
                    Help & Support
                  </button>
                  <hr className="my-2 border-green-100" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 font-medium rounded-b-2xl"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;