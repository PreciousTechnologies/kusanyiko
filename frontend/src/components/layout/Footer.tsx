import React from 'react';
import { Link } from 'react-router-dom';
import { useBranding } from '../../context/BrandingContext';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { branding } = useBranding();

  return (
    <footer className="bg-white/95 backdrop-blur-md border-t border-green-100 mt-8 shadow-sm">
      <div className="px-6 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          {/* Left Section - Enhanced Copyright */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/25">
              <span className="text-white font-bold text-sm">{(branding.app_name?.[0] || 'K').toUpperCase()}</span>
            </div>
            <div className="text-sm text-gray-700 font-medium">
              © {currentYear} {branding.app_name}. All rights reserved.
            </div>
          </div>

          {/* Center Section - Enhanced Links */}
          <div className="flex items-center space-x-6 text-sm">
            <Link 
              to="/privacy" 
              className="text-gray-600 hover:text-green-600 transition-all duration-300 font-medium hover:scale-105 px-2 py-1 rounded-lg hover:bg-green-50"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms" 
              className="text-gray-600 hover:text-green-600 transition-all duration-300 font-medium hover:scale-105 px-2 py-1 rounded-lg hover:bg-green-50"
            >
              Terms of Service
            </Link>
            <Link 
              to="/support" 
              className="text-gray-600 hover:text-green-600 transition-all duration-300 font-medium hover:scale-105 px-2 py-1 rounded-lg hover:bg-green-50"
            >
              Support
            </Link>
          </div>

          {/* Right Section - Enhanced System Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1 rounded-full border border-green-200">
              <div className="relative">
                <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-xs text-green-700 font-semibold">System Online</span>
            </div>
            <div className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-lg">
              v1.1.0 • Build 2025.09.15
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;