# PhoneNumber Component

## Overview
The `PhoneNumber` component provides consistent phone number display across the CRM application with proper internationalization support.

## Features

### 1. Left-to-Right (LTR) Direction
- Phone numbers **always** display left-to-right, regardless of the interface language
- This ensures phone numbers remain readable and properly formatted in both English and Arabic interfaces
- Uses CSS `direction: ltr` and `text-align: left` to enforce LTR display

### 2. Arabic Numeral Conversion
- When Arabic language is active, all digits (0-9) are converted to Arabic-Indic numerals (٠-٩)
- Arabic numbers display as continuous string without formatting or + signs
- Western numerals: `(123) 456-7890` or `+1 234 567 8901`
- Arabic numerals: `١٢٣٤٥٦٧٨٩٠` or `١٢٣٤٥٦٧٨٩٠١` (no spaces, no + sign)

### 3. Language-Specific Formatting
- **English**: Standard formatting with parentheses, spaces, and + signs
  - US numbers (10 digits): `(XXX) XXX-XXXX`
  - International numbers (>10 digits): `+X XXX XXX XXXX`
- **Arabic**: Continuous string format for better readability
  - All numbers: `XXXXXXXXXXX` (converted to Arabic numerals)
- Handles mixed input (Arabic and Western numerals)

## Usage

### Basic Usage
```jsx
import PhoneNumber from '../common/PhoneNumber';

<PhoneNumber phone="1234567890" />
```

### With Icon
```jsx
import { Phone } from 'lucide-react';

<div className="flex items-center">
  <Phone className="h-4 w-4 mr-2" />
  <PhoneNumber phone="1234567890" />
</div>
```

### With Custom Styling
```jsx
<PhoneNumber 
  phone="1234567890" 
  className="text-sm text-gray-600 font-mono"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `phone` | `string` | - | Phone number to display (required) |
| `className` | `string` | `''` | Additional CSS classes |
| `showIcon` | `boolean` | `false` | Whether to show phone icon |
| `iconComponent` | `Component` | `null` | Custom icon component |

## Implementation Details

### Number Conversion
The component uses utility functions from `utils/formatters.js`:
- `toArabicNumerals()` - Converts 0-9 to ٠-٩
- `toWesternNumerals()` - Converts ٠-٩ to 0-9
- `formatPhoneNumber()` - Formats and localizes phone numbers

### CSS Styling
RTL-specific styles in `styles/rtl.css`:
```css
[dir="rtl"] .phone-number {
  direction: ltr !important;
  text-align: left !important;
  display: inline-block;
}
```

### Language Detection
Uses `react-i18next` to detect current language:
- `ar` → Arabic numerals (٠-٩)
- `en` → Western numerals (0-9)

## Testing
Visit `/test/phone` in development mode to see:
- Phone number formatting examples
- Number conversion demonstrations
- RTL direction behavior
- Language switching functionality

## Examples

### English Interface
```
Input: "1234567890"
Output: "(123) 456-7890"
Direction: LTR

Input: "12345678901"
Output: "+1 234 567 8901"
Direction: LTR
```

### Arabic Interface
```
Input: "1234567890"
Output: "١٢٣٤٥٦٧٨٩٠"
Direction: LTR (still left-to-right!)

Input: "12345678901"
Output: "١٢٣٤٥٦٧٨٩٠١"
Direction: LTR (no + sign, no spaces)
```

### Mixed Input
```
Input: "١٢٣٤٥٦٧٨٩٠" (Arabic numerals)
English: "(123) 456-7890"
Arabic: "١٢٣٤٥٦٧٨٩٠"
```
