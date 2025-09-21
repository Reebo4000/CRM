import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Settings, Check, CheckCheck, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from './common/NotificationSystem';
import api from '../services/api';

const NotificationCenter = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const { success, info, warning, error } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef(null);

  // Helper function to map notification types to toast types
  const getToastTypeFromNotificationType = (notificationType) => {
    switch (notificationType) {
      case 'order_created':
      case 'customer_registered':
        return 'success';
      case 'stock_low':
      case 'stock_medium':
        return 'warning';
      case 'stock_out':
      case 'order_failed':
        return 'error';
      case 'order_status_changed':
      case 'order_payment_updated':
      case 'order_high_value':
      default:
        return 'info';
    }
  };

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const unreadOnly = filter === 'unread';
      const response = await api.get(`/notifications?page=${pageNum}&limit=20&unreadOnly=${unreadOnly}`);
      
      if (reset) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.data.notifications]);
      }
      
      setHasMore(response.data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      // console.log('📊 Fetched unread count:', response.data.count);
      setUnreadCount(response.data.count);
    } catch (error) {
      // console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Navigate to related page based on notification type
  const navigateToRelatedPage = (notification) => {
    const { relatedEntityType, relatedEntityId } = notification;

    switch (relatedEntityType) {
      case 'order':
        navigate(`/orders/${relatedEntityId}`);
        break;
      case 'customer':
        navigate(`/customers/${relatedEntityId}`);
        break;
      case 'product':
        navigate(`/products/${relatedEntityId}`);
        break;
      case 'user':
        navigate(`/users/${relatedEntityId}`);
        break;
      default:
        // For notifications without specific entity, navigate to relevant section
        if (notification.type.includes('order')) {
          navigate('/orders');
        } else if (notification.type.includes('stock') || notification.type.includes('product')) {
          navigate('/products');
        } else if (notification.type.includes('customer')) {
          navigate('/customers');
        } else {
          navigate('/dashboard');
        }
        break;
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to related page
    navigateToRelatedPage(notification);

    // Close notification center
    setIsOpen(false);
  };

  // Socket event handlers
  useEffect(() => {
    if (socket) {
      // Handle new notifications (broadcast)
      socket.on('notification', (notificationData) => {
        console.log('📢 New notification received:', notificationData);

        // Extract notification from the data structure
        const notification = notificationData.notification || notificationData;
        const userNotification = notificationData.userNotification;

        // Create the notification object with user-specific data
        const newNotification = {
          ...notification,
          isRead: userNotification?.isRead || false,
          readAt: userNotification?.readAt || null,
          isEmailSent: userNotification?.isEmailSent || false,
          emailSentAt: userNotification?.emailSentAt || null,
          userNotificationId: userNotification?.id
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log('📊 Unread count updated:', prev, '→', newCount);
          return newCount;
        });

        // Show toast notification for real-time feedback
        const toastType = getToastTypeFromNotificationType(notification.type);
        const toastMessage = i18n.language === 'ar' && notification.titleAr
          ? notification.titleAr
          : notification.title;

        // Show toast notification
        switch (toastType) {
          case 'success':
            success(toastMessage, {
              title: 'New Notification',
              duration: 4000
            });
            break;
          case 'warning':
            warning(toastMessage, {
              title: 'Warning',
              duration: 5000
            });
            break;
          case 'error':
            error(toastMessage, {
              title: 'Alert',
              duration: 6000
            });
            break;
          default:
            info(toastMessage, {
              title: 'Notification',
              duration: 4000
            });
        }
      });

      // Handle notification read status updates
      socket.on('notification_read', (data) => {
        console.log('✅ Notification read event received:', data);
        if (data.notificationId) {
          setNotifications(prev =>
            prev.map(notif =>
              notif.id === data.notificationId
                ? { ...notif, isRead: true, readAt: new Date().toISOString() }
                : notif
            )
          );
          setUnreadCount(prev => {
            const newCount = Math.max(0, prev - 1);
            console.log('📊 Unread count decreased:', prev, '→', newCount);
            return newCount;
          });
        }
      });

      // Handle mark all as read
      socket.on('notifications_all_read', () => {
        console.log('✅ Mark all as read event received');
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        console.log('📊 Unread count reset to 0');
      });

      return () => {
        socket.off('notification');
        socket.off('notification_read');
        socket.off('notifications_all_read');
      };
    }
  }, [socket]);

  // Initial unread count fetch on mount
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // Load notifications when opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1, true);
      fetchUnreadCount(); // Refresh count when opened
    }
  }, [isOpen, filter]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Load more notifications
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1, false);
    }
  };

  // Format notification time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('notifications.justNow');
    if (diffInMinutes < 60) return t('notifications.minutesAgo', { count: diffInMinutes });
    if (diffInMinutes < 1440) return t('notifications.hoursAgo', { count: Math.floor(diffInMinutes / 60) });
    return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US');
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const iconMap = {
      order_created: '📦',
      order_status_changed: '📋',
      order_payment_updated: '💳',
      order_high_value: '💰',
      order_failed: '❌',
      stock_low: '📦',
      stock_medium: '⚠️',
      stock_out: '🚨',
      restock_recommendation: '📈',
      customer_registered: '👤',
      sales_summary_daily: '📊',
      sales_summary_weekly: '📈',
      system_alert: '🚨',
      maintenance_notice: '🔧'
    };
    return iconMap[type] || '📢';
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colorMap = {
      low: 'text-gray-500',
      medium: 'text-yellow-500',
      high: 'text-orange-500',
      critical: 'text-red-500'
    };
    return colorMap[priority] || 'text-gray-500';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-600 dark:hover:text-white transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('notifications.title')}
            </h3>
            <div className="flex items-center space-x-2">
              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">{t('notifications.all')}</option>
                <option value="unread">{t('notifications.unread')}</option>
              </select>
              
              {/* Mark all as read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  title={t('notifications.markAllRead')}
                >
                  <CheckCheck size={16} />
                </button>
              )}
              
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {t('notifications.noNotifications')}
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          !notification.isRead
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {i18n.language === 'ar' && notification.titleAr
                            ? notification.titleAr
                            : notification.title}
                        </p>
                        <div className="flex items-center space-x-1">
                          {/* Broadcast indicator */}
                          <span className="text-xs text-gray-400" title={t('notifications.broadcast')}>
                            📢
                          </span>
                          {/* Priority indicator */}
                          <span className={`text-xs ${getPriorityColor(notification.priority)}`}>
                            ●
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {i18n.language === 'ar' && notification.messageAr 
                          ? notification.messageAr 
                          : notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Load More */}
            {hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                >
                  {loading ? t('common.loading') : t('notifications.loadMore')}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to notification settings
                window.location.href = '/settings/notifications';
              }}
              className="w-full text-sm text-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center space-x-2"
            >
              <Settings size={14} />
              <span>{t('notifications.settingss')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
