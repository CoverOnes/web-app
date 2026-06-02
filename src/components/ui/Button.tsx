import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-primary-500 text-white font-semibold',
    'hover:bg-primary-400 active:bg-primary-600',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-accent-500 focus-visible:ring-offset-2',
  ].join(' '),
  secondary: [
    'bg-neutral-100 dark:bg-neutral-700',
    'text-neutral-900 dark:text-neutral-100',
    'border border-neutral-200 dark:border-neutral-600',
    'hover:bg-neutral-200 dark:hover:bg-neutral-600',
    'active:bg-neutral-300 dark:active:bg-neutral-500',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-accent-500 focus-visible:ring-offset-2',
  ].join(' '),
  ghost: [
    'bg-transparent text-primary-500 dark:text-primary-300 font-medium',
    'hover:bg-primary-50 dark:hover:bg-primary-900/30',
    'active:bg-primary-100 dark:active:bg-primary-900/50',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-accent-500 focus-visible:ring-offset-2',
  ].join(' '),
  danger: [
    'bg-error-500 text-white font-semibold',
    'hover:bg-error-400 active:bg-red-700',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-error-500 focus-visible:ring-offset-2',
  ].join(' '),
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-lg',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-12 px-6 text-[15px] rounded-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2',
        'font-medium transition-colors duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        loading ? 'cursor-wait' : '',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <span
          className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  )
}

export default Button
