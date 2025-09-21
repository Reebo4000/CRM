import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useDirection = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const updateDirection = () => {
      const isRTL = i18n.language === 'ar';
      
      // Update document direction
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = i18n.language;
      
      // Update body class for additional styling if needed
      if (isRTL) {
        document.body.classList.add('rtl');
        document.body.classList.remove('ltr');
      } else {
        document.body.classList.add('ltr');
        document.body.classList.remove('rtl');
      }
    };

    // Set initial direction
    updateDirection();

    // Listen for language changes
    i18n.on('languageChanged', updateDirection);

    // Cleanup
    return () => {
      i18n.off('languageChanged', updateDirection);
    };
  }, [i18n]);

  return {
    isRTL: i18n.language === 'ar',
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr'
  };
};
