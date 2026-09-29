import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { ResetPasswordData } from '../../types';
import { Button, Input, Card } from '../../components/ui';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';

const schema = yup.object({
  token: yup.string().required('Reset token is required'),
  new_password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirm_password: yup.string()
    .oneOf([yup.ref('new_password')], 'Passwords must match')
    .required('Please confirm your password'),
});

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

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
          <div className="auth-logo" aria-hidden="true">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
            <h1 className="auth-title">Password Reset Successful!</h1>
            <p className="auth-subtitle">
              Your password has been successfully reset. You will be redirected to the login page.
            </p>
          </div>
          <button
            className="auth-button"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-bg auth-bg-1" aria-hidden="true" />
      <div className="auth-bg auth-bg-2" aria-hidden="true" />
      <div className="auth-grain" aria-hidden="true" />
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" aria-hidden="true">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <input type="hidden" {...register('token')} />

          <div className="auth-input-group">
            <label className="auth-label">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                className={`auth-input ${errors.new_password ? 'error' : ''}`}
                {...register('new_password', { 
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' }
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.new_password && (
              <div className="auth-error">
                ⚠️ {errors.new_password.message}
              </div>
            )}
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                className={`auth-input ${errors.confirm_password ? 'error' : ''}`}
                {...register('confirm_password', { 
                  required: 'Please confirm your password'
                })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirm_password && (
              <div className="auth-error">
                ⚠️ {errors.confirm_password.message}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="auth-spinner" />
                Resetting Password...
              </>
            ) : (
              <>
                <Lock size={20} />
                Reset Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;