/**
 * NativePaymentModal — Google Play Billing (IAP) via expo-iap v4
 *
 * Uses the useIAP hook (expo-iap v4 pattern) which manages the BillingClient
 * lifecycle, product loading, and purchase listener automatically.
 *
 * Flow:
 *   1. Component mounts → useIAP() connects BillingClient + loads product info.
 *   2. User taps "Buy & Download" → requestPurchase(PRODUCT_ID) → native Play sheet.
 *   3. onPurchaseSuccess callback fires → sends purchaseToken to backend /payments/verify-iap/.
 *   4. Backend verifies with Google Play Developer API → returns download_token.
 *   5. App downloads PDF using the one-time token.
 *   6. finishTransaction() acknowledges the purchase (REQUIRED within 3 days).
 *
 * Android only: Google Play Billing is not available on iOS.
 *
 * FIXES applied (2026-08-18):
 *   - Stale closure bug: handlePurchaseSuccess stored in a useRef so the
 *     onPurchaseSuccess callback passed to useIAP() always calls the latest version.
 *   - finishTransaction call: corrected from object-arg to positional-arg form.
 *   - Backend error extraction: reads .message from structured {error, message} responses.
 *   - downloadCV catch: now captures the error object for diagnosis.
 *   - Retry path: after a failed download (payment already verified) the "Retry Download"
 *     button calls /payments/already-paid/ to get a fresh token without re-charging.
 *   - Price display: shows "Loading…" during connecting state.
 *   - Error badge: shows the backend error code slug for easier debugging.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { apiFetch, API_BASE } from '@/services/api';

const { height: SCREEN_H } = Dimensions.get('window');

// ─── IMPORTANT: This MUST match the product ID created in Google Play Console ───
const PRODUCT_ID = 'cv_download_150';

interface NativePaymentModalProps {
  visible: boolean;
  onClose: () => void;
  cvId: number | null;
  cvName: string;
  onSuccess: () => void;
}

type PayState =
  | 'idle'
  | 'connecting'
  | 'purchasing'
  | 'verifying'
  | 'downloading'
  | 'completed'
  | 'cancelled'
  | 'download_failed'   // payment OK but PDF fetch failed — safe to retry
  | 'error';

// ─── expo-iap conditional import (not available in Expo Go) ──────────────────
import Constants, { ExecutionEnvironment } from 'expo-constants';

let useIAP: any = () => ({ connected: false, products: [], requestPurchase: async () => {} });
let finishTransaction: any = async () => {};
let hasNativeIap = false;

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

try {
  if (!isExpoGo) {
    const iapModule = require('expo-iap');
    useIAP = iapModule.useIAP;
    finishTransaction = iapModule.finishTransaction;
    hasNativeIap = true;
  }
} catch (e) {
  console.warn('[expo-iap] Native module unavailable:', e);
}

// ─── Helper: extract a human-readable message from any error shape ─────────────
/**
 * The backend returns structured errors like:
 *   { error: "payment_not_successful", message: "Purchase state is "Canceled"." }
 * apiFetch surfaces this as an Error whose .message is the raw JSON string or
 * the top-level "message" / "detail" / "error" field.
 *
 * This helper tries to parse a nested JSON string and prefers .message > .detail > .error.
 * It also maps known error codes to friendly labels.
 */
