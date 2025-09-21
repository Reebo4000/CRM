import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePaginatedApi } from '../../hooks/useApi';
import { orderAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import Badge from '../ui/Badge';
import {
  Search,
  Filter,
  Eye,
  User,
  Calendar,
  Package,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShoppingBag
} from 'lucide-react';
import CurrencyIcon from '../ui/CurrencyIcon';
import {
  formatDate as baseDateFormat,
  formatCurrency,
  formatOrderStatusTranslated,
  getStatusColor,
  formatNumber
} from '../../utils/formatters';

const OrderList = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const isArabic = i18n.language === 'ar';

  // Create localized formatters
  const formatDate = (date, options = {}) => {
    const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
    return baseDateFormat(date, options, locale);
  };


  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [sortBy, setSortBy] = useState('orderDate');
  const [sortOrder, setSortOrder] = useState('DESC');

  const {
    data: orders,
    pagination,
    loading,
    error,
    updateParams,
    goToPage,
    nextPage,
    prevPage
  } = usePaginatedApi(orderAPI.getAll, {
    page: 1,
    limit: 10,
    search: '',
    status: '',
    sortBy: 'orderDate',
    sortOrder: 'DESC'
  });

  // Handle search and filters with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateParams({ 
        search: searchTerm, 
        status: statusFilter,
        sortBy, 
        sortOrder 
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, sortBy, sortOrder, updateParams]);

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSortBy(field);
    setSortOrder(newOrder);
  };

  if (loading && !orders.length) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="p-6">
          <div className="text-sm text-destructive">
            {t('orders.failedToLoadOrders')}: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const orderStatuses = ['pending', 'processing', 'completed', 'cancelled'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
       
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={t('orders.searchOrders')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select"
              >
                <option value="">{t('orders.allStatuses')}</option>
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {formatOrderStatusTranslated(status, t)}
                  </option>
                ))}
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="form-select"
              >
                <option value="orderDate-DESC">{t('customers.NewestFirst')}</option>
                <option value="orderDate-ASC">{t('customers.OldestFirst')}</option>
                <option value="totalAmount-DESC">{t('orders.totalAmountSort')} (High-Low)</option>
                <option value="totalAmount-ASC">{t('orders.totalAmountSort')} (Low-High)</option>
                <option value="status-ASC">{t('orders.statusSort')} A-Z</option>
              </select>
             
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        {orders.length === 0 ? (
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <ShoppingBag className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">{t('orders.noOrdersFound')}</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter ?
                t('customers.adjustSearch') :
                t('orders.createFirstOrder')
              }
            </p>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/orders/new')}>
              {t('orders.createOrder')}
            </Button>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr className="table-header-row">
                      <th
                        className="table-header-cell cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('id')}
                      >
                        <div className="flex items-center gap-2">
                          {t('orders.orderNumber')}
                          {sortBy === 'id' && (
                            <span className="text-primary">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="table-header-cell">{t('orders.customer')}</th>
                      <th
                        className="table-header-cell cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('orderDate')}
                      >
                        <div className="flex items-center gap-2">
                          {t('orders.orderDate')}
                          {sortBy === 'orderDate' && (
                            <span className="text-primary">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th
                        className="table-header-cell cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('totalAmount')}
                      >
                        <div className="flex items-center gap-2">
                          {t('orders.totalAmount')}
                          {sortBy === 'totalAmount' && (
                            <span className="text-primary">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="table-header-cell">{t('orders.items')}</th>
                      <th
                        className="table-header-cell cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-2">
                          {t('orders.status')}
                          {sortBy === 'status' && (
                            <span className="text-primary">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="table-header-cell">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {orders.map((order) => (
                      <OrderTableRow
                        key={order.id}
                        order={order}
                        formatDate={formatDate}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden p-4">
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  onClick={prevPage}
                  disabled={!pagination.hasPrev}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  onClick={nextPage}
                  disabled={!pagination.hasNext}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  {t('common.next')}
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('pagination.showingPage')} <span className="font-medium text-foreground">{formatNumber(pagination.currentPage)}</span> {t('pagination.of')}{' '}
                    <span className="font-medium text-foreground">{formatNumber(pagination.totalPages)}</span> ({formatNumber(pagination.totalItems-1)} {t('pagination.totalOrders')})
                  </p>
                </div>
                <div>
                  <nav className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={!pagination.hasPrev}
                      leftIcon={isArabic ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    >
                      {t('common.previous')}
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                        if (pageNum > pagination.totalPages) return null;

                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="min-w-[40px]"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={!pagination.hasNext}
                      rightIcon={isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    >
                      {t('common.next')}
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Table Row Component
const OrderTableRow = ({ order, formatDate }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const statusColor = getStatusColor(order.status);

  return (
    <tr className="table-row">
      <td className="table-cell">
        <div className="text-sm font-medium">
          # {formatNumber(order.id)}
          
        </div>
      </td>
      <td className="table-cell">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">
              {order.customer ?
                `${order.customer.firstName} ${order.customer.lastName}` :
                t('orders.customer')
              }
            </div>
            {order.customer?.email && (
              <div className="text-sm text-gray-500">
                {order.customer.email}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="table-cell">
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            {formatDate(order.orderDate)}
          </div>
        </div>
      </td>
      <td className="table-cell">
        <div className="text-sm font-medium">
          <div className="flex items-center gap-1">
            <CurrencyIcon className="h-4 w-4" color="text-green-600" />
            {formatCurrency(order.totalAmount)}
          </div>
        </div>
      </td>
      <td className="table-cell">
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-400" />
            {order.orderItems?.length || 0} {t('orders.items')}
          </div>
        </div>
      </td>
      <td className="table-cell">
        <Badge variant={
          statusColor === 'green' ? 'success' :
          statusColor === 'blue' ? 'default' :
          statusColor === 'yellow' ? 'warning' :
          'destructive'
        }>
          {formatOrderStatusTranslated(order.status, t)}
        </Badge>
      </td>
      <td className="table-cell text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/orders/${order.id}`)}
          leftIcon={<Eye className="h-4 w-4" />}
        >
          {t('orders.viewOrder')}
        </Button>
      </td>
    </tr>
  );
};

// Mobile Card Component
const OrderCard = ({ order, formatDate }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const statusColor = getStatusColor(order.status);

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/orders/${order.id}`)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium">
                {t('orders.orderNumber')} #{order.id}
              </h3>
              <p className="text-sm text-gray-500">
                {order.customer ?
                  `${order.customer.firstName} ${order.customer.lastName}` :
                  t('orders.customer')
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={
              statusColor === 'green' ? 'success' :
              statusColor === 'blue' ? 'default' :
              statusColor === 'yellow' ? 'warning' :
              'destructive'
            }>
              {formatOrderStatusTranslated(order.status, t)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/orders/${order.id}`);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center text-sm text-gray-600 gap-2">
            <Calendar className="h-4 w-4" />
            {formatDate(order.orderDate)}
          </div>
          <div className="flex items-center text-sm text-gray-600 gap-2">
            <CurrencyIcon className="h-4 w-4" color="text-green-600" />
            <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 gap-2">
            <Package className="h-4 w-4" />
            {order.orderItems?.length || 0} {t('orders.items')}
          </div>
        </div>

        {order.notes && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
            <strong>{t('orders.notes')}:</strong> {order.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderList;
