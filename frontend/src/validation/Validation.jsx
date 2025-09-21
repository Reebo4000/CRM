import React, { useState } from 'react';
import FormField, { FormGroup, FormActions } from '../components/common/FormField';
import { useNotifications } from '../components/common/NotificationSystem';
import { 
  validateForm, 
  customerValidationRules, 
  productValidationRules,
  userValidationRules 
} from '../utils/validation';

const Validation = () => {
  const { success, error, warning, info } = useNotifications();
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    dateOfBirth: ''
  });

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    category: '',
    brand: '',
    color: '',
    material: ''
  });

  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff'
  });

  const [errors, setErrors] = useState({});

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({ ...prev, [name]: value }));
  };

  const testCustomerValidation = () => {
    const validation = validateForm(customerData, customerValidationRules);
    
    if (validation.isValid) {
      success('Customer data is valid!', { title: 'Validation Success' });
      setErrors({});
    } else {
      error('Customer validation failed', { title: 'Validation Error' });
      setErrors(validation.errors);
    }
  };

  const testProductValidation = () => {
    const validation = validateForm(productData, productValidationRules);
    
    if (validation.isValid) {
      success('Product data is valid!', { title: 'Validation Success' });
      setErrors({});
    } else {
      error('Product validation failed', { title: 'Validation Error' });
      setErrors(validation.errors);
    }
  };

  const testUserValidation = () => {
    // Add password confirmation validation
    const userRules = {
      ...userValidationRules,
      confirmPassword: [
        (value) => {
          if (!value) return 'Password confirmation is required';
          if (value !== userFormData.password) return 'Passwords do not match';
          return null;
        }
      ]
    };

    const validation = validateForm(userFormData, userRules);
    
    if (validation.isValid) {
      success('User data is valid!', { title: 'Validation Success' });
      setErrors({});
    } else {
      error('User validation failed', { title: 'Validation Error' });
      setErrors(validation.errors);
    }
  };

  const testNotifications = () => {
    success('This is a success message!');
    setTimeout(() => info('This is an info message!'), 500);
    setTimeout(() => warning('This is a warning message!'), 1000);
    setTimeout(() => error('This is an error message!'), 1500);
  };

  const testErrorBoundary = () => {
    // This will trigger an error boundary
    throw new Error('Test error for error boundary');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Validation & Error Handling Test</h1>
        <p className="text-gray-600">Test the comprehensive validation and error handling system</p>
      </div>

      {/* Notification Tests */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification System Test</h2>
        <div className="flex space-x-4">
          <button
            onClick={testNotifications}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Test All Notifications
          </button>
          <button
            onClick={testErrorBoundary}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Test Error Boundary
          </button>
        </div>
      </div>

      {/* Customer Validation Test */}
      <div className="bg-white shadow rounded-lg p-6">
        <FormGroup title="Customer Validation Test" description="Test customer form validation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="First Name"
              name="firstName"
              value={customerData.firstName}
              onChange={handleCustomerChange}
              error={errors.firstName}
              required
              showValidation
            />
            <FormField
              label="Last Name"
              name="lastName"
              value={customerData.lastName}
              onChange={handleCustomerChange}
              error={errors.lastName}
              required
              showValidation
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={customerData.email}
              onChange={handleCustomerChange}
              error={errors.email}
              showValidation
            />
            <FormField
              label="Phone"
              name="phone"
              value={customerData.phone}
              onChange={handleCustomerChange}
              error={errors.phone}
              required
              showValidation
            />
            <FormField
              label="Address"
              name="address"
              value={customerData.address}
              onChange={handleCustomerChange}
              error={errors.address}
              showValidation
            />
            <FormField
              label="City"
              name="city"
              value={customerData.city}
              onChange={handleCustomerChange}
              error={errors.city}
              showValidation
            />
            <FormField
              label="Postal Code"
              name="postalCode"
              value={customerData.postalCode}
              onChange={handleCustomerChange}
              error={errors.postalCode}
              showValidation
            />
            <FormField
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              value={customerData.dateOfBirth}
              onChange={handleCustomerChange}
              error={errors.dateOfBirth}
              showValidation
            />
          </div>
          <FormActions>
            <button
              onClick={testCustomerValidation}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Validate Customer
            </button>
          </FormActions>
        </FormGroup>
      </div>

      {/* Product Validation Test */}
      <div className="bg-white shadow rounded-lg p-6">
        <FormGroup title="Product Validation Test" description="Test product form validation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Product Name"
              name="name"
              value={productData.name}
              onChange={handleProductChange}
              error={errors.name}
              required
              showValidation
            />
            <FormField
              label="Category"
              name="category"
              value={productData.category}
              onChange={handleProductChange}
              error={errors.category}
              required
              showValidation
            />
            <FormField
              label="Price"
              name="price"
              type="number"
              step="0.01"
              value={productData.price}
              onChange={handleProductChange}
              error={errors.price}
              required
              showValidation
            />
            <FormField
              label="Stock Quantity"
              name="stockQuantity"
              type="number"
              value={productData.stockQuantity}
              onChange={handleProductChange}
              error={errors.stockQuantity}
              required
              showValidation
            />
            <FormField
              label="Brand"
              name="brand"
              value={productData.brand}
              onChange={handleProductChange}
              error={errors.brand}
              showValidation
            />
            <FormField
              label="Color"
              name="color"
              value={productData.color}
              onChange={handleProductChange}
              error={errors.color}
              showValidation
            />
            <FormField
              label="Material"
              name="material"
              value={productData.material}
              onChange={handleProductChange}
              error={errors.material}
              showValidation
            />
          </div>
          <FormField
            label="Description"
            name="description"
            type="textarea"
            rows={3}
            value={productData.description}
            onChange={handleProductChange}
            error={errors.description}
            showValidation
          />
          <FormActions>
            <button
              onClick={testProductValidation}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Validate Product
            </button>
          </FormActions>
        </FormGroup>
      </div>

      {/* User Validation Test */}
      <div className="bg-white shadow rounded-lg p-6">
        <FormGroup title="User Validation Test" description="Test user form validation with password strength">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="First Name"
              name="firstName"
              value={userFormData.firstName}
              onChange={handleUserChange}
              error={errors.firstName}
              required
              showValidation
            />
            <FormField
              label="Last Name"
              name="lastName"
              value={userFormData.lastName}
              onChange={handleUserChange}
              error={errors.lastName}
              required
              showValidation
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={userFormData.email}
              onChange={handleUserChange}
              error={errors.email}
              required
              showValidation
            />
            <FormField
              label="Role"
              name="role"
              type="select"
              value={userFormData.role}
              onChange={handleUserChange}
              error={errors.role}
              required
              showValidation
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </FormField>
            <FormField
              label="Password"
              name="password"
              type="password"
              value={userFormData.password}
              onChange={handleUserChange}
              error={errors.password}
              required
              showValidation
              helperText="Must be at least 8 characters with uppercase, lowercase, and numbers"
            />
            <FormField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={userFormData.confirmPassword}
              onChange={handleUserChange}
              error={errors.confirmPassword}
              required
              showValidation
            />
          </div>
          <FormActions>
            <button
              onClick={testUserValidation}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Validate User
            </button>
          </FormActions>
        </FormGroup>
      </div>
    </div>
  );
};

export default Validation;
