/**
 * PaymentModal -- Bottom Drawer
 * Minimal design, brand green accent on CTA only.
 * Uses JS unicode escapes to avoid encoding issues.
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShieldCheck, CreditCard, Download,
  Loader2, AlertTriangle, CheckCircle2, RefreshCw, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, ApiError } from "../../context/AppContext";
import { openPaystackPopup } from "../../lib/paystack";

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvId: number;
  cvName: string;
  userEmail: string;
  isPaid?: boolean;
}

type ModalState =
  | "idle" | "initiating" | "popup_open"
  | "verifying" | "downloading" | "success"
  | "cancelled" | "error";

export function PaymentModal({ isOpen, onClose, cvId, cvName, userEmail, isPaid }: PaymentModalProps) {
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [currentReference, setCurrentReference] = useState("");

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);


  const setError = (msg: string) => { setErrorMessage(msg); setModalState("error"); };

  const downloadWithToken = useCallback(async (token: string) => {
    setModalState("downloading");
    try {
      const authToken = localStorage.getItem("access_token");
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const resp = await fetch(`${API_BASE}/cv/${cvId}/download/?token=${encodeURIComponent(token)}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        setError(body?.error === "token_expired"
          ? "Your download link expired (10 min). Click Retry to get a new one."
          : (body?.message || "Download failed. Please try again."));
        return;
      }
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cvName.replace(/\s+/g, "_")}_${cvId}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setModalState("success");
      toast.success("CV downloaded successfully!");
    } catch { setError("A network error occurred. Please try again."); }
  }, [cvId, cvName]);

  const verifyAndDownload = useCallback(async (reference: string) => {
    setModalState("verifying");
    try {
      const result = await apiFetch("/payments/verify/", { method: "POST", body: JSON.stringify({ reference }) });
      if (result?.download_token) { await downloadWithToken(result.download_token); }
      else { setError("Verification succeeded but no download token returned. Contact support."); }
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { error?: string; message?: string } };
      const code = e?.data?.error || "";
      const msg = e?.data?.message || "Payment verification failed. Please try again.";
      if (e?.status === 402) {
        if (code === "payment_not_successful") setError("Payment was not completed. Please try again.");
        else if (code === "amount_mismatch") setError("Payment amount mismatch. Contact support if charged.");
        else setError(msg);
      } else { setError(msg); }
    }
  }, [downloadWithToken]);

  const handlePay = useCallback(async () => {
    setModalState("initiating"); setErrorMessage("");
    try {
      const result = await apiFetch("/payments/initiate/", { method: "POST", body: JSON.stringify({ cv_id: cvId }) });
      if (result?.already_paid && result?.download_token) {
        toast.info("You already paid. Downloading now...");
        await downloadWithToken(result.download_token); return;
      }
      const { reference, access_code } = result;
      if (!reference || !access_code) { setError("Failed to initiate payment. Please try again."); return; }
      setCurrentReference(reference); setModalState("popup_open");
      await openPaystackPopup({
        email: userEmail,
        accessCode: access_code,
        onSuccess: async () => { await verifyAndDownload(reference); },
        onClose: () => { setModalState("cancelled"); },
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError("The CV document could not be found. It may have been deleted.");
        } else if (err.status >= 500) {
          setError("The server is currently unavailable or waking up from sleep. Please wait 30 seconds and try again.");
        } else if (err.status === 0) {
          setError("Network issue detected. Please check your internet connection.");
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    }
  }, [cvId, cvName, userEmail, downloadWithToken, verifyAndDownload]);

  // Auto-trigger if already paid
  useEffect(() => {
    if (isOpen && isPaid && modalState === "idle") {
      handlePay();
    }
  }, [isOpen, isPaid, modalState, handlePay]);

  const handleRetry = useCallback(async () => {
    if (currentReference && modalState === "error") { await verifyAndDownload(currentReference); }
    else { setModalState("idle"); setErrorMessage(""); }
  }, [currentReference, modalState, verifyAndDownload]);

  const handleClose = () => {
    if (["initiating", "verifying", "downloading"].includes(modalState)) return;
    setModalState("idle"); setErrorMessage(""); setCurrentReference(""); onClose();
  };

  const isBusy = ["initiating", "verifying", "downloading"].includes(modalState);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            key="drawer"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 w-full"
          >
            <div className="w-full">
              <div className="flex justify-center pb-2 pt-2">
                <div className="w-9 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-t-3xl overflow-hidden border-t border-neutral-200 dark:border-neutral-800 shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center">
                      <CreditCard size={17} className="text-accent-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Download CV</p>
                      <p className="text-xs text-neutral-400 truncate max-w-[160px]">{cvName}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose} disabled={isBusy}
                    className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-30"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Body */}
                <div className="px-5 pt-4 pb-7" style={{ paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom))' }}>
                  <AnimatePresence mode="wait">

                    {/* IDLE */}
                    {modalState === "idle" && (
                      <motion.div key="idle"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
                        className="space-y-4"
                      >
                        {/* Price row */}
                        <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                          <div>
                            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">One-time fee</p>
                            <p className="text-2xl font-black text-neutral-900 dark:text-white">{'\u20AC'}1.50</p>
                            <p className="text-[11px] text-neutral-400 mt-0.5">Charged in {'\u20A6'} at live rate</p>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center">
                            <Download size={20} className="text-accent-500" />
                          </div>
                        </div>

                        {/* Trust row */}
                        <div className="flex items-center gap-4 px-1">
                          <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                            <ShieldCheck size={12} className="text-accent-500" />256-bit SSL
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                            <Lock size={12} className="text-accent-500" />Paystack
                          </span>
                        </div>

                        {/* CTA */}
                        <button
                          id="pay-download-btn"
                          onClick={handlePay}
                          className="w-full py-3.5 rounded-2xl text-white text-sm font-bold transition-all active:scale-[0.98]"
                          style={{ background: "linear-gradient(135deg,#0e4f06,#15750a)", boxShadow: "0 6px 20px rgba(21,117,10,0.28)" }}
                        >
                          Pay {'\u20AC'}1.50 &amp; Download
                        </button>

                        <p className="text-center text-[10px] text-neutral-400">
                          Card, bank transfer, or USSD accepted
                        </p>
                      </motion.div>
                    )}

                    {/* INITIATING */}
                    {modalState === "initiating" && (
                      <motion.div key="initiating"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-8 gap-3"
                      >
                        <Loader2 size={32} className="text-accent-500 animate-spin" />
                        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          {isPaid ? "Preparing download..." : "Preparing payment..."}
                        </p>
                      </motion.div>
                    )}

                    {/* POPUP OPEN */}
                    {modalState === "popup_open" && (
                      <motion.div key="popup_open"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-8 gap-3"
                      >
                        <CreditCard size={32} className="text-accent-500" />
                        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Payment window open</p>
                        <p className="text-xs text-neutral-400">Complete payment in the Paystack popup</p>
                        <div className="flex gap-1.5 mt-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-accent-400"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* VERIFYING */}
                    {modalState === "verifying" && (
                      <motion.div key="verifying"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-8 gap-3"
                      >
                        <ShieldCheck size={32} className="text-accent-500 animate-pulse" />
                        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Verifying payment...</p>
                      </motion.div>
                    )}

                    {/* DOWNLOADING */}
                    {modalState === "downloading" && (
                      <motion.div key="downloading"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-8 gap-3"
                      >
                        <Download size={32} className="text-accent-500 animate-bounce" />
                        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Downloading your CV...</p>
                      </motion.div>
                    )}

                    {/* SUCCESS */}
                    {modalState === "success" && (
                      <motion.div key="success"
                        initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-7 gap-3"
                      >
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ type: "spring", damping: 14, stiffness: 220 }}
                          className="w-14 h-14 rounded-full bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center"
                        >
                          <CheckCircle2 size={28} className="text-accent-500" />
                        </motion.div>
                        <p className="text-base font-bold text-neutral-900 dark:text-white">Download complete!</p>
                        <p className="text-xs text-neutral-400">Your CV has been saved to your device.</p>
                        <button id="payment-done-btn" onClick={handleClose}
                          className="mt-1 px-8 py-2.5 rounded-2xl text-white text-sm font-bold"
                          style={{ background: "linear-gradient(135deg,#0e4f06,#15750a)" }}
                        >Done</button>
                      </motion.div>
                    )}

                    {/* CANCELLED */}
                    {modalState === "cancelled" && (
                      <motion.div key="cancelled"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex flex-col items-center py-6 gap-3"
                      >
                        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                          <X size={20} className="text-amber-500" />
                        </div>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Payment cancelled</p>
                        <p className="text-xs text-neutral-400">No charge was made.</p>
                        <div className="flex gap-2.5 w-full mt-1">
                          <button onClick={handleClose}
                            className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 transition-colors"
                          >Close</button>
                          <button id="payment-retry-btn" onClick={() => setModalState("idle")}
                            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white"
                            style={{ background: "linear-gradient(135deg,#0e4f06,#15750a)" }}
                          >Try Again</button>
                        </div>
                      </motion.div>
                    )}

                    {/* ERROR */}
                    {modalState === "error" && (
                      <motion.div key="error"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex flex-col items-center py-5 gap-3"
                      >
                        <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                          <AlertTriangle size={20} className="text-red-500" />
                        </div>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Something went wrong</p>
                        <p className="text-xs text-neutral-400 text-center leading-relaxed max-w-[240px]">{errorMessage}</p>
                        <div className="flex gap-2.5 w-full mt-1">
                          <button onClick={handleClose}
                            className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 transition-colors"
                          >Close</button>
                          <button id="payment-error-retry-btn" onClick={handleRetry}
                            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-bold text-white"
                            style={{ background: "linear-gradient(135deg,#0e4f06,#15750a)" }}
                          >
                            <RefreshCw size={13} />Retry
                          </button>
                        </div>
                        <p className="text-[10px] text-neutral-400 text-center">
                          Money deducted?{" "}
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