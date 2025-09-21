import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { Package, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ProductPerformanceChart = ({ data }) => {
    const { t } = useTranslation();
  
  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-gray-500">
              {t("analytics.No product data available")}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Top 10 products by revenue for chart
  const allProducts = data?.inventoryPerformance || [];

  // Process products for chart - ensure we have valid data
  const processedProducts = allProducts.map(product => ({
    ...product,
    totalRevenue: parseFloat(product.totalRevenue) || 0,
    totalSold: parseInt(product.totalSold) || 0,
    stockQuantity: parseInt(product.stockQuantity) || 0
  }));

  const productsWithRevenue = processedProducts.filter(product => product.totalRevenue > 0);
  const topProducts = productsWithRevenue
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);



  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{data.category}</p>
          <p className="text-blue-600">
            {t("analytics.Revenue")}: {formatCurrency(data.totalRevenue)}
          </p>
          <p className="text-green-600">
            {t("analytics.Sold")}: {formatNumber(data.totalSold)}
          </p>
          <p className="text-orange-600">
            {t("analytics.Stock")}: {formatNumber(data.stockQuantity)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Product Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t("analytics.Total Products")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data?.inventoryPerformance?.length) || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t("analytics.Fast Moving")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data?.fastMovingProducts) || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t("analytics.Slow Moving")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data?.slowMovingProducts) || 0}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t("analytics.Low Stock")}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(data?.lowStockProducts) || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.Top Products by Revenue")}</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="h-64 w-full bg-white" style={{ backgroundColor: '#ffffff' }}>
                <style>
                  {`
                    .recharts-wrapper {
                      background-color: #ffffff !important;
                    }
                    .recharts-surface {
                      background-color: #ffffff !important;
                    }
                  `}
                </style>
                <ResponsiveContainer width="100%" height="100%" style={{ backgroundColor: '#ffffff' }}>
                  <BarChart
                    data={topProducts}
                    layout="horizontal"
                    margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12, fill: '#374151' }}
                      tickFormatter={(value) => formatCurrency(value)}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#374151' }}
                      width={120}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="totalRevenue"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                      stroke="none"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                {t("analytics.No product data available")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.Category Performance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.categoryPerformance || [])
                .filter(cat => cat.totalRevenue > 0)
                .slice(0, 8)
                .map((category) => (
                <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{category.category}</p>
                    <p className="text-sm text-gray-600">
                      {formatNumber(category.productCount)} {t("analytics.products")} - {formatNumber(category.totalSold)} {t("analytics.Sold")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(category.totalRevenue)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("analytics.Avg Price")}: {formatCurrency(category.avgPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.Inventory Performance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("analytics.Product")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("analytics.Category")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("analytics.Stock")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("analytics.Sold")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("analytics.Revenue")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(data?.inventoryPerformance || []).slice(0, 10).map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(product.price)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (product.stockQuantity) <= 10 
                          ? 'bg-red-100 text-red-800'
                          : product.stockQuantity <= 20
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {formatNumber(product.stockQuantity)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(product.totalSold)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductPerformanceChart;
