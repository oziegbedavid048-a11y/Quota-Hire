import { AnimatePresence, motion } from 'framer-motion';
import { Download, ExternalLink, Loader2, X } from 'lucide-react';
import { Portal } from '../../ui/Portal';

/** The confirmation the app shows before changing a candidate's status. */
export const StatusConfirmDialog = ({
  copy,
  busy,
  onCancel,
  onConfirm,
}: {
  copy: { name: string; from: string; to: string; destructive: boolean } | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <Portal>
  <AnimatePresence>
    {copy && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
          onClick={busy ? undefined : onCancel}
        />
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="status-confirm-title"
          initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-xl ring-1 ring-slate-900/5 dark:ring-white/10"
        >
          <h2 id="status-confirm-title" className="text-base font-extrabold text-slate-900 dark:text-white">
            Update Application Status
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
            You are changing {copy.name}'s application status from "{copy.from}" to "{copy.to}".
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
            An automated email notification will be sent to the applicant immediately.
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
            Are you sure you want to proceed?
          </p>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-70 ${
                copy.destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-accent-500 hover:bg-accent-600'
              }`}
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              Confirm Update
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  </Portal>
);

/** Full-screen CV viewer, the web counterpart of the app's in-app viewer. */
export const ResumeViewer = ({ url, name, onClose }: { url: string | null; name?: string; onClose: () => void }) => (
  <Portal>
  <AnimatePresence>
    {url && (
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Candidate CV"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.2 }}
        // Above the toast layer (sonner renders at z-index 999999999). A toast
        // raised just before opening, such as a shortlist confirmation, would
        // otherwise sit over the close and download buttons in the corner.
        className="fixed inset-0 z-[1000000000] flex flex-col bg-white dark:bg-neutral-950"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-neutral-800">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">Candidate Resume / CV</p>
            {name && <p className="text-xs text-slate-500 truncate">{name}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Open CV in a new tab"
            >
              <ExternalLink size={18} />
            </a>
            <a
              href={url}
              download={`${(name || 'candidate').replace(/[^a-z0-9]+/gi, '_')}_CV.pdf`}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Download CV"
            >
              <Download size={18} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Close CV"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <iframe title="Candidate CV" src={url} className="flex-1 w-full bg-slate-100 dark:bg-neutral-900" />
      </motion.div>
    )}
  </AnimatePresence>
  </Portal>
);
