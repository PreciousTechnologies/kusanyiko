import React from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { forgotPassword } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';
import { ForgotPasswordData } from '../../types';
import { toast } from 'sonner';
import { AuthShell } from '../../components/auth-shell';
import { ClayButton } from '../../components/ui-bits';
import { springs, variants } from '../../lib/motion-tokens';

const ForgotPasswordPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>();

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      const result = await dispatch(forgotPassword(data.email));
      if (forgotPassword.fulfilled.match(result)) {
        toast.success('Password reset instructions sent to your email!');
      } else {
        toast.error((result.payload as string) || 'Failed to send reset email');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
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
        <div className="flex items-center gap-3 mb-1">
          <span className="icon-badge">
            <KeyRound className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">Forgot Password?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter your email and we&apos;ll send reset instructions.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              autoComplete="email"
              className={`h-11 w-full rounded-xl border bg-[var(--card)] px-4 text-sm text-[var(--foreground)] placeholder:text-muted-foreground transition-all focus-ring ${
                errors.email ? 'border-rose-500/60' : 'border-[var(--border)] focus:border-[var(--primary)]'
              }`}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email format',
                },
              })}
            />
            {errors.email && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5">
              <p className="text-xs font-semibold text-rose-600">{error}</p>
            </div>
          )}

          <ClayButton tone="primary" loading={loading} icon={<Mail className="w-4 h-4" />} className="w-full !h-11">
            Send Reset Instructions
          </ClayButton>

          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline focus-ring rounded-lg py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </form>
      </motion.div>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
