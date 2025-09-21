# Arabic Numerals Implementation Guide

## Overview
This guide explains which numbers are converted to Arabic-Indic numerals (٠-٩) and which remain as Western numerals (0-9) when Arabic language is active.

## What Gets Converted to Arabic Numerals

### ✅ Phone Numbers
- **Purpose**: Better readability for Arabic users
- **Format**: Continuous string without spaces or + signs
- **Example**: 
  - Input: `1234567890`
  - English: `(123) 456-7890`
  - Arabic: `١٢٣٤٥٦٧٨٩٠`

### ✅ General Numbers (formatNumber)
- **Purpose**: Localized number display
- **Example**:
  - Input: `1234`
  - English: `1,234`
  - Arabic: `١,٢٣٤`

### ✅ Currency Amounts (formatCurrency)
- **Purpose**: Localized currency display
- **Example**:
  - Input: `1234.56`
  - English: `$1,234.56`
  - Arabic: `$١,٢٣٤.٥٦`

## What Stays as Western Numerals

### ❌ Dates (formatDate, formatDateTime)
- **Reason**: Dates should remain consistent and internationally readable
- **Calendar**: Always Gregorian calendar
- **Example**:
  - Input: `2023-12-25`
  - English: `Dec 25, 2023`
  - Arabic: `Dec 25, 2023` (NOT `Dec ٢٥, ٢٠٢٣`)

### ❌ Time (formatTime)
- **Reason**: Time should remain consistent and internationally readable
- **Example**:
  - Input: `15:30`
  - English: `3:30 PM`
  - Arabic: `3:30 PM` (NOT `٣:٣٠ PM`)

### ❌ Age (calculateAge)
- **Reason**: Age is related to dates and should be consistent
- **Example**:
  - Birth Date: `1990-01-01`
  - English: `33`
  - Arabic: `33` (NOT `٣٣`)

## Implementation Details

### Utility Functions
```javascript
// Convert to Arabic numerals
toArabicNumerals('123') // Returns: '١٢٣'

// Convert to Western numerals
toWesternNumerals('١٢٣') // Returns: '123'

// Check if locale is Arabic
isArabicLocale('ar-SA') // Returns: true
isArabicLocale('en-US') // Returns: false

// Localize numbers based on current locale
localizeNumbers('123', 'ar-SA') // Returns: '١٢٣'
localizeNumbers('123', 'en-US') // Returns: '123'
```

### Phone Number Special Handling
```javascript
// English formatting
formatPhoneNumber('1234567890', 'en-US') 
// Returns: '(123) 456-7890'

// Arabic formatting (continuous, no formatting)
formatPhoneNumber('1234567890', 'ar-SA') 
// Returns: '١٢٣٤٥٦٧٨٩٠'
```

## User Experience Rationale

### Why Phone Numbers Use Arabic Numerals
- Phone numbers are frequently shared and communicated verbally
- Arabic speakers are more comfortable reading Arabic numerals
- Continuous format (no spaces/symbols) is cleaner for Arabic text

### Why Dates Stay Western
- Dates need to be internationally consistent
- Business documents and records should be universally readable
- Gregorian calendar is the business standard
- Mixing Arabic numerals in dates can cause confusion

### Why Currency Uses Arabic Numerals
- Financial amounts are often discussed locally
- Arabic numerals make amounts more accessible to Arabic speakers
- Currency symbols remain Western for international recognition

## Testing
Visit `/test/phone` in development mode to see examples of:
- Phone number conversion
- Number formatting differences
- Date formatting consistency
- Currency localization

## Configuration
The conversion behavior is controlled by:
- `getCurrentLocale()` - Detects current language
- `isArabicLocale()` - Determines if Arabic numerals should be used
- Individual formatter functions handle their specific conversion rules
