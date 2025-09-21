import React, { useState } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import OrderList from '../components/orders/OrderList';
import OrderForm from '../components/orders/OrderForm';
import OrderDetail from '../components/orders/OrderDetail';
import { Plus, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Orders = () => {
  return (
    <div className="space-y-6">
      <Routes>
        <Route path="/" element={<OrderListPage />} />
        <Route path="/new" element={<OrderFormPage />} />
        <Route path="/:id" element={<OrderDetailPage />} />
        <Route path="/:id/edit" element={<OrderFormPage />} />
      </Routes>
    </div>
  );
};

const OrderListPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
           {t('orders.description')} 
          </p>
        </div>
        <button
          onClick={() => navigate('/orders/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
           {t('orders.addOrder')} 
        </button>
      </div>
      <OrderList />
    </>
  );
};

const OrderFormPage = () => {
  const { t } = useTranslation();
  return (
    <>
      <div className="mb-6">
        <Link
          to="/orders"
          className="text-lg text-blue-600 hover:text-blue-500 mb-4 inline-block"
        >
          ← {t("orders.backtoOrders")}
        </Link>
        
      </div>
      <OrderForm />
    </>
  );
};

const OrderDetailPage = () => {
    const { t } = useTranslation();
  return (
    <>
      <div className="mb-6">
        <Link
          to="/orders"
          className="text-lg text-blue-600 hover:text-blue-500 mb-4 inline-block"
        >
          ← {t("orders.backtoOrders")}
        </Link>
      </div>
      <OrderDetail />
    </>
  );
};

export default Orders;
