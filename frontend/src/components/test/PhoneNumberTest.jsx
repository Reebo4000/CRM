import React from 'react';
import { useTranslation } from 'react-i18next';
import PhoneNumber from '../common/PhoneNumber';
import { 
  formatPhoneNumber, 
  toArabicNumerals, 
  toWesternNumerals,
  formatNumber,
  formatCurrency,
  calculateAge,
  formatDate,
  formatDateTime,
  formatTime
} from '../../utils/formatters';
import { Phone } from 'lucide-react';

const PhoneNumberTest = () => {
  const { i18n } = useTranslation();
  
  const testPhoneNumbers = [
    '1234567890',
    '12345678901',
    '+1 (555) 123-4567',
    '555-123-4567',
    '01006194729', // Long number example
    '١٢٣٤٥٦٧٨٩٠' // Arabic numerals input
  ];
  
  const testNumbers = [1234, 1234.56, 999999];
  const testDate = new Date('2023-12-25T15:30:00');
  const testBirthDate = new Date('1990-05-15');
  
  const currentLocale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Phone Number & Arabic Numerals Test
      </h1>
      
      <div className="mb-4">
        <button
          onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Switch to {i18n.language === 'ar' ? 'English' : 'العربية'}
        </button>
        <span className="ml-4">Current Language: {i18n.language}</span>
      </div>
      
      {/* Phone Number Tests */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Phone Number Formatting Tests</h2>
        <div className="grid gap-4">
          {testPhoneNumbers.map((phone, index) => (
            <div key={index} className="border p-4 rounded">
              <div className="mb-2">
                <strong>Input:</strong> {phone}
              </div>
              <div className="mb-2">
                <strong>Formatted (function):</strong> {formatPhoneNumber(phone, currentLocale)}
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <strong>Component:</strong> <PhoneNumber phone={phone} />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Number Conversion Tests */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Number Conversion Tests</h2>
        <div className="grid gap-4">
          <div className="border p-4 rounded">
            <h3 className="font-medium mb-2">Western to Arabic Numerals</h3>
            <div>Input: "1234567890"</div>
            <div>Output: "{toArabicNumerals('1234567890')}"</div>
          </div>
          <div className="border p-4 rounded">
            <h3 className="font-medium mb-2">Arabic to Western Numerals</h3>
            <div>Input: "١٢٣٤٥٦٧٨٩٠"</div>
            <div>Output: "{toWesternNumerals('١٢٣٤٥٦٧٨٩٠')}"</div>
          </div>
          <div className="border p-4 rounded">
            <h3 className="font-medium mb-2">Your Example: Phone Number Direction</h3>
            <div>English formatted: "+0 100 619 4729"</div>
            <div>Arabic should be: "{toArabicNumerals('01006194729')}" (no + sign, continuous)</div>
            <div>Actual result: "{formatPhoneNumber('01006194729', 'ar-SA')}"</div>
          </div>
        </div>
      </div>
      
      {/* Number Formatting Tests */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Number Formatting Tests</h2>
        <div className="grid gap-4">
          {testNumbers.map((num, index) => (
            <div key={index} className="border p-4 rounded">
              <div><strong>Number:</strong> {num}</div>
              <div><strong>Formatted:</strong> {formatNumber(num, {}, currentLocale)}</div>
              <div><strong>Currency:</strong> {formatCurrency(num, 'USD', currentLocale)}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Date Formatting Tests */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Date Formatting Tests</h2>
        <div className="border p-4 rounded">
          <div className="mb-4">
            <strong>Note:</strong> Dates should always use Western numerals (Gregorian calendar) in both languages
          </div>
          <div><strong>Test Date:</strong> {testDate.toString()}</div>
          <div><strong>Formatted Date:</strong> {formatDate(testDate, {}, currentLocale)}</div>
          <div><strong>Formatted DateTime:</strong> {formatDateTime(testDate, currentLocale)}</div>
          <div><strong>Formatted Time:</strong> {formatTime(testDate, currentLocale)}</div>
        </div>
      </div>
      
      {/* Age Calculation Test */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Age Calculation Test</h2>
        <div className="border p-4 rounded">
          <div className="mb-2">
            <strong>Note:</strong> Age should use Western numerals (consistent with dates)
          </div>
          <div><strong>Birth Date:</strong> {testBirthDate.toDateString()}</div>
          <div><strong>Age:</strong> {calculateAge(testBirthDate)}</div>
        </div>
      </div>
      
      {/* Arabic Number Direction Test */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Arabic Number Direction Test</h2>
        <div className="border p-4 rounded">
          <div className="mb-4">
            <strong>Arabic numbers should display as continuous string (no + sign, no spaces):</strong>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">English Format:</h3>
                <div className="space-y-2">
                  {['1234567890', '01006194729', '12345678901'].map((phone, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                      <Phone className="h-4 w-4 mr-2" />
                      <PhoneNumber phone={phone} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Arabic Format (same numbers):</h3>
                <div className="space-y-2">
                  {['1234567890', '01006194729', '12345678901'].map((phone, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                      <Phone className="h-4 w-4 mr-2" />
                      <span className="font-mono">{formatPhoneNumber(phone, 'ar-SA')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RTL Direction Test */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">RTL Direction Test</h2>
        <div className="border p-4 rounded">
          <div className="mb-4">
            <strong>Phone numbers should always display LTR (left-to-right):</strong>
          </div>
          <div className="space-y-2">
            {testPhoneNumbers.slice(0, 3).map((phone, index) => (
              <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                <Phone className="h-4 w-4 mr-2" />
                <span className="mr-4">Phone:</span>
                <PhoneNumber phone={phone} className="font-mono" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneNumberTest;
