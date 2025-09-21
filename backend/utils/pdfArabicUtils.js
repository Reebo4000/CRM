/**
 * PDF Arabic Text Utilities
 * Handles Arabic text rendering, RTL layout, and numeral conversion for PDF generation
 */

// Arabic numeral mapping (Western to Arabic-Indic)
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

// Western numeral mapping (Arabic-Indic to Western)
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

/**
 * Convert Western numerals (0-9) to Arabic-Indic numerals (٠-٩)
 */
const toArabicNumerals = (text) => {
  if (!text && text !== 0) return '';
  try {
    return text.toString().replace(/[0-9]/g, (digit) => arabicNumerals[digit] || digit);
  } catch (error) {
    console.warn('Error converting to Arabic numerals:', error);
    return text ? text.toString() : '';
  }
};

/**
 * Convert Arabic-Indic numerals (٠-٩) to Western numerals (0-9)
 */
const toWesternNumerals = (text) => {
  if (!text && text !== 0) return '';
  try {
    return text.toString().replace(/[٠-٩]/g, (digit) => westernNumerals[digit] || digit);
  } catch (error) {
    console.warn('Error converting to Western numerals:', error);
    return text ? text.toString() : '';
  }
};

/**
 * Check if text contains Arabic characters
 */
const containsArabic = (text) => {
  if (!text) return false;
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
};

/**
 * Format currency for PDF display with proper Arabic numeral conversion
 */
const formatCurrencyForPDF = (amount, language = 'en') => {
  if (!amount && amount !== 0) return '0.00 LE';
  
  try {
    const formatted = new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
    
    // For Arabic, convert numerals but keep currency symbol as Western
    if (language === 'ar') {
      return formatted.replace(/[0-9]/g, (digit) => arabicNumerals[digit] || digit);
    }
    
    return formatted;
  } catch (error) {
    console.warn('Error formatting currency:', error);
    return `$${amount || 0}`;
  }
};

/**
 * Format numbers for PDF display with proper Arabic numeral conversion
 */
const formatNumberForPDF = (number, language = 'en') => {
  if (!number && number !== 0) return '0';
  
  try {
    const formatted = new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US').format(number);
    
    // For Arabic, convert numerals
    if (language === 'ar') {
      return toArabicNumerals(formatted);
    }
    
    return formatted;
  } catch (error) {
    console.warn('Error formatting number:', error);
    return number.toString();
  }
};

/**
 * Format dates for PDF display (always keep Western numerals for consistency)
 */
const formatDateForPDF = (date, language = 'en') => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return date.toString();
  }
};

/**
 * Get text alignment based on language and content
 */
const getTextAlignment = (text, language = 'en') => {
  if (language === 'ar' || containsArabic(text)) {
    return 'right';
  }
  return 'left';
};

/**
 * Get appropriate X position for text based on alignment
 */
const getTextXPosition = (alignment, pageWidth = 595, margin = 50, textWidth = 0) => {
  switch (alignment) {
    case 'right':
      return pageWidth - margin - textWidth;
    case 'center':
      return (pageWidth - textWidth) / 2;
    case 'left':
    default:
      return margin;
  }
};

/**
 * Arabic translations for common PDF terms
 */
const arabicTranslations = {
  // Headers
  'Analytics Report': 'تقرير التحليلات',
  'Gemini CRM': 'CRM',
  'Women\'s Bag Store Management System': 'نظام إدارة متجر حقائب النساء',
  
  // Report sections
  'Key Metrics': 'المؤشرات الرئيسية',
  'Recent Orders': 'الطلبات الحديثة',
  'Customer Analytics': 'تحليلات العملاء',
  'Product Analytics': 'تحليلات المنتجات',
  
  // Metrics
  'Total Revenue': 'إجمالي الإيرادات',
  'Total Orders': 'إجمالي الطلبات',
  'Total Customers': 'إجمالي العملاء',
  'Average Order Value': 'متوسط قيمة الطلب',
  'Total Products': 'إجمالي المنتجات',
  'Low Stock Products': 'المنتجات منخفضة المخزون',
  'Out of Stock Products': 'المنتجات غير المتوفرة',
  'New Customers (Last 30 days)': 'العملاء الجدد (آخر 30 يوم)',
  
  // Table headers
  'Order ID': 'رقم الطلب',
  'Customer': 'العميل',
  'Date': 'التاريخ',
  'Amount': 'المبلغ',
  'Status': 'الحالة',
  
  // Status translations
  'pending': 'قيد الانتظار',
  'processing': 'قيد المعالجة',
  'completed': 'مكتمل',
  'cancelled': 'ملغي',
  'shipped': 'تم الشحن',
  'delivered': 'تم التسليم',
  
  // Time references
  'Report Period': 'فترة التقرير',
  'Generated on': 'تم إنشاؤه في',
  'Page': 'صفحة',
  'of': 'من',
  'Generated by Gemini CRM System': 'تم إنشاؤه بواسطة نظام CRM'
};

/**
 * Get translated text for Arabic language
 */
const getTranslatedText = (text, language = 'en') => {
  if (language === 'ar' && arabicTranslations[text]) {
    return arabicTranslations[text];
  }
  return text;
};

/**
 * Simple Arabic text processing for PDF (fallback approach)
 * Since PDFKit has limited Arabic support, we'll use a simplified approach
 */
const processArabicTextForPDF = (text, language = 'en') => {
  if (language !== 'ar' || !text) return text;

  // For Arabic PDFs, we'll use a simplified approach:
  // 1. Keep English text as-is for technical terms
  // 2. Use Arabic numerals for numbers
  // 3. Use transliterated Arabic for complex text

  // Convert numbers to Arabic numerals
  const withArabicNumerals = toArabicNumerals(text);

  return withArabicNumerals;
};

/**
 * Get safe text for PDF rendering (handles Arabic limitations)
 */
const getSafeTextForPDF = (text, language = 'en') => {
  if (language !== 'ar') return text;

  // For Arabic language, use English text with Arabic numerals
  // This ensures readability while maintaining some Arabic characteristics
  return toArabicNumerals(text);
};

module.exports = {
  toArabicNumerals,
  toWesternNumerals,
  containsArabic,
  formatCurrencyForPDF,
  formatNumberForPDF,
  formatDateForPDF,
  getTextAlignment,
  getTextXPosition,
  getTranslatedText,
  processArabicTextForPDF,
  getSafeTextForPDF,
  arabicTranslations
};
