import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
interface CardProps extends HTMLMotionProps<'div'> {
  hoverable?: boolean;
}
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hoverable = false, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={
        hoverable ?
        {
          y: -4,
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.1)'
        } :
        {}
        }
        className={`bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-subtle overflow-hidden ${className}`}
        {...props}>
        
        {children}
      </motion.div>);

  }
);
Card.displayName = 'Card';
export const CardHeader = ({
  className = '',
  children



}: {className?: string;children: React.ReactNode;}) =>
<div
  className={`px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 ${className}`}>
  
    {children}
  </div>;

export const CardTitle = ({
  className = '',
  children



}: {className?: string;children: React.ReactNode;}) =>
<h3
  className={`text-xl font-display font-semibold text-neutral-900 dark:text-white ${className}`}>
  
    {children}
  </h3>;

export const CardContent = ({
  className = '',
  children



}: {className?: string;children: React.ReactNode;}) => <div className={`p-6 ${className}`}>{children}</div>;
export const CardFooter = ({
  className = '',
  children



}: {className?: string;children: React.ReactNode;}) =>
<div
  className={`px-6 py-4 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800 flex items-center ${className}`}>
  
    {children}
  </div>;