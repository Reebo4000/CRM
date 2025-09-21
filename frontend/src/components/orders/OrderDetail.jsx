import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi, useApiSubmit } from '../../hooks/useApi';
import { orderAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import PhoneNumber from '../common/PhoneNumber';
import {
  Edit,
  User,
  Calendar,
  Package,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import CurrencyIcon from '../ui/CurrencyIcon';
import {
  formatDate as baseDateFormat,
  formatDateTime as baseDateTimeFormat,
  formatCurrency,
  formatOrderStatusTranslated,
  formatNumber,
  getStatusColor
} from '../../utils/formatters';

const OrderDetail = () => {
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
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { 
    data: orderData, 
    loading, 
    error,
    refetch
  } = useApi(
    () => orderAPI.getById(id), 
    [id], 
    { immediate: true }
  );

  const { submit: updateStatus } = useApiSubmit(
    ({ orderId, status }) => orderAPI.updateStatus(orderId, { status }),
    {
      onSuccess: () => {
        refetch();
        setUpdatingStatus(false);
      },
      onError: (error) => {
        alert('Failed to update status: ' + error.message);
        setUpdatingStatus(false);
      }
    }
  );

  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    await updateStatus({ orderId: id, status: newStatus });
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
          Failed to load order: {error.message}
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Order not found</div>
      </div>
    );
  }

  const order = orderData.order || orderData;
  const statusColor = getStatusColor(order.status);

  const statusOptions = [
    { value: 'pending', label: t('products.orderStatuses.pending'), icon: Clock, color: 'yellow' },
    { value: 'processing', label: t('products.orderStatuses.processing'), icon: AlertCircle, color: 'blue' },
    { value: 'completed', label: t('products.orderStatuses.completed'), icon: CheckCircle, color: 'green' },
    { value: 'cancelled', label: t('products.orderStatuses.cancelled'), icon: XCircle, color: 'red' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('orders.orderNumber')} # {formatNumber(order.id)}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <span>{t('orders.createdAt')} {formatDateTime(order.createdAt)}</span>
                <span>•</span>
                <span>{t("orders.orderDate")}: {formatDate(order.orderDate)}</span>
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(order.totalAmount)}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  statusColor === 'green' ? 'bg-green-100 text-green-800' :
                  statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                  statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {formatOrderStatusTranslated(order.status, t)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                to={`/orders/${order.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                {t("orders.editOrder")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                {t("orders.customerInformation")}
              </h2>
            </div>
            <div className="p-6">
              {order.customer ? (
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-lg font-medium text-blue-600">
                      {order.customer.firstName.charAt(0)}{order.customer.lastName.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {order.customer.firstName} {order.customer.lastName}
                    </h3>
                    <div className="mt-2 space-y-2">
                      {order.customer.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {order.customer.email}
                        </div>
                      )}
                      {order.customer.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          <PhoneNumber phone={order.customer.phone} />
                        </div>
                      )}
                      {(order.customer.address || order.customer.city) && (
                        <div className="flex items-start text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                          <div>
                            {order.customer.address && (
                              <div>{order.customer.address}</div>
                            )}
                            {order.customer.city && (
                              <div>
                                {order.customer.city}
                                {order.customer.postalCode && `, ${order.customer.postalCode}`}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Customer information not available</div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                {t('orders.orderItems')} ({formatNumber(order.orderItems?.length) || 0})
              </h2>
            </div>
            <div className="p-6">
              {order.orderItems && order.orderItems.length > 0 ? (
                <div className="space-y-4">
                  {order.orderItems.map((item, index) => (
                    <div key={item.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.product?.imagePath ? (
                            <img
                              src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${item.product.imagePath}`}
                              alt={item.product?.name || 'Product'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center ${item.product?.imagePath ? 'hidden' : ''}`}>
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-sm font-medium text-gray-900">
                            {item.product?.name || 'Unknown Product'}
                          </h4>
                          <div className="text-sm text-gray-500">
                            {item.product?.category && (
                              <span>{item.product.category}</span>
                            )}
                            {item.product?.brand && (
                              <span> • {item.product.brand}</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {t("orders.quantity")} : {formatNumber(item.quantity)} × {formatCurrency(item.unitPrice)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-medium text-gray-900">
                          {formatCurrency(item.totalPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Order Total */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-900">{t("orders.totalAmount")} :</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No items in this order</div>
              )}
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  {t("orders.orderNotes")}
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Order Status & Actions */}
        <div className="space-y-6">
          {/* Status Management */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{t("orders.orderStatus")}</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {statusOptions.map((status) => {
                  const Icon = status.icon;
                  const isCurrentStatus = order.status === status.value;
                  const isDisabled = updatingStatus;
                  
                  return (
                    <button
                      key={status.value}
                      onClick={() => !isCurrentStatus && handleStatusUpdate(status.value)}
                      disabled={isCurrentStatus || isDisabled}
                      className={`w-full flex items-center p-3 rounded-lg border-2 transition-colors ${
                        isCurrentStatus
                          ? `border-${status.color}-500 bg-${status.color}-50`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      } ${
                        isCurrentStatus || isDisabled
                          ? 'cursor-not-allowed opacity-75'
                          : 'cursor-pointer'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mr-3 ${
                        isCurrentStatus
                          ? `text-${status.color}-600`
                          : 'text-gray-400'
                      }`} />
                      <span className={`font-medium ${
                        isCurrentStatus
                          ? `text-${status.color}-900`
                          : 'text-gray-700'
                      }`}>
                        {status.label}
                      </span>
                      {isCurrentStatus && (
                        <CheckCircle className={`h-5 w-5 ml-auto text-${status.color}-600`} />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {updatingStatus && (
                <div className="mt-4 flex items-center justify-center">
                  <LoadingSpinner size="small" />
                  <span className="ml-2 text-sm text-gray-600">Updating status...</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{t("orders.orderSummary")}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("orders.orderNumber")} :</span>
                <span className="text-sm font-medium text-gray-900"># {formatNumber(order.id)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("orders.orderDate")} :</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(order.orderDate)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("orders.items")}:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatNumber(order.orderItems?.length) || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("orders.orderStatus")} :</span>
                <span className={`text-sm font-medium ${
                  statusColor === 'green' ? 'text-green-600' :
                  statusColor === 'blue' ? 'text-blue-600' :
                  statusColor === 'yellow' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {formatOrderStatusTranslated(order.status, t)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-gray-900">{t("orders.totalAmount")} :</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
