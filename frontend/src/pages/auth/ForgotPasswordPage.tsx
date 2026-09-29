import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../../store/slices/authSlice';
import { RootState, AppDispatch } from '../../store';
import { ForgotPasswordData } from '../../types';
import { Button, Input, Card } from '../../components/ui';
import { toast } from 'react-toastify';

const schema = yup.object({
  email: yup.string()
    .email('Invalid email format')
    .required('Email is required'),
});

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
        toast.error(result.payload as string || 'Failed to send reset email');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg auth-bg-1" aria-hidden="true" />
      <div className="auth-bg auth-bg-2" aria-hidden="true" />
      <div className="auth-grain" aria-hidden="true" />
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" aria-hidden="true">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="auth-title">Forgot Password?</h1>
          <p className="auth-subtitle">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="auth-input-group">
            <label className="auth-label">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email address"
              className={`auth-input ${errors.email ? 'error' : ''}`}
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email format'
                }
              })}
            />
            {errors.email && (
              <div className="auth-error">
                ⚠️ {errors.email.message}
              </div>
            )}
          </div>

          {error && (
            <div className="auth-error text-center">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="auth-spinner" />
                Sending Instructions...
              </>
            ) : (
              <>
                <Mail size={20} />
                Send Reset Instructions
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <Link
            to="/login"
            className="auth-link inline-flex items-center"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;