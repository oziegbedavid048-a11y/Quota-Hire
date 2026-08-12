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
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  NativeModules,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { apiFetch } from '@/services/api';

const { height: SCREEN_H } = Dimensions.get('window');

// ─── IMPORTANT: This MUST match the product ID you create in Google Play Console ───
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
  | 'error';

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

function ExpoGoFallbackModal({ visible, onClose }: NativePaymentModalProps) {
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

function NativePaymentModalInner({
  visible,
  onClose,
  cvId,
  cvName,
  onSuccess,
}: NativePaymentModalProps) {
  const colors = Colors.light;

  const [payState, setPayState] = useState<PayState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // ─── expo-iap v4 useIAP hook ────────────────────────────────────────────────
  const iap = (useIAP as any)({
    onPurchaseSuccess: async (purchase: any) => {
      await handlePurchaseSuccess(purchase);
    },
    onPurchaseError: (error: any) => {
      if (
        error?.code === 'E_USER_CANCELLED' ||
        error?.message?.toLowerCase().includes('cancel')
      ) {
        setPayState('cancelled');
      } else {
        setErrorMessage(error?.message || 'Purchase failed. Please try again.');
        setPayState('error');
      }
    },
  });

  const products: any[] = iap.products || [];
  const connected: boolean = iap.connected || false;
  const requestPurchase = iap.requestPurchase;
  const getProducts = iap.getProducts || iap.fetchProducts || (async () => {});

  // ─── Fetch product when modal opens and IAP is connected ─────────────────────
  useEffect(() => {
    if (!visible) return;

    // Reset state every time the modal opens fresh
    setPayState('idle');
    setErrorMessage('');

    if (Platform.OS !== 'android') {
      setPayState('error');
      setErrorMessage('In-app purchases via Google Play are only available on Android.');
      return;
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;

    if (connected) {
      // BillingClient is ready — load product info
      setPayState('connecting');
      getProducts([PRODUCT_ID])
        .then(() => setPayState('idle'))
        .catch((err: any) => {
          setErrorMessage(
            err?.message ||
              `Could not load product "${PRODUCT_ID}". Make sure it is Active in Play Console.`
          );
          setPayState('error');
        });
    } else {
      setPayState('connecting');
    }
  }, [connected, visible]);

  // ─── Handle a successful purchase from the useIAP hook ────────────────────────
  const handlePurchaseSuccess = useCallback(
    async (purchase: any) => {
      if (!purchase?.purchaseToken) return;
      setPayState('verifying');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        const res = await apiFetch('/payments/verify-iap/', {
          method: 'POST',
          body: JSON.stringify({
            purchase_token: purchase.purchaseToken,
            product_id: purchase.productId,
            cv_id: cvId,
            order_id: purchase.transactionId ?? purchase.orderId ?? '',
          }),
        });

        if (res.download_token) {
          // Acknowledge the purchase — REQUIRED by Google Play within 3 days
          await finishTransaction(purchase);

          setPayState('downloading');
          await downloadCV(res.download_token);
        } else {
          throw new Error('No download token received from server.');
        }
      } catch (err: any) {
        setErrorMessage(
          err.message || 'Purchase could not be verified. Contact support if you were charged.'
        );
        setPayState('error');
      }
    },
    [cvId, cvName]
  );

  // ─── Trigger Google Play purchase sheet ──────────────────────────────────────
  const handleBuyPress = async () => {
    if (!connected) {
      setErrorMessage('Google Play connection not ready. Please close and try again.');
      setPayState('error');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPayState('purchasing');
    try {
      await (requestPurchase as any)({ skus: [PRODUCT_ID] }).catch(async () => {
        await (requestPurchase as any)(PRODUCT_ID);
      });
      // Result is handled by onPurchaseSuccess / onPurchaseError callbacks above
    } catch (err: any) {
      if (
        err?.code === 'E_USER_CANCELLED' ||
        err?.message?.toLowerCase().includes('cancel')
      ) {
        setPayState('cancelled');
      } else {
        setErrorMessage(err?.message || 'Could not initiate purchase. Please try again.');
        setPayState('error');
      }
    }
  };

  // ─── Download the CV PDF using the server-issued one-time token ──────────────
  const downloadCV = async (token: string) => {
    try {
      const API_BASE = 'https://quotahire-backend.onrender.com/api';
      const safeName = cvName.replace(/\s+/g, '_');
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
    } catch {
      setErrorMessage(
        'Payment was successful, but the PDF download failed. Please retry download.'
      );
      setPayState('error');
    }
  };

  // ─── Close helpers ────────────────────────────────────────────────────────────
  const isBusy = ['connecting', 'purchasing', 'verifying', 'downloading'].includes(payState);

  const handleClose = () => {
    if (isBusy) return;
    setPayState('idle');
    setErrorMessage('');
    onClose();
  };

  // ─── Price display — use live product price from Play Console ─────────────────
  const product = products.find((p: any) => (p?.productId || p?.id || p?.sku) === PRODUCT_ID);
  const displayPrice = (product as any)?.localizedPrice ?? (product as any)?.price ?? '~€1.50';

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
                  <Text style={[s.priceValue, { color: colors.text }]}>{displayPrice}</Text>
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
                  <Text style={s.payBtnText}>Buy {displayPrice} via Google Play</Text>
                </Pressable>
              </LinearGradient>

              <Text style={[s.acceptedPaymentsText, { color: colors.textMuted }]}>
                Secure payment handled by Google Play Billing
              </Text>
            </View>
          )}

          {/* ── CONNECTING: initialising Play Billing client ── */}
          {payState === 'connecting' && (
            <View style={s.center}>
              <ActivityIndicator size="large" color={Palette.accent600} />
              <Text style={[s.statusText, { color: colors.text }]}>
                Connecting to Google Play…
              </Text>
            </View>
          )}

          {/* ── PURCHASING: waiting for user to complete the Play sheet ── */}
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

          {/* ── VERIFYING: backend checking with Google Play API ── */}
          {payState === 'verifying' && (
            <View style={s.center}>
              <ActivityIndicator size="large" color={Palette.accent600} />
              <Text style={[s.statusText, { color: colors.text }]}>
                Verifying purchase with Google…
              </Text>
            </View>
          )}

          {/* ── DOWNLOADING: fetching the PDF ── */}
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
                  onPress={() => setPayState('idle')}
                  style={[s.btnHalf, { backgroundColor: Palette.accent600 }]}
                >
                  <Text style={[s.btnHalfText, { color: '#fff' }]}>Try Again</Text>
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
              <Text style={[s.successSub, { color: colors.textMuted }]}>{errorMessage}</Text>
              <View style={s.btnRow}>
                <Pressable
                  onPress={handleClose}
                  style={[s.btnHalf, { backgroundColor: Palette.neutral100 }]}
                >
                  <Text style={[s.btnHalfText, { color: colors.text }]}>Close</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPayState('idle')}
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
});

export default function NativePaymentModal(props: NativePaymentModalProps) {
  if (!hasNativeIap) {
    return <ExpoGoFallbackModal {...props} />;
  }
  return <NativePaymentModalInner {...props} />;
}
