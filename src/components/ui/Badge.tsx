interface BadgeProps {
  count: number
  max?: number
  className?: string
}

export function Badge({ count, max = 99, className = '' }: BadgeProps) {
  if (count <= 0) return null

  return (
    <span
      className={`
        min-w-[18px] h-[18px] px-1
        bg-accent-500 text-white
        text-[10px] font-bold leading-none
        rounded-full
        flex items-center justify-center
        ${className}
      `}
      aria-label={`${count} 則未讀訊息`}
    >
      {count > max ? `${max}+` : count}
    </span>
  )
}

export default Badge
