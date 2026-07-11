import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { GlassInput } from '../../components/ui/GlassInput';
import { ShaderAnimation } from '../../components/ui/ShaderAnimation';
import { Logo } from '../../components/ui/Logo';
import { useAppContext } from '../../context/AppContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { strictNoHtmlRegex, ERROR_MSGS } from '../../utils/security';

const loginSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .regex(strictNoHtmlRegex, ERROR_MSGS.NO_HTML),
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .regex(strictNoHtmlRegex, ERROR_MSGS.NO_HTML),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export const Login = () => {
  const [globalError, setGlobalError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithGoogle, currentUser } = useAppContext();
  const navigate = useNavigate();
  const googleInitRef = useRef(false);

  useEffect(() => {
    const initGoogleSignIn = () => {
      if (googleInitRef.current) return;
      const google = (window as any).google;
      if (google?.accounts?.id) {
        googleInitRef.current = true;
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          callback: async (response: any) => {
            try {
              setIsGoogleLoading(true);
              setGlobalError('');
              await loginWithGoogle(response.credential);
            } catch (err) {
              console.error("Google sign-in error", err);
            } finally {
              setIsGoogleLoading(false);
            }
          },
        });

        const parentElement = document.getElementById("google-signin-btn");
        if (parentElement) {
          const isDark = document.documentElement.classList.contains('dark');
          google.accounts.id.renderButton(parentElement, {
            theme: isDark ? "filled_black" : "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
          });
        }
      }
    };

    const google = (window as any).google;
    if (google?.accounts?.id) {
      initGoogleSignIn();
    } else {
      const interval = setInterval(() => {
        const g = (window as any).google;
        if (g?.accounts?.id) {
          initGoogleSignIn();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loginWithGoogle]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutTime > 0) {
      timer = setTimeout(() => setLockoutTime(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [lockoutTime]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        navigate('/admin');
      } else if (localStorage.getItem('needs_onboarding') === 'true' && !currentUser.setupCompleted) {
        navigate('/onboarding');
      } else {
        const savedCode = sessionStorage.getItem('redirect_job_code');
        if (savedCode) {
          sessionStorage.removeItem('redirect_job_code');
          navigate(`/jobs?code=${savedCode}`);
        } else {
          navigate('/dashboard');
        }
      }
    }
  }, [currentUser, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    if (lockoutTime > 0) return;
    setGlobalError('');
    try {
      await login(data.email, data.password);
      setFailedAttempts(0);
    } catch (error: any) {
      console.error(error);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 3) {
        setLockoutTime(30);
        setGlobalError('Too many failed attempts. Please wait 30 seconds.');
      } else {
        const msg = error.message || '';
        if (msg === 'No account found please sign up' || msg === 'Password incorrect') {
          setGlobalError(msg);
        } else {
          setGlobalError('An unexpected error occurred. Please try again.');
        }
      }
    }
  };

  const isLockedOut = lockoutTime > 0;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 font-body py-16 px-4">
      <ShaderAnimation isPaused={false} />
      {/* Subtle ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 via-transparent to-warm-500/10 pointer-events-none" />

      <Link
        to="/"
        className="fixed top-4 left-4 md:top-8 md:left-8 z-50 inline-flex items-center text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md px-4 py-2 rounded-full shadow-sm"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Home
      </Link>

      <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between relative z-10 w-full max-w-[1200px] mx-auto gap-8 lg:gap-16">

        {/* ── LEFT PANEL: 3D FIGURE (desktop only) ── */}
        <div className="hidden lg:flex flex-1 items-center justify-center relative z-20 pointer-events-none">
          <motion.img
            src={`${import.meta.env.BASE_URL}images/login_human_3d.png`}
            alt="Welcome Back Illustration"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="h-[540px] xl:h-[630px] w-auto object-contain drop-shadow-2xl animate-float"
          />
        </div>

        {/* ── LOGIN CARD ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md flex-shrink-0 relative z-10 lg:ml-auto"
        >
          <div className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/60 dark:border-white/10 p-8 sm:p-10 relative overflow-hidden pointer-events-auto">
            {isGoogleLoading && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
                <Loader2 size={40} className="animate-spin text-accent-600 dark:text-accent-400 mb-4" />
                <p className="text-neutral-900 dark:text-white font-bold animate-pulse">Verifying with Google...</p>
              </div>
            )}
            {/* Shine */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-[2.5rem]" />

            <div className="text-center mb-8 relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-16 h-16 mx-auto flex items-center justify-center mb-6 drop-shadow-md"
              >
                <Logo size={64} />
              </motion.div>
              <h1 className="text-2xl font-display font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">
                Secure Login
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                Enter your credentials to access your portal.
              </p>
            </div>

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

              <div className="space-y-6 pb-2">
                <GlassInput
                  label="Email Address"
                  icon={<Mail size={20} />}
                  type="email"
                  disabled={isLockedOut || isSubmitting}
                  {...register("email")}
                  error={errors.email?.message}
                />
                <GlassInput
                  label="Password"
                  icon={<Lock size={20} />}
                  type="password"
                  disabled={isLockedOut || isSubmitting}
                  {...register("password")}
                  error={errors.password?.message}
                />
              </div>

              <div className="flex items-center justify-between text-sm font-medium">
                <label className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <input
                      type="checkbox"
                      className="peer appearance-none w-5 h-5 border-2 border-neutral-300 dark:border-neutral-600 rounded bg-white/50 dark:bg-neutral-800/50 checked:bg-accent-500 checked:border-accent-500 transition-all"
                    />
                    <svg className="absolute w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || isLockedOut}
                className={`
                  w-full py-4 rounded-xl text-base font-bold text-white shadow-xl transition-all duration-300
                  ${isLockedOut
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 hover:shadow-accent-500/30 hover:-translate-y-0.5'
                  }
                `}
              >
                {isLockedOut ? (
                  <span className="flex items-center justify-center gap-2">
                    <Lock size={20} /> Try again in {lockoutTime}s
                  </span>
                ) : isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" /> Authenticating...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Google Login Divider */}
            <div className="relative my-6 text-center z-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300 dark:border-neutral-700 opacity-50"></div>
              </div>
              <span className="relative px-4 text-xs font-bold text-neutral-500 dark:text-neutral-400 bg-white/0 backdrop-blur-2xl">
                OR CONTINUE WITH
              </span>
            </div>

            {/* Custom Google Sign-In Button */}
            <button
              type="button"
              className="relative w-full py-4 rounded-xl flex items-center justify-center overflow-hidden mb-4 z-10 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-all duration-300 shadow-md"
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0 relative z-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="text-base font-bold text-neutral-800 dark:text-neutral-200 relative z-0">
                Continue with Google
              </span>

              {/* Invisible Google Standard Button Overlay (User actually clicks this) */}
              <div 
                id="google-signin-btn" 
                className="absolute inset-0 w-full h-full opacity-[0.01] z-10 flex items-center justify-center [&>div]:scale-[3] [&>div]:origin-center cursor-pointer" 
              />
            </button>

            <div className="mt-8 pt-6 border-t border-white/20 dark:border-white/5 relative z-10 text-center">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 transition-colors font-bold"
                >
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};