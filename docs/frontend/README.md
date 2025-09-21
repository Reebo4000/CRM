# Frontend Documentation

Complete guide for the Gemini CRM React frontend application.

## 🎨 Overview

The frontend is a modern React application built with:
- **React 18** with functional components and hooks
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **React Router** for client-side routing
- **React Hook Form** with Yup validation
- **i18next** for internationalization (Arabic/English)
- **Axios** for API communication
- **Socket.io** for real-time notifications

## 🏗️ Architecture

### Project Structure
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Common components (buttons, forms, etc.)
│   │   ├── layout/         # Layout components (header, sidebar, etc.)
│   │   └── ui/             # UI-specific components
│   ├── pages/              # Page components
│   │   ├── auth/           # Authentication pages
│   │   ├── customers/      # Customer management pages
│   │   ├── products/       # Product management pages
│   │   ├── orders/         # Order management pages
│   │   └── analytics/      # Analytics and reporting pages
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service functions
│   ├── utils/              # Utility functions
│   ├── contexts/           # React contexts
│   ├── locales/            # Translation files
│   ├── styles/             # Global styles and Tailwind config
│   └── App.jsx             # Main application component
├── public/                 # Static assets
├── index.html              # HTML template
└── package.json            # Dependencies and scripts
```

### Key Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode**: Theme switching capability
- **RTL Support**: Right-to-left layout for Arabic language
- **Real-time Updates**: WebSocket integration for live notifications
- **Form Validation**: Comprehensive form validation with error handling
- **Role-based UI**: Different interfaces for Admin and Staff users

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Configuration
Create `.env.local` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Gemini CRM
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_NOTIFICATIONS=true
```

## 🎯 Key Components

### Authentication
- **Login/Register**: User authentication forms
- **Protected Routes**: Route guards based on authentication status
- **Role-based Access**: Different UI elements for Admin/Staff roles

### Customer Management
- **Customer List**: Paginated customer listing with search
- **Customer Form**: Create/edit customer information
- **Customer Details**: Detailed customer view with order history

### Product Management
- **Product Catalog**: Grid/list view of products with filtering
- **Product Form**: Create/edit products with image upload
- **Inventory Management**: Stock tracking and low-stock alerts

### Order Management
- **Order Creation**: Multi-step order creation process
- **Order List**: Comprehensive order listing with status filters
- **Order Details**: Detailed order view with item breakdown

### Analytics & Reporting
- **Dashboard**: Key metrics and charts
- **Sales Analytics**: Detailed sales reporting
- **PDF Export**: Generate and download PDF reports

## 🌐 Internationalization

### Supported Languages
- **English (en)**: Left-to-right layout
- **Arabic (ar)**: Right-to-left layout with Arabic numerals

### Translation Files
```
src/locales/
├── en/
│   ├── common.json         # Common translations
│   ├── auth.json           # Authentication
│   ├── customers.json      # Customer management
│   ├── products.json       # Product management
│   ├── orders.json         # Order management
│   └── analytics.json      # Analytics and reports
└── ar/
    ├── common.json         # Arabic translations
    ├── auth.json
    ├── customers.json
    ├── products.json
    ├── orders.json
    └── analytics.json
```

### Usage Example
```jsx
import { useTranslation } from 'react-i18next';

function CustomerForm() {
  const { t } = useTranslation('customers');
  
  return (
    <form>
      <label>{t('firstName')}</label>
      <input placeholder={t('enterFirstName')} />
    </form>
  );
}
```

### RTL Support
- Automatic layout direction switching
- Arabic numeral conversion
- Proper text alignment
- Reversed navigation elements

## 🎨 Styling & Theming

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        // Custom color palette
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        arabic: ['Noto Sans Arabic', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### Theme System
- **Light Mode**: Default theme with light backgrounds
- **Dark Mode**: Dark theme with proper contrast
- **System Preference**: Automatic theme detection
- **Manual Toggle**: User-controlled theme switching

## 🔌 API Integration

### Service Layer
```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Custom Hooks
```javascript
// hooks/useCustomers.js
import { useState, useEffect } from 'react';
import { customerService } from '../services/customerService';

export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.getAll();
      setCustomers(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { customers, loading, error, refetch: fetchCustomers };
}
```

## 🔔 Real-time Features

### WebSocket Integration
```javascript
// contexts/SocketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const newSocket = io(import.meta.env.VITE_API_URL, {
        auth: { token }
      });

      newSocket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
      });

      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, notifications }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
```

## 🧪 Testing

### Testing Setup
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

### Example Test
```javascript
// components/__tests__/CustomerForm.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerForm } from '../CustomerForm';

describe('CustomerForm', () => {
  test('renders form fields', () => {
    render(<CustomerForm />);
    
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(<CustomerForm />);
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
  });
});
```

## 🚀 Build & Deployment

### Development Build
```bash
npm run dev          # Start development server
npm run build        # Create production build
npm run preview      # Preview production build
```

### Production Build
```bash
# Build for production
npm run build

# Build output in dist/ directory
# Optimized and minified assets
# Source maps for debugging
```

### Environment-specific Builds
```bash
# Development build
npm run build:dev

# Staging build
npm run build:staging

# Production build
npm run build:prod
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile-first Approach
```jsx
// Responsive component example
function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## 🔧 Performance Optimization

### Code Splitting
```javascript
// Lazy loading pages
import { lazy, Suspense } from 'react';

const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/products" element={<ProductsPage />} />
      </Routes>
    </Suspense>
  );
}
```

### Image Optimization
- Lazy loading for product images
- WebP format support
- Responsive image sizing
- Placeholder loading states

---

**Last Updated**: July 2025  
**React Version**: 18.x  
**Vite Version**: 4.x
