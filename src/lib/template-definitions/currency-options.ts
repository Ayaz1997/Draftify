
export interface Currency {
  value: string; // symbol
  label: string; // display label
  name: string; // e.g., 'USD'
  fullName: string; // e.g., 'US Dollar'
  plural: string; // e.g., 'Dollars'
  singular: string; // e.g., 'Dollar'
  fractionalUnit: string; // e.g., 'cents'
}

export const currencyOptions: Currency[] = [
  { value: '₹', label: 'INR (Indian Rupee)', name: 'INR', fullName: 'Indian Rupee', plural: 'Rupees', singular: 'Rupee', fractionalUnit: 'paise' },
  { value: '$', label: 'USD (US Dollar)', name: 'USD', fullName: 'US Dollar', plural: 'Dollars', singular: 'Dollar', fractionalUnit: 'cents' },
  { value: '€', label: 'EUR (Euro)', name: 'EUR', fullName: 'Euro', plural: 'Euros', singular: 'Euro', fractionalUnit: 'cents' },
  { value: '£', label: 'GBP (British Pound)', name: 'GBP', fullName: 'British Pound', plural: 'Pounds', singular: 'Pound', fractionalUnit: 'pence' },
  { value: 'A$', label: 'AUD (Australian Dollar)', name: 'AUD', fullName: 'Australian Dollar', plural: 'Dollars', singular: 'Dollar', fractionalUnit: 'cents' },
  { value: 'C$', label: 'CAD (Canadian Dollar)', name: 'CAD', fullName: 'Canadian Dollar', plural: 'Dollars', singular: 'Dollar', fractionalUnit: 'cents' },
  { value: '¥', label: 'JPY (Japanese Yen)', name: 'JPY', fullName: 'Japanese Yen', plural: 'Yen', singular: 'Yen', fractionalUnit: 'sen' },
  { value: 'Fr', label: 'CHF (Swiss Franc)', name: 'CHF', fullName: 'Swiss Franc', plural: 'Francs', singular: 'Franc', fractionalUnit: 'rappen' },
  { value: 'S$', label: 'SGD (Singapore Dollar)', name: 'SGD', fullName: 'Singapore Dollar', plural: 'Dollars', singular: 'Dollar', fractionalUnit: 'cents' },
  { value: 'AED', label: 'AED (UAE Dirham)', name: 'AED', fullName: 'UAE Dirham', plural: 'Dirhams', singular: 'Dirham', fractionalUnit: 'fils' },
];

export const currencyOptionsForSelect = currencyOptions.map(({ value, label }) => ({ value, label }));

export const getCurrencyInfo = (symbol: string): Currency => {
  return currencyOptions.find(c => c.value === symbol) || currencyOptions[0]; // Default to INR
};
