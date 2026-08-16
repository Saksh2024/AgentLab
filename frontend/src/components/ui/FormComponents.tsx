import React, { forwardRef } from 'react';
import type { FieldError } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  error?: FieldError;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, error, children }) => {
  return (
    <div className="space-y-1.5 w-full text-left">
      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[10px] text-rose-500 font-medium mt-1">{error.message}</p>
      )}
    </div>
  );
};

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full text-xs px-3 py-2 bg-zinc-950 rounded border transition-colors focus:outline-none ${error
          ? 'border-rose-500 focus:border-rose-500 text-rose-200'
          : 'border-zinc-800 focus:border-zinc-700 text-zinc-200'
          } ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full text-xs font-mono p-3 bg-zinc-950 rounded border transition-colors focus:outline-none leading-relaxed resize-none ${error
          ? 'border-rose-500 focus:border-rose-500 text-rose-200'
          : 'border-zinc-800 focus:border-zinc-700 text-zinc-300'
          } ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full text-xs px-3 py-2 bg-zinc-950 rounded border transition-colors focus:outline-none font-mono cursor-pointer ${error
          ? 'border-rose-500 focus:border-rose-500 text-rose-200'
          : 'border-zinc-800 focus:border-zinc-700 text-zinc-350'
          } ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
