import { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://quotahire-backend.onrender.com/api';

const GlitterParticle = ({ index }: { index: number }) => {
  const randomXStart = Math.random() * 100;
  const randomXEnd = randomXStart + (Math.random() - 0.5) * 20;
  const randomSize = Math.random() * 8 + 4;
  const randomDuration = Math.random() * 3 + 2.5;
  const randomDelay = Math.random() * 0.5;
  const randomRotate = Math.random() * 360;

  const colors = [
    '#FFD700', // Gold
    '#F59E0B', // Amber
    '#34D399', // Emerald
    '#60A5FA', // Blue
    '#A78BFA', // Purple
    '#F472B6', // Pink
    '#2DD4BF', // Teal
  ];
  const randomColor = colors[index % colors.length];

  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{
        width: randomSize,
        height: randomSize,
        backgroundColor: randomColor,
        left: `${randomXStart}%`,
        top: -20,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      }}
      initial={{ y: -20, opacity: 1, rotate: randomRotate }}
      animate={{
        y: '105vh',
        x: `${randomXEnd}%`,
        opacity: [1, 1, 0.9, 0],
        rotate: randomRotate + 1080,
      }}
      transition={{
        duration: randomDuration,
        delay: randomDelay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    />
  );
};

const GlitterShower = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 60 }).map((_, i) => (
        <GlitterParticle key={i} index={i} />
      ))}
    </div>
  );
};

export const VerifyEmail = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const location = useLocation();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const verifyToken = async () => {
      const queryParams = new URLSearchParams(location.search);
      const token = queryParams.get('token');

      if (!token) {
        setStatus('error');
        setErrorMessage('Verification link is missing the token. Please request a new verification email.');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-email/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Verification failed');
        }

        setStatus('success');
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(
          error?.message?.includes('expired')
            ? 'This verification link has expired. Please log in and request a new one.'
            : error?.message || 'Verification failed. The link may be invalid or already used.'
        );
      }
    };

    verifyToken();
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 font-body py-16 px-4">
      {status === 'success' && <GlitterShower />}
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">

          {/* Top accent bar */}
          <div className={`h-1.5 w-full transition-all duration-700 ${
            status === 'success'
              ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400'
              : status === 'error'
              ? 'bg-gradient-to-r from-red-400 to-orange-400'
              : 'bg-gradient-to-r from-accent-400 to-purple-400 animate-pulse'
          }`} />

          <div className="p-8 sm:p-10 text-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="w-14 h-14 mx-auto mb-6"
            >
              <Logo size={56} />
            </motion.div>

            <AnimatePresence mode="wait">
              {/* Loading */}
              {status === 'loading' && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5 py-4"
                >
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-accent-100 dark:border-accent-900/40" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-500 animate-spin" />
                    <div className="absolute inset-3 rounded-full flex items-center justify-center bg-accent-50 dark:bg-accent-900/20">
                      <Mail size={20} className="text-accent-500" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
                      Verifying your email…
                    </h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      This will only take a moment
                    </p>
                  </div>
                  <div className="flex justify-center gap-1.5">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-accent-400"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, delay: d, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Success */}
              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6"
                >
                  {/* Animated Success Icon with Pulse Rings */}
                  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5"
                      animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute -inset-3 rounded-full bg-emerald-500/5"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2.5, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                      className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 z-10"
                    >
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.6, ease: "easeInOut", delay: 0.3 }}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>
                  </div>

                  <div className="space-y-3">
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-extrabold text-neutral-900 dark:text-white"
                    >
                      Verified Successfully!
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto"
                    >
                      Your email has been verified successfully. You can now log in using the login button below.
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="pt-2"
                  >
                    <Link to="/login">
                      <button className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-emerald-500/35">
                        Log In Now
                        <ArrowRight size={18} />
                      </button>
                    </Link>
                  </motion.div>
                </motion.div>
              )}

              {/* Error */}
              {status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                    className="w-24 h-24 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-red-500/30"
                  >
                    <AlertTriangle size={44} className="text-white" strokeWidth={2} />
                  </motion.div>

                  <div>
                    <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-2">
                      Verification Failed
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {errorMessage}
                    </p>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/40 rounded-2xl p-4 text-left">
                    <p className="text-xs text-orange-700 dark:text-orange-400 font-semibold mb-1">What to do next:</p>
                    <ul className="text-xs text-orange-600 dark:text-orange-500 space-y-1">
                      <li>• Log in and request a new verification email</li>
                      <li>• Ensure the link was not modified or truncated</li>
                      <li>• Verification links expire after 24 hours</li>
                    </ul>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Link to="/login">
                      <button className="w-full flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold py-3.5 px-6 rounded-xl shadow-md transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5">
                        <RefreshCw size={16} />
                        Return to Login
                      </button>
                    </Link>
                    <Link to="/signup" className="text-sm text-neutral-500 hover:text-accent-500 dark:text-neutral-400 dark:hover:text-accent-400 font-medium transition-colors">
                      Create a new account instead
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400 dark:text-neutral-600 mt-6">
          © {new Date().getFullYear()} Quota Hire · All rights reserved
        </p>
      </motion.div>
    </div>
  );
};
