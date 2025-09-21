import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authAPI } from '../../services/api';
import { useApiSubmit } from '../../hooks/useApi';
import LoadingSpinner from '../LoadingSpinner';
import { Save, X, Lock, Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Validation schema - will be created inside component to access t function
const createPasswordSchema = (t) => yup.object({
  currentPassword: yup
    .string()
    .required(t('validation.currentPasswordRequired')),
  newPassword: yup
    .string()
    .required(t('validation.newPasswordRequired'))
    .min(8, t('validation.passwordMin'))
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      t('validation.passwordComplexity')
    ),
  confirmPassword: yup
    .string()
    .required(t('validation.confirmPasswordRequired'))
    .oneOf([yup.ref('newPassword')], t('validation.passwordsMatch'))
});

const PasswordChange = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: yupResolver(createPasswordSchema(t)),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const newPassword = watch('newPassword');

  const { submit, loading: submitting, success } = useApiSubmit(
    (data) => authAPI.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword
    }),
    {
      onSuccess: () => {
        reset();
        setTimeout(() => {
          navigate('/profile');
        }, 5000);
      },
      onError: (error) => {
        setSubmitError(error.message);
        setTimeout(() => {
          navigate('/profile/password');
        }, 5000);
      }
    }
  );

  const onSubmit = async (data) => {
    setSubmitError(null);
    await submit(data);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    const levels = [
      { score: 0, label: '', color: '' },
      { score: 1, label: t('profile.veryWeak'), color: 'bg-red-500' },
      { score: 2, label: t('profile.weak'), color: 'bg-orange-500' },
      { score: 3, label: t('profile.fair'), color: 'bg-yellow-500' },
      { score: 4, label: t('profile.good'), color: 'bg-blue-500' },
      { score: 5, label: t('profile.strong'), color: 'bg-green-500' }
    ];

    return levels[score];
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          to="/profile"
          className="text-sm text-blue-600 hover:text-blue-500 mb-4 inline-flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('profile.backToProfile')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('profile.changePassword')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('profile.changePasswordDesc')}
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            {t('profile.passwordSecurity')}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Display submit error */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-600">{submitError}</div>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-sm text-green-600">
                {t('profile.passwordChanged')}
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <Shield className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">{t('profile.passwordSecurityTips')}</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>{t('profile.useAtLeast8Chars')}</li>
                  <li>{t('profile.includeUpperLower')}</li>
                  <li>{t('profile.addNumbersSpecial')}</li>
                  <li>{t('profile.avoidCommonWords')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
              {t('profile.currentPassword')} *
            </label>
            <div className="mt-1 relative">
              <input
                {...register('currentPassword')}
                type={showPasswords.current ? 'text' : 'password'}
                className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={t('profile.enterCurrentPassword')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              {t('profile.newPassword')} *
            </label>
            <div className="mt-1 relative">
              <input
                {...register('newPassword')}
                type={showPasswords.new ? 'text' : 'password'}
                className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.newPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={t('profile.enterNewPassword')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
            )}
            
            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">{passwordStrength.label}</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              {t('profile.confirmNewPassword')} *
            </label>
            <div className="mt-1 relative">
              <input
                {...register('confirmPassword')}
                type={showPasswords.confirm ? 'text' : 'password'}
                className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={t('profile.confirmNewPasswordPlaceholder')}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 mr-2" />
              {t('profile.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <LoadingSpinner size="small" className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {submitting ? t('profile.changingPassword') : t('profile.changePassword')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChange;
