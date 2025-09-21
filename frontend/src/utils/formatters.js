// Date formatting utilities

// Get current locale from i18n
const getCurrentLocale = () => {
  try {
    // Try to get from React i18n context first
    if (typeof window !== 'undefined' && window.i18n) {
      const currentLang = window.i18n.language || 'en';
      return typeof currentLang === 'string' && currentLang === 'ar' ? 'ar-SA' : 'en-US';
    }

    // Try to get from localStorage (where react-i18next stores the language)
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedLang = window.localStorage.getItem('i18nextLng');
      if (storedLang && typeof storedLang === 'string') {
        return storedLang === 'ar' ? 'ar-SA' : 'en-US';
      }
    }

    // Fallback to browser locale or default
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language || navigator.languages?.[0] || 'en-US';
      return typeof browserLang === 'string' && browserLang.startsWith('ar') ? 'ar-SA' : 'en-US';
    }
  } catch (error) {
    console.warn('Error getting current locale:', error);
  }

  return 'en-US';
};
export const formatDate = (date, options = {}, locale = null) => {
  if (!date) return '';

  const currentLocale = locale || getCurrentLocale();
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    calendar: 'gregory', // Ensure Gregorian calendar
    ...options,
  };

  // Always use Western numerals for dates, even in Arabic locale
  return new Date(date).toLocaleDateString(currentLocale, defaultOptions);
};

export const formatDateTime = (date, locale = null) => {
  if (!date) return '';

  const currentLocale = locale || getCurrentLocale();

  // Always use Western numerals for dates, even in Arabic locale
  return new Date(date).toLocaleString(currentLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'gregory', // Ensure Gregorian calendar
  });
};

export const formatTime = (date, locale = null) => {
  if (!date) return '';

  const currentLocale = locale || getCurrentLocale();

  // Always use Western numerals for time, even in Arabic locale
  return new Date(date).toLocaleTimeString(currentLocale, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helper functions that use current i18n locale
// These will be used by components that have access to i18n
export const formatDateWithLocale = (date, i18n, options = {}) => {
  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  return formatDate(date, locale, options);
};

export const formatDateTimeWithLocale = (date, i18n) => {
  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  return formatDateTime(date, locale);
};

export const formatTimeWithLocale = (date, i18n) => {
  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  return formatTime(date, locale);
};

// Currency formatting with Egyptian Pound (EGP) and language-aware number conversion
export const formatCurrency = (amount, locale = null) => {
  if (amount === null || amount === undefined) return '';

  try {
    const currentLocale = locale || getCurrentLocale();
    const isArabic = isArabicLocale(currentLocale);

    // Format the number without currency symbol first
    const numberFormatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    // Add Egyptian Pound symbol based on language
    let formatted;
    if (isArabic) {
      // Arabic: amount + space + ج.م
      const arabicNumber = toArabicNumerals(numberFormatted);
      formatted = `${arabicNumber} ج.م`;
    } else {
      // English: LE + space + amount
      formatted = `LE ${numberFormatted}`;
    }

    return formatted;
  } catch (error) {
    console.warn('Error formatting currency:', error);
    return amount ? amount.toString() : '';
  }
};

// Number formatting with language-aware number conversion
export const formatNumber = (number, options = {}, locale = null) => {
  if (number === null || number === undefined) return '';

  try {
    const currentLocale = locale || getCurrentLocale();
    const isArabic = isArabicLocale(currentLocale);

    const formatted = new Intl.NumberFormat('en-US', options).format(number);

    // Convert to Arabic numerals if Arabic locale
    return isArabic ? toArabicNumerals(formatted) : formatted;
  } catch (error) {
    console.warn('Error formatting number:', error);
    return number ? number.toString() : '';
  }
};

// Arabic number conversion utilities
const arabicNumerals = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩'
};

const westernNumerals = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9'
};

// Convert Western numerals (0-9) to Arabic-Indic numerals (٠-٩)
export const toArabicNumerals = (text) => {
  if (!text && text !== 0) return '';
  try {
    return text.toString().replace(/[0-9]/g, (digit) => arabicNumerals[digit] || digit);
  } catch (error) {
    console.warn('Error converting to Arabic numerals:', error);
    return text ? text.toString() : '';
  }
};

// Convert Arabic-Indic numerals (٠-٩) to Western numerals (0-9)
export const toWesternNumerals = (text) => {
  if (!text && text !== 0) return '';
  try {
    return text.toString().replace(/[٠-٩]/g, (digit) => westernNumerals[digit] || digit);
  } catch (error) {
    console.warn('Error converting to Western numerals:', error);
    return text ? text.toString() : '';
  }
};

