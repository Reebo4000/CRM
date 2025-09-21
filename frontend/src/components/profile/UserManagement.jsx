import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePaginatedApi, useApiSubmit } from '../../hooks/useApi';
import { authAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { 
  ArrowLeft,
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield,
  Mail,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatDate, formatNumber } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { t } = useTranslation();

  // Check if current user is admin
  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-600">
            {t('profile.accessDenied')}
          </div>
        </div>
      </div>
    );
  }

  const {
    data: users,
    pagination,
    loading,
    error,
    updateParams,
    refetch
  } = usePaginatedApi(authAPI.getAllUsers, {
    page: 1,
    limit: 10,
    search: '',
    role: ''
  });

  // Handle search and filters with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateParams({ 
        search: searchTerm, 
        role: roleFilter
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, roleFilter, updateParams]);

  const handleViewUser = async (userId) => {
    try {
      const response = await authAPI.getUserById(userId);
      setSelectedUser(response.data);
      setShowViewModal(true);
    } catch (error) {
      alert(t('profile.failedToLoad') + ' ' + error.message);
    }
  };

  const handleEditUser = async (userId) => {
    try {
      const response = await authAPI.getUserById(userId);
      setSelectedUser(response.data);
      setShowEditModal(true);
    } catch (error) {
      alert(t('profile.failedToLoad') + ' ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser.id) {
      alert(t('profile.cannotDeleteOwn'));
      return;
    }

    if (window.confirm(t('profile.deleteUserConfirm'))) {
      try {
        await authAPI.deleteUser(userId);
        refetch();
      } catch (error) {
        //get the error message from the api response
        alert(t('profile.failedToDelete') + ' ' +  error['response'].data.message  );;
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          to="/profile"
          className="text-sm text-blue-600 hover:text-blue-500 mb-4 inline-flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('profile.backToProfile')}
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('profile.userManagement')}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {t('profile.manageUsers')}
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('profile.addUser')}
          </button>
        </div>
      </div>

      {/* Create User Form Modal */}
      {showCreateForm && (
        <CreateUserForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            refetch();
          }}
        />
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <ViewUserModal
          user={selectedUser}
          onClose={() => {
            setShowViewModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            refetch();
          }}
        />
      )}

      <div className="bg-white shadow rounded-lg">
        {/* Search and Filter Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('profile.searchUsers')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('profile.allRoles')}</option>
                <option value="admin">{t('profile.admin')}</option>
                <option value="staff">{t('profile.staff')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="overflow-hidden">
          {loading && !users.length ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="large" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 m-6">
              <div className="text-sm text-red-600">
                Failed to load users: {error.message}
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('profile.noUsersFound')}</h3>
              <p className="text-gray-500">
                {searchTerm || roleFilter ?
                  t('profile.adjustSearch') :
                  t('profile.getStartedAddUser')
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('profile.user')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('profile.role')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('profile.created')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('profile.lastLogin')}
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">{t('profile.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      currentUser={currentUser}
                      onView={handleViewUser}
                      onEdit={handleEditUser}
                      onDelete={handleDeleteUser}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {t('profile.showingPage')} <span className="font-medium">{formatNumber(pagination.currentPage)}</span> {t('profile.of')}{' '}
                  <span className="font-medium">{formatNumber(pagination.totalPages)}</span> ({formatNumber(pagination.totalItems)} {t('profile.totalUsers')})
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// User Row Component
const UserRow = ({ user, currentUser, onView, onEdit, onDelete }) => {
  const isCurrentUser = user.id === currentUser.id;
  const { t } = useTranslation();

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.firstName} {user.lastName}
              {isCurrentUser && (
                <span className="ml-2 text-xs text-blue-600">{t('profile.you')}</span>
              )}
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              {user.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          user.role === 'admin' 
            ? 'bg-purple-100 text-purple-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          <Shield className="h-3 w-3 mr-1" />
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDate(user.createdAt)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {user.lastLoginAt ? formatDate(user.lastLoginAt) : t('profile.never')}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView(user.id)}
            className="text-blue-600 hover:text-blue-900"
            title={t('profile.viewDetails')}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(user.id)}
            className="text-green-600 hover:text-green-900"
            title={t('profile.editUser')}
          >
            <Edit className="h-4 w-4" />
          </button>
          {!isCurrentUser && (
            <button
              onClick={() => onDelete(user.id)}
              className="text-red-600 hover:text-red-900"
              title={t('profile.deleteUser')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// Create User Form Component
const CreateUserForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'staff'
  });
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  const { submit, loading: submitting } = useApiSubmit(
    authAPI.createUser,
    {
      onSuccess: () => {
        onSuccess();
      },
      onError: (error) => {
        alert(t('profile.failedToCreate') + ' ' + error.message);
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submit(formData);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('profile.createNewUser')}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('profile.firstName')}</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('profile.lastName')}</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profile.email')}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profile.password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profile.role')}</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="staff">{t('profile.staff')}</option>
                <option value="admin">{t('profile.admin')}</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('profile.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? t('profile.creating') : t('profile.createUser')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// View User Modal Component
const ViewUserModal = ({ user, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('profile.userDetails')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profile.firstName')}</label>
              <p className="mt-1 text-sm text-gray-900">{user.firstName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profile.lastName')}</label>
              <p className="mt-1 text-sm text-gray-900">{user.lastName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profile.email')}</label>
              <p className="mt-1 text-sm text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profile.role')}</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">{user.role}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profile.created')}</label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profile.lastLogin')}</label>
              <p className="mt-1 text-sm text-gray-900">
                {user.lastLoginAt ? formatDate(user.lastLoginAt) : t('profile.never')}
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit User Modal Component
const EditUserModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role
  });
  const { t } = useTranslation();

  const { submit, loading: submitting } = useApiSubmit(
    (data) => authAPI.updateUser(user.id, data),
    {
      onSuccess: () => {
        onSuccess();
      },
      onError: (error) => {
        alert(t('profile.failedToUpdate') + ' ' + error.message);
      }
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submit(formData);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('profile.editUser')}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('profile.firstName')}</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('profile.lastName')}</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profile.email')}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('profile.role')}</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="staff">{t('profile.staff')}</option>
                <option value="admin">{t('profile.admin')}</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {submitting ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
