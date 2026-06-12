import React from 'react';
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
  className?: string;
}
export const Badge = ({
  children,
  variant = 'default',
  className = ''
}: BadgeProps) => {
  const variants = {
    default:
    'bg-accent-100 text-accent-900 dark:bg-accent-900/40 dark:text-accent-200',
    success:
    'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    warning:
    'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    outline:
    'border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 bg-transparent'
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      
      {children}
    </span>);

};