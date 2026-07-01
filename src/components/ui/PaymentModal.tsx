/**
 * PaymentModal â€” Bottom Drawer Edition
 *
 * A premium bottom-sheet that gates CV downloads behind a Paystack payment.
 * Slides up from the bottom. Uses Quota Hire brand green palette throughout.
 *
 * Flow:
 *   1. User clicks Download â†’ this drawer slides up
 *   2. "Pay â‚¬1.50" button â†’ POST /api/payments/initiate/ â†’ reference + amount
 *   3. Paystack inline popup opens
 *   4. On success â†’ POST /api/payments/verify/ â†’ download_token
 *   5. GET /api/cv/<id>/download/?token=<t> â†’ streams PDF
 *   6. On failure/close â†’ shows retry UI
 */

import { useState, useCallback, useEffect } from 'react';
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
  FileText,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../context/AppContext';
import { openPaystackPopup } from '../../lib/paystack';

/* â”€â”€ Types â”€â”€ */
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

/* â”€â”€ Component â”€â”€ */
export function PaymentModal({ isOpen, onClose, cvId, cvName, userEmail }: PaymentModalProps) {
  const [modalState, setModalState] = useState<ModalState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentReference, setCurrentReference] = useState('');

  /* Lock body scroll when drawer is open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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
        toast.info('You already paid for this document. Downloading nowâ€¦');
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
        label: `Quota Hire CV â€” ${cvName}`,
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

  const isBusy = ['initiating', 'verifying', 'downloading'].includes(modalState);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* â”€â”€ Backdrop â”€â”€ */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* â”€â”€ Bottom Drawer â”€â”€ */}
          <motion.div
            key="drawer"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            {/* Centering wrapper â€” full width on mobile, max-w-lg centred on desktop */}
            <div className="w-full max-w-lg mx-auto">

              {/* Drag handle pill */}
              <div className="flex justify-center pt-2.5 pb-0.5">
                <div className="w-10 h-1 rounded-full bg-white/40" />
              </div>

              <div className="bg-white dark:bg-neutral-950 rounded-t-[28px] shadow-2xl border-t border-x border-neutral-100 dark:border-neutral-800 overflow-hidden">

                {/* â”€â”€ Green branded header â”€â”€ */}
                <div
                  className="relative px-5 pt-5 pb-5 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #0e4f06 0%, #15750a 55%, #3a9e10 100%)' }}
                >
                  {/* Decorative blobs */}
                  <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
                  <div className="absolute -bottom-6 right-4 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
                  <div className="absolute top-2 left-1/2 w-16 h-16 rounded-full bg-accent-400/10 pointer-events-none" />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/25 shadow-lg flex-shrink-0">
                        <CreditCard size={20} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-white leading-tight tracking-tight">
                          Download CV
                        </h2>
                        <p className="text-xs text-white/65 mt-0.5 max-w-[200px] truncate">
                          {cvName}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      disabled={isBusy}
                      className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors disabled:opacity-30 border border-white/20 flex-shrink-0"
                      aria-label="Close payment drawer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* â”€â”€ Body â”€â”€ */}
                <div className="px-5 pb-8 pt-5">
                  <AnimatePresence mode="wait">

                    {/* â”€â”€â”€ IDLE â”€â”€â”€ */}
                    {modalState === 'idle' && (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-4"
                      >
                        {/* File info row */}
                        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/40">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                            style={{ background: 'linear-gradient(135deg, #15750a, #116108)' }}
                          >
                            <FileText size={17} className="text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{cvName}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">PDF Document Â· One-time download</p>
                          </div>
                        </div>

                        {/* Price card */}
                        <div
                          className="rounded-2xl p-4 border border-accent-200 dark:border-accent-800/30"
                          style={{ background: 'linear-gradient(135deg, #f4fbf2 0%, #e5f6e2 100%)' }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-extrabold text-accent-600 uppercase tracking-widest mb-1">
                                One-time download fee
                              </p>
                              <p className="text-4xl font-black text-neutral-900 leading-none">
                                â‚¬1.50
                              </p>
                              <p className="text-xs text-neutral-500 mt-1.5">
                                Charged in â‚¦ at live rate via Paystack
                              </p>
                            </div>
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md border border-accent-200"
                              style={{ background: 'white' }}
                            >
                              <Sparkles size={22} className="text-accent-500" />
                            </div>
                          </div>
                        </div>

                        {/* Trust badges */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                            <ShieldCheck size={13} className="text-accent-500 flex-shrink-0" />
                            <span>256-bit SSL</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                            <Lock size={13} className="text-accent-500 flex-shrink-0" />
                            <span>Powered by Paystack</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                            <ShieldCheck size={13} className="text-accent-500 flex-shrink-0" />
                            <span>Secure checkout</span>
                          </div>
                        </div>

                        {/* CTA */}
                        <button
                          id="pay-download-btn"
                          onClick={handlePay}
                          className="w-full flex items-center justify-center gap-2.5 text-white font-extrabold py-4 rounded-2xl text-sm transition-all active:scale-[0.97]"
                          style={{
                            background: 'linear-gradient(135deg, #0e4f06 0%, #15750a 60%, #116108 100%)',
                            boxShadow: '0 8px 24px rgba(21, 117, 10, 0.38)',
                          }}
                        >
                          <CreditCard size={17} />
                          Pay &amp; Download Now â€” â‚¬1.50
                        </button>

                        <p className="text-center text-[11px] text-neutral-400 leading-relaxed">
                          Pay with card, bank transfer, or USSD.<br className="sm:hidden" />
                          {' '}Charged in â‚¦ equivalent to â‚¬1.50.
                        </p>
                      </motion.div>
                    )}

                    {/* â”€â”€â”€ INITIATING â”€â”€â”€ */}
                    {modalState === 'initiating' && (
                      <motion.div
                        key="initiating"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex flex-col items-center justify-center py-10 gap-4"
                      >
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                          style={{ background: 'linear-gradient(135deg, #e5f6e2, #cbedc6)' }}
                        >
                          <Loader2 size={28} className="text-accent-500 animate-spin" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">Preparing paymentâ€¦</p>
                          <p className="text-xs text-neutral-500 mt-1">Connecting to Paystack securely</p>
                        </div>
                      </motion.div>
                    )}

                    {/* â”€â”€â”€ POPUP OPEN â”€â”€â”€ */}
                    {modalState === 'popup_open' && (
                      <motion.div
                        key="popup_open"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex flex-col items-center justify-center py-8 gap-4"
                      >
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                          style={{ background: 'linear-gradient(135deg, #e5f6e2, #a3df9b)' }}
                        >
                          <CreditCard size={26} className="text-accent-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">Payment window open</p>
                          <p className="text-xs text-neutral-500 mt-1">Complete your payment in the Paystack popup</p>
                        </div>
                        {/* Pulsing dots */}
                        <div className="flex gap-1.5 mt-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 rounded-full bg-accent-400"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* â”€â”€â”€ VERIFYING â”€â”€â”€ */}
                    {modalState === 'verifying' && (
                      <motion.div
                        key="verifying"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex flex-col items-center justify-center py-10 gap-4"
                      >
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                          style={{ background: 'linear-gradient(135deg, #e5f6e2, #cbedc6)' }}
                        >
                          <ShieldCheck size={28} className="text-accent-500 animate-pulse" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">Verifying paymentâ€¦</p>
                          <p className="text-xs text-neutral-500 mt-1">Confirming with Paystack servers</p>
                        </div>
                      </motion.div>
                    )}

                    {/* â”€â”€â”€ DOWNLOADING â”€â”€â”€ */}
                    {modalState === 'downloading' && (
                      <motion.div
                        key="downloading"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex flex-col items-center justify-center py-10 gap-4"
                      >
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                          style={{ background: 'linear-gradient(135deg, #e5f6e2, #cbedc6)' }}
                        >
                          <Download size={28} className="text-accent-500 animate-bounce" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">Downloading your CVâ€¦</p>
                          <p className="text-xs text-neutral-500 mt-1">Preparing your PDF file</p>
                        </div>
                      </motion.div>
                    )}

                    {/* â”€â”€â”€ SUCCESS â”€â”€â”€ */}
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
                          className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl"
                          style={{ background: 'linear-gradient(135deg, #e5f6e2, #a3df9b)' }}
                        >
                          <CheckCircle2 size={38} className="text-accent-500" />
                        </motion.div>
                        <div className="text-center">
                          <p className="text-lg font-extrabold text-neutral-900 dark:text-white">Download complete!</p>
                          <p className="text-xs text-neutral-500 mt-1">Your CV has been saved to your device.</p>
                        </div>
                        <button
                          id="payment-done-btn"
                          onClick={handleClose}
                          className="mt-1 w-full py-3.5 text-white font-extrabold rounded-2xl text-sm transition-all active:scale-95"
                          style={{
                            background: 'linear-gradient(135deg, #0e4f06, #15750a)',
                            boxShadow: '0 6px 20px rgba(21, 117, 10, 0.3)',
                          }}
                        >
                          Done
                        </button>
                      </motion.div>
                    )}

                    {/* â”€â”€â”€ CANCELLED â”€â”€â”€ */}
                    {modalState === 'cancelled' && (
                      <motion.div
                        key="cancelled"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex flex-col items-center justify-center py-6 gap-4"
                      >
                        <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center border border-amber-100 dark:border-amber-800/30">
                          <X size={22} className="text-amber-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">Payment cancelled</p>
                          <p className="text-xs text-neutral-500 mt-1">You closed the payment window. No charge was made.</p>
                        </div>
                        <div className="flex gap-3 mt-1 w-full">
                          <button
                            onClick={handleClose}
                            className="flex-1 py-3.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            id="payment-retry-btn"
                            onClick={() => setModalState('idle')}
                            className="flex-1 py-3.5 text-white font-extrabold rounded-2xl text-sm transition-all active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #0e4f06, #15750a)' }}
                          >
                            Try Again
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* â”€â”€â”€ ERROR â”€â”€â”€ */}
                    {modalState === 'error' && (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex flex-col items-center justify-center py-5 gap-4"
                      >
                        <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center border border-red-100 dark:border-red-800/30">
                          <AlertTriangle size={22} className="text-red-500" />
                        </div>
                        <div className="text-center max-w-xs">
                          <p className="text-sm font-bold text-neutral-900 dark:text-white">Something went wrong</p>
                          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">{errorMessage}</p>
                        </div>
                        <div className="flex gap-3 mt-1 w-full">
                          <button
                            onClick={handleClose}
                            className="flex-1 py-3.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-2xl text-sm hover:bg-neutral-200 transition-colors"
                          >
                            Close
                          </button>
                          <button
                            id="payment-error-retry-btn"
                            onClick={handleRetry}
                            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white font-extrabold rounded-2xl text-sm transition-all active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #0e4f06, #15750a)' }}
                          >
                            <RefreshCw size={14} />
                            Retry
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-400 text-center leading-relaxed">
                          Money deducted but download failed? Email{' '}
                          <a href="mailto:support.qutahire@gmail.com" className="text-accent-500 hover:underline">
                            support.qutahire@gmail.com
                          </a>
                        </p>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
