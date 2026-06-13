import { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';


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
        // Use Django backend for custom email verification
        const res = await fetch(`${(import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api'}/auth/verify-email/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
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
      <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 via-transparent to-warm-500/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10 text-center"
      >
        <div className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/60 dark:border-white/10 p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-[2.5rem]" />

          <div className="relative z-10 space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-16 h-16 mx-auto flex items-center justify-center mb-6"
            >
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
            </motion.div>

            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="w-12 h-12 text-accent-500 animate-spin" />
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Verifying your email...</h2>
              </div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="w-20 h-20 bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Email Verified!</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-8">
                    Your email address has been successfully verified. You can now access all features of Quota Hire.
                  </p>
                </div>
                <Link to="/login" className="block">
                  <Button className="w-full py-4 rounded-xl text-base font-bold text-white shadow-xl transition-all duration-300 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 hover:shadow-accent-500/30 hover:-translate-y-0.5">
                    Continue to Login
                  </Button>
                </Link>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <AlertTriangle size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Verification Failed</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-8">
                    {errorMessage}
                  </p>
                </div>
                <Link to="/login" className="block">
                  <Button className="w-full py-4 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-xl font-bold transition-all">
                    Return to Login
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
