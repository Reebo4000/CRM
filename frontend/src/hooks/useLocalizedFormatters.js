import { useTranslation } from 'react-i18next';
import {
  formatDate as baseDateFormat,
  formatDateTime as baseDateTimeFormat,
  formatTime as baseTimeFormat
} from '../utils/formatters';

export const useLocalizedFormatters = () => {
  const { i18n, t } = useTranslation();
  
  // Get current locale based on i18n language
  const getCurrentLocale = () => {
    const currentLang = i18n.language || 'en';
    // Use ar-EG for Arabic to ensure Gregorian calendar with Arabic month names
    return currentLang === 'ar' ? 'ar-EG' : 'en-US';
  };

  const formatDate = (date, options = {}) => {
    return baseDateFormat(date, getCurrentLocale(), options);
  };

  const formatDateTime = (date) => {
    return baseDateTimeFormat(date, getCurrentLocale());
  };

  const formatTime = (date) => {
    return baseTimeFormat(date, getCurrentLocale());
  };

  const formatRelativeTime = (date) => {
    if (!date) return '';

    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return t('time.justNow');
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return t('time.minutesAgo', { count: minutes });
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return t('time.hoursAgo', { count: hours });
    }
    if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return t('time.daysAgo', { count: days });
    }

    return formatDate(date);
  };

  return {
    formatDate,
    formatDateTime,
    formatTime,
    formatRelativeTime,
    locale: getCurrentLocale()
  };
};
