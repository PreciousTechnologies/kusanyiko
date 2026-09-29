import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateUser, logout } from '../../store/slices/authSlice';
import { authAPI, userManagementAPI } from '../../services/api';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  UserCircleIcon,
  CameraIcon,
  KeyIcon,
  TrashIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  PencilIcon,
  UserIcon,
  EnvelopeIcon,
  MapPinIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import ProfilePicture from '../../components/ui/ProfilePicture';
import Camera from '../../components/ui/Camera';

// Validation schemas
const profileSchema = yup.object({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  username: yup.string().required('Username is required'),
  country: yup.string().required('Country is required'),
  region: yup.string().required('Region is required'),
});

const passwordSchema = yup.object({
  current_password: yup.string().required('Current password is required'),
  new_password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
    .required('New password is required'),
  confirm_password: yup.string()
    .oneOf([yup.ref('new_password')], 'Passwords must match')
    .required('Please confirm your password'),
});

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  country: string;
  region: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const ProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'danger'>('profile');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Freeze background scroll while the delete confirmation is open
  useBodyScrollLock(showDeleteConfirm);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty }
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    mode: 'onChange',
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors }
  } = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
    mode: 'onChange',
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      resetProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
        country: user.country || '',
        region: user.region || '',
      });
    }
  }, [user, resetProfile]);

  // Handle profile picture upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera capture
  const handleCameraCapture = (imageFile: File) => {
    setProfileFile(imageFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string);
    };
    reader.readAsDataURL(imageFile);
  };

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await userManagementAPI.updateOwnProfile(data, profileFile);
      // Sync Redux + localStorage so header/dashboard show the new values instantly
      if (response.data) dispatch(updateUser(response.data));
      setProfileFile(null);
      setSuccessMessage('Profile updated successfully!');
      setIsProfileEditing(false);

      // Auto-hide success message
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await authAPI.changePassword(data.current_password, data.new_password);
      setSuccessMessage(response.data.message || 'Password changed successfully!');
      resetPassword();

      // Auto-hide success message
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      await userManagementAPI.deleteOwnAccount();
      dispatch(logout());
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
    { id: 'security', label: 'Security', icon: KeyIcon },
    { id: 'danger', label: 'Danger Zone', icon: ExclamationTriangleIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-green-600 transition-colors duration-200 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-gray-600">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-red-700 font-medium">{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <button
                      onClick={() => setIsProfileEditing(!isProfileEditing)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors duration-200"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>{isProfileEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                    </button>
                  </div>

                  {/* Profile Picture Section */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative">
                      <ProfilePicture
                        src={profileImage || user?.profile_picture}
                        firstName={user?.first_name || 'User'}
                        lastName={user?.last_name || 'Profile'}
                        size="lg"
                        clickable={!isProfileEditing}
                      />
                      
                      {isProfileEditing && (
                        <div className="absolute -bottom-2 -right-2 flex space-x-2">
                          {/* Upload from files button */}
                          <label className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 shadow-lg">
                            <PhotoIcon className="h-4 w-4 text-white" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>

                          {/* Camera capture button */}
                          <button
                            type="button"
                            onClick={() => setIsCameraOpen(true)}
                            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 shadow-lg"
                            title="Take Photo"
                          >
                            <CameraIcon className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {isProfileEditing && (
                      <p className="text-xs text-gray-500 mt-3 text-center">
                        Click 📷 to upload from files or 📸 to take photo
                      </p>
                    )}
                  </div>

                  {/* Profile Form */}
                  <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* First Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name *
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            {...registerProfile('first_name')}
                            disabled={!isProfileEditing}
                            className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                              isProfileEditing
                                ? 'border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500'
                                : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                            }`}
                            placeholder="Enter first name"
                          />
                        </div>
                        {profileErrors.first_name && (
                          <p className="text-red-500 text-sm mt-1">{profileErrors.first_name.message}</p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            {...registerProfile('last_name')}
                            disabled={!isProfileEditing}
                            className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                              isProfileEditing
                                ? 'border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500'
                                : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                            }`}
                            placeholder="Enter last name"
                          />
                        </div>
                        {profileErrors.last_name && (
                          <p className="text-red-500 text-sm mt-1">{profileErrors.last_name.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Email (managed by Auth — contact an admin to change it) */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            {...registerProfile('email')}
                            disabled
                            type="email"
                            title="Email changes must go through account verification — ask an admin"
                            className="w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-all duration-200 border-gray-100 bg-gray-50 cursor-not-allowed"
                            placeholder="Enter email address"
                          />
                        </div>
                        {profileErrors.email && (
                          <p className="text-red-500 text-sm mt-1">{profileErrors.email.message}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">Locked — ask an admin to change your email.</p>
                      </div>

                      {/* Username */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Username *
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            {...registerProfile('username')}
                            disabled={!isProfileEditing}
                            className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                              isProfileEditing
                                ? 'border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500'
                                : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                            }`}
                            placeholder="Enter username"
                          />
                        </div>
                        {profileErrors.username && (
                          <p className="text-red-500 text-sm mt-1">{profileErrors.username.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Country */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Country *
                        </label>
                        <div className="relative">
                          <GlobeAltIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            {...registerProfile('country')}
                            disabled={!isProfileEditing}
                            className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                              isProfileEditing
                                ? 'border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500'
                                : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                            }`}
                            placeholder="Enter country"
                          />
                        </div>
                        {profileErrors.country && (
                          <p className="text-red-500 text-sm mt-1">{profileErrors.country.message}</p>
                        )}
                      </div>

                      {/* Region */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Region *
                        </label>
                        <div className="relative">
                          <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <input
                            {...registerProfile('region')}
                            disabled={!isProfileEditing}
                            className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                              isProfileEditing
                                ? 'border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500'
                                : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                            }`}
                            placeholder="Enter region"
                          />
                        </div>
                        {profileErrors.region && (
                          <p className="text-red-500 text-sm mt-1">{profileErrors.region.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Save Button */}
                    {isProfileEditing && (
                      <div className="flex justify-end pt-6 border-t border-gray-200">
                        <button
                          type="submit"
                          disabled={loading || !isProfileDirty}
                          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                            loading || !isProfileDirty
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:scale-105'
                          }`}
                        >
                          {loading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Updating...
                            </div>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Security Settings</h2>
                    <p className="text-gray-600">Update your password to keep your account secure</p>
                  </div>

                  <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Current Password *
                      </label>
                      <div className="relative">
                        <KeyIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          {...registerPassword('current_password')}
                          type={showCurrentPassword ? 'text' : 'password'}
                          className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.current_password && (
                        <p className="text-red-500 text-sm mt-1">{passwordErrors.current_password.message}</p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        New Password *
                      </label>
                      <div className="relative">
                        <KeyIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          {...registerPassword('new_password')}
                          type={showNewPassword ? 'text' : 'password'}
                          className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.new_password && (
                        <p className="text-red-500 text-sm mt-1">{passwordErrors.new_password.message}</p>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        Password must be at least 8 characters and contain uppercase, lowercase, and number
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <KeyIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          {...registerPassword('confirm_password')}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.confirm_password && (
                        <p className="text-red-500 text-sm mt-1">{passwordErrors.confirm_password.message}</p>
                      )}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-6 border-t border-gray-200">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                          loading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:scale-105'
                        }`}
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Changing Password...
                          </div>
                        ) : (
                          'Change Password'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === 'danger' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Danger Zone</h2>
                    <p className="text-gray-600">Irreversible and destructive actions</p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-red-900 mb-2">Delete Account</h3>
                        <p className="text-red-700 mb-4">
                          Once you delete your account, there is no going back. This action will permanently 
                          delete your account and remove all your data from our servers.
                        </p>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors duration-200"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delete Confirmation Modal */}
                  {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
                      <div className="flex min-h-full p-4">
                      <div className="bg-white rounded-2xl p-6 max-w-md w-full m-auto max-h-[90vh] overflow-y-auto">
                        <div className="text-center">
                          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Are you absolutely sure?
                          </h3>
                          <p className="text-gray-600 mb-6">
                            This action cannot be undone. This will permanently delete your account 
                            and remove all your data from our servers.
                          </p>
                          
                          <div className="flex space-x-3">
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleDeleteAccount}
                              disabled={loading}
                              className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-colors duration-200 ${
                                loading
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-red-600 text-white hover:bg-red-700'
                              }`}
                            >
                              {loading ? 'Deleting...' : 'Delete Account'}
                            </button>
                          </div>
                        </div>
                      </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Camera Component */}
      <Camera
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};

export default ProfileSettings;