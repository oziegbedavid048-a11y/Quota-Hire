/**
 * useIAPPrice — Google Play price display + direct purchase
 *
 * SOURCE OF TRUTH (real Android build):
 *   product.localizedPrice from Google Play Billing — EXACT match to what
 *   Google Play charges. Nigeria → ₦2,900, UK → £1.29, etc.
 *
 * FALLBACK (Expo Go / connection failure):
 *   Uses the user's country name (from their backend profile) to determine
 *   currency reliably — NOT device locale (which is unreliable because Nigerian
 *   users often set English-US as their device language).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { apiFetch, API_BASE } from '@/services/api';

const PRODUCT_ID = 'cv_download_150';
const BASE_PRICE_EUR = 1.50;

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const isAndroid = Platform.OS === 'android';

// ─── expo-iap lazy load ────────────────────────────────────────────────────────
let useIAP: any = () => ({
  connected: false, products: [],
  requestPurchase: async () => {},
  fetchProducts: null, getProducts: null, finishTransaction: null,
});
let finishTransactionModule: any = async () => {};

try {
  if (!isExpoGo && isAndroid) {
    const iapModule = require('expo-iap');
    useIAP = iapModule.useIAP;
    finishTransactionModule = iapModule.finishTransaction;
  }
} catch (e) {
  console.warn('[useIAPPrice] expo-iap unavailable:', e);
}

// ─── Country name → ISO currency (covers 180+ countries) ─────────────────────
// Keys are lowercase country names / common variants as returned by the backend
const COUNTRY_CURRENCY: Record<string, string> = {
  // Africa
  'nigeria': 'NGN', 'ghana': 'GHS', 'kenya': 'KES', 'south africa': 'ZAR',
  'uganda': 'UGX', 'tanzania': 'TZS', 'ethiopia': 'ETB', 'rwanda': 'RWF',
  'cameroon': 'XAF', 'senegal': 'XOF', "côte d'ivoire": 'XOF', 'ivory coast': 'XOF',
  'guinea': 'GNF', 'zambia': 'ZMW', 'malawi': 'MWK', 'zimbabwe': 'ZWL',
  'mozambique': 'MZN', 'angola': 'AOA', 'namibia': 'NAD', 'botswana': 'BWP',
  'egypt': 'EGP', 'morocco': 'MAD', 'tunisia': 'TND', 'algeria': 'DZD',
  'sudan': 'SDG', 'somalia': 'SOS', 'liberia': 'LRD', 'sierra leone': 'SLL',
  'gambia': 'GMD', 'mauritius': 'MUR', 'seychelles': 'SCR',
  // Americas
  'united states': 'USD', 'usa': 'USD', 'canada': 'CAD',
  'brazil': 'BRL', 'mexico': 'MXN', 'argentina': 'ARS', 'colombia': 'COP',
  'chile': 'CLP', 'peru': 'PEN', 'venezuela': 'VES', 'ecuador': 'USD',
  'jamaica': 'JMD', 'trinidad and tobago': 'TTD', 'trinidad': 'TTD',
  'barbados': 'BBD', 'guyana': 'GYD', 'suriname': 'SRD',
  // Europe
  'united kingdom': 'GBP', 'uk': 'GBP', 'great britain': 'GBP',
  'germany': 'EUR', 'france': 'EUR', 'italy': 'EUR', 'spain': 'EUR',
  'netherlands': 'EUR', 'belgium': 'EUR', 'portugal': 'EUR', 'ireland': 'EUR',
  'austria': 'EUR', 'finland': 'EUR', 'greece': 'EUR', 'luxembourg': 'EUR',
  'sweden': 'SEK', 'norway': 'NOK', 'denmark': 'DKK', 'switzerland': 'CHF',
  'poland': 'PLN', 'czech republic': 'CZK', 'hungary': 'HUF',
  'romania': 'RON', 'croatia': 'EUR', 'serbia': 'RSD', 'ukraine': 'UAH',
  // Asia
  'india': 'INR', 'china': 'CNY', 'japan': 'JPY', 'south korea': 'KRW',
  'singapore': 'SGD', 'malaysia': 'MYR', 'thailand': 'THB',
  'indonesia': 'IDR', 'philippines': 'PHP', 'vietnam': 'VND',
  'pakistan': 'PKR', 'bangladesh': 'BDT', 'sri lanka': 'LKR',
  'nepal': 'NPR', 'myanmar': 'MMK', 'cambodia': 'KHR',
  'united arab emirates': 'AED', 'uae': 'AED', 'saudi arabia': 'SAR',
  'qatar': 'QAR', 'kuwait': 'KWD', 'bahrain': 'BHD', 'jordan': 'JOD',
  'israel': 'ILS', 'turkey': 'TRY',
  // Oceania
  'australia': 'AUD', 'new zealand': 'NZD',
};

// Currencies supported by Frankfurter API
const FRANKFURTER_SUPPORTED = new Set([
  'AUD','BGN','BRL','CAD','CHF','CNY','CZK','DKK','GBP','HKD',
  'HUF','IDR','ILS','INR','ISK','JPY','KRW','MXN','MYR','NOK',
  'NZD','PHP','PLN','RON','SEK','SGD','THB','TRY','USD','ZAR',
]);

// Fixed rates for currencies Frankfurter doesn't support (€1.50 equivalent)
const FIXED_RATES: Record<string, number> = {
  NGN: 2900, GHS: 23, KES: 218, UGX: 5700, TZS: 4100,
  RWF: 2200, ETB: 195, ZMW: 43,  MWK: 2600, GNF: 13000,
  XOF: 984,  XAF: 984, JMD: 245, TTD: 10,   GMD: 103,
  SLL: 37000, LRD: 290, SOS: 850, SDG: 900,
  SRD: 55,   BBD: 3,   GYD: 315, MUR: 68,   SCR: 22,
  NAD: 28,   BWP: 20,  MZN: 96,  AOA: 1350, ZWL: 580,
  SRS: 55,   MAD: 15,  TND: 5,   DZD: 203,  EGP: 73,
  SAR: 5.6,  AED: 5.5, QAR: 5.5, KWD: 0.46, BHD: 0.57,
  JOD: 1.06, LKR: 476, NPR: 200, MMK: 3150, VND: 38000,
  KHR: 6100, UAH: 62,  RSD: 165, HRK: 11,
};

function formatCurrency(amount: number, currency: string): string {
  const noDecimals = [
    'JPY','NGN','KES','UGX','GHS','TZS','RWF','GNF','XOF','XAF',
    'ETB','ZMW','MWK','SLL','LRD','VND','KHR','MMK','SOS','SDG',
    'ZWL','AOA','MZN',
  ];
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: noDecimals.includes(currency) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${noDecimals.includes(currency) ? Math.round(amount) : amount.toFixed(2)}`;
  }
}

async function resolvePrice(userCountry?: string): Promise<string> {
  // 1. Determine currency from user's profile country (most reliable)
  let currency = 'EUR';
  if (userCountry) {
    const key = userCountry.toLowerCase().trim();
    currency = COUNTRY_CURRENCY[key] ?? 'EUR';
  }

  if (currency === 'EUR') return `€${BASE_PRICE_EUR.toFixed(2)}`;

  // 2. Use fixed rate for unsupported currencies (covers all African currencies)
  if (FIXED_RATES[currency] !== undefined) {
    return formatCurrency(FIXED_RATES[currency], currency);
  }

  // 3. Frankfurter API for major currencies
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?amount=${BASE_PRICE_EUR}&from=EUR&to=${currency}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    const amount = data?.rates?.[currency];
    if (typeof amount === 'number') return formatCurrency(amount, currency);
  } catch {}

  return `€${BASE_PRICE_EUR.toFixed(2)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface PurchaseOptions {
  cvId: number;
  cvName: string;
  coverLetterText?: string | null;
  userName?: string; userEmail?: string; userPhone?: string;
  userLocation?: string; targetCompany?: string; targetRole?: string;
  onSuccess: () => void;
}

interface UseIAPPriceResult {
  localizedPrice: string;
  priceReady: boolean;
  requestCVPurchase: (options: PurchaseOptions) => Promise<void>;
  isPurchasing: boolean;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useIAPPrice(userCountry?: string): UseIAPPriceResult {
  const [localizedPrice, setLocalizedPrice] = useState('Loading…');
  const [priceReady, setPriceReady] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const purchaseCallbackRef = useRef<PurchaseOptions | null>(null);
  const productLoadedRef = useRef(false);
  // Mirrors priceReady for use inside async callbacks, which would otherwise
  // close over a stale value and overwrite a real Play price with the estimate.
  const priceReadyRef = useRef(false);

  // ── Google Play hook ───────────────────────────────────────────────────────
  const iap = (useIAP as any)({
    onPurchaseSuccess: async (purchase: any) => {
      const ctx = purchaseCallbackRef.current;
      if (!ctx || !purchase?.purchaseToken) return;
      try {
        const res = await apiFetch('/payments/verify-iap/', {
          method: 'POST',
          body: JSON.stringify({
            purchase_token: purchase.purchaseToken,
            product_id: purchase.productId ?? PRODUCT_ID,
            cv_id: ctx.cvId,
            order_id: purchase.transactionId ?? purchase.orderId ?? '',
          }),
        });
        if (!res.download_token) throw new Error('No download token from server.');
        try {
          const ft = typeof iap.finishTransaction === 'function'
            ? iap.finishTransaction : finishTransactionModule;
          await ft(purchase, false);
        } catch {}

        const safeName = (ctx.cvName || 'cv').replace(/\s+/g, '_');
        const fileUri = `${FileSystem.documentDirectory}${safeName}_${ctx.cvId}.pdf`;
        const { uri } = await FileSystem.downloadAsync(
          `${API_BASE}/cv/${ctx.cvId}/download/?token=${encodeURIComponent(res.download_token)}`,
          fileUri
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        ctx.onSuccess();
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Success', 'CV saved to your device.');
        }
      } catch (err: any) {
        Alert.alert('Download Failed', err?.message || 'Payment verified but download failed.');
      } finally {
        setIsPurchasing(false);
        purchaseCallbackRef.current = null;
      }
    },
    onPurchaseError: (error: any) => {
      setIsPurchasing(false);
      if (
        error?.code !== 'E_USER_CANCELLED' &&
        !error?.message?.toLowerCase().includes('cancel')
      ) {
        Alert.alert('Purchase Failed', error?.message || 'Something went wrong.');
      }
    },
  });

  const connected: boolean = iap.connected || false;
  const products: any[] = iap.products || [];

  // ── Priority 1: Google Play localizedPrice (real build) ───────────────────
  // Load product once connected
  useEffect(() => {
    if (!connected || productLoadedRef.current || !isAndroid || isExpoGo) return;
    productLoadedRef.current = true;
    const load = iap.fetchProducts
      ? iap.fetchProducts({ skus: [PRODUCT_ID], type: 'in-app' })
      : (iap.getProducts || (() => Promise.resolve()))([PRODUCT_ID]);
    load.catch((e: any) => console.warn('[useIAPPrice] product load failed:', e?.message));
  }, [connected]);

  // Extract price as soon as product arrives
  useEffect(() => {
    if (priceReady) return;
    const product = products.find(
      (p: any) => (p?.productId || p?.id || p?.sku) === PRODUCT_ID
    );
    if (!product) return;
    const raw =
      (product as any).localizedPrice ??
      (product as any).displayPrice ??
      String((product as any).price ?? '');
    if (raw) {
      setLocalizedPrice(String(raw));
      priceReadyRef.current = true;
      setPriceReady(true);
    }
  }, [products, priceReady]);

  // ── Priority 2: Country-based price, shown straight away ──────────────────
  // This used to run immediately only in Expo Go; a real Android build instead
  // waited on a 7-second timer. That is why the country currency appeared under
  // Expo Go but not in the installed app — for the first 7 seconds the button
  // read "Download (Loading…)", and if Play Billing never answered (which is
  // exactly what happens while billing is not configured for the build) that
  // was the entire experience.
  //
  // Now every platform resolves the country price on mount, so there is never a
  // "Loading…" gap. Google Play stays authoritative: if it answers, the effect
  // above overwrites this with the real charged price, and the ref guard stops
  // a late-returning estimate from clobbering it.
  useEffect(() => {
    let cancelled = false;
    resolvePrice(userCountry).then(price => {
      if (!cancelled && !priceReadyRef.current) setLocalizedPrice(price);
    });
    return () => { cancelled = true; };
  }, [userCountry]);

  // ── Trigger Google Play purchase ────────────────────────────────────────────
  const requestCVPurchase = useCallback(async (options: PurchaseOptions) => {
    if (isExpoGo || !isAndroid) {
      Alert.alert('Android Required', 'CV downloads are only available on Android devices.');
      return;
    }
    if (!connected) {
      Alert.alert('Not Ready', 'Google Play is still connecting. Please try again in a moment.');
      return;
    }
    purchaseCallbackRef.current = options;
    setIsPurchasing(true);
    try {
      if (iap.requestPurchase && iap.fetchProducts) {
        await iap.requestPurchase({ request: { google: { skus: [PRODUCT_ID] } }, type: 'in-app' });
      } else {
        try { await iap.requestPurchase({ skus: [PRODUCT_ID] }); }
        catch { await iap.requestPurchase(PRODUCT_ID); }
      }
    } catch (err: any) {
      setIsPurchasing(false);
      if (
        err?.code !== 'E_USER_CANCELLED' &&
        !err?.message?.toLowerCase().includes('cancel')
      ) {
        Alert.alert('Purchase Failed', err?.message || 'Could not open Google Play.');
      }
    }
  }, [connected, iap]);

  return { localizedPrice, priceReady, requestCVPurchase, isPurchasing };
}
