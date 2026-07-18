import React, { useState, useEffect } from 'react';
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
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { apiFetch } from '@/services/api';

const { height: SCREEN_H } = Dimensions.get('window');

interface NativePaymentModalProps {
  visible: boolean;
  onClose: () => void;
  cvId: number | null;
  cvName: string;
  onSuccess: () => void;
}

type PayState = 'idle' | 'initiating' | 'checkout' | 'verifying' | 'downloading' | 'completed' | 'cancelled' | 'error';

export default function NativePaymentModal({ visible, onClose, cvId, cvName, onSuccess }: NativePaymentModalProps) {
  const colors = Colors.light;

  const [payState, setPayState] = useState<PayState>('idle');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [webViewLoading, setWebViewLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setPayState('idle');
      setCheckoutUrl(null);
      setReference(null);
      setErrorMessage('');
      setWebViewLoading(true);
    }
  }, [visible]);

  const initiatePayment = async () => {
    setPayState('initiating');
    try {
      const res = await apiFetch('/payments/initiate/', {
        method: 'POST',
        body: JSON.stringify({ cv_id: cvId }),
      });

      if (res.already_paid && res.download_token) {
        setPayState('downloading');
        downloadCV(res.download_token);
        return;
      }

      if (res.access_code && res.reference) {
        setReference(res.reference);
        setCheckoutUrl(res.authorization_url || `https://checkout.paystack.com/${res.access_code}`);
        setWebViewLoading(true);
        setPayState('checkout');
      } else {
        throw new Error('Failed to initiate payment.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to initiate transaction. Please check your network.');
      setPayState('error');
    }
  };

  const injectedJS = `
    (function() {
      // 1. Override window.close
      var origClose = window.close;
      window.close = function() {
        window.ReactNativeWebView.postMessage("cancelled");
        if (origClose) origClose();
      };

      // 2. Intercept redirects or navigation attempts to standard close URLs
      var origAssign = window.location.assign;
      if (origAssign) {
        window.location.assign = function(url) {
          if (url && (url.indexOf('close') !== -1 || url.indexOf('cancel') !== -1)) {
            window.ReactNativeWebView.postMessage("cancelled");
          }
          origAssign.apply(this, arguments);
        };
      }

      // 3. Keep trying to bind click handlers to cancel / close links
      var checkInterval = setInterval(function() {
        var links = document.getElementsByTagName('a');
        for (var i = 0; i < links.length; i++) {
          var link = links[i];
          if (link.innerText && (link.innerText.toLowerCase().includes('cancel') || link.innerText.toLowerCase().includes('close') || link.innerText.toLowerCase().includes('go back'))) {
            if (!link.hasAttribute('data-cancel-bound')) {
              link.setAttribute('data-cancel-bound', 'true');
              link.addEventListener('click', function(e) {
                window.ReactNativeWebView.postMessage("cancelled");
              });
            }
          }
        }
        var buttons = document.getElementsByTagName('button');
        for (var i = 0; i < buttons.length; i++) {
          var btn = buttons[i];
          if (btn.innerText && (btn.innerText.toLowerCase().includes('cancel') || btn.innerText.toLowerCase().includes('close') || btn.innerText.toLowerCase().includes('go back'))) {
            if (!btn.hasAttribute('data-cancel-bound')) {
              btn.setAttribute('data-cancel-bound', 'true');
              btn.addEventListener('click', function(e) {
                window.ReactNativeWebView.postMessage("cancelled");
              });
            }
          }
        }
      }, 1000);
    })();
    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const data = event.nativeEvent.data;
      if (data === 'cancelled' || data === 'close' || data === 'window_close') {
        handleCancelPayment();
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    if (!url) return;
    // Paystack success/callback
    if (url.includes('callback') || url.includes('success') || url.includes('trx')) {
      verifyTransaction();
      return;
    }
    // Paystack's own Cancel button redirects to a URL containing 'cancel' or 'close'
    if (url.includes('cancel') || url.includes('close') || url.includes('cancelled')) {
      handleCancelPayment();
    }
  };

  const verifyTransaction = async () => {
    if (!reference) return;
    setPayState('verifying');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await apiFetch('/payments/verify/', {
        method: 'POST',
        body: JSON.stringify({ reference }),
      });

      if (res.download_token) {
        setPayState('downloading');
        downloadCV(res.download_token);
      } else {
        throw new Error('No download token received.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment could not be verified. Contact support if you were debited.');
      setPayState('error');
    }
  };

  const downloadCV = async (token: string) => {
    try {
      const API_BASE = 'https://quotahire-backend.onrender.com/api';
      const fileUri = `${FileSystem.documentDirectory}${cvName.replace(/\s+/g, '_')}_${cvId}.pdf`;

      // Native PDF download from Django REST binary endpoint
      const { uri } = await FileSystem.downloadAsync(
        `${API_BASE}/cv/${cvId}/download/?token=${encodeURIComponent(token)}`,
        fileUri
      );

      setPayState('completed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();

      // Open native system sharing/viewing sheet so user can view/save/print it!
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', 'CV saved to device local folder.');
      }
    } catch (err) {
      setErrorMessage('Payment was successful, but the PDF download failed. Please retry.');
      setPayState('error');
    }
  };

  const handleClose = () => {
    if (['initiating', 'verifying', 'downloading'].includes(payState)) return;
    setPayState('idle');
    setErrorMessage('');
    setReference(null);
    setCheckoutUrl(null);
    onClose();
  };

  // Used by the Cancel Payment button shown during checkout
  const handleCancelPayment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPayState('cancelled');
  };

  const isBusy = ['initiating', 'verifying', 'downloading'].includes(payState);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={[
          s.sheet,
          { backgroundColor: colors.cardBg },
          payState === 'checkout' && { height: '100%', borderTopLeftRadius: 0, borderTopRightRadius: 0, paddingTop: Platform.OS === 'ios' ? 44 : 20 }
        ]}>
          {/* Header */}
          <View style={[s.header, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[s.headerIconWrap, { backgroundColor: Palette.accent50 }]}>
                <Feather name="credit-card" size={16} color={Palette.accent600} />
              </View>
              <View>
                <Text style={[s.headerTitle, { color: colors.text }]}>Download CV</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted, maxWidth: 180 }} numberOfLines={1}>{cvName}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                // During checkout: cancel payment (not silently close)
                if (payState === 'checkout') {
                  handleCancelPayment();
                } else {
                  handleClose();
                }
              }}
              disabled={isBusy}
              hitSlop={12}
            >
              <Feather name="x" size={20} color={colors.textMuted} style={isBusy && { opacity: 0.3 }} />
            </Pressable>
          </View>

          {/* IDLE */}
          {payState === 'idle' && (
            <View style={s.idleContainer}>
              {/* Price row */}
              <View style={[s.priceCard, { backgroundColor: Palette.neutral50, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.priceLabel, { color: colors.textMuted }]}>One-time fee</Text>
                  <Text style={[s.priceValue, { color: colors.text }]}>€1.50</Text>
                  <Text style={[s.priceSubtitle, { color: colors.textMuted }]}>Charged in ₦ at live rate</Text>
                </View>
                <View style={[s.priceIconWrap, { backgroundColor: Palette.accent50 }]}>
                  <Feather name="download" size={22} color={Palette.accent600} />
                </View>
              </View>

              {/* Trust row */}
              <View style={s.trustRow}>
                <View style={s.trustItem}>
                  <Feather name="shield" size={12} color={Palette.accent600} />
                  <Text style={[s.trustText, { color: colors.textMuted }]}>256-bit SSL</Text>
                </View>
                <View style={s.trustItem}>
                  <Feather name="lock" size={12} color={Palette.accent600} />
                  <Text style={[s.trustText, { color: colors.textMuted }]}>Paystack</Text>
                </View>
              </View>

              {/* CTA button with LinearGradient */}
              <LinearGradient
                colors={['#0e4f06', '#15750a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[s.payBtnWrap, Shadow.card]}
              >
                <Pressable
                  style={({ pressed }) => [s.payBtn, pressed && { opacity: 0.95 }]}
                  onPress={initiatePayment}
                >
                  <Text style={s.payBtnText}>Pay €1.50 & Download</Text>
                </Pressable>
              </LinearGradient>

              <Text style={[s.acceptedPaymentsText, { color: colors.textMuted }]}>
                Card, bank transfer, or USSD accepted
              </Text>
            </View>
          )}

          {/* INITIATING */}
          {payState === 'initiating' && (
            <View style={s.center}>
              <ActivityIndicator size="large" color={Palette.accent600} />
              <Text style={[s.statusText, { color: colors.text }]}>Preparing transaction secure gateway...</Text>
            </View>
          )}

          {/* CHECKOUT */}
          {payState === 'checkout' && checkoutUrl && (
            <View style={{ flex: 1, position: 'relative' }}>
              <WebView
                source={{ uri: checkoutUrl }}
                onNavigationStateChange={handleNavigationStateChange}
                onLoadStart={() => setWebViewLoading(true)}
                onLoadEnd={() => setWebViewLoading(false)}
                injectedJavaScript={injectedJS}
                onMessage={handleMessage}
                style={{ flex: 1 }}
              />

              {/* Overlay spinner until Paystack page is fully loaded */}
              {webViewLoading && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', zIndex: 10 }]}>
                  <ActivityIndicator size="large" color={Palette.accent600} />
                  <Text style={{ marginTop: 12, fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>
                    Loading Paystack secure gateway...
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* VERIFYING */}
          {payState === 'verifying' && (
            <View style={s.center}>
              <ActivityIndicator size="large" color={Palette.accent600} />
              <Text style={[s.statusText, { color: colors.text }]}>Verifying transaction reference...</Text>
            </View>
          )}

          {/* DOWNLOADING */}
          {payState === 'downloading' && (
            <View style={s.center}>
              <ActivityIndicator size="large" color={Palette.emerald600} />
              <Text style={[s.statusText, { color: colors.text }]}>Generating binary PDF and saving...</Text>
            </View>
          )}

          {/* COMPLETED */}
          {payState === 'completed' && (
            <View style={s.center}>
              <View style={[s.successIconWrap, { backgroundColor: Palette.emerald50 }]}>
                <Feather name="check-circle" size={32} color={Palette.emerald600} />
              </View>
              <Text style={[s.successTitle, { color: colors.text }]}>Download complete!</Text>
              <Text style={[s.successSub, { color: colors.textMuted }]}>Your CV has been saved to your device.</Text>
              <Pressable
                onPress={handleClose}
                style={[s.doneBtn, { backgroundColor: Palette.accent600 }]}
              >
                <Text style={s.doneBtnText}>Done</Text>
              </Pressable>
            </View>
          )}

          {/* CANCELLED */}
          {payState === 'cancelled' && (
            <View style={s.center}>
              <View style={[s.warnIconWrap, { backgroundColor: Palette.neutral100 }]}>
                <Feather name="x-circle" size={32} color={Palette.neutral500} />
              </View>
              <Text style={[s.successTitle, { color: colors.text }]}>Payment cancelled</Text>
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

          {/* ERROR */}
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
                  onPress={initiatePayment}
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

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.cardLg,
    borderTopRightRadius: BorderRadius.cardLg,
    height: SCREEN_H * 0.45,
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
  cancelBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Palette.red400,
    backgroundColor: Palette.red50,
  },
  cancelBarText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.red600,
  },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.neutral50,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Palette.neutral200,
  },
  checkoutHeaderSecureText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cancelPaymentBtn: {
    backgroundColor: Palette.red50,
    borderColor: Palette.red400,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelPaymentBtnText: {
    color: Palette.red700,
    fontSize: 11,
    fontWeight: '700',
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
