import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './components/common/NotificationSystem';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import NotificationSettings from './pages/NotificationSettings';
import Validation from './validation/Validation';
import PhoneNumberTest from './components/test/PhoneNumberTest';
import './App.css';

// Import i18n configuration
import './i18n';

function App() {
  return (
    <ErrorBoundary
      componentName="App"
      title="Application Error"
      message="The application encountered an unexpected error. Please try refreshing the page."
    >
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <Router>
            <div className="App">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={
                    <ErrorBoundary componentName="Dashboard">
                      <Dashboard />
                    </ErrorBoundary>
                  } />
                  <Route path="customers/*" element={
                    <ErrorBoundary componentName="Customers">
                      <Customers />
                    </ErrorBoundary>
                  } />
                  <Route path="products/*" element={
                    <ErrorBoundary componentName="Products">
                      <Products />
                    </ErrorBoundary>
                  } />
                  <Route path="orders/*" element={
                    <ErrorBoundary componentName="Orders">
                      <Orders />
                    </ErrorBoundary>
                  } />
                  <Route path="analytics" element={
                    <ErrorBoundary componentName="Analytics">
                      <Analytics />
                    </ErrorBoundary>
                  } />
                  <Route path="profile/*" element={
                    <ErrorBoundary componentName="Profile">
                      <Profile />
                    </ErrorBoundary>
                  } />
                  <Route path="settings/notifications" element={
                    <ErrorBoundary componentName="NotificationSettings">
                      <NotificationSettings />
                    </ErrorBoundary>
                  } />
                  {process.env.NODE_ENV === 'development' && (
                    <>
                      <Route path="test/validation" element={
                        <ErrorBoundary componentName="Validation">
                          <Validation/>
                        </ErrorBoundary>
                      } />
                      <Route path="test/phone" element={
                        <ErrorBoundary componentName="PhoneNumberTest">
                          <PhoneNumberTest />
                        </ErrorBoundary>
                      } />
                    </>
                  )}
                </Route>

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
            </Router>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
