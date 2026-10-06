import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { Eye, EyeOff, LogIn, ShieldCheck, CalendarDays, MapPin, Sparkles } from 'lucide-react';
import { loginUser } from '../../store/slices/authSlice';
import { useBranding } from '../../context/BrandingContext';
import { LoginCredentials } from '../../types';
import { toast } from 'sonner';
import { AuthShell } from '../../components/auth-shell';
import { ClayButton, StatusPill } from '../../components/ui-bits';
import { springs } from '../../lib/motion-tokens';

const inputCls = (invalid: boolean) =>
  `h-11 w-full rounded-xl border bg-[var(--card)] px-4 text-sm text-[var(--foreground)] placeholder:text-muted-foreground transition-all focus-ring ${
    invalid ? 'border-rose-500/60' : 'border-[var(--border)] focus:border-[var(--primary)]'
  }`;
const labelCls = 'block text-xs font-semibold text-[var(--foreground)] mb-1.5';
const errCls = 'text-xs text-rose-600 mt-1 font-medium';

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const { branding } = useBranding();

  // Load saved credentials on component mount
  React.useEffect(() => {
    const savedUsername = localStorage.getItem('remembered_username');
    const savedRememberMe = localStorage.getItem('remember_me') === 'true';

    if (savedUsername && savedRememberMe) {
      setValue('username', savedUsername);
      setRememberMe(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginCredentials>();

  // Watch the remember_me checkbox
  const watchedRememberMe = watch('remember_me', false);

  React.useEffect(() => {
    setRememberMe(!!watchedRememberMe);
  }, [watchedRememberMe]);

  const onSubmit = async (data: LoginCredentials) => {
    try {
      const result = await dispatch(loginUser(data));
      if (loginUser.fulfilled.match(result)) {
        toast.success('Welcome back! Login successful.');

        // Handle remember me functionality
        if (rememberMe && data.username) {
          localStorage.setItem('remembered_username', data.username);
          localStorage.setItem('remember_me', 'true');
        } else {
          localStorage.removeItem('remembered_username');
          localStorage.removeItem('remember_me');
        }

        // Navigation will be handled by the AppRouter based on user role
      } else {
        toast.error((result.payload as string) || 'Login failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <AuthShell>
      <div className="grid lg:grid-cols-2 gap-10 items-center max-w-6xl mx-auto min-h-[calc(100vh-7.5rem)]">
        {/* Hero — brand story, desktop only */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.gentle, delay: 0.05 }}
          className="hidden lg:flex flex-col justify-center"
        >
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-[var(--foreground)] w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
            {branding.registration_status_label}
          </span>

          <h1 className="mt-5 font-display text-4xl xl:text-6xl font-bold leading-[1.05] tracking-tight">
            {branding.landing_hero_prefix}{' '}
            <span className="text-[var(--primary)]">{branding.landing_hero_highlight}</span>{' '}
            {branding.landing_hero_suffix}
          </h1>

          <p className="mt-4 text-muted-foreground text-base xl:text-lg leading-relaxed max-w-lg">
            {branding.landing_description}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 max-w-lg">
            <div className="surface bento p-4">
              <span className="icon-badge mb-2">
                <CalendarDays className="w-4 h-4" />
              </span>
              <p className="tnum font-display text-lg font-bold">{branding.camp_start_date}</p>
              <p className="text-xs text-muted-foreground mt-0.5">to {branding.camp_end_date}</p>
            </div>
            <div className="surface bento p-4">
              <span className="icon-badge mb-2">
                <MapPin className="w-4 h-4" />
              </span>
              <p className="font-display text-lg font-bold leading-snug">{branding.camp_location}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{branding.ministry_lead}</p>
            </div>
          </div>

          <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            {branding.app_subtitle}
          </p>
        </motion.div>

        {/* Auth card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.gentle, delay: 0.12 }}
          className="glass-strong rounded-3xl p-6 md:p-8 shadow-[var(--shadow-elev-def)] w-full max-w-md mx-auto lg:ml-auto lg:mr-0"
        >
          <div className="flex items-center gap-3 mb-1">
            <span className="icon-badge">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sign in to your {branding.app_name} account
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className={labelCls}>Username or Email</label>
              <input
                type="text"
                placeholder="Enter your username or email"
                autoComplete="username"
                className={inputCls(!!errors.username)}
                {...register('username', { required: 'Username or email is required' })}
              />
              {errors.username && <p className={errCls}>{errors.username.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`${inputCls(!!errors.password)} pr-11`}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className={errCls}>{errors.password.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember-me"
                className="w-4 h-4 rounded accent-[var(--primary)]"
                {...register('remember_me')}
              />
              <label htmlFor="remember-me" className="text-xs font-medium text-muted-foreground cursor-pointer">
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="ml-auto text-xs font-semibold text-[var(--primary)] hover:underline focus-ring rounded"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5">
                <p className="text-xs font-semibold text-rose-600">{error}</p>
              </div>
            )}

            <ClayButton tone="primary" loading={loading} icon={<LogIn className="w-4 h-4" />} className="w-full !h-11">
              Sign In
            </ClayButton>

            <div className="flex justify-center pt-1">
              <StatusPill stage="Accounts are issued by administrators" tone="neutral" />
            </div>
          </form>
        </motion.div>
      </div>
    </AuthShell>
  );
};

export default LoginPage;
