import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User, Building, Loader2, AlertTriangle, Phone, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { GlassInput } from '../../components/ui/GlassInput';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
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
  const { register: registerUser, currentUser } = useAppContext();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<SignupFormValues>({
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
      setGlobalError(error.message || 'An error occurred during registration.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 font-body py-16 px-4">
      {/* Subtle ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 via-transparent to-warm-500/10 pointer-events-none" />

      <Link
        to="/"
        className="fixed top-4 left-4 md:top-8 md:left-8 z-50 inline-flex items-center text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md px-4 py-2 rounded-full shadow-sm"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Home
      </Link>

      {/*
        ─── Layout strategy ───────────────────────────────────────────
        The CARD is the centered anchor (max-w-xl, centered by flex).
        The 3D figure + copy panel is absolutely positioned starting
        from the card's RIGHT edge (left-full), so it NEVER affects
        the card's centering or causes left-side overflow.
        The page's overflow-hidden clips anything that exits the viewport.
        ──────────────────────────────────────────────────────────────
      */}
      <div className="flex flex-col lg:flex-row items-center justify-center relative z-10 w-full max-w-[1200px] mx-auto">

        {/* ── SIGNUP CARD ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg flex-shrink-0 relative z-10"
        >
          <div className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/60 dark:border-white/10 p-5 sm:p-8 relative overflow-hidden">

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
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
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

              <div className="space-y-4 sm:space-y-5">
                <AnimatePresence mode="popLayout">
                  {watchRole === 'company' ? (
                    <motion.div
                      key="companyFields"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <GlassInput
                        label="Company Name"
                        icon={<Building size={20} />}
                        {...register("companyName")}
                        error={errors.companyName?.message}
                        disabled={isSubmitting}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="employeeFields"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col sm:flex-row gap-4 sm:gap-5"
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>

                <GlassInput
                  label="Email Address"
                  icon={<Mail size={20} />}
                  type="email"
                  {...register("email")}
                  error={errors.email?.message}
                  disabled={isSubmitting}
                />

                {/* Phone Number */}
                <GlassInput
                  label="Phone Number"
                  icon={<Phone size={20} />}
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  {...register("phone")}
                  disabled={isSubmitting}
                />

                {/* City + Country */}
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
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 sm:py-4 mt-4 sm:mt-6 rounded-xl text-sm sm:text-base font-bold text-white shadow-xl transition-all duration-300 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 hover:shadow-accent-500/30 hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" /> Creating account...
                  </span>
                ) : (
                  "Create Secure Account"
                )}
              </Button>
            </form>

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
            src="/images/signup_human_3d.png"
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