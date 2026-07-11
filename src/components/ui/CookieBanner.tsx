import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, ShieldCheck, BarChart2 } from 'lucide-react';
import posthog from 'posthog-js';

const CONSENT_KEY = 'qh_cookie_consent';

type ConsentState = 'accepted' | 'declined' | null;

export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentState | null;
    if (stored === 'accepted') {
      // Restore consent on every page load
      posthog.opt_in_capturing();
    } else if (stored === 'declined') {
      posthog.opt_out_capturing();
    } else {
      // No stored preference — show the banner after a short delay
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Allow other parts of the app to open the banner again (e.g., footer "Cookie settings" link)
  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener('qh:open-cookie-banner', handler);
    return () => window.removeEventListener('qh:open-cookie-banner', handler);
  }, []);

  const handleAccept = () => {
    posthog.opt_in_capturing();
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    posthog.opt_out_capturing();
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="cookie-consent-banner"
          role="dialog"
          aria-label="Cookie consent"
          aria-modal="false"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed bottom-5 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2"
        >
          {/* Glass card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/80 shadow-2xl backdrop-blur-xl dark:bg-neutral-950/85">
            {/* Accent gradient strip at top */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent-400 via-accent-500 to-accent-600" />

            <div className="px-5 py-5 sm:px-6">
              {/* Header row */}
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-500/20 text-accent-400">
                  <Cookie size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">
                    We use analytics cookies 🍪
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                    QuotaHire uses{' '}
                    <a
                      href="https://posthog.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-accent-400 transition-colors"
                    >
                      PostHog
                    </a>{' '}
                    to understand how visitors use the site — no ads, no
                    third-party selling. Accepting helps us improve the product.
                    You can change your mind at any time via the footer.
                  </p>
                </div>

                {/* Dismiss button (treated as decline) */}
                <button
                  id="cookie-banner-dismiss"
                  onClick={handleDecline}
                  aria-label="Dismiss and decline cookies"
                  className="ml-2 shrink-0 rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Feature pills */}
              <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                <span className="flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800/60 px-3 py-1 text-neutral-300">
                  <BarChart2 size={11} className="text-accent-400" />
                  Usage analytics only
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-800/60 px-3 py-1 text-neutral-300">
                  <ShieldCheck size={11} className="text-accent-400" />
                  No ads or data selling
                </span>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  id="cookie-banner-decline"
                  onClick={handleDecline}
                  className="w-full rounded-xl border border-neutral-700 bg-transparent px-5 py-2.5 text-sm font-medium text-neutral-300 transition-all hover:border-neutral-500 hover:text-white sm:w-auto"
                >
                  Decline
                </button>
                <button
                  id="cookie-banner-accept"
                  onClick={handleAccept}
                  className="w-full rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-all hover:bg-accent-600 hover:shadow-accent-600/30 sm:w-auto"
                >
                  Accept analytics
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Programmatically re-open the banner.
 * Use this from your footer "Cookie settings" link so users can change their mind.
 *
 * Example:
 *   import { openCookieBanner } from '../ui/CookieBanner';
 *   <button onClick={openCookieBanner}>Cookie settings</button>
 */
export const openCookieBanner = () => {
  // Clear stored preference so the banner shows fresh
  localStorage.removeItem('qh_cookie_consent');
  window.dispatchEvent(new Event('qh:open-cookie-banner'));
};
