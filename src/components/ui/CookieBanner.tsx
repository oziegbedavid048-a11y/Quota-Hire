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
      posthog.opt_in_capturing();
    } else if (stored === 'declined') {
      posthog.opt_out_capturing();
    } else {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

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
          initial={{ y: '110%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '110%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className={[
            'fixed z-[9999]',
            'bottom-0 left-0 right-0',
            'sm:bottom-4 sm:left-auto sm:right-4',
            'p-3 sm:p-0',
            'w-full sm:w-[360px] sm:max-w-[calc(100vw-2rem)]',
          ].join(' ')}
        >
          {/* Card — styled with the website's exact background colors & gradient */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#fffbeb]/95 to-[#f4fbf2]/95 dark:from-[#1c1508]/95 dark:to-[#050f03]/95 backdrop-blur-md border border-[#e5f6e2] dark:border-accent-950/40 shadow-elevated">
            
            {/* Accent top gradient line */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-accent-400 to-accent-600" />

            {/* Absolute close button to maximize horizontal space for text on mobile */}
            <button
              id="cookie-banner-dismiss"
              onClick={handleDecline}
              aria-label="Dismiss and decline cookies"
              className="absolute top-3 right-3 rounded-lg p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-white/5 transition-colors"
            >
              <X size={14} />
            </button>

            <div className="p-4 pt-5 sm:p-5 sm:pt-6">
              
              {/* Content Header */}
              <div className="flex items-start gap-3 pr-6">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-100/55 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400">
                  <Cookie size={16} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white leading-snug">
                    We value your privacy 🍪
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                    We use{' '}
                    <a
                      href="https://posthog.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-600 dark:text-accent-400 hover:underline font-medium underline-offset-2"
                    >
                      PostHog
                    </a>{' '}
                    analytics to improve QuotaHire — no ads, no data selling.
                    Change choice anytime in footer.
                  </p>
                </div>
              </div>

              {/* Badges/Pills */}
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-50/70 dark:bg-accent-900/20 border border-accent-100/60 dark:border-accent-800 text-accent-700 dark:text-accent-300 px-2 py-0.5 text-[10px] font-medium">
                  <BarChart2 size={9} />
                  Analytics only
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-50/70 dark:bg-accent-900/20 border border-accent-100/60 dark:border-accent-800 text-accent-700 dark:text-accent-300 px-2 py-0.5 text-[10px] font-medium">
                  <ShieldCheck size={9} />
                  No data selling
                </span>
              </div>

              {/* Actions: Stacks on very small viewports (<350px) to prevent button compression */}
              <div className="mt-4 flex flex-col min-[350px]:flex-row gap-2">
                <button
                  id="cookie-banner-decline"
                  onClick={handleDecline}
                  className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all text-center"
                >
                  Decline
                </button>
                <button
                  id="cookie-banner-accept"
                  onClick={handleAccept}
                  className="flex-1 rounded-xl bg-accent-600 hover:bg-accent-700 px-3 py-2 text-xs font-semibold text-white shadow-sm active:scale-95 transition-all text-center"
                >
                  Accept
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
 * Re-open the cookie banner (e.g. from a footer "Cookie settings" link).
 * Clears the stored preference so the user can change their choice.
 */
export const openCookieBanner = () => {
  localStorage.removeItem('qh_cookie_consent');
  window.dispatchEvent(new Event('qh:open-cookie-banner'));
};
