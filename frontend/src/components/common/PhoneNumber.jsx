import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatPhoneNumber } from '../../utils/formatters';

/**
 * PhoneNumber component that displays phone numbers with proper direction and localization
 * - Always displays left-to-right (LTR) regardless of interface language
 * - Converts numbers to Arabic numerals when Arabic language is active
 * - For Arabic: displays as continuous string without formatting (e.g., ۰۱۰۰٦۱۹٤۷۲۹)
 * - For English: maintains standard formatting (e.g., (123) 456-7890)
 */
const PhoneNumber = ({
  phone,
  className = '',
  showIcon = false,
  iconComponent: IconComponent = null,
  ...props
}) => {
  const { i18n } = useTranslation();

  if (!phone) return null;

  const currentLocale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  const formattedPhone = formatPhoneNumber(phone, currentLocale);

  return (
    <span
      className={`phone-number ${className}`}
      dir="ltr" // Always LTR for phone numbers
      style={{
        direction: 'ltr', // Ensure LTR direction
        textAlign: 'left', // Align text to left
        display: 'inline-block', // Prevent text wrapping issues
        fontFamily: i18n.language === 'ar' ? 'monospace' : 'inherit' // Use monospace for Arabic numbers for better alignment
      }}
      {...props}
    >
      {showIcon && IconComponent && (
        <IconComponent className="inline mr-1 h-4 w-4" />
      )}
      {formattedPhone}
    </span>
  );
};

export default PhoneNumber;
