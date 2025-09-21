# Internationalization (i18n) Guide

Complete guide for implementing and managing multi-language support in the Gemini CRM frontend.

## 🌐 Overview

The Gemini CRM supports two languages with full internationalization:
- **English (en)**: Left-to-right (LTR) layout with Western numerals
- **Arabic (ar)**: Right-to-left (RTL) layout with Arabic numerals

## 🛠️ Technical Implementation

### i18next Configuration
```javascript
// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import arCommon from '../locales/ar/common.json';
import arAuth from '../locales/ar/auth.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        // ... other namespaces
      },
      ar: {
        common: arCommon,
        auth: arAuth,
        // ... other namespaces
      }
    },
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;
```

### Translation File Structure
```
src/locales/
├── en/
│   ├── common.json         # Common UI elements
│   ├── auth.json           # Authentication pages
│   ├── customers.json      # Customer management
│   ├── products.json       # Product management
│   ├── orders.json         # Order management
│   ├── analytics.json      # Analytics and reports
│   └── notifications.json  # Notification messages
└── ar/
    ├── common.json         # Arabic translations
    ├── auth.json
    ├── customers.json
    ├── products.json
    ├── orders.json
    ├── analytics.json
    └── notifications.json
```

## 📝 Translation Usage

### Basic Translation Hook
```jsx
import { useTranslation } from 'react-i18next';

function CustomerForm() {
  const { t } = useTranslation('customers');
  
  return (
    <form>
      <label>{t('firstName')}</label>
      <input placeholder={t('enterFirstName')} />
      <button>{t('save')}</button>
    </form>
  );
}
```

### Translation with Parameters
```jsx
function OrderSummary({ orderCount, total }) {
  const { t } = useTranslation('orders');
  
  return (
    <div>
      <p>{t('orderSummary', { count: orderCount })}</p>
      <p>{t('totalAmount', { amount: total })}</p>
    </div>
  );
}
```

### Pluralization
```json
// en/orders.json
{
  "orderCount": "{{count}} order",
  "orderCount_plural": "{{count}} orders"
}

// ar/orders.json
{
  "orderCount": "طلب واحد",
  "orderCount_plural": "{{count}} طلبات"
}
```

## 🎨 RTL Layout Implementation

### CSS Direction Handling
```css
/* Global RTL styles */
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .flex {
  flex-direction: row-reverse;
}

[dir="rtl"] .ml-4 {
  margin-left: 0;
  margin-right: 1rem;
}

/* Tailwind RTL utilities */
.rtl\:text-right:where([dir="rtl"], [dir="rtl"] *) {
  text-align: right;
}

.rtl\:flex-row-reverse:where([dir="rtl"], [dir="rtl"] *) {
  flex-direction: row-reverse;
}
```

### Dynamic Direction Component
```jsx
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

function DirectionProvider({ children }) {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', i18n.language);
  }, [i18n.language]);
  
  return <>{children}</>;
}
```

### RTL-Aware Components
```jsx
function NavigationButton({ children, onClick }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
    >
      {!isRTL && <ChevronLeftIcon />}
      <span className="mx-2">{children}</span>
      {isRTL && <ChevronRightIcon />}
    </button>
  );
}
```

## 🔢 Number and Date Formatting

### Arabic Numeral Conversion
```javascript
// utils/numberUtils.js
export const convertToArabicNumerals = (number) => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return number.toString().replace(/[0-9]/g, (digit) => arabicNumerals[digit]);
};

export const formatNumber = (number, language) => {
  if (language === 'ar') {
    return convertToArabicNumerals(number);
  }
  return number.toString();
};
```

### Date Formatting
```javascript
// utils/dateUtils.js
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export const formatDate = (date, language, formatString = 'PPP') => {
  const locale = language === 'ar' ? ar : enUS;
  return format(date, formatString, { locale });
};

// Usage in component
function OrderDate({ date }) {
  const { i18n } = useTranslation();
  
  return (
    <span>
      {formatDate(date, i18n.language)}
    </span>
  );
}
```

### Phone Number Formatting
```javascript
// Phone numbers always display LTR regardless of language
function PhoneNumber({ phone }) {
  const { i18n } = useTranslation();
  
  const formatPhone = (phoneNumber) => {
    if (i18n.language === 'ar') {
      // Convert to Arabic numerals but keep LTR direction
      return convertToArabicNumerals(phoneNumber);
    }
    return phoneNumber;
  };
  
  return (
    <span dir="ltr" className="font-mono">
      {formatPhone(phone)}
    </span>
  );
}
```

## 🎛️ Language Switching

### Language Toggle Component
```jsx
import { useTranslation } from 'react-i18next';
import { GlobeIcon } from '@heroicons/react/24/outline';

function LanguageToggle() {
  const { i18n, t } = useTranslation('common');
  
  const toggleLanguage = () => {
    const newLanguage = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLanguage);
  };
  
  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
      title={t('switchLanguage')}
    >
      <GlobeIcon className="w-5 h-5" />
      <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
}
```

