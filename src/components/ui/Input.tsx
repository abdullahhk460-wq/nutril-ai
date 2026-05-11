import { forwardRef } from 'react';
import { cn } from '@/src/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-semibold tracking-tight text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm ring-offset-white transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };
