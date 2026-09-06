/**
 * Currency & Exchange Rate Service
 * Converts base EUR prices (e.g. €1.50 for CV download) to the user's localized currency
 * using real-time exchange rates with local fallback rates & automatic country detection.
 */

import * as SecureStore from 'expo-secure-store';

const RATES_CACHE_KEY = 'cached_exchange_rates_eur';
const RATES_CACHE_TIME_KEY = 'cached_exchange_rates_time';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Default fallback exchange rates against 1.0 EUR (updated fallback baseline)
const DEFAULT_RATES: Record<string, number> = {
  EUR: 1.0,
  NGN: 1850.0,
  USD: 1.09,
  GBP: 0.86,
  CAD: 1.48,
  AUD: 1.66,
  GHS: 17.2,
  KES: 142.0,
  ZAR: 19.8,
  INR: 91.5,
  AED: 4.0,
  SAR: 4.08,
  EGP: 53.0,
  UGX: 4100.0,
  TZS: 2850.0,
  RWF: 1450.0,
  ZMW: 29.5,
  BRL: 5.95,
  CNY: 7.85,
  JPY: 168.0,
};

// Currency symbols
const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  NGN: '₦',
  USD: '$',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'AU$',
  GHS: 'GH₵ ',
  KES: 'KSh ',
  ZAR: 'R ',
  INR: '₹',
  AED: 'AED ',
  SAR: 'SAR ',
  EGP: 'EGP ',
  UGX: 'USh ',
  TZS: 'TSh ',
  RWF: 'RF ',
  ZMW: 'ZK ',
  BRL: 'R$',
  CNY: '¥',
  JPY: '¥',
};

// Country name / code / keyword to currency code mapping
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Nigeria
  nigeria: 'NGN',
  ng: 'NGN',
  lagos: 'NGN',
  abuja: 'NGN',

  // United Kingdom
  'united kingdom': 'GBP',
  uk: 'GBP',
  'great britain': 'GBP',
  england: 'GBP',
  scotland: 'GBP',
  wales: 'GBP',
  london: 'GBP',
  gb: 'GBP',

  // United States
  'united states': 'USD',
  usa: 'USD',
  us: 'USD',
  america: 'USD',

  // Ghana
  ghana: 'GHS',
  gh: 'GHS',
  accra: 'GHS',

  // Kenya
  kenya: 'KES',
  ke: 'KES',
  nairobi: 'KES',

  // South Africa
  'south africa': 'ZAR',
  za: 'ZAR',
  johannesburg: 'ZAR',
  'cape town': 'ZAR',

  // Canada
  canada: 'CAD',
  ca: 'CAD',
  toronto: 'CAD',
  vancouver: 'CAD',

  // Australia
  australia: 'AUD',
  au: 'AUD',
  sydney: 'AUD',
  melbourne: 'AUD',

  // India
  india: 'INR',
  in: 'INR',
  mumbai: 'INR',
  delhi: 'INR',
  bangalore: 'INR',

  // UAE
  uae: 'AED',
  'united arab emirates': 'AED',
  dubai: 'AED',
  'abu dhabi': 'AED',

  // Saudi Arabia
  'saudi arabia': 'SAR',
  sa: 'SAR',
  riyadh: 'SAR',

  // Egypt
  egypt: 'EGP',
  eg: 'EGP',
  cairo: 'EGP',

  // Uganda
  uganda: 'UGX',
  ug: 'UGX',
  kampala: 'UGX',

  // Tanzania
  tanzania: 'TZS',
  tz: 'TZS',

  // Rwanda
  rwanda: 'RWF',
  rw: 'RWF',
  kigali: 'RWF',

  // Zambia
  zambia: 'ZMW',
  zm: 'ZMW',
  lusaka: 'ZMW',

  // Europe (EUR default)
  germany: 'EUR',
  france: 'EUR',
  italy: 'EUR',
  spain: 'EUR',
  netherlands: 'EUR',
  belgium: 'EUR',
  ireland: 'EUR',
  portugal: 'EUR',
  austria: 'EUR',
  finland: 'EUR',
  greece: 'EUR',
  cyprus: 'EUR',
};

// Phone prefix to currency mapping
const PHONE_PREFIX_TO_CURRENCY: Record<string, string> = {
  '+234': 'NGN',
  '234': 'NGN',
  '+44': 'GBP',
  '44': 'GBP',
  '+1': 'USD',
  '1': 'USD',
  '+233': 'GHS',
  '233': 'GHS',
  '+254': 'KES',
  '254': 'KES',
  '+27': 'ZAR',
  '27': 'ZAR',
  '+91': 'INR',
  '91': 'INR',
  '+61': 'AUD',
  '61': 'AUD',
  '+971': 'AED',
  '971': 'AED',
  '+966': 'SAR',
  '966': 'SAR',
  '+20': 'EGP',
  '20': 'EGP',
  '+256': 'UGX',
  '256': 'UGX',
  '+255': 'TZS',
  '255': 'TZS',
  '+250': 'RWF',
  '250': 'RWF',
  '+260': 'ZMW',
  '260': 'ZMW',
};

