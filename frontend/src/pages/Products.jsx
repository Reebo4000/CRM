import React, { useState } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductList from '../components/products/ProductList';
import ProductForm from '../components/products/ProductForm';
import ProductDetail from '../components/products/ProductDetail';
import InventoryManagement from '../components/products/InventoryManagement';
import { Plus, Package, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

const Products = () => {
  return (
    <div className="space-y-6">
      <Routes>
        <Route path="/" element={<ProductListPage />} />
        <Route path="/new" element={<ProductFormPage />} />
        <Route path="/inventory" element={<InventoryManagementPage />} />
        <Route path="/:id" element={<ProductDetailPage />} />
        <Route path="/:id/edit" element={<ProductFormPage />} />
      </Routes>
    </div>
  );
};

const ProductListPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div dir={isRTL ? 'ltr' : 'rtl'}>
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={isRTL ? 'text-left' : 'text-right'}>
          <h1 className="text-2xl font-bold text-foreground">{t('products.productsInventory')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('products.manageProductCatalog')}
          </p>
        </div>
        <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="outline"
            onClick={() => navigate('/products/inventory')}
            leftIcon={!isRTL ? <Package className="h-4 w-4" /> : undefined}
            rightIcon={isRTL ? <Package className="h-4 w-4" /> : undefined}
          >
            {t('products.manageInventory')}
          </Button>
          <Button
            onClick={() => navigate('/products/new')}
            leftIcon={!isRTL ? <Plus className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 ml-2" />}
          >
             {t('products.addProduct') }
          </Button>
        </div>
      </div>
      <ProductList />
    </div>
  );
};

const ProductFormPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      
      <ProductForm />
    </div>
  );
};

const ProductDetailPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6 ">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          leftIcon={!isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4 scale-x-[-1]" />}
        //  rightIcon={!isRTL ?  <ArrowLeft className="h-4 w-4 scale-x-[-1]" /> :undefined }
          className="mb-4 bg-blue-500 text-white"
        >
          {t('products.backToProducts')}
        </Button>
      </div>
      <ProductDetail />
    </div>
  );
};

const InventoryManagementPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6  ">
        <h1 className={`text-2xl font-bold text-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('products.inventoryManagement')}
        </h1>
        <p className={`mt-1 text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
          {t('products.adjustStockLevels')}
        </p>
        <br></br>
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          leftIcon={!isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4 scale-x-[-1]" />}
         // rightIcon={isRTL ? <ArrowLeft className="h-4 w-4 scale-x-[-1]" /> : undefined}
          className="mb-4 bg-blue-500 text-white"
        >
          {t('products.backToProducts')}
        </Button>
        
      </div>
      <InventoryManagement />
    </div>
  );
};

export default Products;
