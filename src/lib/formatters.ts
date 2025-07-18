
import numWords from 'num-words';
import { getCurrencyInfo } from './template-definitions/currency-options';

export const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  // Check for YYYY-MM-DD format and treat as UTC to prevent timezone shifts
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(dateString + 'T00:00:00Z').toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }
  try {
    // For other valid date strings
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    return dateString; // Fallback for invalid formats
  }
};

export const formatCurrency = (amount?: number | string, currencySymbol = '₹') => {
  const num = parseFloat(String(amount || 0));
  if (isNaN(num)) {
    return `${currencySymbol}0.00`;
  }
  const locale = currencySymbol === '₹' ? 'en-IN' : 'en-US';
  return `${currencySymbol}${num.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const amountToWords = (amount?: number | string, currencySymbol = '₹') => {
  const num = parseFloat(String(amount || 0));
  if (isNaN(num)) return 'Invalid Number';

  const currency = getCurrencyInfo(currencySymbol);
  
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let words = numWords(integerPart);
  words = words.charAt(0).toUpperCase() + words.slice(1); // Capitalize first letter

  if (decimalPart > 0) {
    words += ' and ' + numWords(decimalPart) + ' ' + currency.fractionalUnit;
  }

  return currency.plural + ' ' + words + ' only';
};
