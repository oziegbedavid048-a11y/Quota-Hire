import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';

/**
 * Shown when someone opens a job application before their profile is finished.
 *
 * Deliberately not a warning. Nothing has gone wrong and nothing is at risk —
 * there are simply a couple of sections left to fill, so the tone is a quiet
 * note rather than an alert. The earlier version used an amber triangle on an
 * amber panel, which read as a threat for what is really just a next step.
 *
 * The list shows every required section with the finished ones ticked, so the
 * applicant sees how close they are instead of only what is wrong. Labels match
 * the profile page cards exactly, so "Skills & Expertise" here is the card of
 * the same name there.
 */
interface Requirement {
  label: string;
  filled: boolean;
}

interface IncompleteProfileModalProps {
  open: boolean;
  onClose: () => void;
  /** Full checklist, finished and unfinished, from getProfileCompletion(). */
  requirements?: Requirement[];
  /** Labels still outstanding — used when the full list is not supplied. */
  missing?: string[];
}

export function IncompleteProfileModal({
  open,
  onClose,
  requirements,
  missing = [],
}: IncompleteProfileModalProps) {
  const navigate = useNavigate();

  const items: Requirement[] =
    requirements && requirements.length > 0
      ? requirements
      : missing.map((label) => ({ label, filled: false }));

  const remaining = items.filter((i) => !i.filled).length;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[3px]"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-progress-title"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="relative w-full max-w-[380px] bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-xl ring-1 ring-neutral-900/5 dark:ring-white/10"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-3.5 right-3.5 p-1 rounded-md text-neutral-300 hover:text-neutral-500 dark:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
            >
              <X size={16} />
            </button>

            <h2
              id="profile-progress-title"
              className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight"
            >
              Almost ready to apply
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {remaining === 1
                ? 'One more section and your profile is ready.'
                : `${remaining} sections left before you can apply.`}
            </p>

            <ul className="mt-5 space-y-2.5">
              {items.map(({ label, filled }) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      filled
                        ? 'bg-accent-500 text-white'
                        : 'border border-dashed border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {filled && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span
                    className={
                      filled
                        ? 'text-neutral-400 dark:text-neutral-600 line-through decoration-neutral-200 dark:decoration-neutral-700'
                        : 'text-neutral-700 dark:text-neutral-200 font-medium'
                    }
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/employee/profile');
              }}
              className="mt-6 w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
            >
              Finish my profile
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full py-2 rounded-xl text-sm font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              Maybe later
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
