import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePaginatedApi, useApi, useNotificationPreferences } from '../../hooks/useApi';
import { productAPI } from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import Badge from '../ui/Badge';
import { ScreenReaderOnly } from '../common/AccessibilityProvider';
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import CurrencyIcon from '../ui/CurrencyIcon';
import {
  formatCurrency,
  formatNumber,
  getStockLevelTranslated,
  getStockLevelColor
} from '../../utils/formatters';

const ProductList = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const isRTL = i18n.language === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Get dynamic stock thresholds from user preferences
  const { getStockThresholds } = useNotificationPreferences();
  const stockThresholds = getStockThresholds();

  // Handle both 'inStock' and 'filter' URL parameters
  const getInitialStockFilter = () => {
    const inStockParam = searchParams.get('inStock');
    const filterParam = searchParams.get('filter');

    if (inStockParam) return inStockParam;

    // Convert dashboard filter values to inStock values
    if (filterParam === 'out-of-stock') return 'false';
    if (filterParam === 'low-stock') return 'low';

    return '';
  };

  const [stockFilter, setStockFilter] = useState(getInitialStockFilter());
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Fetch categories for the filter dropdown
  const {
    data: categoriesData,
    loading: loadingCategories,
    error: categoriesError
  } = useApi(() => productAPI.getCategories(), []);

  const categories = categoriesData?.categories || [];

  const {
    data: products,
    pagination,
    loading,
    error,
    updateParams,
    goToPage,
    nextPage,
    prevPage
  } = usePaginatedApi(productAPI.getAll, {
    page: 1,
    limit: 12,
    search: '',
    category: '',
    inStock: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  });

  // Handle search and filters with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateParams({ 
        search: searchTerm, 
        category: categoryFilter,
        inStock: stockFilter,
        sortBy, 
        sortOrder 
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, categoryFilter, stockFilter, sortBy, sortOrder, updateParams]);



  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(productId);
        // Refresh the list
        updateParams({});
      } catch (error) {
        alert('Failed to delete product: ' + error.message);
      }
    }
  };

  if (loading && !products.length) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="p-6">
          <div className="text-sm text-destructive">
            Failed to load products: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <Card className= 'mt-8'>
        {/* <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products
              </CardTitle>
              <CardDescription>
                Manage your product inventory and catalog
              </CardDescription>
            </div>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => navigate('/products/new')}
              className="w-full sm:w-auto"
            >
              <span className="sm:hidden">Add New Product</span>
              <span className="hidden sm:inline">Add Product</span>
            </Button>
          </div>
        </CardHeader> */}
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="space-y-4 lg:space-y-0 lg:grid lg:items-center lg:gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={t('products.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={!isRTL ? <Search className="h-4 w-4" /> : undefined}
                rightIcon={isRTL ? <Search className="h-4 w-4" /> : undefined}
                className="w-full"
                aria-label={t('products.searchProducts')}
                role="searchbox"
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-select1"
                aria-label={t('products.filterByCategory')}
                disabled={loadingCategories}
              >
                <option value="">{t('products.allCategories')}</option>
                {loadingCategories ? (
                  <option disabled>{t('products.loadingCategories')}</option>
                ) : categoriesError ? (
                  <option disabled>{t('products.errorLoadingCategories')}</option>
                ) : (
                  categories.map((category) => (
                    <option key={category.category} value={category.category}>
                      {category.category} ({category.productCount})
                    </option>
                  ))
                )}
              </select>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="form-select1"
                aria-label={t('products.filterByStock')}
              >
                <option value="">{t('products.allStockLevels')}</option>
                <option value="true">{t('products.inStock')}</option>
                <option value="false">{t('products.outOfStock')}</option>
                <option value="low">{t('products.lowStock')} (≤5)</option>
                <option value="medium">{t('products.mediumStock')} (6-20)</option>
                <option value="high">{t('products.highStock')} (&gt;20)</option>
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="form-select1"
                aria-label={t('products.sortProducts')}
              >
                <option value="createdAt-DESC">{t('products.sort.newestFirst')}</option>
                <option value="createdAt-ASC">{t('products.sort.oldestFirst')}</option>
                <option value="name-ASC">{t('products.sort.nameAZ')}</option>
                <option value="name-DESC">{t('products.sort.nameZA')}</option>
                <option value="price-ASC">{t('products.sort.priceLowHigh')}</option>
                <option value="price-DESC">{t('products.sort.priceHighLow')}</option>
                <option value="stockQuantity-ASC">{t('products.sort.stockLowHigh')}</option>
                <option value="stockQuantity-DESC">{t('products.sort.stockHighLow')}</option>
              </select>
              
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      <Card>
        {products.length === 0 ? (
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter || stockFilter ?
                'Try adjusting your search or filter criteria.' :
                'Get started by adding your first product.'
              }
            </p>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/products/new')}>
              Add Product
            </Button>
          </CardContent>
        ) : (
          <CardContent className="p-6">
            {/* Responsive Grid View */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              role="grid"
              aria-label={`${products.length} products found`}
            >
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDelete}
                  gridIndex={index + 1}
                  totalProducts={products.length}
                  stockThresholds={stockThresholds}
                />
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <nav
              aria-label="Product pagination"
              className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              {/* Mobile pagination */}
              <div className="flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  onClick={prevPage}
                  disabled={!pagination.hasPrev}
                  leftIcon={isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  className="flex-1 mr-2 focus-ring"
                  aria-label={`Go to previous page, currently on page ${formatNumber(pagination.currentPage)}`}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  onClick={nextPage}
                  disabled={!pagination.hasNext}
                  rightIcon={isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  className="flex-1 ml-2 focus-ring"
                  aria-label={`Go to next page, currently on page ${formatNumber(pagination.currentPage)}`}
                >
                  {t('common.next')}
                </Button>
              </div>

              {/* Mobile page info */}
              <div
                className="text-center text-sm text-muted-foreground sm:hidden"
                aria-live="polite"
                aria-atomic="true"
              >
{t('common.pageOf', { current: formatNumber(pagination.currentPage), total: formatNumber(pagination.totalPages) })}
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
{t('common.showingPage', {
                      current: formatNumber(pagination.currentPage),
                      total: formatNumber(pagination.totalPages),
                      totalItems: formatNumber(pagination.totalItems)
                    })}
                  </p>
                </div>
                <div>
                  <nav className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={!pagination.hasPrev}
                      leftIcon={isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                      className="focus-ring"
                      aria-label={`Go to previous page, currently on page ${formatNumber(pagination.currentPage)}`}
                    >
                      {t('common.previous')}
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1" role="group" aria-label="Page navigation">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                        if (pageNum > pagination.totalPages) return null;

                        const isCurrentPage = pageNum === pagination.currentPage;
                        return (
                          <Button
                            key={pageNum}
                            variant={isCurrentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            className="min-w-[40px] focus-ring"
                            aria-label={`Go to page ${pageNum}`}
                            aria-current={isCurrentPage ? 'page' : undefined}
                          >
                            {formatNumber(pageNum)}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={!pagination.hasNext}
                      rightIcon={isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      className="focus-ring"
                      aria-label={`Go to next page, currently on page ${formatNumber(pagination.currentPage)}`}
                    >
                      {t('common.next')}
                    </Button>
                  </nav>
                </div>
              </div>
            </nav>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, onDelete, gridIndex, totalProducts, stockThresholds }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const stockLevel = getStockLevelTranslated(product.stockQuantity, t, stockThresholds);
  const stockColor = getStockLevelColor(product.stockQuantity, stockThresholds);

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all duration-200 active:scale-95 focus-ring"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="gridcell"
      aria-label={`Product ${gridIndex} of ${totalProducts}: ${product.name}, ${formatCurrency(product.price)}, ${stockLevel}`}
    >
      {/* Product Image */}
      <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-xl bg-gray-100">
        {product.imagePath ? (
          <img
            src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${product.imagePath}`}
            alt={product.name}
            className="w-full h-48 sm:h-52 object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`w-full h-48 sm:h-52 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center ${product.imagePath ? 'hidden' : ''}`}
        >
          <Package className="h-12 w-12 text-primary/40" aria-hidden="true" />
        </div>
      </div>

      <CardContent className="p-4">
        {/* Product Name and Category */}
        <div className="mb-3">
          <h3 className="text-lg font-medium ">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500">{product.category}</p>
          {product.brand && (
            <p className="text-xs text-gray-400">{product.brand}</p>
          )}
        </div>

        {/* Price and Stock */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <CurrencyIcon className="h-4 w-4" color="text-green-600" />
            <span className="text-sm font-medium">
              {formatCurrency(product.price)}
            </span>
          </div>
          <Badge variant={
            stockColor === 'green' ? 'success' :
            stockColor === 'yellow' ? 'warning' :
            stockColor === 'orange' ? 'warning' :
            'destructive'
          }>
            {stockLevel}
          </Badge>
        </div>

        {/* Stock Quantity */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-gray-600 gap-1">
            <Package className="h-4 w-4" />
            <span>{formatNumber(product.stockQuantity)} {t('products.inStock')}</span>
          </div>
          {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          )}
          {product.stockQuantity === 0 && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </div>

        {/* Product Details */}
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Product Attributes */}
        <div className="flex flex-wrap gap-1 mb-4">
          {product.color && (
            <Badge variant="outline" className="text-xs">
              {product.color}
            </Badge>
          )}
          {product.material && (
            <Badge variant="outline" className="text-xs">
              {product.material}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2" role="group" aria-label="Product actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/products/${product.id}`);
              }}
              aria-label={`View details for ${product.name}`}
              className="min-h-[40px] min-w-[40px] p-2 focus-ring"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              <ScreenReaderOnly>{t('products.viewDetails')}</ScreenReaderOnly>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/products/${product.id}/edit`);
              }}
              aria-label={`${t('products.edit')} ${product.name}`}
              className="min-h-[40px] min-w-[40px] p-2 focus-ring"
            >
              <Edit className="h-4 w-4" aria-hidden="true" />
              <ScreenReaderOnly>{t('products.editProduct')}</ScreenReaderOnly>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product.id);
              }}
              aria-label={`${t('products.delete')} ${product.name}`}
              className="min-h-[40px] min-w-[40px] p-2 focus-ring"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <ScreenReaderOnly>{t('products.deleteProduct')}</ScreenReaderOnly>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/products/${product.id}`);
            }}
            className="text-sm font-medium hidden sm:flex focus-ring"
            aria-label={`View details for ${product.name}`}
          >
            {t("products.viewDetails")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductList;
