import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { customerAPI } from '../../services/api';
import { useApiSubmit, useApi } from '../../hooks/useApi';
import LoadingSpinner from '../LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input, FormField, FormGroup, Textarea } from '../ui/Input';
import { Save, X, User, Mail, Phone, MapPin, Calendar, ArrowLeft } from 'lucide-react';

// Validation schema function that uses translations
const createCustomerSchema = (t) => yup.object({
  firstName: yup
    .string()
    .required(t('customers.validation.firstNameRequired'))
    .min(2, t('customers.validation.firstNameMin'))
    .max(50, t('customers.validation.firstNameMax')),
  lastName: yup
    .string()
    .required(t('customers.validation.lastNameRequired'))
    .min(2, t('customers.validation.lastNameMin'))
    .max(50, t('customers.validation.lastNameMax')),
  email: yup
    .string()
    .email(t('customers.validation.emailInvalid'))
    .nullable(),
  phone: yup
    .string()
    .required(t('customers.validation.phoneRequired'))
    .test('len', t('customers.validation.phoneMin'), value => !value || value.replace(/\D/g, '').length > 10)
    .test('len', t('customers.validation.phoneMax'), value => !value || value.replace(/\D/g, '').length < 15)
    ,
  address: yup
    .string()
    .max(500, t('customers.validation.addressMax'))
    .nullable(),
  city: yup
    .string()
    .max(50, t('customers.validation.cityMax'))
    .nullable(),
  postalCode: yup
    .string()
    .max(10, t('customers.validation.postalCodeMax'))
    .nullable(),
  dateOfBirth: yup
    .date()
    .max(new Date(), t('customers.validation.dateOfBirthFuture'))
    .nullable()
});

