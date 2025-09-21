import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePaginatedApi, useApiSubmit, useNotificationPreferences } from '../../hooks/useApi';
import { productAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  Plus,
  Minus,
  Save,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  formatNumber,
  getStockLevelTranslated,
  getStockLevelColor,
  formatDate
} from '../../utils/formatters';

const InventoryManagement = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [adjustments, setAdjustments] = useState({});
  const [adjustmentNotes, setAdjustmentNotes] = useState({});

  // Get dynamic stock thresholds from user preferences
  const { getStockThresholds, loading: preferencesLoading, preferences } = useNotificationPreferences();

  // Wait for preferences to load before getting thresholds
  const stockThresholds = React.useMemo(() => {
    if (preferencesLoading || !preferences) {
      // Return default thresholds while loading
      return { low: 5, medium: 10 };
    }
    return getStockThresholds();
  }, [preferencesLoading, preferences, getStockThresholds]);

  const {
    data: products,
    pagination,
    loading,
    error,
    params,
    updateParams,
    refetch
  } = usePaginatedApi(productAPI.getAll, {
    page: 1,
    limit: 50,
    search: '',
    inStock: '',
    sortBy: 'stockQuantity',
    sortOrder: 'ASC'
  });

  // Handle search and filters with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateParams({ 
        search: searchTerm, 
        inStock: stockFilter
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, stockFilter, updateParams]);

  const { submit: submitAdjustment, loading: submittingAdjustment } = useApiSubmit(
    ({ productId, newQuantity, notes }) => productAPI.updateStock(productId, {
      quantity: newQuantity,
      operation: 'set',
      reason: notes
    }),
    {
      onSuccess: () => {
        // Clear adjustments and refresh data
        setAdjustments({});
        setAdjustmentNotes({});
        refetch();
      },
      onError: (error) => {
        alert(t('inventory.failedToAdjustStock') + ': ' + error.message);
      }
    }
  );

  const handleAdjustmentChange = (productId, value) => {
    // Handle empty string as 0, but preserve the actual input for better UX
    const numericValue = value === '' ? 0 : parseInt(value) || 0;
    setAdjustments(prev => ({
      ...prev,
      [productId]: numericValue
    }));
  };

  const handleNotesChange = (productId, notes) => {
    setAdjustmentNotes(prev => ({
      ...prev,
      [productId]: notes
    }));
  };

  const handleQuickAdjustment = (productId, amount) => {
    setAdjustments(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + amount
    }));
  };

  const handleSubmitAdjustment = async (productId) => {
    const adjustment = adjustments[productId];
    const notes = adjustmentNotes[productId];

    if (adjustment === 0 || adjustment === null || adjustment === undefined) {
      alert(t('inventory.enterAdjustmentAmount'));
      return;
    }

    const product = products.find(p => p.id === productId);
    const newQuantity = Math.max(0, product.stockQuantity + adjustment);



    await submitAdjustment({
      productId,
      newQuantity,
      notes: notes || null
    });
  };

  const handleBulkAdjustment = async () => {
    const adjustmentsToSubmit = Object.entries(adjustments)
      .filter(([_, adjustment]) => adjustment !== 0)
      .map(([productId, adjustment]) => {
        const product = products.find(p => p.id === parseInt(productId));
        const newQuantity = Math.max(0, product.stockQuantity + adjustment);
        return {
          productId: parseInt(productId),
          newQuantity,
          notes: adjustmentNotes[productId] || null
        };
      });

    if (adjustmentsToSubmit.length === 0) {
      alert('No adjustments to submit');
      return;
    }

    if (window.confirm(`Submit ${adjustmentsToSubmit.length} inventory adjustments?`)) {
      try {
        await Promise.all(
          adjustmentsToSubmit.map(({ productId, newQuantity, notes }) =>
            productAPI.updateStock(productId, {
              quantity: newQuantity,
              operation: 'set',
              reason: notes
            })
          )
        );

        setAdjustments({});
        setAdjustmentNotes({});
        refetch();
      } catch (error) {
        alert(t('inventory.failedBulkAdjustments') + ': ' + error.message);
      }
    }
  };

  if (loading && !products.length) {
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
          {t('inventory.failedToLoadProducts')}: {error.message}
        </div>
      </div>
    );
  }

  const hasAdjustments = Object.values(adjustments).some(adj => adj !== 0);
  const lowStockProducts = products.filter(p => p.stockQuantity <= stockThresholds.low && p.stockQuantity > 0);
  const outOfStockProducts = products.filter(p => p.stockQuantity === 0);

  return (
    <div className="space-y-6">
      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 m-2">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('inventory.totalProducts')}</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {pagination.totalItems}
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
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('inventory.lowStock')}</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {lowStockProducts.length}
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
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('inventory.outOfStock')}</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {outOfStockProducts.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Management Table */}
      <div className="bg-white shadow rounded-lg">
        {/* Search and Filter Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('inventory.searchProducts')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('inventory.allStockLevels')}</option>
                <option value="false">{t('inventory.outOfStock')}</option>
                <option value="low">{t('inventory.lowStockFilter')}</option>
                <option value="true">{t('inventory.inStock')}</option>
              </select>
              <select
                value={params?.limit || 50}
                onChange={(e) => updateParams({ limit: parseInt(e.target.value), page: 1 })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={25}>25 {t('common.perPage')}</option>
                <option value={50}>50 {t('common.perPage')}</option>
                <option value={100}>100 {t('common.perPage')}</option>
                <option value={200}>200 {t('common.perPage')}</option>
              </select>
              {hasAdjustments && (
                <button
                  onClick={handleBulkAdjustment}
                  disabled={submittingAdjustment}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {submittingAdjustment ? (
                    <LoadingSpinner size="small" className="mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('inventory.saveAllChanges')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('inventory.product')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('inventory.currentStock')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('inventory.adjustment')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('inventory.newStock')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('inventory.notes')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('inventory.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <InventoryRow
                  key={product.id}
                  product={product}
                  adjustment={adjustments[product.id] || 0}
                  notes={adjustmentNotes[product.id] || ''}
                  onAdjustmentChange={(value) => handleAdjustmentChange(product.id, value)}
                  onNotesChange={(notes) => handleNotesChange(product.id, notes)}
                  onQuickAdjustment={(amount) => handleQuickAdjustment(product.id, amount)}
                  onSubmit={() => handleSubmitAdjustment(product.id)}
                  submitting={submittingAdjustment}
                  stockThresholds={stockThresholds}
                />
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">
              {searchTerm || stockFilter ?
                'Try adjusting your search or filter criteria.' :
                'No products available for inventory management.'
              }
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => updateParams({ page: pagination.currentPage - 1 })}
                disabled={pagination.currentPage <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.previous')}
              </button>
              <button
                onClick={() => updateParams({ page: pagination.currentPage + 1 })}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.next')}
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {t('common.showing')} <span className="font-medium">{(formatNumber(pagination.currentPage - 1) * (params?.limit || 50)) + 1}</span> {t('common.to')} <span className="font-medium">{Math.min(formatNumber(pagination.currentPage) * (params?.limit || formatNumber(50)), formatNumber(pagination.totalItems))}</span> {t('common.of')} <span className="font-medium">{formatNumber(pagination.totalItems)}</span> {t('common.results')}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => updateParams({ page: pagination.currentPage - 1 })}
                    disabled={pagination.currentPage <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">{t('common.previous')}</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => updateParams({ page: pageNum })}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === pagination.currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => updateParams({ page: pagination.currentPage + 1 })}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">{t('common.next')}</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Individual Inventory Row Component
const InventoryRow = ({
  product,
  adjustment,
  notes,
  onAdjustmentChange,
  onNotesChange,
  onQuickAdjustment,
  onSubmit,
  submitting,
  stockThresholds
}) => {
  const { t } = useTranslation();
  const stockLevel = getStockLevelTranslated(product.stockQuantity, t, stockThresholds);
  const stockColor = getStockLevelColor(product.stockQuantity, stockThresholds);
  const newStock = Math.max(0, product.stockQuantity + adjustment);
  const newStockLevel = getStockLevelTranslated(newStock, t, stockThresholds);
  const newStockColor = getStockLevelColor(newStock, stockThresholds);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{product.name}</div>
          <div className="text-sm text-gray-500">{product.category}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-900 mr-2">
            {formatNumber(product.stockQuantity)}
          </span>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            stockColor === 'green' ? 'bg-green-100 text-green-800' :
            stockColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            stockColor === 'orange' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {stockLevel}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onQuickAdjustment(-10)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Decrease by 10"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => onQuickAdjustment(-1)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Decrease by 1"
          >
            <Minus className="h-3 w-3" />
          </button>
          <input
            type="number"
            value={adjustment}
            onChange={(e) => onAdjustmentChange(e.target.value)}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-center"
            placeholder="0"
          />
          <button
            onClick={() => onQuickAdjustment(1)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Increase by 1"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={() => onQuickAdjustment(10)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Increase by 10"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-900 mr-2">
            {formatNumber(newStock)}
          </span>
          {adjustment !== 0 && (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              newStockColor === 'green' ? 'bg-green-100 text-green-800' :
              newStockColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
              newStockColor === 'orange' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {newStockLevel}
            </span>
          )}
          {adjustment > 0 && (
            <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
          )}
          {adjustment < 0 && (
            <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          placeholder={t('inventory.addNotes')}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {adjustment !== 0 && (
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? (
              <LoadingSpinner size="small" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </button>
        )}
      </td>
    </tr>
  );
};

export default InventoryManagement;
