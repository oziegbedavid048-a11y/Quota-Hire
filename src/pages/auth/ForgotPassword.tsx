import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { GlassInput } from '../../components/ui/GlassInput';
import { useAppContext } from '../../context/AppContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { strictNoHtmlRegex, ERROR_MSGS } from '../../utils/security';

const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .regex(strictNoHtmlRegex, ERROR_MSGS.NO_HTML),
});
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword = () => {
  const [globalError, setGlobalError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { sendPasswordRecovery } = useAppContext();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setGlobalError('');
    try {
      await sendPasswordRecovery(data.email);
      setIsSuccess(true);
    } catch (error: any) {
      console.error(error);
      setGlobalError(error.message || 'Failed to send recovery email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 font-body py-16 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 via-transparent to-warm-500/10 pointer-events-none" />

      <Link
        to="/login"
        className="fixed top-4 left-4 md:top-8 md:left-8 z-50 inline-flex items-center text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md px-4 py-2 rounded-full shadow-sm"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Login
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/60 dark:border-white/10 p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-[2.5rem]" />

          <div className="text-center mb-8 relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-16 h-16 mx-auto flex items-center justify-center mb-6 drop-shadow-md"
            >
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-full h-full object-contain" />
            </motion.div>
            <h1 className="text-2xl font-display font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">
              Reset Password
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
              Enter your email to receive a password reset link.
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
              <AnimatePresence mode="wait">
                {globalError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-xl p-4 text-sm text-red-600 dark:text-red-400 font-bold flex items-start gap-3 shadow-inner">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>{globalError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <GlassInput
                label="Email Address"
                icon={<Mail size={20} />}
                type="email"
                disabled={isSubmitting}
                {...register("email")}
                error={errors.email?.message}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl text-base font-bold text-white shadow-xl transition-all duration-300 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 hover:shadow-accent-500/30 hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" /> Sending...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center relative z-10 space-y-6 py-4"
            >
              <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Check your inbox</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  We've sent a password recovery link to your email. Please click the link to reset your password.
                </p>
              </div>
              <Button
                onClick={() => setIsSuccess(false)}
                className="w-full py-4 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-xl font-bold transition-all"
              >
                Send again
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
