import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label: string;
  error?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ icon, label, error, type = 'text', className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const hasValue = !!props.value;

    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className={`relative ${className}`}>
        {/* Label on top */}
        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 ml-1">
          {label}
        </label>

        {/* Input Container */}
        <div 
          className={`
            relative flex items-center w-full rounded-2xl transition-all duration-300
            bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md
            border-2 
            ${error 
              ? 'border-red-400 dark:border-red-500 shadow-[0_0_15px_rgba(248,113,113,0.3)]' 
              : isFocused 
                ? 'border-accent-400 dark:border-accent-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]' 
                : 'border-white/50 dark:border-white/10 hover:border-white/70 dark:hover:border-white/20'
            }
          `}
        >
          {/* Icon */}
          {icon && (
            <div className={`
              pl-4 pr-2 transition-colors duration-300 z-10
              ${error ? 'text-red-400' : isFocused ? 'text-accent-500' : 'text-neutral-500 dark:text-neutral-400'}
            `}>
              {icon}
            </div>
          )}

          {/* Actual Input */}
          <input
            ref={ref}
            type={inputType}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={`
              w-full bg-transparent border-none outline-none 
              ${icon ? 'pl-2' : 'pl-4'} pr-10 py-3.5
              text-neutral-900 dark:text-white font-medium
              placeholder:text-neutral-400 dark:placeholder:text-neutral-500
            `}
            placeholder={label}
            {...props}
          />

          {/* Password Toggle or Error Icon */}
          <div className="absolute right-3 flex items-center gap-2 z-10">
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-neutral-400 hover:text-accent-500 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
            {error && !isPassword && (
              <AlertCircle size={18} className="text-red-500" />
            )}
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute -bottom-5 left-2 text-xs font-bold text-red-500"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
