import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User, Building, Loader2, AlertTriangle, Phone, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { GlassInput } from '../../components/ui/GlassInput';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
import { ShaderAnimation } from '../../components/ui/ShaderAnimation';
import { Logo } from '../../components/ui/Logo';
import { useAppContext } from '../../context/AppContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { strictNoHtmlRegex, strictNameRegex, ERROR_MSGS } from '../../utils/security';

const signupSchema = z.object({
  role: z.enum(['employee', 'company']),
  firstName: z.string().regex(strictNameRegex, ERROR_MSGS.INVALID_NAME).or(z.literal('')),
  lastName: z.string().regex(strictNameRegex, ERROR_MSGS.INVALID_NAME).or(z.literal('')),
  companyName: z.string().regex(strictNameRegex, ERROR_MSGS.INVALID_NAME).or(z.literal('')),
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .regex(strictNoHtmlRegex, ERROR_MSGS.NO_HTML),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(strictNoHtmlRegex, ERROR_MSGS.NO_HTML),
  passwordConfirm: z.string()
    .min(1, "Please confirm your password")
    .regex(strictNoHtmlRegex, ERROR_MSGS.NO_HTML),
}).superRefine((data, ctx) => {
  if (data.role === 'employee') {
    if (!data.firstName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "First name is required",
        path: ["firstName"]
      });
    }
    if (!data.lastName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Last name is required",
        path: ["lastName"]
      });
    }
  } else {
    if (!data.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Company name is required",
        path: ["companyName"]
      });
    }
  }
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords do not match",
  path: ["passwordConfirm"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export const Signup = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRole = (queryParams.get('role') as 'employee' | 'company') || 'employee';

  const [globalError, setGlobalError] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [step, setStep] = useState(1);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { register: registerUser, loginWithGoogle, currentUser } = useAppContext();
  const navigate = useNavigate();
  const googleInitRef = useRef(false);

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors, isSubmitting } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: initialRole,
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      phone: '',
      city: '',
      country: '',
      password: '',
      passwordConfirm: '',
    }
  });

  const watchRole = watch("role");
  const watchPassword = watch("password");

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') navigate('/admin');
      else navigate('/onboarding');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const initGoogleSignUp = () => {
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
              await loginWithGoogle(response.credential, watchRole);
            } catch (err) {
              console.error("Google sign-up error", err);
            } finally {
              setIsGoogleLoading(false);
            }
          },
        });

        const parentElement = document.getElementById("google-signup-btn");
        if (parentElement) {
          const isDark = document.documentElement.classList.contains('dark');
          google.accounts.id.renderButton(parentElement, {
            theme: isDark ? "filled_black" : "outline",
            size: "large",
            text: "signup_with",
            shape: "rectangular",
            logo_alignment: "left",
          });
        }
      }
    };

    const google = (window as any).google;
    if (google?.accounts?.id) {
      initGoogleSignUp();
    } else {
      const interval = setInterval(() => {
        const g = (window as any).google;
        if (g?.accounts?.id) {
          initGoogleSignUp();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loginWithGoogle, watchRole]);

  const handleNextStep = async () => {
    const fieldsToValidate = watchRole === 'employee' 
      ? ['firstName', 'lastName', 'email', 'phone'] 
      : ['companyName', 'email', 'phone'];
    
    // @ts-ignore
    const isStep1Valid = await trigger(fieldsToValidate);
    
    if (isStep1Valid) {
      setStep(2);
    }
  };

  const onSubmit = async (data: SignupFormValues) => {
    setGlobalError('');
    try {
      const finalName = data.role === 'company'
        ? data.companyName
        : `${data.firstName} ${data.lastName}`.trim();

      await registerUser({
        name: finalName as string,
        email: data.email,
        password: data.password,
        password2: data.passwordConfirm,
        role: data.role,
        phone: data.phone,
        city: data.city,
        country: data.country
      });

      // Show verification modal
      setShowVerificationModal(true);
    } catch (error: any) {
      console.error(error);
      const msg = error.message || '';
      if (msg.toLowerCase().includes('already exists')) {
        setGlobalError('An account with this email already exists.');
      } else {
        setGlobalError('Registration failed. Please try again.');
      }
    }
  };

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

      <div className="flex flex-col lg:flex-row items-center justify-center relative z-10 w-full max-w-[1200px] mx-auto">

        {/* ── SIGNUP CARD ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg flex-shrink-0 relative z-10"
        >
          <div className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/60 dark:border-white/10 p-5 sm:p-8 relative overflow-hidden">
            {isGoogleLoading && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm">
                <Loader2 size={40} className="animate-spin text-accent-600 dark:text-accent-400 mb-4" />
                <p className="text-neutral-900 dark:text-white font-bold animate-pulse">Verifying with Google...</p>
              </div>
            )}
            {/* Shine */}
            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-[2.5rem]" />

            {/* Header */}
            <div className="text-center mb-5 sm:mb-8 relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-14 h-14 sm:w-16 sm:h-16 mx-auto flex items-center justify-center mb-4 sm:mb-6 drop-shadow-md"
              >
                <Logo size={60} />
              </motion.div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-1 sm:mb-2 tracking-tight">
                Create an account
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                Join the premier network for sales professionals.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 relative z-10">
              <AnimatePresence mode="wait">
                {globalError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-red-600 dark:text-red-400 font-bold flex items-start gap-3 shadow-inner mb-1">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
                      <p>{globalError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Role Switcher */}
              <div className="flex p-1 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/10 shadow-inner relative">
                <button
                  type="button"
                  onClick={() => setValue('role', 'employee')}
                  className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl transition-all z-10 flex justify-center items-center gap-1 sm:gap-2 ${
                    watchRole === 'employee'
                      ? 'text-accent-700 dark:text-white'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <User size={15} />
                  <span className="hidden sm:inline">I'm looking for a job</span>
                  <span className="sm:hidden">Job Seeker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('role', 'company')}
                  className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl transition-all z-10 flex justify-center items-center gap-1 sm:gap-2 ${
                    watchRole === 'company'
                      ? 'text-accent-700 dark:text-white'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <Building size={15} />
                  <span className="hidden sm:inline">I'm hiring</span>
                  <span className="sm:hidden">Hiring</span>
                </button>
                <div
                  className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-white dark:bg-accent-600 rounded-xl shadow-md transition-transform duration-300 ease-out border border-white/50 dark:border-accent-500"
                  style={{ transform: watchRole === 'employee' ? 'translateX(0)' : 'translateX(calc(100% + 0.25rem))' }}
                />
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 sm:space-y-5"
                  >
                    {watchRole === 'company' ? (
                      <GlassInput
                        label="Company Name"
                        icon={<Building size={20} />}
                        {...register("companyName")}
                        error={errors.companyName?.message}
                        disabled={isSubmitting}
                      />
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                        <div className="flex-1">
                          <GlassInput
                            label="First Name"
                            icon={<User size={20} />}
                            {...register("firstName")}
                            error={errors.firstName?.message}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="flex-1">
                          <GlassInput
                            label="Last Name"
                            icon={<User size={20} />}
                            {...register("lastName")}
                            error={errors.lastName?.message}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    )}

                    <GlassInput
                      label="Email Address"
                      icon={<Mail size={20} />}
                      type="email"
                      {...register("email")}
                      error={errors.email?.message}
                      disabled={isSubmitting}
                    />

                    <GlassInput
                      label="Phone Number"
                      icon={<Phone size={20} />}
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      {...register("phone")}
                      disabled={isSubmitting}
                    />

                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full py-3.5 sm:py-4 mt-4 sm:mt-6 rounded-xl text-sm sm:text-base font-bold text-white shadow-xl transition-all duration-300 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 hover:shadow-accent-500/30 hover:-translate-y-0.5"
                    >
                      Continue
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 sm:space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                      <div className="flex-1">
                        <GlassInput
                          label="City"
                          icon={<MapPin size={20} />}
                          type="text"
                          placeholder="e.g. New York"
                          {...register("city")}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="flex-1">
                        <GlassInput
                          label="Country"
                          icon={<MapPin size={20} />}
                          type="text"
                          placeholder="e.g. United States"
                          {...register("country")}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                      <div className="flex-1">
                        <GlassInput
                          label="Password"
                          icon={<Lock size={20} />}
                          type="password"
                          {...register("password")}
                          error={errors.password?.message}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="flex-1">
                        <GlassInput
                          label="Confirm Password"
                          icon={<Lock size={20} />}
                          type="password"
                          {...register("passwordConfirm")}
                          error={errors.passwordConfirm?.message}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {watchPassword && (
                      <PasswordStrengthMeter password={watchPassword} />
                    )}

                    <div className="flex gap-3 mt-4 sm:mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="w-1/3 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-bold"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-2/3 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-bold text-white shadow-xl transition-all duration-300 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 hover:shadow-accent-500/30 hover:-translate-y-0.5"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 size={20} className="animate-spin" /> Creating account...
                          </span>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* Google Signup Divider */}
            <div className="relative my-6 text-center z-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300 dark:border-neutral-700 opacity-50"></div>
              </div>
              <span className="relative px-4 text-xs font-bold text-neutral-500 dark:text-neutral-400 bg-white/0 backdrop-blur-2xl">
                OR SIGN UP WITH
              </span>
            </div>

            {/* Custom Google Sign-Up Button */}
            <button
              type="button"
              className="relative w-full py-3.5 sm:py-4 rounded-xl flex items-center justify-center overflow-hidden mb-4 z-10 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-all duration-300 shadow-md"
            >
              <svg className="w-5 h-5 mr-3 flex-shrink-0 relative z-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="text-sm sm:text-base font-bold text-neutral-800 dark:text-neutral-200 relative z-0">
                Sign up with Google
              </span>
              <div 
                id="google-signup-btn" 
                className="absolute inset-0 w-full h-full opacity-[0.01] z-10 flex items-center justify-center [&>div]:scale-[3] [&>div]:origin-center cursor-pointer" 
              />
            </button>

            <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-white/20 dark:border-white/5 relative z-10 text-center">
              <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 transition-colors font-bold"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT PANEL: 3D FIGURE + TEXT (desktop only) ── */}
        <div className="hidden lg:flex flex-row items-center justify-start relative z-20 pointer-events-none -ml-12 xl:-ml-20">
          <motion.img
            src={`${import.meta.env.BASE_URL}images/signup_human_3d.png`}
            alt="Sign Up Illustration"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="h-[540px] xl:h-[630px] w-auto object-contain drop-shadow-2xl animate-float flex-shrink-0"
          />
          
        </div>

      </div>

      {/* Verification Modal */}
      <AnimatePresence>
        {showVerificationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
              onClick={() => navigate('/login')}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center"
            >
              <div className="w-20 h-20 bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Mail size={40} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-3">Check your email</h2>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
                We've sent a confirmation link to your email address. Please click the link to verify your account before logging in. 
                <br /><br />
                <span className="font-bold text-red-500 dark:text-red-400">Please check your spam folder if it is not in your inbox.</span>
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full py-4 rounded-xl text-base font-bold text-white shadow-xl transition-all duration-300 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 hover:shadow-accent-500/30 hover:-translate-y-0.5"
              >
                Go to Login
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};