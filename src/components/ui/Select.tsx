import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  containerClassName?: string;
}

export function Select({
  label,
  error,
  id,
  options,
  containerClassName = '',
  className = '',
  ...props
}: SelectProps) {
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
      <select
        id={id}
        className={[
          'h-11 px-4 rounded-lg appearance-none',
          'bg-white dark:bg-neutral-800',
          'border border-neutral-200 dark:border-neutral-700',
          'text-[15px] text-neutral-900 dark:text-neutral-100',
          'hover:border-neutral-300 dark:hover:border-neutral-600',
          'focus-visible:outline-none',
          'focus-visible:border-accent-500',
          'focus-visible:ring-2 focus-visible:ring-accent-500/20',
          'disabled:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed',
          'transition-colors duration-150',
          'cursor-pointer',
          error ? 'border-error-500 focus-visible:ring-error-500/20' : '',
          className,
        ].join(' ')}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-error-500 flex items-center gap-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default Select;
