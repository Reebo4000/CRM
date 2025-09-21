import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Calendar, TrendingUp, Users, DollarSign, ShoppingCart, AlertTriangle, Clock, Download, ChevronDown, X } from 'lucide-react';
import { formatCurrency, formatDate, formatNumber, formatOrderStatusTranslated, formatTime } from '../utils/formatters';
import { analyticsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';


// Import chart components (we'll create these next)
import RevenueChart from '../components/analytics/RevenueChart';
import CategoryChart from '../components/analytics/CategoryChart';
import CustomerChart from '../components/analytics/CustomerChart';
import ProductPerformanceChart from '../components/analytics/ProductPerformanceChart';

const Analytics = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days back (1 month)
    endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Today
  });



  // Analytics data state
  const [dashboardData, setDashboardData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [productData, setProductData] = useState(null);
  const [operationalData, setOperationalData] = useState(null);

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };

      // Fetch data sequentially to better handle errors
      const dashboard = await analyticsAPI.getDashboard(params);
      setDashboardData(dashboard.data.data); // Extract the nested data

      const sales = await analyticsAPI.getSales(params);
      setSalesData(sales.data.data); // Extract the nested data

      const customers = await analyticsAPI.getCustomers(params);
      setCustomerData(customers.data.data); // Extract the nested data

      const products = await analyticsAPI.getProducts(params);
      setProductData(products.data.data); // Extract the nested data

      const operations = await analyticsAPI.getOperations(params);
      setOperationalData(operations.data.data); // Extract the nested data

    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      setError(`Failed to load analytics data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportDropdown && !event.target.closest('.export-dropdown')) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Export analytics data to PDF
  const handleExportPDF = async (reportType = 'overview') => {
    try {
      setExportLoading(true);

      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        reportType,
        language: localStorage.getItem('i18nextLng') || 'en'
      };

      const response = await analyticsAPI.exportPDF(params);

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      link.download = `Analytics_Report_${currentDate}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message (you can add toast notification here)
      console.log('PDF exported successfully');

    } catch (error) {
      console.error('Export PDF error:', error);
      // Show error message (you can add toast notification here)
      alert(t('analytics.exportError') || 'Failed to export PDF. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} onRetry={fetchAnalyticsData} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('analytics.title')}</h1>
          <p className="text-gray-600 mt-2">{t('analytics.overview')}</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <span className="text-gray-500">{t('analytics.dateRange')}</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
              {t('common.refresh')}
            </Button>

            {/* Export PDF Dropdown */}
            <div className="relative export-dropdown">
              <Button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                variant="default"
                size="sm"
                disabled={exportLoading}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>{exportLoading ? t('analytics.exporting') || 'Exporting...' : t('analytics.exportPDF') || 'Export PDF'}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>

              {showExportDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleExportPDF('overview');
                        setShowExportDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('analytics.overviewReport') || 'Overview Report'}
                    </button>
                    <button
                      onClick={() => {
                        handleExportPDF('sales');
                        setShowExportDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('analytics.salesReport') || 'Sales Report'}
                    </button>
                    <button
                      onClick={() => {
                        handleExportPDF('customers');
                        setShowExportDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('analytics.customersReport') || 'Customers Report'}
                    </button>
                    <button
                      onClick={() => {
                        handleExportPDF('products');
                        setShowExportDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('analytics.productsReport') || 'Products Report'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>





      {/* Key Metrics Cards */}
      {dashboardData && dashboardData.keyMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('dashboard.totalRevenue')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardData.keyMetrics.totalRevenue || 0)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('dashboard.totalOrders')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber((dashboardData.keyMetrics.totalOrders || 0).toLocaleString())}
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('dashboard.cancelledOrders')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber((dashboardData.keyMetrics.cancelledOrders || 0).toLocaleString())}
                  </p>
                </div>
                <X className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('dashboard.totalCustomers')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber((dashboardData.keyMetrics.totalCustomers || 0).toLocaleString())}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{t('dashboard.averageOrderValue')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardData.keyMetrics.averageOrderValue || 0)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6 ">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger className="bg-blue-700  text-white ml-2" value="overview">{t('analytics.overview')}</TabsTrigger>
          <TabsTrigger className="bg-blue-700  text-white ml-2" value="sales">{t('analytics.sales')}</TabsTrigger>
          <TabsTrigger className="bg-blue-700  text-white ml-2" value="customers">{t('analytics.customers')}</TabsTrigger>
          <TabsTrigger className="bg-blue-700  text-white ml-2" value="products">{t('analytics.products')}</TabsTrigger>
          <TabsTrigger className="bg-blue-700  text-white ml-2" value="operations">{t('analytics.operations')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            {dashboardData && dashboardData.recentOrders && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    {t('analytics.recentOrders')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(dashboardData.recentOrders || []).length > 0 ? (
                      (dashboardData.recentOrders || []).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900"># {formatNumber(order.id)}</p>
                            <p className="text-sm text-gray-600">{order.customerName}</p>
                            <p className="text-xs text-gray-500">{formatDate(order.orderDate)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{formatCurrency(order.totalAmount)}</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : order.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {formatOrderStatusTranslated(order.status, t)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        No recent orders found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Low Stock Alerts */}
            {dashboardData && dashboardData.lowStockAlerts && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                    {t("analytics.lowStockAlerts")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(dashboardData.lowStockAlerts || []).length > 0 ? (
                      (dashboardData.lowStockAlerts || []).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.category}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              {product.stockQuantity} {t('inventory.inStock')}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        {t('analytics.noPeakSalesData')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          {salesData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <RevenueChart data={salesData.revenueTrends} />
              <CategoryChart data={salesData.salesByCategory} />
            </div>
          )}
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          {customerData && (
            <CustomerChart data={customerData} />
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {productData && (
            <ProductPerformanceChart data={productData} />
          )}
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          {operationalData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle> {t('analytics.orderStatusDistribution')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(operationalData.orderStatusDistribution || []).length > 0 ? (
                      (operationalData.orderStatusDistribution || []).map((item) => (
                        <div key={item.status} className="flex items-center justify-between">
                          {/* <span className="capitalize text-gray-700">{formatOrderStatusTranslated(item.status,t)}</span> */}
                           <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : item.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : item.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {formatOrderStatusTranslated(item.status, t)}
                            </span>
                          <span className="font-medium">{formatNumber(item.count)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        No order status data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.peakSalesHours')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(operationalData.peakSalesHours || []).length > 0 ? (
                      (operationalData.peakSalesHours || []).slice(0, 5).map((item) => (
                        <div key={item.hour} className="flex items-center justify-between">
                          <span className="text-gray-700">{formatNumber(item.hour)}:{formatNumber(0o0)}{formatNumber(0o0)}</span>
                          <span className="font-medium">{formatNumber(item.orderCount)} {t('dashboard.orders')}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        {t('analytics.noPeakSalesData')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
