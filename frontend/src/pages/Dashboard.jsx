import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useDirection } from '../hooks/useDirection';
import { useApi } from '../hooks/useApi';
import { orderAPI, customerAPI, productAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Badge from '../components/ui/Badge';
import { useNavigate } from "react-router";

import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  BarChart3,
  X
} from 'lucide-react';
import CurrencyIcon from '../components/ui/CurrencyIcon';
import { formatCurrency, formatNumber } from '../utils/formatters';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  
  // Fetch order statistics
  const {
    data: orderStats,
    loading: orderStatsLoading,
    error: orderStatsError
  } = useApi(orderAPI.getStatistics, [], {
    immediate: true,
    transform: (response) => response.statistics
  });

  // Fetch customer statistics
  const {
    data: customerStats,
    loading: customerStatsLoading,
    error: customerStatsError
  } = useApi(customerAPI.getStatistics, [], {
    immediate: true,
    transform: (response) => response.statistics
  });

  // Fetch product statistics
  const {
    data: productStats,
    loading: productStatsLoading,
    error: productStatsError
  } = useApi(productAPI.getStatistics, [], {
    immediate: true,
    transform: (response) => response.statistics
  });

  const isLoading = orderStatsLoading || customerStatsLoading || productStatsLoading;
  const hasError = orderStatsError || customerStatsError || productStatsError;

  const StatCard = ({ title, value, icon: Icon, color, change, link, trend }) => (
    <Card className="group hover:shadow-medium transition-all duration-200 h-full card-content-contained">
      <CardContent className="p-2 h-full flex flex-col card-content-centered">
        {/* Header with icon and trend */}
        <div className="flex items-start justify-between mb-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${color}-100 text-${color}-600 dark:bg-${color}-900/20 dark:text-${color}-400 flex-shrink-0`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <div className={`flex items-center text-sm font-medium ${trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <TrendingUp className={`h-4 w-4 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          <p className="text-sm font-medium text-muted-foreground mb-2 truncate">{title}</p>
          <p className="text-1xl font-bold text-foreground mb-1 truncate">{value}</p>
          {change && (
            <p className="text-sm text-muted-foreground truncate">{change}</p>
          )}
        </div>

        {/* Footer link */}
        {link && (
          <div className="mt-4 pt-4 border-t border-border flex-shrink-0">
            <Link
              to={link}
              className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors group-hover:translate-x-1 transform duration-200"
            >
              {t('common.viewAll')}
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
  const navigate = useNavigate();

  const QuickAction = ({ title, description, icon: Icon, color, link }) => (
    <Card className="group hover:shadow-medium transition-all duration-200 hover:scale-[1.02]">
      <CardContent className="p-6">
        <Link to={link} className="block">
          <div className="flex items-start justify-between">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${color}-100 text-${color}-600 dark:bg-${color}-900/20 dark:text-${color}-400 group-hover:scale-110 transition-transform duration-200`}>
              <Icon className="h-6 w-6" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
              {title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </Link>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full space-y-8" dir={isRTL ? 'rtl2' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-foreground truncate">
            {t('dashboard.welcome')} {user?.firstName}!
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t('dashboard.storeOverview')}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* navigate to analytics page */}
          <Button variant="outline" leftIcon={<BarChart3 className="h-4 w-4" />} className="hidden sm:flex"
          onClick={() => navigate('/analytics')}>
            {t('dashboard.viewReports')}
            
            

          </Button >
          {/* <Button leftIcon={<Plus className="h-4 w-4" />}>
            <span className="hidden sm:inline">{t('dashboard.quickAdd')}</span>
            <span className="sm:hidden">Add</span>
          </Button> */}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      ) : hasError ? (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">
                {t('dashboard.failedToLoadStats')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : orderStats && customerStats && productStats ? (
        <>
          {/* Main Statistics */}
          <div className="grid-responsive-stats">
            <StatCard
              title={t('dashboard.totalOrders')}
              value={formatNumber(orderStats.totalOrders)}
              icon={ShoppingCart}
              color="blue"
              link="/orders"
              trend={12}
            />
            <StatCard
              title={t('dashboard.totalRevenue')}
              value={formatCurrency(orderStats.totalRevenue)}
              icon={CurrencyIcon}
              color="green"
              link="/orders"
              trend={8}
            />
            <StatCard
              title={t('dashboard.totalCustomers')}
              value={formatNumber(customerStats.totalCustomers)}
              icon={Users}
              color="indigo"
              link="/customers"
              trend={15}
            />
            <StatCard
              title={t('dashboard.totalProducts')}
              value={formatNumber(productStats.totalProducts)}
              icon={Package}
              color="purple"
              link="/products"
              trend={-3}
            />
          </div>

          {/* Secondary Statistics */}
          <div className="grid-responsive-stats">
            <StatCard
              title={t('dashboard.averageOrderValue')}
              value={formatCurrency(orderStats.averageOrderValue)}
              icon={TrendingUp}
              color="green"
              trend={5}
            />
            <StatCard
              title={t('dashboard.cancelledOrders')}
              value={formatNumber(orderStats.cancelledOrders)}
              icon={X}
              color="red"
              link="/orders?status=cancelled"
            />
            <StatCard
              title={t('dashboard.newCustomers')}
              value={formatNumber(customerStats.newCustomersThisMonth)}
              icon={Users}
              color="blue"
              change={t('dashboard.thisMonth')}
              trend={22}
            />
            <StatCard
              title={t('dashboard.lowStockItems')}
              value={formatNumber(productStats.lowStockCount)}
              icon={AlertTriangle}
              color="yellow"
              link="/products?inStock=low"
            />
            <StatCard
              title={t('dashboard.outOfStock')}
              value={formatNumber(productStats.outOfStockCount)}
              icon={AlertTriangle}
              color="red"
              link="/products?filter=out-of-stock"
            />
          </div>
        </>
      ) : null}

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between1 mb-6">
          <h2 className="text-xl font-semibold text-foreground">{t('dashboard.quickActions')}</h2>
          
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            title={t('dashboard.addNewCustomer')}
            description={t('dashboard.addNewCustomerDesc')}
            icon={Users}
            color="blue"
            link="/customers/new"
          />
          <QuickAction
            title={t('dashboard.createOrder')}
            description={t('dashboard.createOrderDesc')}
            icon={ShoppingCart}
            color="green"
            link="/orders/new"
          />
          <QuickAction
            title={t('dashboard.manageInventory')}
            description={t('dashboard.manageInventoryDesc')}
            icon={Package}
            color="purple"
            link="/products/inventory"
          />
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid-responsive-dashboard min-h-0">
        {/* Order Status Overview */}
        {orderStats?.ordersByStatus && (
          <Card className="flex flex-col border-l-4 border-l-blue-500">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                {t('dashboard.orderStatusOverview')}
              </CardTitle>
              <CardDescription className="text-blue-600/70 dark:text-blue-400/70 ml-7">
                {t('dashboard.orderStatusDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                {orderStats.ordersByStatus.map((status) => {
                  const getStatusColors = (statusType) => {
                    switch (statusType) {
                      case 'completed':
                        return {
                          dot: 'bg-green-500',
                          text: 'text-green-700 dark:text-green-400',
                          badge: 'bg-green-100 text-green-800    dark:text-green-400',
                          hover: 'hover:bg-green-50 dark:hover:bg-green-900/10'
                        };
                      case 'processing':
                        return {
                          dot: 'bg-blue-500',
                          text: 'text-blue-700 dark:text-blue-400',
                          badge: 'bg-blue-100 text-blue-800  dark:text-blue-400',
                          hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/10'
                        };
                      case 'pending':
                        return {
                          dot: 'bg-yellow-500',
                          text: 'text-yellow-900 dark:text-yellow-600',
                          badge: 'bg-yellow-100 text-yellow-800  dark:text-yellow-500',
                          hover: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                        };
                      default:
                        return {
                          dot: 'bg-red-500',
                          text: 'text-red-700 dark:text-red-400',
                          badge: 'bg-red-100 text-red-800  dark:text-red-400',
                          hover: 'hover:bg-red-50 dark:hover:bg-red-900/10'
                        };
                    }
                  };

                  const colors = getStatusColors(status.status);

                  return (
                    <Link
                      key={status.status}
                      to={`/orders?status=${status.status}`}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 cursor-pointer group ${colors.hover}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${colors.dot} shadow-sm`} />
                        <span className={`text-sm font-medium capitalize ${colors.text} group-hover:font-semibold transition-all`}>
                          {t(`status.${status.status}`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${colors.badge} border-0 font-semibold`}>
                          {formatNumber(status.count)}
                        </Badge>
                        <ArrowUpRight className={`h-4 w-4 ${colors.text} group-hover:scale-110 transition-all`} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Products */}
        {orderStats?.topProducts && (
          <Card className="flex flex-col border-l-4 border-l-green-500">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <TrendingUp className="h-5 w-5 text-green-600" />
                {t('dashboard.topSellingProducts')}
              </CardTitle>
              <CardDescription className="text-green-600/70 dark:text-green-400/70 ml-7">
                {t('dashboard.topProductsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                {orderStats.topProducts.slice(0, 5).map((product, index) => {
                  const getRankColors = (rank) => {
                    switch (rank) {
                      case 0: // 1st place
                        return {
                          bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
                          text: 'text-yellow-900',
                          productName: 'text-yellow-700 dark:text-yellow-500',
                          badge: 'bg-yellow-300 text-yellow-800 border-yellow-200 dark:text-yellow-900  ',
                          hover: 'hover:bg-yellow-50 ',
                          icon: '🥇'
                        };
                      case 1: // 2nd place
                        return {
                          bg: 'bg-gradient-to-r from-gray-300 to-gray-400',
                          text: 'text-gray-900',
                          productName: 'text-gray-800 dark:text-gray-500',
                          badge: 'bg-gray-100 text-gray-400 border-gray-100 dark:bg-gray-900/20 dark:text-gray-900 ',
                          hover: 'hover:bg-gray-50 dark:hover:bg-gray-900/10',
                          icon: '🥈'
                        };
                      case 2: // 3rd place
                        return {
                          bg: 'bg-gradient-to-r from-orange-400 to-orange-500',
                          text: 'text-orange-900',
                          productName: 'text-orange-800 dark:text-orange-400',
                          badge: 'bg-orange-100 text-orange-800 border-orange-100 dark:bg-orange-900/10 dark:text-orange-400 ',
                          hover: 'hover:bg-orange-50 dark:hover:bg-orange-900/10',
                          icon: '🥉'
                        };
                      default: // 4th and 5th place
                        return {
                          bg: 'bg-gradient-to-r from-blue-400 to-blue-500',
                          text: 'text-blue-900',
                          productName: 'text-blue-800 dark:text-blue-400',
                          badge: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/10 dark:text-blue-400 ',
                          hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/10',
                          icon: '🏆'
                        };
                    }
                  };

                  const colors = getRankColors(index);

                  return (
                    <div key={product.product.id} className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${colors.hover} group`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.bg} shadow-sm`}>
                          <span className={`font-bold text-sm ${colors.text}`}>
                            #{index + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{colors.icon}</span>
                          <div>
                            <p className={`text-sm font-semibold ${colors.productName} group-hover:font-bold transition-all`}>
                              {product.product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">{formatNumber(product.totalSold)}</span> {t('dashboard.sold')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Badge className={`${colors.badge} font-semibold shadow-sm`}>
                        {formatCurrency(product.totalRevenue)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
