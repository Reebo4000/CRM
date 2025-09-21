import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { useApiSubmit } from '../../hooks/useApi';
import LoadingSpinner from '../LoadingSpinner';
import { Save, X, User, Mail, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Validation schema - will be created inside component to access t function
const createProfileSchema = (t) => yup.object({
  firstName: yup
    .string()
    .required(t('validation.firstNameRequired'))
    .min(2, t('validation.firstNameMin'))
    .max(50, t('validation.firstNameMax')),
  lastName: yup
    .string()
    .required(t('validation.lastNameRequired'))
    .min(2, t('validation.lastNameMin'))
    .max(50, t('validation.lastNameMax')),
  email: yup
    .string()
    .email(t('validation.emailInvalid'))
    .required(t('validation.emailRequired'))
});

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [submitError, setSubmitError] = useState(null);
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(createProfileSchema(t)),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || ''
    }
  });

  const { submit, loading: submitting, success } = useApiSubmit(
    async (data) => {
      const result = await updateProfile(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    {
      onSuccess: () => {
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      },
      onError: (error) => {
        setSubmitError(error.message);
      }
    }
  );

  const onSubmit = async (data) => {
    setSubmitError(null);
    await submit(data);
  };

  const handleReset = () => {
    reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || ''
    });
    setSubmitError(null);
  };

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
        <h1 className="text-2xl font-bold text-gray-900">{t('profile.profileSettings')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('profile.profileSettingsDesc')}
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2" />
            {t('profile.personalInformation')}
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
                {t('profile.profileUpdated')}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                {t('profile.firstName')} *
              </label>
              <input
                {...register('firstName')}
                id="firstName"
                type="text"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={t('profile.enterFirstName')}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                {t('profile.lastName')} *
              </label>
              <input
                {...register('lastName')}
                id="lastName"
                type="text"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={t('profile.enterLastName')}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              <Mail className="h-4 w-4 inline mr-1" />
              {t('profile.emailAddress')} *
            </label>
            <input
              {...register('email')}
              id="email"
              type="email"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={t('profile.enterEmail')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Role Display (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('profile.role')}
            </label>
            <div className="mt-1">
              <span className={`inline-flex px-3 py-2 text-sm font-medium rounded-md ${
                user?.role === 'admin'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
              <p className="mt-1 text-xs text-gray-500">
                {t('profile.contactAdmin')}
              </p>
            </div>
          </div>

          {/* Account Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('profile.accountInformation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('profile.userId')}</label>
                <div className="mt-1 text-sm text-gray-900">#{user?.id}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('profile.accountCreated')}</label>
                <div className="mt-1 text-sm text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : t('profile.unknown')}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 mr-2" />
              {t('profile.reset')}
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
              {submitting ? t('profile.saving') : t('profile.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
