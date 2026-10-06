import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateUser, logout } from '../../store/slices/authSlice';
import { authAPI, userManagementAPI } from '../../services/api';
import { PageHeader } from '../../components/app-shell';
import { SectionCard, ClayButton, StatusPill } from '../../components/ui-bits';
import { springs, variants } from '../../lib/motion-tokens';
import {
  User as UserIcon,
  Mail,
  MapPin,
  Globe,
  KeyRound,
  Camera as CameraIcon,
  ImagePlus,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
} from 'lucide-react';
import ProfilePicture from '../../components/ui/ProfilePicture';
import Camera from '../../components/ui/Camera';

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

const fieldCls = (editing: boolean) =>
  `w-full h-11 pl-10 pr-4 rounded-xl border text-sm transition-all focus-ring ${
    editing
      ? 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]'
      : 'border-[var(--border)] bg-[color-mix(in_srgb,var(--secondary)_50%,transparent)] text-muted-foreground cursor-not-allowed'
  }`;
const labelCls = 'block text-xs font-semibold text-[var(--foreground)] mb-1.5';
const errCls = 'text-xs text-rose-600 mt-1';

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

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileFormData>({ resolver: yupResolver(profileSchema), mode: 'onChange' });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({ resolver: yupResolver(passwordSchema), mode: 'onChange' });

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfileImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageFile: File) => {
    setProfileFile(imageFile);
    const reader = new FileReader();
    reader.onload = (e) => setProfileImage(e.target?.result as string);
    reader.readAsDataURL(imageFile);
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await userManagementAPI.updateOwnProfile(data, profileFile);
      if (response.data) dispatch(updateUser(response.data));
      setProfileFile(null);
      setSuccessMessage('Profile updated successfully!');
      setIsProfileEditing(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await authAPI.changePassword(data.current_password, data.new_password);
      setSuccessMessage(response.data.message || 'Password changed successfully!');
      resetPassword();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'security', label: 'Security', icon: KeyRound },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Settings"
        subtitle="Account identity, security and danger zone"
        cta={
          <ClayButton tone="neutral" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>
            Back
          </ClayButton>
        }
      />

      <AnimatePresence>
        {successMessage && (
          <motion.div variants={variants.fadeScaleIn} initial="initial" animate="animate" exit="exit" className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <p className="text-xs font-semibold text-emerald-600">{successMessage}</p>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div variants={variants.fadeScaleIn} initial="initial" animate="animate" exit="exit" className="flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <p className="text-xs font-semibold text-rose-600">{errorMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-60 flex-shrink-0">
          <div className="surface p-2 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`clay-press flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    active ? 'bg-[var(--primary)] text-white shadow-sm' : 'text-muted-foreground hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="surface p-4 mt-4 hidden lg:block">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--secondary)] block">
                <ProfilePicture src={(user as any)?.profile_picture} firstName={user?.first_name || 'U'} lastName={user?.last_name || ''} size="sm" className="!w-full !h-full !ring-0 !border-0" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold truncate">{user?.first_name} {user?.last_name}</span>
                <span className="block text-[11px] text-muted-foreground capitalize">{user?.role}</span>
              </span>
            </div>
            <div className="mt-3">
              <StatusPill stage="Verified Account" tone="success" />
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <SectionCard
              title="Profile Information"
              subtitle="Identity used across dashboards and exports"
              action={
                <ClayButton tone={isProfileEditing ? 'neutral' : 'primary'} icon={<Pencil className="w-4 h-4" />} onClick={() => setIsProfileEditing((v) => !v)}>
                  {isProfileEditing ? 'Cancel Edit' : 'Edit Profile'}
                </ClayButton>
              }
            >
              <div className="flex flex-col items-center mb-6">
                <span className="relative block">
                  <span className="w-20 h-20 rounded-3xl overflow-hidden bg-[var(--secondary)] block">
                    <ProfilePicture src={profileImage || (user as any)?.profile_picture} firstName={user?.first_name || 'User'} lastName={user?.last_name || ''} size="lg" clickable={!isProfileEditing} className="!w-full !h-full !ring-0 !border-0" />
                  </span>
                  {isProfileEditing && (
                    <span className="absolute -bottom-2 -right-2 flex gap-1.5">
                      <label className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-transform" title="Upload photo">
                        <ImagePlus className="w-4 h-4" />
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <button type="button" onClick={() => setIsCameraOpen(true)} className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-md hover:scale-105 transition-transform" title="Take photo">
                        <CameraIcon className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                </span>
              </div>

              <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="grid md:grid-cols-2 gap-4">
                {(
                  [
                    { key: 'first_name', label: 'First Name', icon: <UserIcon className="w-4 h-4" /> },
                    { key: 'last_name', label: 'Last Name', icon: <UserIcon className="w-4 h-4" /> },
                    { key: 'username', label: 'Username', icon: <UserIcon className="w-4 h-4" /> },
                    { key: 'country', label: 'Country', icon: <Globe className="w-4 h-4" /> },
                    { key: 'region', label: 'Region', icon: <MapPin className="w-4 h-4" /> },
                  ] as const
                ).map((f) => (
                  <div key={f.key}>
                    <label className={labelCls}>{f.label} *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{f.icon}</span>
                      <input {...registerProfile(f.key)} disabled={!isProfileEditing} placeholder={`Enter ${f.label.toLowerCase()}`} className={fieldCls(isProfileEditing)} />
                    </div>
                    {(profileErrors as any)[f.key] && <p className={errCls}>{(profileErrors as any)[f.key]?.message}</p>}
                  </div>
                ))}
                <div>
                  <label className={labelCls}>Email Address * (locked)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Mail className="w-4 h-4" /></span>
                    <input {...registerProfile('email')} disabled type="email" title="Ask an admin to change your email" className={fieldCls(false)} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Locked — ask an admin to change your email.</p>
                </div>
                {isProfileEditing && (
                  <div className="md:col-span-2 flex justify-end pt-2 border-t border-[var(--border)]">
                    <ClayButton tone="primary" loading={loading} disabled={!isProfileDirty}>
                      Save Changes
                    </ClayButton>
                  </div>
                )}
              </form>
            </SectionCard>
          )}

          {activeTab === 'security' && (
            <SectionCard title="Security Settings" subtitle="Rotate your password regularly">
              <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4 max-w-xl">
                {(
                  [
                    { key: 'current_password', label: 'Current Password', show: showCurrentPassword, set: setShowCurrentPassword },
                    { key: 'new_password', label: 'New Password', show: showNewPassword, set: setShowNewPassword },
                    { key: 'confirm_password', label: 'Confirm New Password', show: showConfirmPassword, set: setShowConfirmPassword },
                  ] as const
                ).map((f) => (
                  <div key={f.key}>
                    <label className={labelCls}>{f.label} *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><KeyRound className="w-4 h-4" /></span>
                      <input
                        {...registerPassword(f.key)}
                        type={f.show ? 'text' : 'password'}
                        placeholder={`Enter ${f.label.toLowerCase()}`}
                        className="w-full h-11 pl-10 pr-11 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm focus-ring"
                      />
                      <button type="button" onClick={() => f.set(!f.show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:bg-[var(--secondary)]">
                        {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {(passwordErrors as any)[f.key] && <p className={errCls}>{(passwordErrors as any)[f.key]?.message}</p>}
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">Minimum 8 characters with uppercase, lowercase and a number.</p>
                <div className="flex justify-end pt-2 border-t border-[var(--border)]">
                  <ClayButton tone="primary" loading={loading}>Change Password</ClayButton>
                </div>
              </form>
            </SectionCard>
          )}

          {activeTab === 'danger' && (
            <SectionCard title="Danger Zone" subtitle="Irreversible actions">
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-display text-sm font-bold text-rose-600">Delete Account</h3>
                  <p className="text-xs text-muted-foreground mt-1">Permanently deletes your account and removes all data from servers.</p>
                  <div className="mt-3">
                    <ClayButton tone="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteConfirm(true)}>
                      Delete Account
                    </ClayButton>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div variants={variants.backdropFade} initial="initial" animate="animate" exit="exit" onClick={() => setShowDeleteConfirm(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div variants={variants.modalPanel} initial="initial" animate="animate" exit="exit" transition={springs.gentle} className="glass-strong relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl text-center">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <h3 className="font-display text-base font-bold">Are you absolutely sure?</h3>
              <p className="text-xs text-muted-foreground mt-1">This permanently deletes your account and all data.</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <ClayButton tone="neutral" onClick={() => setShowDeleteConfirm(false)}>Cancel</ClayButton>
                <ClayButton tone="danger" loading={loading} onClick={handleDeleteAccount}>Delete Account</ClayButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Camera isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCameraCapture} />
    </div>
  );
};

export default ProfileSettings;
