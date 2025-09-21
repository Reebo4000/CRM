import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi, useNotificationPreferences } from '../../hooks/useApi';
import { productAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import {
  Edit,
  Trash2,
  Package,
  Tag,
  Palette,
  Layers,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import CurrencyIcon from '../ui/CurrencyIcon';
import {
  formatDate as baseDateFormat,
  formatDateTime as baseDateTimeFormat,
  formatCurrency,
  formatNumber,
  getStockLevelTranslated,
  getStockLevelColor,
  capitalizeWords,
  formatDateTime
} from '../../utils/formatters';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Create localized formatters
  const formatDate = (date, options = {}) => {
    const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
    return baseDateFormat(date, locale, options);
  };

  const formatDateTime = (date) => {
    const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
    return baseDateTimeFormat(date, locale);
  };
  const [activeTab, setActiveTab] = useState('overview');

  // Get dynamic stock thresholds from user preferences
  const { getStockThresholds } = useNotificationPreferences();
  const stockThresholds = getStockThresholds();

  const {
    data: productData, 
    loading, 
    error,
    refetch
  } = useApi(
    () => productAPI.getById(id), 
    [id], 
    { immediate: true }
  );

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await productAPI.delete(id);
        navigate('/products');
      } catch (error) {
        alert('Failed to delete product: ' + error.message);
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
          Failed to load product: {error.message}
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Product not found</div>
      </div>
    );
  }

  const { product, statistics } = productData;
  const stockLevel = getStockLevelTranslated(product.stockQuantity, t, stockThresholds);
  const stockColor = getStockLevelColor(product.stockQuantity, stockThresholds);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              {/* Product Image */}
              <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mr-6 ml-6 overflow-hidden">
                {product.imagePath ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${product.imagePath}`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${product.imagePath ? 'hidden' : ''}`}>
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {product.name}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span>{t('products.productId')}: # { formatNumber(product.id)}</span>
                  <span>•</span>
                  <span>{product.category}</span>
                  {product.brand && (
                    <>
                      <span>•</span>
                      <span>{product.brand}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(product.price)}
                  </span>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    stockColor === 'green' ? 'bg-green-100 text-green-800' :
                    stockColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    stockColor === 'orange' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {stockLevel}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                to={`/products/${product.id}/edit`}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 m-2">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1 min-w-0">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 break-words">{t('products.productDetailPage.stockQuantity')}</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatNumber(product.stockQuantity)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 m-2">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1 min-w-0">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 break-words">{t('products.productDetailPage.totalSold')}</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatNumber(statistics?.totalSold || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 m-2">
                {/* <DollarSign className="h-6 w-6 text-purple-600" /> */}
              </div>
              <div className="ml-5 w-0 flex-1 min-w-0">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 break-words">{t('products.productDetailPage.revenue')}</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(statistics?.totalRevenue || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 m-2">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1 min-w-0">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 break-words">{t('products.productDetailPage.lastSoldDate')}</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statistics?.lastSoldDate ? formatDateTime(statistics.lastSoldDate) : t('products.productDetailPage.neverSold')}
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
              {t('products.productDetailPage.overview')}
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sales'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('products.productDetailPage.salesHistory')}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab product={product} formatDate={formatDate} />}
          {activeTab === 'sales' && <SalesTab product={product} statistics={statistics} formatDateTime={formatDateTime} />}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ product, formatDate }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Product Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Package className="h-5 w-5 mr-2" />
          {t('products.productDetailPage.productDetails')}
        </h3>
        <div className="space-y-3">
          {product.description && (
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('products.description')}</dt>
              <dd className="text-sm text-gray-900 mt-1 break-words">{product.description}</dd>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('products.category')}</dt>
              <dd className="text-sm text-gray-900 mt-1 break-words">{product.category}</dd>
            </div>
            {product.brand && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('products.brand')}</dt>
                <dd className="text-sm text-gray-900 mt-1 break-words">{product.brand}</dd>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Attributes */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Palette className="h-5 w-5 mr-2" />
          {t('products.productDetailPage.attributes')}
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.color && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('products.color')}</dt>
                <dd className="text-sm text-gray-900 mt-1 break-words">{product.color}</dd>
              </div>
            )}
            {product.material && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('products.material')}</dt>
                <dd className="text-sm text-gray-900 mt-1 break-words">{product.material}</dd>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('products.price')}</dt>
              <dd className="text-lg font-semibold text-green-600 mt-1 break-words">
                {formatCurrency(product.price)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('products.stock')}</dt>
              <dd className="text-lg font-semibold text-gray-900 mt-1 break-words">
                {formatNumber(product.stockQuantity)}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('products.createdAt')}</dt>
            <dd className="text-sm text-gray-900 mt-1 break-words">{formatDateTime(product.createdAt)}</dd>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sales Tab Component
const SalesTab = ({ product, statistics, formatDateTime }) => {
  const { t } = useTranslation();

  if (!statistics?.orderItems || statistics.orderItems.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('products.productDetailPage.neverSold')}</h3>
        <p className="text-gray-500">{t('products.noSalesYet')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <ShoppingBag className="h-5 w-5 text-blue-600 mr-2" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-500 break-words">{t('products.productDetailPage.totalOrders')}</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatNumber(statistics.orderItems.length||0)}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-green-600 mr-2" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-500 break-words">{t('products.productDetailPage.unitsSold')}</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatNumber(statistics.totalSold || 0)}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            {/* <DollarSign className="h-5 w-5 text-purple-600 mr-2" /> */}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-500 break-words">{t('products.productDetailPage.totalRevenue')}</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(statistics.totalRevenue || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-900">{t('orders.recentOrders')}</h4>
        {statistics.orderItems.slice(0, 10).map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                   {t ('orders.orderNumber')} # {formatNumber(item.orderId)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDateTime(item.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    {formatCurrency(item.totalPrice)}
                  </div>
                </div>
                <Link
                  to={`/orders/${item.orderId}`}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductDetail;