### Persistent Language Storage
```javascript
// hooks/useLanguage.js
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export function useLanguage() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    // Save language preference
    localStorage.setItem('language', i18n.language);
  }, [i18n.language]);
  
  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
  };
  
  return {
    currentLanguage: i18n.language,
    changeLanguage,
    isRTL: i18n.language === 'ar'
  };
}
```

## 📱 Form Handling with i18n

### Form Validation Messages
```javascript
// utils/validationSchemas.js
import * as Yup from 'yup';
import i18n from '../i18n';

export const customerSchema = Yup.object({
  firstName: Yup.string()
    .required(i18n.t('validation:required', { field: i18n.t('customers:firstName') }))
    .min(2, i18n.t('validation:minLength', { field: i18n.t('customers:firstName'), min: 2 })),
  
  email: Yup.string()
    .email(i18n.t('validation:invalidEmail'))
    .required(i18n.t('validation:required', { field: i18n.t('customers:email') }))
});
```

### RTL Form Layout
```jsx
function CustomerForm() {
  const { t, i18n } = useTranslation('customers');
  const isRTL = i18n.language === 'ar';
  
  return (
    <form className={`space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className="grid grid-cols-2 gap-4">
        <div className={isRTL ? 'order-2' : 'order-1'}>
          <label className="block text-sm font-medium">
            {t('firstName')}
          </label>
          <input
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 ${
              isRTL ? 'text-right' : 'text-left'
            }`}
            placeholder={t('enterFirstName')}
          />
        </div>
        
        <div className={isRTL ? 'order-1' : 'order-2'}>
          <label className="block text-sm font-medium">
            {t('lastName')}
          </label>
          <input
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 ${
              isRTL ? 'text-right' : 'text-left'
            }`}
            placeholder={t('enterLastName')}
          />
        </div>
      </div>
    </form>
  );
}
```

## 📊 Data Table Internationalization

### RTL Table Headers
```jsx
function CustomerTable({ customers }) {
  const { t, i18n } = useTranslation('customers');
  const isRTL = i18n.language === 'ar';
  
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
            isRTL ? 'text-right' : 'text-left'
          }`}>
            {t('name')}
          </th>
          <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
            isRTL ? 'text-right' : 'text-left'
          }`}>
            {t('email')}
          </th>
          <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
            isRTL ? 'text-right' : 'text-left'
          }`}>
            {t('phone')}
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {customers.map((customer) => (
          <tr key={customer.id}>
            <td className={`px-6 py-4 whitespace-nowrap ${
              isRTL ? 'text-right' : 'text-left'
            }`}>
              {customer.firstName} {customer.lastName}
            </td>
            <td className={`px-6 py-4 whitespace-nowrap ${
              isRTL ? 'text-right' : 'text-left'
            }`}>
              {customer.email}
            </td>
            <td className="px-6 py-4 whitespace-nowrap" dir="ltr">
              {formatNumber(customer.phone, i18n.language)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## 🔧 Best Practices

### Translation Key Naming
```javascript
// Good: Descriptive and hierarchical
"customers.form.firstName"
"orders.status.pending"
"analytics.reports.salesSummary"

// Bad: Generic or unclear
"text1"
"label"
"button"
```

### Context-Aware Translations
```json
{
  "save": "Save",
  "saveCustomer": "Save Customer",
  "saveAndContinue": "Save and Continue",
  "saveChanges": "Save Changes"
}
```

### Handling Missing Translations
```jsx
function SafeTranslation({ i18nKey, fallback, ...props }) {
  const { t, i18n } = useTranslation();
  
  const translation = t(i18nKey, { defaultValue: fallback });
  
  // Log missing translations in development
  if (process.env.NODE_ENV === 'development' && translation === i18nKey) {
    console.warn(`Missing translation for key: ${i18nKey} in language: ${i18n.language}`);
  }
  
  return <span {...props}>{translation}</span>;
}
```

## 🧪 Testing i18n

### Testing Translation Components
```javascript
// __tests__/CustomerForm.test.jsx
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/testConfig';
import CustomerForm from '../CustomerForm';

describe('CustomerForm i18n', () => {
  test('renders in English', () => {
    i18n.changeLanguage('en');
    
    render(
      <I18nextProvider i18n={i18n}>
        <CustomerForm />
      </I18nextProvider>
    );
    
    expect(screen.getByText('First Name')).toBeInTheDocument();
  });
  
  test('renders in Arabic', () => {
    i18n.changeLanguage('ar');
    
    render(
      <I18nextProvider i18n={i18n}>
        <CustomerForm />
      </I18nextProvider>
    );
    
    expect(screen.getByText('الاسم الأول')).toBeInTheDocument();
  });
});
```

---

**Last Updated**: July 2025  
**i18next Version**: 22.x  
**Supported Languages**: English (en), Arabic (ar)