const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const isEditing = Boolean(id);
  const isRTL = i18n.language === 'ar';

  const [submitError, setSubmitError] = useState(null);

  // Fetch customer data if editing
  const {
    data: customerResponse,
    loading: loadingCustomer,
    error: customerError
  } = useApi(
    () => customerAPI.getById(id),
    [id],
    {
      immediate: isEditing,
      transform: (data) => data.customer // Extract customer from response
    }
  );

  const customer = customerResponse;





  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(createCustomerSchema(t)),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      dateOfBirth: ''
    }
  });

  // Submit handler
  const { submit, loading: submitting, success } = useApiSubmit(
    isEditing ? 
      (data) => customerAPI.update(id, data) : 
      customerAPI.create,
    {
      onSuccess: () => {
        navigate('/customers');
      },
      onError: (error) => {
        setSubmitError(error.message);
      }
    }
  );

  // Populate form when editing
  useEffect(() => {
    if (customer && isEditing) {
      reset({
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        postalCode: customer.postalCode || '',
        dateOfBirth: customer.dateOfBirth ?
          new Date(customer.dateOfBirth).toISOString().split('T')[0] : ''
      });
    }
  }, [customer, isEditing, reset]);

  const onSubmit = async (data) => {
    setSubmitError(null);
    
    // Convert empty strings to null for optional fields
    const cleanedData = {
      ...data,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      postalCode: data.postalCode || null,
      dateOfBirth: data.dateOfBirth || null
    };

    await submit(cleanedData);
  };

  if (loadingCustomer) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (customerError) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="p-6">
          <div className="text-sm text-destructive">
            {t('customers.failedToLoad')} {customerError.message}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Customer ID: {id} | Authenticated: {!!localStorage.getItem('token')}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if customer not found (API returned null/undefined)
  if (isEditing && !loadingCustomer && !customer) {
    return (
      <Card className="border-warning bg-warning/5">
        <CardContent className="p-6">
          <div className="text-sm text-warning-foreground">
            {t('customers.customerNotFound')} {id}
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => navigate('/customers')}
              leftIcon={isRTL ? undefined : <ArrowLeft className="h-4 w-4" />}
              rightIcon={isRTL ? <ArrowLeft className="h-4 w-4 scale-x-[-1]" /> : undefined}
            >
              {t('customers.backToCustomers')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir={isRTL ? 'rtl1' : 'ltr1'}>
      {/* Header */}
      <div className={`flex items-center justify-between2 ${isRTL ? 'flex-row-reverse1' : ''}`}>
        <div className={isRTL ? 'text-left' : 'text-left'}>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? t('customers.editCustomer') : t('customers.addNewCustomer')}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ?
              t('customers.updateProfile') :
              t('customers.enterProfile')
            }
          </p>
        </div>
        <Button
        className="bg-blue-500 text-white"
          variant="outline"
          onClick={() => navigate('/customers')}
          leftIcon={!isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4 scale-x-[-1]" />}
          // rightIcon={isRTL ? <ArrowLeft className="h-4 w-4 scale-x-[-1]" /> : undefined}
        >
          {t('customers.backToCustomers')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Display submit error */}
            {submitError && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="p-4">
                  <div className="text-sm text-destructive">{submitError}</div>
                </CardContent>
              </Card>
            )}

            {/* Success message */}
            {success && (
              <Card className="border-success bg-success/5">
                <CardContent className="p-4">
                  <div className="text-sm text-success-foreground">
                    {t('customers.customerCreated')} {isEditing ? t('customers.customerUpdatedSuccess') : t('customers.customerCreatedSuccess')}!
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personal Information */}
            <div>
              <h3 className={`text-lg font-semibold text-foreground mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                <User className="h-5 w-5" />
                {t('customers.personalInformation')}
              </h3>
              <FormGroup>
                <FormField
                  label={t('customers.firstName')}
                  error={errors.firstName?.message}
                  required
                >
                  <Input
                    {...register('firstName')}
                    id="firstName"
                    type="text"
                    placeholder={t('customers.firstNamePlaceholder')}
                    error={!!errors.firstName}
                  />
                </FormField>

                <FormField
                  label={t('customers.lastName')}
                  error={errors.lastName?.message}
                  required
                >
                  <Input
                    {...register('lastName')}
                    id="lastName"
                    type="text"
                    placeholder={t('customers.lastNamePlaceholder')}
                    error={!!errors.lastName}
                  />
                </FormField>

                <FormField
                  label={t('customers.dateOfBirth')}
                  error={errors.dateOfBirth?.message}
                >
                  <Input
                    {...register('dateOfBirth')}
                    id="dateOfBirth"
                    type="date"
                    error={!!errors.dateOfBirth}
                    leftIcon={<Calendar className="h-4 w-4" />}
                  />
                </FormField>
              </FormGroup>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className={`text-lg font-semibold text-foreground mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                <Phone className="h-5 w-5" />
                {t('customers.contactInformation')}
              </h3>
              <FormGroup>
                <FormField
                  label={t('customers.email')}
                  error={errors.email?.message}
                >
                  <Input
                    {...register('email')}
                    id="email"
                    type="email"
                    placeholder={t('customers.emailPlaceholder')}
                    error={!!errors.email}
                    leftIcon={!isRTL ? <Mail className="h-4 w-4" /> : undefined}
                    rightIcon={isRTL ? <Mail className="h-4 w-4" /> : undefined}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    style={{ textAlign: isRTL ? 'right' : 'left' }}
                  />
                </FormField>

                <FormField
                  label={t('customers.phone')}
                  error={errors.phone?.message}
                  required
                >
                  <Input
                    {...register('phone')}
                    id="phone"
                    type="tel"
                    placeholder={t('customers.phonePlaceholder')}
                    error={!!errors.phone}
                    leftIcon={!isRTL ? <Phone className="h-4 w-4" /> : undefined}
                    rightIcon={isRTL ? <Phone className="h-4 w-4" /> : undefined}
                    dir="ltr"
                    style={{ textAlign: 'left' }}
                  />
                </FormField>
              </FormGroup>
            </div>

            {/* Address Information */}
            <div>
              <h3 className={`text-lg font-semibold text-foreground mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                <MapPin className="h-5 w-5" />
                {t('customers.addressInformation')}
              </h3>
              <FormGroup>
                <FormField
                  label={t('customers.streetAddress')}
                  error={errors.address?.message}
                >
                  <Textarea
                    {...register('address')}
                    id="address"
                    rows={3}
                    placeholder={t('customers.streetAddressPlaceholder')}
                    error={!!errors.address}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    style={{ textAlign: isRTL ? 'right' : 'left' }}
                  />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label={t('customers.city')}
                    error={errors.city?.message}
                  >
                    <Input
                      {...register('city')}
                      id="city"
                      type="text"
                      placeholder={t('customers.cityPlaceholder')}
                      error={!!errors.city}
                      dir={isRTL ? 'rtl' : 'ltr'}
                      style={{ textAlign: isRTL ? 'right' : 'left' }}
                    />
                  </FormField>

                  <FormField
                    label={t('customers.postalCode')}
                    error={errors.postalCode?.message}
                  >
                    <Input
                      {...register('postalCode')}
                      id="postalCode"
                      type="text"
                      placeholder={t('customers.postalCodePlaceholder')}
                      error={!!errors.postalCode}
                      dir="ltr"
                      style={{ textAlign: 'left' }}
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
                onClick={() => navigate('/customers')}
                leftIcon={isRTL ? undefined : <X className="h-4 w-4" />}
                rightIcon={isRTL ? <X className="h-4 w-4" /> : undefined}
              >
                {t('customers.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                loading={submitting}
                leftIcon={!submitting && !isRTL ? <Save className="h-4 w-4" /> : undefined}
                rightIcon={!submitting && isRTL ? <Save className="h-4 w-4" /> : undefined}
              >
                {submitting ? t('customers.saving') : (isEditing ? t('customers.updateCustomer') : t('customers.createCustomer'))}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerForm;
