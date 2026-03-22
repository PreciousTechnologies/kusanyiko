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
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-green-100 shadow-sm h-16">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 h-full gap-2">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl hover:bg-green-50 transition-all duration-300 border border-transparent hover:border-green-200 flex-shrink-0"
            title="Toggle menu"
          >
            {isSidebarOpen ? (
              <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            ) : (
              <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            )}
          </button>

          {/* Brand/Logo with Mission Statement */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-green-700 truncate">We Bring The 🌍To Jesus</h1>
              <p className="text-xs text-gray-600 font-medium truncate line-clamp-1">{branding.app_subtitle}</p>
            </div>
          </div>

          {/* User Role Badge - Hidden on mobile */}
          {user && (
            <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-2 sm:px-3 py-1 rounded-full border border-green-200 shadow-sm flex-shrink-0">
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
              <span className="text-xs sm:text-sm font-semibold text-green-700 capitalize">{user.role}</span>
            </div>
          )}

          {/* Date & Time - Hidden on smaller screens */}
          <div className="hidden lg:block text-xs lg:text-sm text-gray-600 font-medium flex-shrink-0">
            {getCurrentDateTime()}
          </div>
        </div>

        {/* Right Section - Profile */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1 sm:gap-3 p-2 rounded-xl hover:bg-green-50 transition-all duration-300 border border-transparent hover:border-green-200"
              title="User menu"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white border-2 border-green-500 rounded-full flex items-center justify-center text-green-600 text-xs sm:text-sm font-bold shadow-lg ring-2 ring-green-100 flex-shrink-0">
                {getUserInitials()}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                  {user?.first_name && user?.last_name 
                    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`
                    : user?.username?.substring(0, 2)
                  }
                </p>
                <p className="text-xs text-green-600 capitalize font-medium">{user?.role}</p>
              </div>
              <ChevronDownIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
            </button>

            {/* Enhanced Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-52 sm:w-56 bg-white/95 backdrop-blur-md border border-green-100 shadow-xl rounded-2xl z-50 max-h-screen sm:max-h-auto overflow-y-auto sm:overflow-y-visible">
                <div className="p-3 sm:p-4 border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 sm:w-10 h-9 sm:h-10 bg-white border-2 border-green-500 rounded-full flex items-center justify-center text-green-600 font-bold shadow-lg ring-2 ring-green-100 flex-shrink-0 text-xs sm:text-sm">
                      {getUserInitials()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {user?.first_name && user?.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user?.username
                        }
                      </p>
                      <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                      <p className="text-xs text-green-600 capitalize font-semibold">{user?.role}</p>
                    </div>
                  </div>
                </div>
                
                <div className="py-2">
                  <button 
                    onClick={() => {
                      const profilePath = user?.role === 'admin' ? '/admin/profile-settings' : '/registrant/profile-settings';
                      navigate(profilePath);
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 font-medium"
                  >
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 font-medium">
                    Help & Support
                  </button>
                  <hr className="my-2 border-green-100" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-all duration-200 font-medium rounded-b-2xl"
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