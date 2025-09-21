import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '../../utils/formatters';

const CustomerChart = ({ data }) => {
  const { t } = useTranslation();
  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Acquisition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-gray-500">
              No customer data available
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Customer segmentation data for pie chart
  const segmentationData = data && data.customerSegmentation ? [
    { name:  t("analytics.newCustomers"), value: data.customerSegmentation.newCustomers  || 0, color: '#3b82f6' },
    { name: t("analytics.returningCustomers") , value: data.customerSegmentation.returningCustomers || 0, color: '#10b981' },
    { name:  t("analytics.loyalCustomers"), value: data.customerSegmentation.loyalCustomers || 0, color: '#f59e0b' },
  ].filter(item => item.value > 0) : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{formatDate(label)}</p>
          <p className="text-blue-600">
             {t("analytics.newCustomers")} : {formatNumber(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-blue-600">{t("analytics.count")}: {formatNumber(data.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Key Customer Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">{t("analytics.averageCLV")}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data?.averageCustomerLifetimeValue || 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">{t("analytics.repeatPurchaseRate")}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber((data?.repeatPurchaseRate || 0).toFixed(1))} %
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">{t("analytics.activeCustomers")}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(data?.totalCustomersWithOrders) || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Acquisition Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.customerAcquisition')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.customerAcquisition || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="newCustomers" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Segmentation Chart */}
        <Card>
          <CardHeader>
            <CardTitle> {t('analytics.customerSegmentation')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${formatNumber((percent * 100).toFixed(0))} %`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {segmentationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerChart;
