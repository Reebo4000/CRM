import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { orderAPI, customerAPI, productAPI } from '../../services/api';
import { useApiSubmit, useApi } from '../../hooks/useApi';
import LoadingSpinner from '../LoadingSpinner';
import {
  Save,
  X,
  User,
  Package,
  Plus,
  Trash2,
  Search
} from 'lucide-react';
import { 
  formatCurrency,
  formatNumber,


 } from '../../utils/formatters';

const OrderForm = () => {
  const { t } = useTranslation();

  // Simplified validation schema - let custom validation handle customer logic
  const orderSchema = yup.object({
    customerId: yup
      .number()
      .nullable(),
    newCustomerName: yup
      .string()
      .nullable(),
    customerInputMode: yup
      .string()
      .oneOf(['search', 'new'])
      .required(),
    orderItems: yup
      .array()
      .of(
        yup.object({
          productId: yup
            .number()
            .required(t('orders.validation.productRequired'))
            .positive(t('orders.validation.selectValidProduct')),
          quantity: yup
            .number()
            .required(t('orders.validation.quantityRequired'))
            .integer(t('orders.validation.quantityWholeNumber'))
            .min(1, t('orders.validation.quantityMinOne')),
          unitPrice: yup
            .number()
            .required(t('orders.validation.unitPriceRequired'))
            .min(0, t('orders.validation.unitPriceNonNegative'))
        })
      )
      .min(1, t('orders.validation.atLeastOneItem')),
    notes: yup
      .string()
      .max(500, t('orders.validation.notesMaxLength'))
      .nullable()
  });
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const [submitError, setSubmitError] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerInputMode, setCustomerInputMode] = useState('search'); // 'search' or 'new'

  // Fetch order data if editing
  const {
    data: orderResponse,
    loading: loadingOrder,
    error: orderError
  } = useApi(
    () => orderAPI.getById(id),
    [id],
    {
      immediate: isEditing,
      transform: (data) => data.order // Extract order from response
    }
  );

  const order = orderResponse;

  // Fetch customers for selection
  const {
    data: customersData,
    loading: loadingCustomers
  } = useApi(
    () => customerAPI.getAll({ search: customerSearch, limit: 10 }),
    [customerSearch],
    { immediate: true }
  );

  // Fetch products for selection
  const {
    data: productsData,
    loading: loadingProducts
  } = useApi(
    () => productAPI.getAll({ search: productSearch, limit: 20 }),
    [productSearch],
    { immediate: true }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
    getValues,
    reset,
    trigger
  } = useForm({
    resolver: yupResolver(orderSchema),
    mode: 'onChange',
    defaultValues: {
      customerId: '',
      newCustomerName: '',
      customerInputMode: 'search',
      orderItems: [{ productId: '', quantity: 1, unitPrice: 0 }],
      notes: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'orderItems'
  });

  const watchedItems = watch('orderItems');
  const watchedCustomerInputMode = watch('customerInputMode');
  const watchedNewCustomerName = watch('newCustomerName');

  // Debug form state changes
  useEffect(() => {
    console.log('📊 FORM STATE CHANGE:', {
      watchedCustomerInputMode,
      watchedNewCustomerName,
      selectedCustomer,
      watchedItems,
      errors,
      isFormValid: isFormValid()
    });
  }, [watchedCustomerInputMode, watchedNewCustomerName, selectedCustomer, watchedItems, errors]);

  // Submit handler
  const { submit, loading: submitting, success } = useApiSubmit(
    isEditing ?
      (data) => orderAPI.update(id, data) :
      orderAPI.create,
    {
      onSuccess: () => {
        navigate('/orders');
      },
      onError: (error) => {
        setSubmitError(error.message);
      }
    }
  );

  const onSubmit = async (data) => {
    console.log('🚀 FORM SUBMIT TRIGGERED!', data);
    setSubmitError(null);

    // Calculate total amount
    const totalAmount = data.orderItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const orderData = {
      totalAmount,
      orderItems: data.orderItems.map(item => ({
        ...item,
        totalPrice: item.quantity * item.unitPrice
      })),
      notes: data.notes
    };

    // Handle customer selection based on input mode
    if (data.customerInputMode === 'search') {
      orderData.customerId = data.customerId;
    } else {
      // For new customer, send customer info to be created
      orderData.customerInfo = {
        name: data.newCustomerName.trim()
      };
    }

    console.log('📦 ORDER DATA TO SUBMIT:', orderData);

    try {
      await submit(orderData);
      console.log('✅ ORDER SUBMITTED SUCCESSFULLY!');
    } catch (error) {
      console.error('❌ ORDER SUBMISSION FAILED:', error);
    }
  };

  // Populate form when editing
  useEffect(() => {
    if (order && isEditing) {
      // Set selected customer
      if (order.customer) {
        setSelectedCustomer(order.customer);
        setCustomerInputMode('search');
        
      }

      // Reset form with order data
      reset({
        customerId: order.customerId || '',
        newCustomerName: '',
        customerInputMode: 'search',
        orderItems: order.orderItems?.map(item => ({
          productId: item.productId || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0
        })) || [{ productId: '', quantity: 1, unitPrice: 0 }],
        notes: order.notes || ''
      });
    }
  }, [order, isEditing, reset]);

  // Trigger validation when customer input mode changes
  useEffect(() => {
    if (watchedCustomerInputMode) {
      trigger(['customerId', 'newCustomerName', 'customerInputMode']);
    }
  }, [watchedCustomerInputMode, trigger]);

  // Custom validation for button enable/disable
  const isFormValid = () => {
    // Check if order items are valid
    const hasValidItems = watchedItems && watchedItems.length > 0 &&
      watchedItems.every(item => item.productId && item.quantity > 0 && item.unitPrice >= 0);

    // Check customer validation based on mode
    let customerValid = false;
    if (watchedCustomerInputMode === 'search') {
      customerValid = selectedCustomer && selectedCustomer.id;
    } else if (watchedCustomerInputMode === 'new') {
      customerValid = watchedNewCustomerName && watchedNewCustomerName.trim().length >= 2;
    }

    // Debug logging
    console.log('🔍 Form Validation Debug:', {
      watchedCustomerInputMode,
      watchedNewCustomerName,
      selectedCustomer,
      hasValidItems,
      customerValid,
      watchedItems,
      finalResult: hasValidItems && customerValid
    });

    return hasValidItems && customerValid;
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setValue('customerId', customer.id);
    setValue('customerInputMode', 'search');
    setCustomerSearch('');
    setCustomerInputMode('search');
  };

  const handleCustomerModeChange = (mode) => {
    setCustomerInputMode(mode);
    setValue('customerInputMode', mode);

    if (mode === 'search') {
      setSelectedCustomer(null);
      setValue('customerId', '');
      setValue('newCustomerName', '');
    } else {
      setSelectedCustomer(null);
      setValue('customerId', '');
      setCustomerSearch('');
    }

    // Trigger validation for customer fields
    setTimeout(() => {
      trigger(['customerId', 'newCustomerName']);
    }, 0);
  };



  const handleProductSelect = (index, product) => {
    setValue(`orderItems.${index}.productId`, product.id);
    setValue(`orderItems.${index}.unitPrice`, product.price);
    setProductSearch('');
  };

  const addOrderItem = () => {
    append({ productId: '', quantity: 1, unitPrice: 0 });
  };

  const removeOrderItem = (index) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const calculateTotal = () => {
    return watchedItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };

  const customers = customersData?.customers || [];
  const products = productsData?.products || [];

  // Loading state for editing
  if (isEditing && loadingOrder) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Error state for editing
  if (isEditing && orderError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-sm text-red-600">
          {t('orders.failedToLoadOrder')}: {orderError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {isEditing ? t('orders.editOrder') : t('orders.createNewOrder')}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {isEditing ?
              t('orders.updateOrderDetails') :
              t('orders.selectCustomerAndProducts')
            }
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit, (errors) => {
          console.log('❌ FORM VALIDATION ERRORS:', errors);
        })} className="p-6 space-y-6">
          {/* Display submit error */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-600">{submitError}</div>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-sm text-green-600">
                Order created successfully!
              </div>
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              {t('orders.customerSelection')}
            </h3>

            {/* Customer Input Mode Toggle */}
            <div className="mb-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="customerMode"
                    value="search"
                    checked={customerInputMode === 'search'}
                    onChange={() => handleCustomerModeChange('search')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{t('orders.searchExistingCustomer')}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="customerMode"
                    value="new"
                    checked={customerInputMode === 'new'}
                    onChange={() => handleCustomerModeChange('new')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{t('orders.addNewCustomer')}</span>
                </label>
              </div>
            </div>

            {/* Customer Input Based on Mode */}
            {customerInputMode === 'search' ? (
              <>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {selectedCustomer.firstName.charAt(0)}{selectedCustomer.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {selectedCustomer.firstName} {selectedCustomer.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedCustomer.email}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setValue('customerId', '');
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t('orders.searchCustomersPlaceholder')}
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {customerSearch && (
                      <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                        {loadingCustomers ? (
                          <div className="p-4 text-center">
                            <LoadingSpinner size="small" />
                          </div>
                        ) : customers.length > 0 ? (
                          customers.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => handleCustomerSelect(customer)}
                              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {customer.firstName} {customer.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {customer.email}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-sm text-gray-500 text-center">
                            {t('orders.noCustomersFound')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder={t('orders.enterCustomerName')}
                  {...register('newCustomerName')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('orders.newCustomerNote')}
                </p>
              </div>
            )}

            {/* Error Messages */}            
            {errors.newCustomerName && customerInputMode === 'new' && (
              <p className="mt-1 text-sm text-red-600">{errors.newCustomerName.message}</p>
            )}
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                {t('orders.orderItems')}
              </h3>
              <button
                type="button"
                onClick={addOrderItem}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('orders.addItem')}
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <OrderItemRow
                  key={field.id}
                  index={index}
                  register={register}
                  errors={errors}
                  products={products}
                  loadingProducts={loadingProducts}
                  productSearch={productSearch}
                  setProductSearch={setProductSearch}
                  handleProductSelect={handleProductSelect}
                  removeOrderItem={removeOrderItem}
                  canRemove={fields.length > 1}
                  watch={watch}
                  setValue={setValue}
                  t={t}
                />
              ))}
            </div>

            {errors.orderItems && (
              <p className="mt-1 text-sm text-red-600">{errors.orderItems.message}</p>
            )}
          </div>

          {/* Order Total */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-gray-900">{t('orders.orderTotal')}:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              {t('orders.orderNotesOptional')}
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              rows={3}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                errors.notes ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={t('orders.orderNotesPlaceholder')}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 mr-2" />
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !isFormValid()}
              onClick={(e) => {
                e.preventDefault();
                console.log('🖱️ SUBMIT BUTTON CLICKED!');
                console.log('Button disabled?', submitting || !isFormValid());
                console.log('Form valid?', isFormValid());
                console.log('Submitting?', submitting);

                if (submitting || !isFormValid()) {
                  console.log('❌ Form submission prevented due to validation');
                  return;
                }

                // Get current form values and submit directly
                const currentValues = getValues();
                console.log('📝 Current form values:', currentValues);
                onSubmit(currentValues);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <LoadingSpinner size="small" className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {submitting ?
                (isEditing ? t('orders.updatingOrder') : t('orders.creatingOrder')) :
                (isEditing ? t('orders.updateOrder') : t('orders.createOrder'))
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Order Item Row Component
const OrderItemRow = ({
  index,
  register,
  errors,
  products,
  loadingProducts,
  productSearch,
  setProductSearch,
  handleProductSelect,
  removeOrderItem,
  canRemove,
  watch,
  setValue,
  t
}) => {
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const watchedItem = watch(`orderItems.${index}`);
  const quantity = parseFloat(watchedItem.quantity) || 0;
  const unitPrice = parseFloat(watchedItem.unitPrice) || 0;
  const totalPrice = quantity * unitPrice;

  const handleProductSelectLocal = (product) => {
    setSelectedProduct(product);
    handleProductSelect(index, product);
    setShowProductSearch(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">{t('orders.item')} # {formatNumber(index + 1)}</h4>
        {canRemove && (
          <button
            type="button"
            onClick={() => removeOrderItem(index)}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Product Selection */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('orders.product')} *
          </label>
          
          {selectedProduct ? (
            <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {selectedProduct.name}
                </div>
                <div className="text-xs text-gray-500">
                  {formatCurrency(selectedProduct.price)} • {t('orders.stock')}: {selectedProduct.stockQuantity}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setValue(`orderItems.${index}.productId`, '');
                  setValue(`orderItems.${index}.unitPrice`, 0);
                }}
                className="text-red-600 hover:text-red-900"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setShowProductSearch(!showProductSearch)}
                className="w-full p-2 text-left border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span className="text-gray-500">{t('orders.selectProductPlaceholder')}</span>
              </button>
              
              {showProductSearch && (
                <div className="mt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t('orders.searchProductsPlaceholder')}
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="mt-1 max-h-32 overflow-y-auto border border-gray-200 rounded-md">
                    {loadingProducts ? (
                      <div className="p-2 text-center">
                        <LoadingSpinner size="small" />
                      </div>
                    ) : products.length > 0 ? (
                      products.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleProductSelectLocal(product)}
                          className="w-full text-left p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(product.price)} • Stock: {product.stockQuantity}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-2 text-xs text-gray-500 text-center">
                        No products found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <input
            type="hidden"
            {...register(`orderItems.${index}.productId`)}
          />
          {errors.orderItems?.[index]?.productId && (
            <p className="mt-1 text-xs text-red-600">
              {errors.orderItems[index].productId.message}
            </p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('orders.quantity')} *
          </label>
          <input
            type="number"
            min="1"
            {...register(`orderItems.${index}.quantity`)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.orderItems?.[index]?.quantity ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.orderItems?.[index]?.quantity && (
            <p className="mt-1 text-xs text-red-600">
              {errors.orderItems[index].quantity.message}
            </p>
          )}
        </div>

        {/* Unit Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('orders.unitPrice')} *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register(`orderItems.${index}.unitPrice`)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.orderItems?.[index]?.unitPrice ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.orderItems?.[index]?.unitPrice && (
            <p className="mt-1 text-xs text-red-600">
              {errors.orderItems[index].unitPrice.message}
            </p>
          )}
        </div>
      </div>

      {/* Item Total */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">{t('orders.itemTotal')}:</span>
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(totalPrice)}
        </span>
      </div>
    </div>
  );
};

export default OrderForm;