function extractErrorMessage(err: any, fallback = 'Something went wrong. Please try again.'): { text: string; code: string | null } {
  let raw: any = err?.message || err?.detail || err?.error || fallback;
  let code: string | null = null;

  // If the backend returned a structured object (ApiError may have serialised it)
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        code = parsed.error || null;
        raw = parsed.message || parsed.detail || parsed.error || raw;
      }
    } catch {
      // not JSON — use as-is
    }
  } else if (raw && typeof raw === 'object') {
    code = raw.error || null;
    raw = raw.message || raw.detail || raw.error || fallback;
  }

  // Map known backend error codes to friendly messages
  const codeMessages: Record<string, string> = {
    'server_config_error': 'Server payment configuration error. Please contact support.',
    'verify_failed': 'Could not verify your purchase with Google Play. Please try again in a moment.',
    'payment_not_successful': raw, // already human-readable from backend
    'invalid_product': 'The product is not configured correctly. Please contact support.',
    'duplicate_token': 'This purchase has already been redeemed. Try the "Already Paid?" option.',
  };

  if (code && codeMessages[code]) {
    return { text: codeMessages[code], code };
  }

  // HTTP status hints
  const status = err?.status;
  if (status === 429) {
    return { text: 'Too many attempts. Please wait a moment before trying again.', code: 'rate_limited' };
  }
  if (status === 502 || status === 503) {
    return { text: 'Google Play verification service is temporarily unavailable. Please try again shortly.', code: 'gateway_error' };
  }
  if (err?.isNetworkError) {
    return { text: 'No internet connection. Please check your WiFi or mobile data.', code: 'no_network' };
  }

  return { text: typeof raw === 'string' ? raw : fallback, code };
}

