import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { customerAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import PhoneNumber from '../common/PhoneNumber';
import {
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  Package,
  Clock,
  Eye
} from 'lucide-react';
import CurrencyIcon from '../ui/CurrencyIcon';
import {
  formatDate as baseDateFormat,
  formatDateTime as baseDateTimeFormat,
  calculateAge,
  formatCurrency,
  formatOrderStatusTranslated,
  getStatusColor,
  formatNumber
} from '../../utils/formatters';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Create localized formatters
  const formatDate = (date, options = {}) => {
    const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
    return baseDateFormat(date, options, locale);
  };

  const formatDateTime = (date) => {
    const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
    return baseDateTimeFormat(date, locale);
  };
  const [activeTab, setActiveTab] = useState('overview');

  const {
    data: customerData,
    loading,
    error
  } = useApi(
    () => customerAPI.getById(id), 
    [id], 
    { immediate: true }
  );

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await customerAPI.delete(id);
        navigate('/customers');
      } catch (error) {
        alert('Failed to delete customer: ' + error['response'].data.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-sm text-red-600">
          {t('customers.failedToLoadCustomer')}: {error.message}
        </div>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">{t('customers.customerNotFound')}</div>
      </div>
    );
  }

  const { customer, statistics } = customerData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-medium text-blue-600">
                  {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                </span>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {customer.firstName} {customer.lastName}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{t('customers.customerId')}: # {formatNumber(customer.id)}</span>
                  <span>•</span>
                  <span>{t('customers.joined')} {formatDate(customer.createdAt)}</span>
                  {customer.dateOfBirth && (
                    <>
                      <span>•</span>
                      <span>{t('customers.age')} {formatNumber(calculateAge(customer.dateOfBirth))}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to={`/customers/${customer.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </Link>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white  shadow rounded-lg">
          <div className="p-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingBag className="h-6 w-6 m-2 text-blue-600" />
              </div>
              <div className="ml-1 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 ">{t('customers.totalOrders')}</dt>
                  <dd className="text-lg font-medium text-gray-900">{statistics?.totalOrders || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white  shadow rounded-lg">
          <div className="p-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyIcon className="h-6 w-6 m-2"  color="text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 ">{t('customers.totalSpent')}</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(statistics?.totalSpent || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white  shadow rounded-lg">
          <div className="p-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 m-2 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 ">{t('customers.avgOrderValue')}</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(statistics?.averageOrderValue || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white  shadow rounded-lg">
          <div className="p-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 m-2 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 ">{t('customers.lastOrder')}</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statistics?.lastOrderDate ? formatDate(statistics.lastOrderDate) : t('customers.never')}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('customers.overview')}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('customers.orderHistory')} ({customer.orders?.length || 0})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab customer={customer} formatDate={formatDate} t={t} />}
          {activeTab === 'orders' && <OrdersTab orders={customer.orders || []} formatDateTime={formatDateTime} t={t} />}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ customer, formatDate, t }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 mr-2" />
          {t('customers.contactInformation')}
        </h3>
        <div className="space-y-3">
          {customer.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-sm text-gray-900">{customer.email}</span>
            </div>
          )}
          <div className="flex items-center">
            <Phone className="h-4 w-4 text-gray-400 mr-3" />
            <PhoneNumber phone={customer.phone} className="text-sm text-gray-900" />
          </div>
          {customer.dateOfBirth && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-3" />
              <span className="text-sm text-gray-900">
                {t('customers.born')} {formatDate(customer.dateOfBirth)} ({t('customers.age')} {formatNumber(calculateAge(customer.dateOfBirth))})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Address Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          {t('customers.addressInformation')}
        </h3>
        <div className="space-y-2">
          {customer.address ? (
            <>
              <div className="text-sm text-gray-900">{customer.address}</div>
              {(customer.city || customer.postalCode) && (
                <div className="text-sm text-gray-900">
                  {customer.city}{customer.city && customer.postalCode && ', '}{customer.postalCode}
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-500">{t('customers.noAddressAvailable')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Orders Tab Component
const OrdersTab = ({ orders, formatDateTime, t }) => {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('customers.noOrdersYet')}</h3>
        <p className="text-gray-500">{t('customers.noOrdersDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <h4 className="text-lg font-medium text-gray-900">
                {t('customers.orderNumber')} #{order.id}
              </h4>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                getStatusColor(order.status) === 'green' ? 'bg-green-100 text-green-800' :
                getStatusColor(order.status) === 'blue' ? 'bg-blue-100 text-blue-800' :
                getStatusColor(order.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {formatOrderStatusTranslated(order.status, t)}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-lg font-medium text-gray-900">
                {formatCurrency(order.totalAmount)}
              </span>
              <Link
                to={`/orders/${order.id}`}
                className="text-blue-600 hover:text-blue-900"
              >
                <Eye className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{formatDateTime(order.orderDate)}</span>
            <span>{order.orderItems?.length || 0} items</span>
          </div>

          {order.orderItems && order.orderItems.length > 0 && (
            <div className="mt-3 space-y-2">
              {order.orderItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-900">
                    {item.quantity}x {item.product?.name || t('customers.unknownProduct')}
                  </span>
                  <span className="text-gray-500">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              ))}
              {order.orderItems.length > 3 && (
                <div className="text-sm text-gray-500">
                  +{order.orderItems.length - 3} {t('customers.moreItems')}
                </div>
              )}
            </div>
          )}

          {order.notes && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
              <strong>{t('customers.notes')}:</strong> {order.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CustomerDetail;