// Helper function to determine if current locale is Arabic
export const isArabicLocale = (locale = null) => {
  const currentLocale = locale || getCurrentLocale();
  return typeof currentLocale === 'string' && currentLocale.startsWith('ar');
};

// Convert numbers in text based on current locale
export const localizeNumbers = (text, locale = null) => {
  if (!text) return '';
  return isArabicLocale(locale) ? toArabicNumerals(text) : text;
};

// Phone number formatting with language-aware number conversion
export const formatPhoneNumber = (phoneNumber, locale = null) => {
  if (!phoneNumber) return '';

  try {
    const currentLocale = locale || getCurrentLocale();
    const isArabic = isArabicLocale(currentLocale);

    // Remove all non-digit characters (including Arabic numerals)
    const cleaned = toWesternNumerals(phoneNumber).replace(/\D/g, '');

    let formatted = '';

    if (isArabic) {
      // For Arabic: display numbers without formatting, just convert to Arabic numerals
      // Remove any + signs and spaces, display as continuous string
      formatted = cleaned;
    } else {
      // For English: use standard formatting
      // Format as (XXX) XXX-XXXX for US numbers
      if (cleaned.length === 10) {
        formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
      // For international numbers, just add spaces
      else if (cleaned.length > 10) {
        formatted = cleaned.replace(/(\d{1,3})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4');
      }
      else {
        formatted = cleaned || phoneNumber.toString();
      }
    }

    // Convert to Arabic numerals if Arabic locale
    return isArabic ? toArabicNumerals(formatted) : formatted;
  } catch (error) {
    console.warn('Error formatting phone number:', error);
    return phoneNumber ? phoneNumber.toString() : '';
  }
};

// Name formatting
export const formatFullName = (firstName, lastName) => {
  if (!firstName && !lastName) return '';
  if (!firstName) return lastName;
  if (!lastName) return firstName;
  return `${firstName} ${lastName}`;
};

export const getInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${first}${last}`;
};

// Text formatting
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const capitalizeFirst = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text) => {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => capitalizeFirst(word))
    .join(' ');
};

// Status formatting (legacy - for backward compatibility)
export const formatOrderStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return statusMap[status] || capitalizeFirst(status);
};

// Status formatting with translations
export const formatOrderStatusTranslated = (status, t) => {
  const statusKey = `products.orderStatuses.${status}`;
  return t(statusKey, { defaultValue: capitalizeFirst(status) });
};

export const getStatusColor = (status) => {
  const colorMap = {
    pending: 'yellow',
    processing: 'blue',
    completed: 'green',
    cancelled: 'red',
  };
  
  return colorMap[status] || 'gray';
};

// Stock level formatting (legacy - for backward compatibility)
export const getStockLevel = (quantity) => {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= 5) return 'Low Stock';
  if (quantity <= 20) return 'Medium Stock';
  return 'In Stock';
};

// Stock level formatting with translations (with dynamic thresholds)
export const getStockLevelTranslated = (quantity, t, thresholds = null) => {
  const lowThreshold = thresholds?.low || 5;
  const mediumThreshold = thresholds?.medium || 20;

  if (quantity === 0) return t('products.stockLevels.outOfStock');
  if (quantity <= lowThreshold) return t('products.stockLevels.lowStock');
  if (quantity <= mediumThreshold) return t('products.stockLevels.mediumStock');
  return t('products.stockLevels.inStock');
};

export const getStockLevelColor = (quantity, thresholds = null) => {
  const lowThreshold = thresholds?.low || 5;
  const mediumThreshold = thresholds?.medium || 20;

  if (quantity === 0) return 'red';
  if (quantity <= lowThreshold) return 'orange';
  if (quantity <= mediumThreshold) return 'yellow';
  return 'green';
};

// URL and slug formatting
export const createSlug = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
};

// File size formatting
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validation helpers
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Array formatting
export const formatList = (items, conjunction = 'and') => {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);
  
  return `${otherItems.join(', ')}, ${conjunction} ${lastItem}`;
};

// Age calculation - always returns Western numerals for consistency with dates
export const calculateAge = (birthDate) => {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  // Always return Western numerals for age (consistent with dates)
  return age;
};

// Relative time formatting
export const formatRelativeTime = (date, locale = 'en-US') => {
  if (!date) return '';

  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDate(date, locale);
};
