export const worldCurrencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' },
  { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union' },
  { code: 'GBP', symbol: '£', name: 'British Pound', country: 'United Kingdom' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', country: 'Canada' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', country: 'Australia' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'Japan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', country: 'China' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', country: 'Nigeria' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', country: 'South Africa' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', country: 'Kenya' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', country: 'Ghana' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', country: 'Brazil' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', country: 'Mexico' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore' },
  { code: 'NZD', symbol: '$', name: 'New Zealand Dollar', country: 'New Zealand' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', country: 'Switzerland' },
  { code: 'HKD', symbol: '$', name: 'Hong Kong Dollar', country: 'Hong Kong' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', country: 'Sweden' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', country: 'South Korea' },
  { code: 'AED', symbol: 'د.إ', name: 'United Arab Emirates Dirham', country: 'United Arab Emirates' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', country: 'Saudi Arabia' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', country: 'Russia' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', country: 'Turkey' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso', country: 'Argentina' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso', country: 'Colombia' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso', country: 'Chile' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', country: 'Peru' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', country: 'Vietnam' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', country: 'Thailand' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', country: 'Indonesia' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', country: 'Malaysia' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', country: 'Philippines' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', country: 'Pakistan' },
  { code: 'EGP', symbol: '£', name: 'Egyptian Pound', country: 'Egypt' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel', country: 'Israel' }
];

export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.50,
  JPY: 155.0,
  INR: 83.5,
  CNY: 7.25,
  NGN: 1600.0,
  ZAR: 18.5,
  KES: 130.0,
  GHS: 15.0,
  BRL: 5.25,
  MXN: 17.5,
  SGD: 1.35,
  NZD: 1.63,
  CHF: 0.90,
  HKD: 7.80,
  SEK: 10.50,
  KRW: 1360.0,
  AED: 3.67,
  SAR: 3.75,
  RUB: 90.0,
  TRY: 32.0,
  ARS: 880.0,
  COP: 3900.0,
  CLP: 920.0,
  PEN: 3.70,
  VND: 25400.0,
  THB: 36.5,
  IDR: 16000.0,
  MYR: 4.70,
  PHP: 57.5,
  PKR: 278.0,
  EGP: 47.0,
  ILS: 3.70,
};

export const getCurrencySymbol = (code: string): string => {
  const found = worldCurrencies.find(c => c.code === code);
  return found ? found.symbol : code;
};

export const convertSalary = (
  rangeStr: string,
  fromCurrency: string,
  toCurrency: string
): string => {
  if (!rangeStr || !fromCurrency || !toCurrency || fromCurrency === toCurrency) return rangeStr;

  const fromRate = EXCHANGE_RATES[fromCurrency.toUpperCase()] || 1.0;
  const toRate = EXCHANGE_RATES[toCurrency.toUpperCase()] || 1.0;

  // Conversion factor: multiply by toRate / fromRate
  const factor = toRate / fromRate;

  // Regex to match numbers (with commas or k/M suffix)
  return rangeStr.replace(/\b\d+[\d,\.]*(?:\s*[kKmM])?\b/g, (match) => {
    // Clean string from commas and check for k/M
    let clean = match.replace(/,/g, '').trim();
    let isK = false;
    let isM = false;

    if (clean.toLowerCase().endsWith('k')) {
      isK = true;
      clean = clean.slice(0, -1);
    } else if (clean.toLowerCase().endsWith('m')) {
      isM = true;
      clean = clean.slice(0, -1);
    }

    const num = parseFloat(clean);
    if (isNaN(num)) return match;

    const converted = num * factor;

    if (isK) {
      return `${Math.round(converted)}k`;
    }
    if (isM) {
      return `${converted.toFixed(1)}M`;
    }

    if (converted >= 1000) {
      return Math.round(converted).toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    return converted.toFixed(0);
  });
};
