import React, { useState } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileSettings from '../components/profile/ProfileSettings';
import PasswordChange from '../components/profile/PasswordChange';
import UserManagement from '../components/profile/UserManagement';
import {
  User,
  Lock,
  Users,
  Settings,
  Shield,
  Calendar,
  Mail,
  Phone
} from 'lucide-react';
import { formatDate as baseDateFormat } from '../utils/formatters';
import { useTranslation } from 'react-i18next';

const Profile = () => {
  return (
    <div className="space-y-6">
      <Routes>
        <Route path="/" element={<ProfileOverview />} />
        <Route path="/settings" element={<ProfileSettings />} />
        <Route path="/password" element={<PasswordChange />} />
        <Route path="/users" element={<UserManagement />} />
      </Routes>
    </div>
  );
};

const ProfileOverview = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();

  // Create localized formatDate function
  const formatDate = (date, options = {}) => {
    const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
    return baseDateFormat(date, locale, options);
  };

  const handleLogout = async () => {
    if (window.confirm(t('profile.logoutConfirm'))) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('profile.subtitle')}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          {t('profile.logout')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information Card */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                {t('profile.userInformation')}
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-start">
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl font-medium text-blue-600">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="ml-6 flex-1">
                  <h3 className="text-xl font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {user?.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Shield className="h-4 w-4 mr-2" />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user?.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                      </span>
                    </div>
                    {user?.createdAt && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {t('profile.memberSince')} {formatDate(user.createdAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Account Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{t('profile.accountActions')}</h2>
            </div>
            <div className="p-6 space-y-3">
              <Link
                to="/profile/settings"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{t('profile.profileSettings')}</div>
                  <div className="text-xs text-gray-500">{t('profile.profileSettingsDesc')}</div>
                </div>
              </Link>

              <Link
                to="/profile/password"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Lock className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{t('profile.changePassword')}</div>
                  <div className="text-xs text-gray-500">{t('profile.changePasswordDesc')}</div>
                </div>
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to="/profile/users"
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{t('profile.userManagement')}</div>
                    <div className="text-xs text-gray-500">{t('profile.userManagementDesc')}</div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{t('profile.systemInformation')}</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('profile.application')}:</span>
                <span className="text-gray-900">Gemini CRM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('profile.version')}:</span>
                <span className="text-gray-900">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('profile.environment')}:</span>
                <span className="text-gray-900">Development</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('profile.lastLogin')}:</span>
                <span className="text-gray-900">
                  {user?.lastLoginAt ? formatDate(user.lastLoginAt) : t('profile.currentSession')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
