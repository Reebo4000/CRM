import React, { useState, useEffect, useRef } from 'react';
import { Bell, Mail, Globe, Save, TestTube, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const NotificationSettings = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const modalRef = useRef(null);

  // Notification types with descriptions - Only enabled types as requested
  const notificationTypes = [
    {
      type: 'order_created',
      category: 'orders',
      icon: '📦',
      defaultThreshold: null
    },
    {
      type: 'order_status_changed',
      category: 'orders',
      icon: '📋',
      defaultThreshold: null
    },
    {
      type: 'order_high_value',
      category: 'orders',
      icon: '💰',
      defaultThreshold: { amount: 1000 }
    },
    {
      type: 'order_failed',
      category: 'orders',
      icon: '❌',
      defaultThreshold: null
    },
    {
      type: 'stock_low',
      category: 'inventory',
      icon: '📦',
      defaultThreshold: { quantity: 5 }
    },
    {
      type: 'stock_medium',
      category: 'inventory',
      icon: '⚠️',
      defaultThreshold: { quantity: 10 }
    },
    {
      type: 'stock_out',
      category: 'inventory',
      icon: '🚨',
      defaultThreshold: null
    },
    {
      type: 'restock_recommendation',
      category: 'inventory',
      icon: '📈',
      defaultThreshold: null
    },
    {
      type: 'customer_registered',
      category: 'customers',
      icon: '👤',
      defaultThreshold: null
    },
    {
      type: 'sales_summary_daily',
      category: 'reports',
      icon: '📊',
      defaultThreshold: null
    },
    {
      type: 'sales_summary_weekly',
      category: 'reports',
      icon: '📈',
      defaultThreshold: null
    }
  ];

  // Fetch user preferences
  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/preferences');
      setPreferences(response.data.preferences);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    try {
      setSaving(true);
      await api.put('/notifications/preferences', { preferences });
      // Show success message
      alert(t('notifications.settings.saved'));
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert(t('notifications.settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    try {
      setTestSending(true);
      await api.post('/notifications/test');
      alert(t('notifications.settings.testSent'));
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert(t('notifications.settings.testError'));
    } finally {
      setTestSending(false);
    }
  };

  // Update preference
  const updatePreference = (type, field, value) => {
    setPreferences(prev => {
      const existing = prev.find(p => p.notificationType === type);
      if (existing) {
        return prev.map(p => 
          p.notificationType === type 
            ? { ...p, [field]: value }
            : p
        );
      } else {
        // Create new preference
        const notifType = notificationTypes.find(nt => nt.type === type);
        return [...prev, {
          notificationType: type,
          inAppEnabled: field === 'inAppEnabled' ? value : true,
          emailEnabled: field === 'emailEnabled' ? value : false,
          threshold: field === 'threshold' ? value : notifType?.defaultThreshold,
          language: field === 'language' ? value : i18n.language
        }];
      }
    });
  };

  // Get preference value
  const getPreferenceValue = (type, field) => {
    const pref = preferences.find(p => p.notificationType === type);
    if (!pref) {
      const notifType = notificationTypes.find(nt => nt.type === type);
      switch (field) {
        case 'inAppEnabled': return true;
        case 'emailEnabled': return false;
        case 'threshold': return notifType?.defaultThreshold;
        case 'language': return i18n.language;
        default: return null;
      }
    }
    return pref[field];
  };

  // Group notifications by category
  const groupedNotifications = notificationTypes.reduce((acc, notif) => {
    if (!acc[notif.category]) {
      acc[notif.category] = [];
    }
    acc[notif.category].push(notif);
    return acc;
  }, {});

  useEffect(() => {
    fetchPreferences();
  }, []);

  // Handle close
  const handleClose = () => {
    window.history.back();
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('notifications.settings.title')}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={sendTestNotification}
                disabled={testSending}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
              >
                <TestTube size={16} />
                <span>{testSending ? t('common.sending') : t('notifications.settings.sendTest')}</span>
              </button>
              <button
                onClick={savePreferences}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                <span>{saving ? t('common.saving') : t('common.save')}</span>
              </button>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {Object.entries(groupedNotifications).map(([category, notifications]) => (
            <div key={category} className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t(`notifications.categories.${category}`)}
              </h2>
              
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div key={notif.type} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="text-xl">{notif.icon}</span>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {t(`notifications.types.${notif.type}.title`)}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {t(`notifications.types.${notif.type}.description`)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {/* In-App Toggle */}
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={getPreferenceValue(notif.type, 'inAppEnabled')}
                            onChange={(e) => updatePreference(notif.type, 'inAppEnabled', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Bell size={16} className="text-gray-500" />
                        </label>
                        
                        {/* Email Toggle */}
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={getPreferenceValue(notif.type, 'emailEnabled')}
                            onChange={(e) => updatePreference(notif.type, 'emailEnabled', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Mail size={16} className="text-gray-500" />
                        </label>
                      </div>
                    </div>
                    
                    {/* Threshold Settings */}
                    {notif.defaultThreshold && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-600">
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('notifications.settings.threshold')}:
                          </label>

                          {/* Stock threshold explanation */}
                          {notif.type.startsWith('stock_') && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              {notif.type === 'stock_low' && (
                                <span>🔴 Notify when stock quantity is at or below this level (but above 0)</span>
                              )}
                              {notif.type === 'stock_medium' && (
                                <span>🟡 Notify when stock quantity is at this level (but above low stock threshold)</span>
                              )}
                              {notif.type === 'stock_out' && (
                                <span>🚨 Notify when stock quantity reaches 0 (no threshold needed)</span>
                              )}
                            </div>
                          )}

                          {Object.entries(notif.defaultThreshold).map(([key, defaultValue]) => (
                            <div key={key} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {t(`notifications.thresholds.${key}`)}:
                                </span>
                                {notif.type.startsWith('stock_') && key === 'quantity' && (
                                  <span className="text-xs text-gray-500">units</span>
                                )}
                                {notif.type === 'order_high_value' && key === 'amount' && (
                                  <span className="text-xs text-gray-500">currency</span>
                                )}
                              </div>
                              <input
                                type="number"
                                min="0"
                                value={getPreferenceValue(notif.type, 'threshold')?.[key] || defaultValue}
                                onChange={(e) => {
                                  const currentThreshold = getPreferenceValue(notif.type, 'threshold') || {};
                                  updatePreference(notif.type, 'threshold', {
                                    ...currentThreshold,
                                    [key]: parseInt(e.target.value) || 0
                                  });
                                }}
                                className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={defaultValue.toString()}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
