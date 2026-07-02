/**
 * Paystack Inline Payment Utility
 *
 * Dynamically loads the Paystack inline JS popup and provides a typed
 * wrapper so the rest of the app stays clean.
 *
 * Usage:
 *   import { openPaystackPopup } from '../lib/paystack';
 *   openPaystackPopup({ email, reference, amountKobo, onSuccess, onClose });
 */

export interface PaystackSuccessResponse {
  reference: string;
  trans: string;
  status: string;
  message: string;
  transaction: string;
  trxref: string;
}

export interface PaystackPopupOptions {
  email: string;
  /** Amount in kobo (NGN × 100) */
  amountKobo: number;
  reference: string;
  /** Called when user completes payment — reference is safe to verify server-side */
  onSuccess: (response: PaystackSuccessResponse) => void;
  /** Called when user closes popup without paying */
  onClose: () => void;
  /** Optional: a human-readable label shown in the Paystack popup */
  label?: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PaystackPop: any;
  }
}

const PAYSTACK_JS_URL = 'https://js.paystack.co/v1/inline.js';
let sdkLoaded = false;
let sdkLoading = false;
const pendingCallbacks: Array<() => void> = [];

/**
 * Dynamically loads the Paystack inline JS SDK once.
 * Subsequent calls resolve immediately from cache.
 */
function loadPaystackSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (sdkLoaded) {
      resolve();
      return;
    }

    pendingCallbacks.push(resolve);

    if (sdkLoading) return; // already loading, will resolve when ready
    sdkLoading = true;

    const script = document.createElement('script');
    script.src = PAYSTACK_JS_URL;
    script.async = true;

    script.onload = () => {
      sdkLoaded = true;
      sdkLoading = false;
      pendingCallbacks.forEach((cb) => cb());
      pendingCallbacks.length = 0;
    };

    script.onerror = () => {
      sdkLoading = false;
      reject(new Error('Failed to load Paystack JS SDK. Check your internet connection.'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Opens the Paystack inline payment popup.
 * Loads the SDK first if it hasn't been loaded yet.
 */
export async function openPaystackPopup(opts: PaystackPopupOptions): Promise<void> {
  await loadPaystackSDK();

  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string;
  if (!publicKey) {
    throw new Error('VITE_PAYSTACK_PUBLIC_KEY is not set in your environment variables.');
  }

  const handler = window.PaystackPop.setup({
    key: publicKey,
    email: opts.email,
    amount: opts.amountKobo,
    ref: opts.reference,
    currency: 'NGN',
    channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer', 'apple_pay'],
    label: opts.label ?? 'Quota Hire — Document Download',
    onClose: opts.onClose,
    callback: (response: PaystackSuccessResponse) => {
      opts.onSuccess(response);
    },
  });

  handler.openIframe();
}
