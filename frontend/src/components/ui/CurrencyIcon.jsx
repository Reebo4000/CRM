import React from 'react';
import { useTranslation } from 'react-i18next';

const CurrencyIcon = ({ className = "h-4 w-4", color = "text-green-600" }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  if (isArabic) {
    // Arabic: ج.م (Egyptian Pound in Arabic)
    return (
      <span 
        className={`inline-flex items-center justify-center font-bold ${color} ${className}`}
        style={{ 
          fontSize: '0.75rem',
          fontWeight: 'bold',
          minWidth: '1rem',
          textAlign: 'center'
        }}
        title="جنيه مصري"
      >
        ج.م
      </span>
    );
  } else {
    // English: LE (Egyptian Pound in English)
    return (
      <span 
        className={`inline-flex items-center justify-center font-bold ${color} ${className}`}
        style={{ 
          fontSize: '0.75rem',
          fontWeight: 'bold',
          minWidth: '1rem',
          textAlign: 'center'
        }}
        title="Egyptian Pound"
      >
        LE
      </span>
    );
  }
};

export default CurrencyIcon;
