import React, { forwardRef } from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, fullWidth = true, ...props }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''} flex flex-col gap-1.5`}>
        {label &&
        <label className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
            {label}
          </label>
        }
        <input
          ref={ref}
          className={`flex h-11 w-full rounded-md border ${error ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-white dark:bg-neutral-900 text-ink dark:text-neutral-100 px-3 py-2 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`}
          {...props} />
        
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>);

  }
);
Input.displayName = 'Input';
interface TextareaProps extends
  React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, fullWidth = true, ...props }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''} flex flex-col gap-1.5`}>
        {label &&
        <label className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
            {label}
          </label>
        }
        <textarea
          ref={ref}
          className={`flex min-h-[80px] w-full rounded-md border ${error ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-700'} bg-white dark:bg-neutral-900 text-ink dark:text-neutral-100 px-3 py-2 text-sm placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`}
          {...props} />
        
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>);

  }
);
Textarea.displayName = 'Textarea';