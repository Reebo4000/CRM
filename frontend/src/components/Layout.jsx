import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useDirection } from '../hooks/useDirection';
import { SkipLink, ScreenReaderOnly } from './common/AccessibilityProvider';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import NotificationCenter from './NotificationCenter';
import { SocketProvider } from '../contexts/SocketContext';
import {
  Home,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Settings,
  Zap
} from 'lucide-react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout,  } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useDirection();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: Home },
    { name: t('navigation.customers'), href: '/customers', icon: Users },
    { name: t('navigation.products'), href: '/products', icon: Package },
    { name: t('navigation.orders'), href: '/orders', icon: ShoppingCart },
    { name: t('navigation.analytics'), href: '/analytics', icon: BarChart3 },
  ];

  const isActiveRoute = (href) => {
    return location.pathname.startsWith(href);
  };

  return (
    <SocketProvider>
      <div className="min-h-screen bg-background flex flex-col">
      {/* Skip Link for accessibility */}
      <SkipLink href="#main-content">
        {t('accessibility.skipToMain', 'Skip to main content')}
      </SkipLink>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('navigation.mobileMenu', 'Mobile navigation menu')}
      >
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        <div className={`relative flex w-full max-w-xs flex-1 flex-col sidebar ${isRTL ? 'right-0' : 'left-0'}`}>
          <div className={`absolute top-0 pt-2 ${isRTL ? 'left-0 -ml-12' : 'right-0 -mr-12'}`}>
            <button
              type="button"
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm border border-border focus-ring ${isRTL ? 'mr-1' : 'ml-1'}`}
              onClick={() => setSidebarOpen(false)}
              aria-label={t('navigation.closeMobileMenu', 'Close mobile menu')}
            >
              <X className="h-5 w-5 text-foreground" aria-hidden="true" />
            </button>
          </div>
          <div className="h-0 flex-1 overflow-y-auto pt-6 pb-4">
            <div className="sidebar-header">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Zap className="h-5 w-5" />
                </div>
                <h1 className="text-xl font-bold text-sidebar-foreground">CRM</h1>
              </div>
            </div>
            <nav
              className="sidebar-nav mt-6"
              aria-label={t('navigation.mainNavigation', 'Main navigation')}
            >
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`sidebar-nav-item ${
                      isActive ? 'sidebar-nav-item-active' : ''
                    }`}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col ${isRTL ? 'lg:right-0' : 'lg:left-0'}`}>
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground">CRM</h1>
                <p className="text-xs text-sidebar-accent-foreground">{t('auth.subtitle')}</p>
              </div>
            </div>
          </div>

          <div className="sidebar-content">
            <nav className="sidebar-nav">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`sidebar-nav-item ${
                      isActiveRoute(item.href) ? 'sidebar-nav-item-active' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="sidebar-footer">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent">
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-sidebar-accent-foreground capitalize truncate">
                  {t(`roles.${user?.role}`)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col ${isRTL ? 'lg:pr-60' : 'lg:pl-60'}`}>
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-input">
          <div
            className={`flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 ${
              isRTL ? 'justify-between3' : ''
            }`}
            dir={isRTL ? 'ltr' : 'ltr'}
          >
            <button
              type="button"
              className={`lg:hidden btn-ghost btn-sm ${isRTL ? 'order-2' : 'order-1'}`}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div
              className={`flex items-center gap-3 ${
                isRTL ? 'flex-row-reverse' : ''
              }`}
            >
              {/* User info - hidden on mobile, shown on desktop */}
              <div className="hidden lg:flex items-center gap-3">
                {/* <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </span>
                </div> */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize truncate">
                    {t(`roles.${user?.role}`)}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <LanguageSwitcher />
                {/* <ThemeToggle /> */}

                {/* Notification Center */}
                <NotificationCenter />

                <Link
                  to="/profile"
                  className="btn-ghost btn-sm"
                  title={t('navigation.profile')}
                >
                  <User className="h-5 w-5" />
                </Link>

                {/* {isAdmin() && (
                  <button
                    className="btn-ghost btn-sm"
                    title={t('navigation.settings')}
                  >
                    <Settings className="h-5 w-5" />
                  </button>

                )} */}

                <button
                  onClick={handleLogout}
                  className="btn-ghost btn-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                  title={t('navigation.logout')}
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main
          id="main-content"
          className={`flex-1 flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}
          role="main"
          aria-label={t('accessibility.mainContent', 'Main content')}
        >
          <div className="py-8 flex-1 flex flex-col">
            <div className="mx-auto max-w-8xl px-3 sm:px-4 lg:px-4 flex-1 flex flex-col">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
    </SocketProvider>
  );
};

export default Layout;
