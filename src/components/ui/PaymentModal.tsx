/**
 * PaymentModal
 *
 * A premium modal that gates CV downloads behind a Paystack payment.
 * Flow:
 *   1. User clicks Download → this modal opens
 *   2. "Pay €1.50" button → POST /api/payments/initiate/ → get reference + amount
 *   3. Paystack inline popup opens
 *   4. On success → POST /api/payments/verify/ → get download_token
 *   5. GET /api/cv/<id>/download/?token=<t> → streams PDF
 *   6. On failure/close → shows retry UI
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  CreditCard,
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../context/AppContext';
import { openPaystackPopup } from '../../lib/paystack';

/* ── Types ── */
export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvId: number;
  cvName: string;
  userEmail: string;
}

type ModalState =
  | 'idle'
  | 'initiating'
  | 'popup_open'
  | 'verifying'
  | 'downloading'
  | 'success'
  | 'cancelled'
  | 'error';

/* ── Component ── */
export function PaymentModal({ isOpen, onClose, cvId, cvName, userEmail }: PaymentModalProps) {
  const [modalState, setModalState] = useState<ModalState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentReference, setCurrentReference] = useState('');

  const setError = (msg: string) => {
    setErrorMessage(msg);
    setModalState('error');
  };

  const downloadWithToken = useCallback(async (token: string) => {
    setModalState('downloading');
    try {
      const authToken = localStorage.getItem('access_token');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const resp = await fetch(`${API_BASE}/cv/${cvId}/download/?token=${encodeURIComponent(token)}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        const errCode = body?.error || '';
        if (errCode === 'token_expired') {
          setError('Your download link expired (10 min). Click Retry to get a new one instantly.');
        } else {
          setError(body?.message || 'Download failed. Please try again.');
        }
        return;
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cvName.replace(/\s+/g, '_')}_${cvId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setModalState('success');
      toast.success('CV downloaded successfully!');
    } catch {
      setError('A network error occurred during download. Please try again.');
    }
  }, [cvId, cvName]);

  const verifyAndDownload = useCallback(async (reference: string) => {
    setModalState('verifying');
    try {
      const result = await apiFetch('/payments/verify/', {
        method: 'POST',
        body: JSON.stringify({ reference }),
      });

      if (result?.download_token) {
        await downloadWithToken(result.download_token);
      } else {
        setError('Verification succeeded but no download token was returned. Contact support.');
      }
    } catch (err: unknown) {
      const errObj = err as { status?: number; data?: { error?: string; message?: string } };
      const code = errObj?.data?.error || '';
      const msg = errObj?.data?.message || 'Payment verification failed. Please try again.';

      if (errObj?.status === 402) {
        if (code === 'payment_not_successful') {
          setError('Payment was not completed successfully. Please try paying again.');
        } else if (code === 'amount_mismatch') {
          setError('Payment amount did not match. Contact support if money was deducted.');
        } else {
          setError(msg);
        }
      } else {
        setError(msg);
      }
    }
  }, [downloadWithToken]);

  const handlePay = useCallback(async () => {
    setModalState('initiating');
    setErrorMessage('');

    try {
      const result = await apiFetch('/payments/initiate/', {
        method: 'POST',
        body: JSON.stringify({ cv_id: cvId }),
      });

      if (result?.already_paid && result?.download_token) {
        toast.info('You already paid for this document. Downloading now…');
        await downloadWithToken(result.download_token);
        return;
      }

      const { reference, amount_kobo } = result;
      if (!reference) {
        setError('Failed to initiate payment. Please try again.');
        return;
      }

      setCurrentReference(reference);
      setModalState('popup_open');

      await openPaystackPopup({
        email: userEmail,
        amountKobo: amount_kobo,
        reference,
        label: `Quota Hire CV — ${cvName}`,
        onSuccess: async (_response) => {
          await verifyAndDownload(reference);
        },
        onClose: () => {
          setModalState('cancelled');
        },
      });
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string } };
      setError(errObj?.data?.message || (err instanceof Error ? err.message : 'An unexpected error occurred.'));
    }
  }, [cvId, cvName, userEmail, downloadWithToken, verifyAndDownload]);

  const handleRetry = useCallback(async () => {
    if (currentReference && modalState === 'error') {
      await verifyAndDownload(currentReference);
    } else {
      setModalState('idle');
      setErrorMessage('');
    }
  }, [currentReference, modalState, verifyAndDownload]);

  const handleClose = () => {
    if (['initiating', 'verifying', 'downloading'].includes(modalState)) return;
    setModalState('idle');
    setErrorMessage('');
    setCurrentReference('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md bg-white dark:bg-neutral-950 rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">

              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-400" />

              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
                      <CreditCard size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-neutral-900 dark:text-white leading-tight">
                        Download CV
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-[200px] truncate">
                        {cvName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={['initiating', 'verifying', 'downloading'].includes(modalState)}
                    className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-30"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Body */}
                <AnimatePresence mode="wait">
                  {/* IDLE */}
                  {modalState === 'idle' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-5"
                    >
                      <div className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-900/20 dark:to-violet-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                              One-time download fee
                            </p>
                            <p className="text-3xl font-black text-neutral-900 dark:text-white">
                              €1.50
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              Charged in NGN at current rate via Paystack
                            </p>
                          </div>
                          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-900 flex items-center justify-center shadow-md border border-blue-100 dark:border-blue-800/20">
                            <Download size={22} className="text-blue-500" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <ShieldCheck size={14} className="text-emerald-500" />
                          <span>256-bit SSL</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <Lock size={14} className="text-emerald-500" />
                          <span>Powered by Paystack</span>
                        </div>
                      </div>

                      <button
                        onClick={handlePay}
                        className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-extrabold py-3.5 rounded-2xl text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all active:scale-[0.98]"
                      >
                        <CreditCard size={16} />
                        Pay &amp; Download Now
                      </button>

                      <p className="text-center text-[11px] text-neutral-400 leading-relaxed">
                        Pay with card, bank transfer, or USSD. Charged in ₦ equivalent to €1.50.
                      </p>
                    </motion.div>
                  )}

                  {/* INITIATING */}
                  {modalState === 'initiating' && (
                    <motion.div
                      key="initiating"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex flex-col items-center justify-center py-10 gap-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <Loader2 size={26} className="text-blue-500 animate-spin" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Preparing payment…</p>
                        <p className="text-xs text-neutral-500 mt-1">Connecting to Paystack securely</p>
                      </div>
                    </motion.div>
                  )}

                  {/* POPUP_OPEN */}
                  {modalState === 'popup_open' && (
                    <motion.div
                      key="popup_open"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex flex-col items-center justify-center py-8 gap-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                        <CreditCard size={24} className="text-violet-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Payment window open</p>
                        <p className="text-xs text-neutral-500 mt-1">Complete payment in the Paystack popup</p>
                      </div>
                    </motion.div>
                  )}

                  {/* VERIFYING */}
                  {modalState === 'verifying' && (
                    <motion.div
                      key="verifying"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex flex-col items-center justify-center py-10 gap-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                        <ShieldCheck size={26} className="text-emerald-500 animate-pulse" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Verifying payment…</p>
                        <p className="text-xs text-neutral-500 mt-1">Confirming with Paystack servers</p>
                      </div>
                    </motion.div>
                  )}

                  {/* DOWNLOADING */}
                  {modalState === 'downloading' && (
                    <motion.div
                      key="downloading"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex flex-col items-center justify-center py-10 gap-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <Download size={26} className="text-blue-500 animate-bounce" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Downloading your CV…</p>
                        <p className="text-xs text-neutral-500 mt-1">Preparing your PDF</p>
                      </div>
                    </motion.div>
                  )}

                  {/* SUCCESS */}
                  {modalState === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-8 gap-4"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 14, stiffness: 200 }}
                        className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
                      >
                        <CheckCircle2 size={32} className="text-emerald-500" />
                      </motion.div>
                      <div className="text-center">
                        <p className="text-base font-extrabold text-neutral-900 dark:text-white">Download complete!</p>
                        <p className="text-xs text-neutral-500 mt-1">Your CV has been saved to your device.</p>
                      </div>
                      <button
                        onClick={handleClose}
                        className="mt-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-sm transition-colors"
                      >
                        Done
                      </button>
                    </motion.div>
                  )}

                  {/* CANCELLED */}
                  {modalState === 'cancelled' && (
                    <motion.div
                      key="cancelled"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex flex-col items-center justify-center py-6 gap-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                        <X size={24} className="text-amber-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Payment cancelled</p>
                        <p className="text-xs text-neutral-500 mt-1">You closed the payment window. No charge was made.</p>
                      </div>
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={handleClose}
                          className="px-5 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => setModalState('idle')}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-extrabold rounded-xl text-sm hover:opacity-90 transition-opacity"
                        >
                          Try Again
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ERROR */}
                  {modalState === 'error' && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex flex-col items-center justify-center py-6 gap-4"
                    >
                      <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-red-500" />
                      </div>
                      <div className="text-center max-w-xs">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Something went wrong</p>
                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{errorMessage}</p>
                      </div>
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={handleClose}
                          className="px-5 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        >
                          Close
                        </button>
                        <button
                          onClick={handleRetry}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-extrabold rounded-xl text-sm hover:opacity-90 transition-opacity"
                        >
                          <RefreshCw size={14} />
                          Retry
                        </button>
                      </div>
                      <p className="text-[11px] text-neutral-400 text-center">
                        If money was deducted and download failed, email{' '}
                        <a href="mailto:support.qutahire@gmail.com" className="text-blue-500 hover:underline">
                          support.qutahire@gmail.com
                        </a>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

