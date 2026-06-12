import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
  {
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  },
  ref) =>
  {
    const baseStyles =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-950 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden';
    const variants = {
      primary: 'bg-accent-600 text-white hover:bg-accent-700 shadow-subtle',
      secondary:
      'bg-accent-100 text-accent-900 hover:bg-accent-200 dark:bg-accent-900/30 dark:text-accent-100 dark:hover:bg-accent-900/50',
      outline:
      'border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800',
      ghost:
      'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800',
      gold: 'bg-accent-600 text-white hover:bg-accent-700 shadow-subtle' // Aliased to primary
    };
    const sizes = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-14 px-8 text-lg'
    };
    return (
      <motion.button
        ref={ref}
        whileHover={{
          scale: disabled || isLoading ? 1 : 1.02,
          y: disabled || isLoading ? 0 : -1
        }}
        whileTap={{
          scale: disabled || isLoading ? 1 : 0.97
        }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}>
        
        {variant === 'primary' && !disabled && !isLoading &&
        <motion.span
          className="absolute inset-0 bg-white/20"
          initial={{
            x: '-100%',
            skewX: -20
          }}
          animate={{
            x: '200%'
          }}
          transition={{
            repeat: Infinity,
            repeatType: 'loop',
            duration: 2,
            repeatDelay: 5,
            ease: 'linear'
          }} />

        }

        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        <span className="relative z-10">{children}</span>
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </motion.button>);

  }
);
Button.displayName = 'Button';