import React, { useState } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../hooks/useDirection';
import CustomerList from '../components/customers/CustomerList';
import CustomerForm from '../components/customers/CustomerForm';
import CustomerDetail from '../components/customers/CustomerDetail';
import { Plus, Users } from 'lucide-react';

const Customers = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <Routes>
        <Route path="/" element={<CustomerListPage />} />
        <Route path="/new" element={<CustomerFormPage />} />
        <Route path="/:id" element={<CustomerDetailPage />} />
        <Route path="/:id/edit" element={<CustomerFormPage />} />
      </Routes>
    </div>
  );
};

const CustomerListPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isRTL } = useDirection();

  return (
    <>
      <div
        className="flex justify-between items-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="">
          <h1 className="text-2xl font-bold text-gray-900 text-left">{t('customers.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 text-left">
            {t('customers.description')}
          </p>
        </div>
        <button
          onClick={() => navigate('/customers/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          style={isRTL ? { flexDirection: 'row-reverse' } : {}}
        >
          <Plus className={isRTL ? 'ml-2' : 'mr-2'} style={{ width: 16, height: 16 }} />
          {t('customers.addCustomer')}
        </button>
      </div>
      <CustomerList />
    </>
  );
};

const CustomerFormPage = () => {
  const { isRTL } = useDirection();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      
      <CustomerForm />
    </div>
  );
};

const CustomerDetailPage = () => {
    const { t } = useTranslation();

  return (
    <>
      <div className="mb-6">
        <Link
          to="/customers"
          className="text-lg text-blue-600 hover:text-blue-500 mb-4 inline-block"
        >
          ← {t("customers.backToCustomers")}
        </Link>
      </div>
      <CustomerDetail />
    </>
  );
};

export default Customers;