let inMemoryRates: Record<string, number> = { ...DEFAULT_RATES };
let lastFetchTime = 0;

/**
 * Detects currency code from user profile details (location, country, phone)
 */
export function detectUserCurrency(locationOrCountry?: string, phone?: string): string {
  if (locationOrCountry) {
    const clean = locationOrCountry.toLowerCase().trim();
    // 1. Direct match
    if (COUNTRY_TO_CURRENCY[clean]) {
      return COUNTRY_TO_CURRENCY[clean];
    }
    // 2. Keyword substring search
    for (const [key, currency] of Object.entries(COUNTRY_TO_CURRENCY)) {
      if (clean.includes(key)) {
        return currency;
      }
    }
  }

  // 3. Phone prefix detection
  if (phone) {
    const cleanPhone = phone.trim();
    for (const [prefix, currency] of Object.entries(PHONE_PREFIX_TO_CURRENCY)) {
      if (cleanPhone.startsWith(prefix)) {
        return currency;
      }
    }
  }

  // 4. Default to EUR base
  return 'EUR';
}

/**
 * Fetches latest live exchange rates against EUR from reliable public API
 */
export async function getLiveExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();

  // Return in-memory cache if fresh
  if (inMemoryRates && now - lastFetchTime < CACHE_TTL_MS) {
    return inMemoryRates;
  }

  // Try reading from SecureStore
  try {
    const storedTime = await SecureStore.getItemAsync(RATES_CACHE_TIME_KEY);
    if (storedTime && now - parseInt(storedTime, 10) < CACHE_TTL_MS) {
      const storedRatesJson = await SecureStore.getItemAsync(RATES_CACHE_KEY);
      if (storedRatesJson) {
        inMemoryRates = JSON.parse(storedRatesJson);
        lastFetchTime = parseInt(storedTime, 10);
        return inMemoryRates!;
      }
    }
  } catch {
    // Continue to network fetch
  }

  // Fetch live rates from open.er-api.com
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EUR');
    if (res.ok) {
      const data = await res.json();
      if (data?.rates && typeof data.rates === 'object') {
        inMemoryRates = { ...DEFAULT_RATES, ...data.rates };
        lastFetchTime = now;
        try {
          await SecureStore.setItemAsync(RATES_CACHE_KEY, JSON.stringify(inMemoryRates));
          await SecureStore.setItemAsync(RATES_CACHE_TIME_KEY, now.toString());
        } catch {
          // Non-blocking
        }
        return inMemoryRates;
      }
    }
  } catch (err) {
    console.warn('[Currency] Live rates fetch failed, using fallback:', err);
  }

  // Fallback to defaults
  inMemoryRates = DEFAULT_RATES;
  return DEFAULT_RATES;
}

/**
 * Formats a converted amount with appropriate rounding & decimal places
 */
export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode] || `${currencyCode} `;

  // Currencies typically displayed as whole rounded integers
  if (['NGN', 'KES', 'UGX', 'TZS', 'RWF', 'JPY', 'INR', 'ZMW'].includes(currencyCode)) {
    // Round to nearest 10 or 100 for clean numbers, e.g. ₦2,800
    const rounded = Math.round(amount / 10) * 10 || Math.round(amount);
    return `${symbol}${rounded.toLocaleString('en-US')}`;
  }

  // Decimal currencies (USD, EUR, GBP, CAD, AUD, GHS, ZAR, etc.)
  return `${symbol}${amount.toFixed(2)}`;
}

export interface LocalizedPriceResult {
  formattedPrice: string;
  currencyCode: string;
  currencySymbol: string;
  convertedAmount: number;
}

/**
 * Converts a base EUR amount (default 1.50) into the user's localized currency
 */
export async function getLocalizedPrice(
  baseEur: number = 1.50,
  locationOrCountry?: string,
  phone?: string
): Promise<LocalizedPriceResult> {
  const currencyCode = detectUserCurrency(locationOrCountry, phone);
  const rates = await getLiveExchangeRates();
  const rate = rates[currencyCode] || DEFAULT_RATES[currencyCode] || 1.0;
  const convertedAmount = baseEur * rate;
  const formattedPrice = formatCurrencyAmount(convertedAmount, currencyCode);
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || `${currencyCode} `;

  return {
    formattedPrice,
    currencyCode,
    currencySymbol,
    convertedAmount,
  };
}

/**
 * Synchronous immediate calculation using fallback / cached rates
 */
export function getLocalizedPriceSync(
  baseEur: number = 1.50,
  locationOrCountry?: string,
  phone?: string
): LocalizedPriceResult {
  const currencyCode = detectUserCurrency(locationOrCountry, phone);
  const rates = inMemoryRates || DEFAULT_RATES;
  const rate = rates[currencyCode] || DEFAULT_RATES[currencyCode] || 1.0;
  const convertedAmount = baseEur * rate;
  const formattedPrice = formatCurrencyAmount(convertedAmount, currencyCode);
  const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || `${currencyCode} `;

  return {
    formattedPrice,
    currencyCode,
    currencySymbol,
    convertedAmount,
  };
}
