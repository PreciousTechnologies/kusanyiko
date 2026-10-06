import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { ResetPasswordData } from '../../types';
import { authAPI } from '../../services/api';
import { toast } from 'sonner';
import { AuthShell } from '../../components/auth-shell';
import { ClayButton } from '../../components/ui-bits';
import { springs, variants } from '../../lib/motion-tokens';

const inputCls = (invalid: boolean) =>
  `h-11 w-full rounded-xl border bg-[var(--card)] px-4 pr-11 text-sm text-[var(--foreground)] placeholder:text-muted-foreground transition-all focus-ring ${
    invalid ? 'border-rose-500/60' : 'border-[var(--border)] focus:border-[var(--primary)]'
  }`;

const ResetPasswordPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    defaultValues: {
      token,
    },
  });

  const onSubmit = async (data: ResetPasswordData) => {
    setLoading(true);
    try {
      await authAPI.resetPassword(data);
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <motion.div
        variants={variants.fadeSlideUp}
        initial="initial"
        animate="animate"
        transition={springs.gentle}
        className="glass-strong rounded-3xl p-6 md:p-8 shadow-[var(--shadow-elev-def)] w-full max-w-md mx-auto mt-6"
      >
        {success ? (
          <div className="text-center">
            <span className="icon-badge !w-14 !h-14 mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </span>
            <h2 className="font-display text-xl font-bold tracking-tight">Password Reset Successful!</h2>
            <p className="text-xs text-muted-foreground mt-1 mb-6">
              Your password has been reset. You will be redirected to login.
            </p>
            <ClayButton tone="primary" className="w-full !h-11" onClick={() => navigate('/login')}>
              Go to Login
            </ClayButton>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-1">
              <span className="icon-badge">
                <Lock className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight">Reset Password</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Enter your new password below.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <input type="hidden" {...register('token')} />

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                    className={inputCls(!!errors.new_password)}
                    {...register('new_password', {
                      required: 'New password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.new_password && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{errors.new_password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    className={inputCls(!!errors.confirm_password)}
                    {...register('confirm_password', {
                      required: 'Please confirm your password',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{errors.confirm_password.message}</p>
                )}
              </div>

              <ClayButton tone="primary" loading={loading} icon={<Lock className="w-4 h-4" />} className="w-full !h-11">
                Reset Password
              </ClayButton>

              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline focus-ring rounded-lg py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </Link>
            </form>
          </>
        )}
      </motion.div>
    </AuthShell>
  );
};

export default ResetPasswordPage;
