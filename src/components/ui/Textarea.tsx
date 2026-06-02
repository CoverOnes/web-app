import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Textarea({
  label,
  error,
  id,
  containerClassName = '',
  className = '',
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={[
          'px-4 py-3 rounded-lg min-h-32 resize-y',
          'bg-white dark:bg-neutral-800',
          'border border-neutral-200 dark:border-neutral-700',
          'text-[15px] text-neutral-900 dark:text-neutral-100',
          'placeholder:text-neutral-400 dark:placeholder:text-neutral-600',
          'hover:border-neutral-300 dark:hover:border-neutral-600',
          'focus-visible:outline-none',
          'focus-visible:border-accent-500',
          'focus-visible:ring-2 focus-visible:ring-accent-500/20',
          'disabled:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed',
          'transition-colors duration-150',
          error ? 'border-error-500 focus-visible:ring-error-500/20' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p className="text-xs text-error-500 flex items-center gap-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default Textarea;