// ─── Expo Go fallback ─────────────────────────────────────────────────────────
function ExpoGoFallbackModal({ visible, onClose }: Pick<NativePaymentModalProps, 'visible' | 'onClose'>) {
  const colors = Colors.light;
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <View style={[s.sheet, { backgroundColor: colors.cardBg }]}>
          <View style={s.header}>
            <Text style={[s.headerTitle, { color: colors.text }]}>In-App Purchase Notice</Text>
            <Pressable onPress={onClose} style={s.closeBtn}>
              <Feather name="x" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>
          <View style={[s.body, { paddingVertical: 24, alignItems: 'center' }]}>
            <View style={[s.warnIconWrap, { backgroundColor: Palette.warm50 }]}>
              <Feather name="alert-triangle" size={24} color={Palette.warm500} />
            </View>
            <Text style={[s.successTitle, { color: colors.text, marginTop: 12 }]}>
              Development Build Required
            </Text>
            <Text style={[s.successSub, { color: colors.textSecondary, marginTop: 6, textAlign: 'center' }]}>
              Google Play Billing requires a standalone APK or custom Development Build. It is disabled in the Expo Go sandbox.
            </Text>
            <Pressable onPress={onClose} style={[s.doneBtn, { backgroundColor: Palette.accent600, marginTop: 16 }]}>
              <Text style={s.doneBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
function NativePaymentModalInner({
  visible,
  onClose,
  cvId,
  cvName,
  onSuccess,
}: NativePaymentModalProps) {
  const colors = Colors.light;

  const [payState, setPayState] = useState<PayState>('idle');
  const [errorText, setErrorText] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // ─── FIX: store the latest handlePurchaseSuccess in a ref so the
  //     onPurchaseSuccess callback passed to useIAP() always invokes the
  //     current version without causing the hook to reinitialise on every render.
  const handlePurchaseSuccessRef = useRef<(purchase: any) => Promise<void>>(async () => {});

  // ─── expo-iap v4 useIAP hook ────────────────────────────────────────────────
  const iap = (useIAP as any)({
    onPurchaseSuccess: async (purchase: any) => {
      // Always delegates to the current ref value — never stale
      await handlePurchaseSuccessRef.current(purchase);
    },
    onPurchaseError: (error: any) => {
      if (
        error?.code === 'E_USER_CANCELLED' ||
        error?.message?.toLowerCase().includes('cancel')
      ) {
        setPayState('cancelled');
      } else {
        const { text, code } = extractErrorMessage(error, 'Purchase failed. Please try again.');
        setErrorText(text);
        setErrorCode(code);
        setPayState('error');
      }
    },
  });

  const products: any[] = iap.products || [];
  const connected: boolean = iap.connected || false;
  const getProducts = iap.getProducts || iap.fetchProducts || (async () => {});

  // ─── Reset & fetch product when modal opens ──────────────────────────────────
  useEffect(() => {
    if (!visible) return;

    setPayState('idle');
    setErrorText('');
    setErrorCode(null);

    if (Platform.OS !== 'android') {
      const { text } = extractErrorMessage(
        { message: 'In-app purchases via Google Play are only available on Android.' },
        'Only available on Android.'
      );
      setErrorText(text);
      setErrorCode('android_only');
      setPayState('error');
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;

    if (connected) {
      setPayState('connecting');
      const fetchPromise = iap.fetchProducts
        ? iap.fetchProducts({ skus: [PRODUCT_ID], type: 'in-app' })
        : getProducts([PRODUCT_ID]);

      fetchPromise
        .then(() => setPayState('idle'))
        .catch((err: any) => {
          const { text, code } = extractErrorMessage(
            err,
            `Could not load product "${PRODUCT_ID}". Make sure it is Active in Play Console.`
          );
          setErrorText(text);
          setErrorCode(code ?? 'product_load_failed');
          setPayState('error');
        });
    } else {
      setPayState('connecting');
    }
  }, [connected, visible]);

  // ─── Download the CV PDF using a server-issued one-time token ────────────────
  const downloadCV = useCallback(async (token: string) => {
    try {
      const safeName = (cvName || 'cv').replace(/\s+/g, '_');
      const fileUri = `${FileSystem.documentDirectory}${safeName}_${cvId}.pdf`;

      const { uri } = await FileSystem.downloadAsync(
        `${API_BASE}/cv/${cvId}/download/?token=${encodeURIComponent(token)}`,
        fileUri
      );

      setPayState('completed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', 'CV saved to your device.');
      }
    } catch (downloadErr: any) {
      console.error('[IAP] PDF download failed:', downloadErr);
      // Use download_failed state so the user can retry without re-paying
      setErrorText(
        'Payment was successful, but the PDF download failed. Tap "Retry Download" to try again — you will NOT be charged again.'
      );
      setErrorCode('download_failed');
      setPayState('download_failed');
    }
  }, [cvId, cvName, onSuccess]);

  // ─── Retry download using the already-paid endpoint (no second charge) ───────
  const handleRetryDownload = useCallback(async () => {
    if (!cvId) return;
    setPayState('downloading');
    try {
      const res = await apiFetch('/payments/already-paid/', {
        method: 'POST',
        body: JSON.stringify({ cv_id: cvId }),
      });
      if (res.already_paid && res.download_token) {
        await downloadCV(res.download_token);
      } else {
        setErrorText('No verified payment found for this CV. Please complete payment first.');
        setErrorCode('not_paid');
        setPayState('error');
      }
    } catch (err: any) {
      const { text, code } = extractErrorMessage(err, 'Could not retry download. Please try again.');
      setErrorText(text);
      setErrorCode(code);
      setPayState('error');
    }
  }, [cvId, downloadCV]);

  // ─── Handle a successful purchase ────────────────────────────────────────────
  const handlePurchaseSuccess = useCallback(
    async (purchase: any) => {
      if (!purchase?.purchaseToken) {
        console.warn('[IAP] onPurchaseSuccess fired but purchaseToken is missing', purchase);
        return;
      }
      setPayState('verifying');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        const res = await apiFetch('/payments/verify-iap/', {
          method: 'POST',
          body: JSON.stringify({
            purchase_token: purchase.purchaseToken,
            product_id: purchase.productId ?? PRODUCT_ID,
            cv_id: cvId,
            order_id: purchase.transactionId ?? purchase.orderId ?? '',
          }),
        });

        if (res.download_token) {
          // ─── FIX: finishTransaction expects (purchase, isConsumable) positional args
          //     NOT { purchase, isConsumable } object. Using module-level fallback if
          //     iap.finishTransaction is not available.
          try {
            if (typeof iap.finishTransaction === 'function') {
              await iap.finishTransaction(purchase, false);
            } else {
              await finishTransaction(purchase, false);
            }
          } catch (ackErr) {
            // Non-fatal — backend also acknowledges on its side.
            console.warn('[IAP] Client-side finishTransaction failed (non-fatal):', ackErr);
          }

          setPayState('downloading');
          await downloadCV(res.download_token);
        } else {
          throw new Error('No download token received from server. Please contact support.');
        }
      } catch (err: any) {
        const { text, code } = extractErrorMessage(
          err,
          'Purchase could not be verified. Contact support if you were charged.'
        );
        setErrorText(text);
        setErrorCode(code);
        setPayState('error');
      }
    },
    [cvId, downloadCV, iap]
  );

  // ─── Keep the ref in sync with the latest callback on every render ───────────
  useEffect(() => {
    handlePurchaseSuccessRef.current = handlePurchaseSuccess;
  });

  // ─── Trigger Google Play purchase sheet ──────────────────────────────────────
  const handleBuyPress = async () => {
    if (!connected) {
      setErrorText('Google Play Billing is not connected yet. Please close and try again.');
      setErrorCode('not_connected');
      setPayState('error');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPayState('purchasing');
    try {
      // expo-iap v4 requestPurchase shape
      if (iap.requestPurchase && iap.fetchProducts) {
        await iap.requestPurchase({
          request: { google: { skus: [PRODUCT_ID] } },
          type: 'in-app',
        });
      } else {
        // Legacy fallback for older expo-iap
        try {
          await iap.requestPurchase({ skus: [PRODUCT_ID] });
        } catch {
          await iap.requestPurchase(PRODUCT_ID);
        }
      }
      // Result handled by onPurchaseSuccess / onPurchaseError callbacks
    } catch (err: any) {
      if (
        err?.code === 'E_USER_CANCELLED' ||
        err?.message?.toLowerCase().includes('cancel')
      ) {
        setPayState('cancelled');
      } else {
        const { text, code } = extractErrorMessage(err, 'Could not initiate purchase. Please try again.');
        setErrorText(text);
        setErrorCode(code);
        setPayState('error');
      }
    }
  };

  // ─── Close helpers ────────────────────────────────────────────────────────────
  const isBusy = ['connecting', 'purchasing', 'verifying', 'downloading'].includes(payState);

  const handleClose = () => {
    if (isBusy) return;
    setPayState('idle');
    setErrorText('');
    setErrorCode(null);
    onClose();
  };

  // ─── Price display ────────────────────────────────────────────────────────────
  const product = products.find((p: any) => (p?.productId || p?.id || p?.sku) === PRODUCT_ID);
  const rawPrice = (product as any)?.localizedPrice ?? (product as any)?.displayPrice ?? (product as any)?.price;
  const displayPrice = rawPrice
    ? (/[€$£¥₦]/.test(String(rawPrice)) || /EUR|USD|GBP|NGN/i.test(String(rawPrice))
        ? String(rawPrice)
        : `€${rawPrice}`)
    : null; // null = still loading

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={[s.sheet, { backgroundColor: colors.cardBg }]}>
          {/* ── Header ── */}
          <View style={[s.header, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[s.headerIconWrap, { backgroundColor: Palette.accent50 }]}>
                <Feather name="shopping-bag" size={16} color={Palette.accent600} />
              </View>
              <View>
                <Text style={[s.headerTitle, { color: colors.text }]}>Download CV</Text>
                <Text
                  style={{ fontSize: 10, color: colors.textMuted, maxWidth: 180 }}
                  numberOfLines={1}
                >
                  {cvName}
                </Text>
              </View>
            </View>
            <Pressable onPress={handleClose} disabled={isBusy} hitSlop={12}>
              <Feather
                name="x"
                size={20}
                color={colors.textMuted}
                style={isBusy && { opacity: 0.3 }}
              />
            </Pressable>
          </View>

          {/* ── IDLE: show product info & buy button ── */}
          {payState === 'idle' && (
            <View style={s.idleContainer}>
              {/* Price card */}
              <View
                style={[s.priceCard, { backgroundColor: Palette.neutral50, borderColor: colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.priceLabel, { color: colors.textMuted }]}>One-time fee</Text>
                  <Text style={[s.priceValue, { color: colors.text }]}>
                    {displayPrice ?? '€1.50'}
                  </Text>
                  <Text style={[s.priceSubtitle, { color: colors.textMuted }]}>
                    Charged via Google Play
                  </Text>
                </View>
                <View style={[s.priceIconWrap, { backgroundColor: Palette.accent50 }]}>
                  <Feather name="download" size={22} color={Palette.accent600} />
                </View>
              </View>

              {/* Trust row */}
              <View style={s.trustRow}>
                <View style={s.trustItem}>
                  <Feather name="shield" size={12} color={Palette.accent600} />
                  <Text style={[s.trustText, { color: colors.textMuted }]}>Google Play Protected</Text>
                </View>
                <View style={s.trustItem}>
                  <Feather name="lock" size={12} color={Palette.accent600} />
                  <Text style={[s.trustText, { color: colors.textMuted }]}>256-bit SSL</Text>
                </View>
              </View>

              {/* Buy CTA */}
              <LinearGradient
                colors={['#0e4f06', '#15750a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[s.payBtnWrap, Shadow.card]}
              >
                <Pressable
                  style={({ pressed }) => [s.payBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleBuyPress}
                >
                  <Feather name="shopping-cart" size={14} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={s.payBtnText}>
                    Buy {displayPrice ?? '€1.50'} via Google Play
                  </Text>
                </Pressable>
              </LinearGradient>

              <Text style={[s.acceptedPaymentsText, { color: colors.textMuted }]}>
                Secure payment handled by Google Play Billing
              </Text>
            </View>
          )}

          {/* ── CONNECTING ── */}
          {payState === 'connecting' && (
            <View style={s.center}>
              <ActivityIndicator size="large" color={Palette.accent600} />
              <Text style={[s.statusText, { color: colors.text }]}>
                Connecting to Google Play…
              </Text>
              {/* Show price shimmer while connecting */}
              <View style={[s.priceShimmer, { borderColor: colors.border }]}>
                <Text style={[s.priceLabel, { color: colors.textMuted }]}>Loading price…</Text>
              </View>
            </View>
          )}

          {/* ── PURCHASING ── */}
          {payState === 'purchasing' && (
            <View style={s.center}>
              <ActivityIndicator size="large" color={Palette.accent600} />
              <Text style={[s.statusText, { color: colors.text }]}>
                Opening Google Play checkout…
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center' }}>
                Complete the payment in the Google Play sheet that appeared.
              </Text>
            </View>
          )}

          {/* ── VERIFYING ── */}
          {payState === 'verifying' && (
            <View style={s.center}>
              <ActivityIndicator size="large" color={Palette.accent600} />
              <Text style={[s.statusText, { color: colors.text }]}>
                Verifying purchase with Google…
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center' }}>
                This may take a few seconds. Please do not close the app.
              </Text>
            </View>
          )}

          {/* ── DOWNLOADING ── */}
          {payState === 'downloading' && (
            <View style={s.center}>
              <ActivityIndicator size="large" color={Palette.emerald600} />
              <Text style={[s.statusText, { color: colors.text }]}>
                Generating PDF and saving to device…
              </Text>
            </View>
          )}

          {/* ── COMPLETED ── */}
          {payState === 'completed' && (
            <View style={s.center}>
              <View style={[s.successIconWrap, { backgroundColor: Palette.emerald50 }]}>
                <Feather name="check-circle" size={32} color={Palette.emerald600} />
              </View>
              <Text style={[s.successTitle, { color: colors.text }]}>Download complete!</Text>
              <Text style={[s.successSub, { color: colors.textMuted }]}>
                Your CV has been saved to your device.
              </Text>
              <Pressable
                onPress={handleClose}
                style={[s.doneBtn, { backgroundColor: Palette.accent600 }]}
              >
                <Text style={s.doneBtnText}>Done</Text>
              </Pressable>
            </View>
          )}

          {/* ── CANCELLED ── */}
          {payState === 'cancelled' && (
            <View style={s.center}>
              <View style={[s.warnIconWrap, { backgroundColor: Palette.neutral100 }]}>
                <Feather name="x-circle" size={32} color={Palette.neutral500} />
              </View>
              <Text style={[s.successTitle, { color: colors.text }]}>Purchase cancelled</Text>
              <Text style={[s.successSub, { color: colors.textMuted }]}>No charge was made.</Text>
              <View style={s.btnRow}>
                <Pressable
                  onPress={handleClose}
                  style={[s.btnHalf, { backgroundColor: Palette.neutral100 }]}
                >
                  <Text style={[s.btnHalfText, { color: colors.text }]}>Close</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setPayState('idle');
                    setErrorText('');
                    setErrorCode(null);
                  }}
                  style={[s.btnHalf, { backgroundColor: Palette.accent600 }]}
                >
                  <Text style={[s.btnHalfText, { color: '#fff' }]}>Try Again</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ── DOWNLOAD FAILED (payment OK, PDF fetch failed) ── */}
          {payState === 'download_failed' && (
            <View style={s.center}>
              <View style={[s.warnIconWrap, { backgroundColor: Palette.warm50 }]}>
                <Feather name="cloud-off" size={32} color={Palette.warm500} />
              </View>
              <Text style={[s.successTitle, { color: colors.text }]}>Download Failed</Text>
              <Text style={[s.successSub, { color: colors.textMuted }]}>
                Your payment was successful but the PDF could not be downloaded. Tap below to retry — you will NOT be charged again.
              </Text>
              <View style={s.btnRow}>
                <Pressable
                  onPress={handleClose}
                  style={[s.btnHalf, { backgroundColor: Palette.neutral100 }]}
                >
                  <Text style={[s.btnHalfText, { color: colors.text }]}>Close</Text>
                </Pressable>
                <Pressable
                  onPress={handleRetryDownload}
                  style={[s.btnHalf, { backgroundColor: Palette.accent600 }]}
                >
                  <Text style={[s.btnHalfText, { color: '#fff' }]}>Retry Download</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ── ERROR ── */}
          {payState === 'error' && (
            <View style={s.center}>
              <View style={[s.errIconWrap, { backgroundColor: Palette.red50 }]}>
                <Feather name="alert-triangle" size={32} color={Palette.red600} />
              </View>
              <Text style={[s.successTitle, { color: colors.text }]}>Something went wrong</Text>
              <Text style={[s.successSub, { color: colors.textMuted }]}>{errorText}</Text>

              {/* Error code badge — helps with debugging & support */}
              {errorCode && (
                <View style={[s.errorCodeBadge, { backgroundColor: Palette.red50, borderColor: Palette.red400 }]}>
                  <Feather name="info" size={10} color={Palette.red600} style={{ marginRight: 4 }} />
                  <Text style={[s.errorCodeText, { color: Palette.red600 }]}>
                    Code: {errorCode}
                  </Text>
                </View>
              )}

              <View style={s.btnRow}>
                <Pressable
                  onPress={handleClose}
                  style={[s.btnHalf, { backgroundColor: Palette.neutral100 }]}
                >
                  <Text style={[s.btnHalfText, { color: colors.text }]}>Close</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setPayState('idle');
                    setErrorText('');
                    setErrorCode(null);
                  }}
                  style={[s.btnHalf, { backgroundColor: Palette.accent600 }]}
                >
                  <Text style={[s.btnHalfText, { color: '#fff' }]}>Retry</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.cardLg,
    borderTopRightRadius: BorderRadius.cardLg,
    maxHeight: SCREEN_H * 0.85,
    paddingTop: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 24,
    alignItems: 'center',
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  idleContainer: {
    padding: 20,
    gap: 16,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: FontWeight.black,
    marginTop: 2,
  },
  priceSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  priceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceShimmer: {
    borderWidth: 1,
    borderRadius: BorderRadius.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 4,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '500',
  },
  payBtnWrap: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    marginTop: 6,
  },
  payBtn: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: FontWeight.bold,
  },
  acceptedPaymentsText: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 2,
  },
  successIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
  },
  successSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  doneBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: BorderRadius.card,
    marginTop: 8,
  },
  doneBtnText: {
    color: '#fff',
    fontWeight: FontWeight.bold,
    fontSize: 13,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  btnHalf: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnHalfText: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
  },
  errorCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: -4,
  },
  errorCodeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});

export default function NativePaymentModal(props: NativePaymentModalProps) {
  if (!hasNativeIap) {
    return <ExpoGoFallbackModal visible={props.visible} onClose={props.onClose} />;
  }
  return <NativePaymentModalInner {...props} />;
}
