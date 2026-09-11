import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';

/**
 * Shown when someone tries to apply for a job with an unfinished profile.
 *
 * This replaces two things: a toast that said only "your profile is missing
 * details", and a scrolling banner across every dashboard page. Neither said
 * what was actually missing, and both were driven by a percentage that could
 * never reach 100 — so people were told to fix a profile that was already
 * complete. Here the outstanding sections are listed by name, with one button
 * that goes straight to them.
 */
interface IncompleteProfileModalProps {
  open: boolean;
  onClose: () => void;
  /** Section names still to fill in, from getProfileCompletion(). */
  missing: string[];
}

export function IncompleteProfileModal({ open, onClose, missing }: IncompleteProfileModalProps) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="incomplete-profile-title"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-neutral-200 dark:border-neutral-800"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5">
              <AlertTriangle size={26} />
            </div>

            <h2
              id="incomplete-profile-title"
              className="text-xl sm:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-2"
            >
              Complete your profile to apply
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">
              Employers see your full profile with every application, so it needs to be
              finished before you can apply. You still need to add:
            </p>

            {missing.length > 0 && (
              <ul className="space-y-2 mb-6">
                {missing.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200"
                  >
                    <span
                      aria-hidden="true"
                      className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="sm:w-1/3 py-3 rounded-xl font-bold text-sm text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/employee/profile');
                }}
                className="sm:w-2/3 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-accent-600 hover:bg-accent-700 shadow-lg shadow-accent-500/25 transition"
              >
                Complete my profile
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
