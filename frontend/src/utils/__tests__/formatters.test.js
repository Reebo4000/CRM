import {
  formatPhoneNumber,
  toArabicNumerals,
  toWesternNumerals,
  isArabicLocale,
  localizeNumbers,
  formatNumber,
  formatCurrency,
  calculateAge
} from '../formatters';

describe('Arabic Number Conversion', () => {
  test('toArabicNumerals converts Western numerals to Arabic-Indic numerals', () => {
    expect(toArabicNumerals('1234567890')).toBe('١٢٣٤٥٦٧٨٩٠');
    expect(toArabicNumerals('Phone: (123) 456-7890')).toBe('Phone: (١٢٣) ٤٥٦-٧٨٩٠');
    expect(toArabicNumerals('')).toBe('');
    expect(toArabicNumerals(null)).toBe('');
  });

  test('toWesternNumerals converts Arabic-Indic numerals to Western numerals', () => {
    expect(toWesternNumerals('١٢٣٤٥٦٧٨٩٠')).toBe('1234567890');
    expect(toWesternNumerals('Phone: (١٢٣) ٤٥٦-٧٨٩٠')).toBe('Phone: (123) 456-7890');
    expect(toWesternNumerals('')).toBe('');
    expect(toWesternNumerals(null)).toBe('');
  });

  test('isArabicLocale correctly identifies Arabic locales', () => {
    expect(isArabicLocale('ar-SA')).toBe(true);
    expect(isArabicLocale('ar-EG')).toBe(true);
    expect(isArabicLocale('en-US')).toBe(false);
    expect(isArabicLocale('fr-FR')).toBe(false);
  });

  test('localizeNumbers converts numbers based on locale', () => {
    expect(localizeNumbers('123', 'ar-SA')).toBe('١٢٣');
    expect(localizeNumbers('123', 'en-US')).toBe('123');
    expect(localizeNumbers('', 'ar-SA')).toBe('');
  });
});

describe('Phone Number Formatting', () => {
  test('formatPhoneNumber formats US numbers correctly in English', () => {
    expect(formatPhoneNumber('1234567890', 'en-US')).toBe('(123) 456-7890');
    expect(formatPhoneNumber('12345678901', 'en-US')).toBe('+1 234 567 8901');
  });

  test('formatPhoneNumber formats and converts numbers to Arabic', () => {
    expect(formatPhoneNumber('1234567890', 'ar-SA')).toBe('(١٢٣) ٤٥٦-٧٨٩٠');
    expect(formatPhoneNumber('12345678901', 'ar-SA')).toBe('+١ ٢٣٤ ٥٦٧ ٨٩٠١');
  });

  test('formatPhoneNumber handles Arabic input numbers', () => {
    expect(formatPhoneNumber('١٢٣٤٥٦٧٨٩٠', 'ar-SA')).toBe('(١٢٣) ٤٥٦-٧٨٩٠');
    expect(formatPhoneNumber('١٢٣٤٥٦٧٨٩٠', 'en-US')).toBe('(123) 456-7890');
  });

  test('formatPhoneNumber handles empty or invalid input', () => {
    expect(formatPhoneNumber('', 'en-US')).toBe('');
    expect(formatPhoneNumber(null, 'en-US')).toBe('');
    expect(formatPhoneNumber(undefined, 'en-US')).toBe('');
  });
});

describe('Number Formatting', () => {
  test('formatNumber converts numbers to Arabic numerals in Arabic locale', () => {
    expect(formatNumber(1234, {}, 'ar-SA')).toBe('١,٢٣٤');
    expect(formatNumber(1234, {}, 'en-US')).toBe('1,234');
  });

  test('formatCurrency converts currency numbers to Arabic numerals in Arabic locale', () => {
    const arabicResult = formatCurrency(1234.56, 'USD', 'ar-SA');
    const englishResult = formatCurrency(1234.56, 'USD', 'en-US');
    
    expect(arabicResult).toContain('١,٢٣٤.٥٦');
    expect(englishResult).toContain('1,234.56');
  });
});

describe('Age Calculation', () => {
  test('calculateAge returns Arabic numerals for Arabic locale', () => {
    const birthDate = new Date('1990-01-01');
    const currentYear = new Date().getFullYear();
    const expectedAge = currentYear - 1990;
    
    const arabicAge = calculateAge(birthDate, 'ar-SA');
    const englishAge = calculateAge(birthDate, 'en-US');
    
    expect(arabicAge).toBe(toArabicNumerals(expectedAge.toString()));
    expect(englishAge).toBe(expectedAge);
  });

  test('calculateAge handles invalid dates', () => {
    expect(calculateAge(null, 'ar-SA')).toBe(null);
    expect(calculateAge(undefined, 'en-US')).toBe(null);
  });
});
