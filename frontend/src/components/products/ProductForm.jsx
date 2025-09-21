import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { productAPI } from '../../services/api';
import { useApiSubmit, useApi } from '../../hooks/useApi';
import LoadingSpinner from '../LoadingSpinner';
import { Save, X, Package, DollarSign, Tag, Palette, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input, Textarea, FormField, FormGroup } from '../ui/Input';
import { Card, CardContent } from '../../components/ui/card';
import CategorySelect from '../ui/CategorySelect';

// Create validation schema with translations
const createProductSchema = (t) => yup.object({
  name: yup
    .string()
    .required(t('validation.required', { field: t('products.productName') }))
    .min(2, t('validation.minLength', { field: t('products.productName'), min: 2 }))
    .max(100, t('validation.maxLength', { field: t('products.productName'), max: 100 })),
  description: yup
    .string()
    .max(1000, t('validation.maxLength', { field: t('products.productDescription'), max: 1000 }))
    .nullable(),
  price: yup
    .number()
    .required(t('validation.required', { field: t('products.priceLabel') }))
    .min(0.01, t('validation.minValue', { field: t('products.priceLabel'), min: 0.01 }))
    .max(99999.99, t('validation.maxValue', { field: t('products.priceLabel'), max: 99999.99 })),
  stockQuantity: yup
    .number()
    .required(t('validation.required', { field: t('products.stockQuantityLabel') }))
    .integer(t('validation.integer', { field: t('products.stockQuantityLabel') }))
    .min(0, t('validation.minValue', { field: t('products.stockQuantityLabel'), min: 0 })),
  category: yup
    .string()
    .required(t('validation.required', { field: t('products.categoryLabel') }))
    .min(2, t('validation.minLength', { field: t('products.categoryLabel'), min: 2 }))
    .max(50, t('validation.maxLength', { field: t('products.categoryLabel'), max: 50 })),
  brand: yup
    .string()
    .max(50, t('validation.maxLength', { field: t('products.brand'), max: 50 }))
    .nullable(),
  color: yup
    .string()
    .max(30, t('validation.maxLength', { field: t('products.color'), max: 30 }))
    .nullable(),
  material: yup
    .string()
    .max(50, t('validation.maxLength', { field: t('products.material'), max: 50 }))
    .nullable()
});

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const isEditing = Boolean(id);
  const isRTL = i18n.language === 'ar';

  const [submitError, setSubmitError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch product data if editing
  const {
    data: productData,
    loading: loadingProduct,
    error: productError
  } = useApi(
    () => productAPI.getById(id),
    [id],
    { immediate: isEditing }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(createProductSchema(t)),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      stockQuantity: '',
      category: '',
      brand: '',
      color: '',
      material: ''
    }
  });

  // Submit handler
  const { submit, loading: submitting, success } = useApiSubmit(
    isEditing ?
      (data) => productAPI.update(id, data) :
      productAPI.create,
    {
      onSuccess: () => {
        navigate('/products');
      },
      onError: (error) => {
        setSubmitError(error.message);
      }
    }
  );

  // Populate form when editing
  useEffect(() => {
    if (productData && isEditing) {
      const product = productData.product || productData;
      reset({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        stockQuantity: product.stockQuantity || '',
        category: product.category || '',
        brand: product.brand || '',
        color: product.color || '',
        material: product.material || ''
      });

      // Set image preview if product has an image
      if (product.imagePath) {
        setImagePreview(`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${product.imagePath}`);
      }
    }
  }, [productData, isEditing, reset]);

  // Register the category field for react-hook-form
  useEffect(() => {
    register('category');
  }, [register]);

  const onSubmit = async (data) => {
    setSubmitError(null);

    // Create FormData for file upload
    const formData = new FormData();

    // Add form fields
    formData.append('name', data.name);
    formData.append('description', data.description || '');
    formData.append('price', parseFloat(data.price));
    formData.append('stockQuantity', parseInt(data.stockQuantity));
    formData.append('category', data.category);
    formData.append('brand', data.brand || '');
    formData.append('color', data.color || '');
    formData.append('material', data.material || '');

    // Add image file if selected
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    await submit(formData);
  };

  // Handle image selection
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    // Clear the file input
    const fileInput = document.getElementById('image');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Early returns after all hooks are called
  if (loadingProduct) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (productError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-sm text-red-600">
          Failed to load product: {productError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir={isRTL ? 'rtl1' : 'ltr1'}>
      {/* Header */}
      <div className={`flex items-center justify-between2 ${isRTL ? 'flex-row-reverse1' : ''}`}>
        <div className={isRTL ? 'text-left' : 'text-left'}>
          <h1 className="text-1xl font-bold text-foreground">
            {isEditing ? t('products.editProduct') : t('products.addNewProduct')}
          </h1>
          <p className="font-light">
            {isEditing ?
              t('products.updateProduct') :
              t('products.createNewProduct')
            }
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => navigate('/products')}
          leftIcon={isRTL ? <ArrowLeft className="h-4 w-4 scale-x-[-1]" /> :undefined }
          rightIcon={isRTL ? undefined: <ArrowLeft className="h-4 w-4 scale-x-[-1]" />}
       className="mb-4 bg-blue-500 text-white" >
          {t('products.backToProducts')}
        </Button>
      </div>

      <Card>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Display submit error */}
            {submitError && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="p-4">
                  <div className="text-sm text-destructive-foreground">{submitError}</div>
                </CardContent>
              </Card>
            )}

            {/* Success message */}
            {success && (
              <Card className="border-success bg-success/5">
                <CardContent className="p-4">
                  <div className="text-sm text-success-foreground">
                    {t('products.productCreated')} {isEditing ? t('products.productUpdated') : t('products.productCreated')}!
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Basic Information */}
            <div>
              <h3 className={`text-lg font-semibold text-foreground mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse1 text-right' : 'text-left'}`}>
                <Package className="h-5 w-5" />
                {t('products.basicInformation')}
              </h3>
              <FormGroup>
                <FormField
                  label={t('products.productName')}
                  error={errors.name?.message}
                  required
                >
                  <Input
                    {...register('name')}
                    id="name"
                    type="text"
                    placeholder={t('products.productNamePlaceholder')}
                    error={!!errors.name}
                  />
                </FormField>

                <FormField
                  label={t('products.productDescription')}
                  error={errors.description?.message}
                >
                  <Textarea
                    {...register('description')}
                    id="description"
                    rows={4}
                    placeholder={t('products.productDescriptionPlaceholder')}
                    error={!!errors.description}
                  />
                </FormField>

                {/* Product Image */}
                <FormField
                  label={t('inventory.productImage')}
                  error={null}
                >
                  <div className="space-y-4">
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt={t("")}
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {/* File Input */}
                    <div className="flex items-center gap-4">
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>

                    <p className="text-xs text-gray-500">
                      {t('products.imageUploadHint')}
                    </p>
                  </div>
                </FormField>
              </FormGroup>
            </div>

            {/* Pricing and Inventory */}
            <div>
              <h3 className={`text-lg font-semibold text-foreground mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse1 text-right' : 'text-left'}`}>
                <DollarSign className="h-5 w-5" />
                {t('products.pricingInventory')}
              </h3>
              <FormGroup>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label={t('products.priceLabel')}
                    error={errors.price?.message}
                    required
                  >
                    <Input
                      {...register('price')}
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t('products.pricePlaceholder')}
                      error={!!errors.price}
                      leftIcon={<DollarSign className="h-4 w-4" />}
                      dir="ltr"
                      style={{ textAlign: 'left' }}
                    />
                  </FormField>

                  <FormField
                    label={t('products.stockQuantityLabel')}
                    error={errors.stockQuantity?.message}
                    required
                  >
                    <Input
                      {...register('stockQuantity')}
                      id="stockQuantity"
                      type="number"
                      min="0"
                      placeholder={t('products.stockQuantityPlaceholder')}
                      error={!!errors.stockQuantity}
                      dir="ltr"
                      style={{ textAlign: 'left' }}
                    />
                  </FormField>
                </div>
              </FormGroup>
            </div>

            {/* Category and Brand */}
            <div>
              <h3 className={`text-lg font-semibold text-foreground mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse1 text-right' : 'text-left'}`}>
                <Tag className="h-5 w-5" />
                {t('products.additionalDetails')}
              </h3>
              <FormGroup>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label={t('products.categoryLabel')}
                    error={errors.category?.message}
                    required
                  >
                    <CategorySelect
                      value={watch('category')}
                      onChange={(value) => setValue('category', value)}
                      error={!!errors.category}
                      placeholder={t('products.categoryPlaceholder')}
                      required
                    />
                  </FormField>

                  <FormField
                    label={t('products.brand')}
                    error={errors.brand?.message}
                  >
                    <Input
                      {...register('brand')}
                      id="brand"
                      type="text"
                      placeholder={t('products.brandPlaceholder')}
                      error={!!errors.brand}
                    />
                  </FormField>
                </div>
              </FormGroup>
            </div>

            {/* Product Attributes */}
            <div>
              <h3 className={`text-lg font-semibold text-foreground mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse1 text-right' : 'text-left'}`}>
                <Palette className="h-5 w-5" />
                {t('products.additionalDetails')}
              </h3>
              <FormGroup>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label={t('products.color')}
                    error={errors.color?.message}
                  >
                    <Input
                      {...register('color')}
                      id="color"
                      type="text"
                      placeholder={t('products.colorPlaceholder')}
                      error={!!errors.color}
                    />
                  </FormField>

                  <FormField
                    label={t('products.material')}
                    error={errors.material?.message}
                  >
                    <Input
                      {...register('material')}
                      id="material"
                      type="text"
                      placeholder={t('products.materialPlaceholder')}
                      error={!!errors.material}
                    />
                  </FormField>
                </div>
              </FormGroup>
            </div>

            {/* Form Actions */}
            <div className={`flex gap-3 pt-6 border-t border-border ${isRTL ? 'justify-start' : 'justify-end'}`}>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/products')}
                leftIcon={isRTL ? undefined : <X className="h-4 w-4" />}
                rightIcon={isRTL ? <X className="h-4 w-4" /> : undefined}
              >
                {t('products.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                loading={submitting}
                leftIcon={!submitting && !isRTL ? <Save className="h-4 w-4" /> : undefined}
                rightIcon={!submitting && isRTL ? <Save className="h-4 w-4" /> : undefined}
              >
                {submitting ? t('products.saving') : (isEditing ? t('products.updateProduct') : t('products.createProduct'))}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;
